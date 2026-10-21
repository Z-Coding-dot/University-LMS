import { AxiosError, AxiosHeaders, type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { z } from 'zod';
import { users, departments, semesters, settings, initialDemoPassword } from './fixtures';
import { storage } from '../../lib/storage';
import { normalizeDigits } from '../../lib/number';
import { loginSchema, passwordSchema } from '../../features/auth/schemas';
import { profileSchema } from '../../features/profile/schemas';
import type { User } from '../types';
import { canChangeOwnPassword, canSubmitProfileUpdate, requiresPasswordChange } from '../../lib/account-policy';
import { dashboardQuerySchema } from '../../features/dashboard/schemas';
import { buildDashboard } from './dashboard';
import { handleAcademic } from './academic';
import { handleAccounts } from './accounts';
import { handleAdminAcademic } from './admin-academic';

// Passwords stay private to the mock; only administrator issue/reset responses reveal them.
const passwords = new Map(users.map(user => [user.id, initialDemoPassword(user)]));
function issuePassword(user: User): string {
  let password: string;
  do { password = `U9!a${crypto.randomUUID().replaceAll('-', '')}`; } while ([...passwords.values()].includes(password));
  passwords.set(user.id, password);
  user.must_change_password = false;
  return password;
}
let currentSession: { userId: number; token: string } | null = (() => {
  try { const saved: unknown = JSON.parse(storage.get('lms-mock-session', true) ?? 'null');
    return z.object({ userId: z.number().int(), token: z.string() }).nullable().parse(saved);
  } catch { return null; }
})();

function respond(config: InternalAxiosRequestConfig, status: number, data: unknown): AxiosResponse {
  const response = { config, status, statusText: String(status), headers: new AxiosHeaders(), data };
  if (status >= 400) throw new AxiosError('Mock request failed', status < 500 ? AxiosError.ERR_BAD_REQUEST : AxiosError.ERR_BAD_RESPONSE, config, undefined, response);
  return response;
}
function failure(config: InternalAxiosRequestConfig, status: number, key: string, field?: string): AxiosResponse {
  return respond(config, status, { message: key, ...(field ? { errors: { [field]: [key] } } : {}) });
}
function validate<T extends z.ZodTypeAny>(schema: T, body: unknown, config: InternalAxiosRequestConfig): z.output<T> {
  const result = schema.safeParse(body);
  if (result.success) return result.data;
  const errors: Record<string, string[]> = {};
  result.error.issues.forEach(issue => { const key = issue.path.join('.'); (errors[key] ??= []).push(issue.message); });
  respond(config, 422, { message: 'common:validationError', errors });
  throw new Error('Unreachable');
}
const publicUser = (user: User): User => structuredClone(user);

export const mockAdapter: AxiosAdapter = async config => {
  await new Promise(resolve => setTimeout(resolve, 250));
  if (config.signal?.aborted) throw new AxiosError('Canceled', AxiosError.ERR_CANCELED, config);
  const path = new URL(config.url ?? '/', 'http://mock.local').pathname.replace(/^\/api\/v1/, '');
  const method = config.method?.toUpperCase();
  const body: unknown = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
  if (path === '/sanctum/csrf-cookie' && method === 'GET') return respond(config, 204, null);
  if (path === '/auth/login' && method === 'POST') {
    const input = validate(loginSchema, body, config);
    const identifier = normalizeDigits(input.identifier.trim()).toLowerCase();
    const user = users.find(item => item.email.toLowerCase() === identifier || item.profile.institutional_id.toLowerCase() === identifier);
    if (!user || passwords.get(user.id) !== input.password) return failure(config, 422, 'auth:invalidCredentials', 'identifier');
    if (user.status !== 'active') return failure(config, 403, 'auth:inactive');
    currentSession = { userId: user.id, token: crypto.randomUUID() };
    storage.set('lms-mock-session', JSON.stringify(currentSession), true);
    return respond(config, 200, { data: { user: publicUser(user), ...(import.meta.env.VITE_AUTH_MODE === 'token' ? { token: currentSession.token } : {}) } });
  }
  const user = users.find(item => item.id === currentSession?.userId);
  if (!currentSession || !user || user.status !== 'active') return failure(config, 401, 'common:sessionExpired');
  if (import.meta.env.VITE_AUTH_MODE === 'token' && config.headers.get('Authorization') !== `Bearer ${currentSession.token}`) return failure(config, 401, 'common:sessionExpired');
  if (path === '/auth/logout' && method === 'POST') {
    currentSession = null; storage.remove('lms-mock-session', true);
    return respond(config, 204, null);
  }
  if (path === '/auth/me' && method === 'GET') return respond(config, 200, { data: publicUser(user) });
  if (path === '/profile/password' && method === 'PUT') {
    if (!canChangeOwnPassword(user)) return failure(config, 403, 'profile:managedAccount');
    const input = validate(passwordSchema, body, config);
    if (input.current_password !== passwords.get(user.id)) return failure(config, 422, 'auth:currentPasswordInvalid', 'current_password');
    passwords.set(user.id, input.password); user.must_change_password = false;
    return respond(config, 200, { data: publicUser(user) });
  }
  if (requiresPasswordChange(user)) return failure(config, 403, 'auth:changeDescription');
  const context = { config, user, path, method, body, locale: config.headers.get('Accept-Language') === 'en' ? 'en' as const : 'fa' as const, issuePassword };
  const accountResponse = handleAccounts(context);
  if (accountResponse) return accountResponse;
  const adminResponse = handleAdminAcademic(context);
  if (adminResponse) return adminResponse;
  const academicResponse = handleAcademic(context);
  if (academicResponse) return academicResponse;
  if (['/dashboard', '/dashboard/tasks', '/dashboard/files'].includes(path) && method === 'GET') {
    const query = validate(dashboardQuerySchema, config.params ?? {}, config);
    const locale = config.headers.get('Accept-Language') === 'en' ? 'en' : 'fa';
    const dashboard = buildDashboard(user, query, locale);
    if (dashboard.forbidden) return failure(config, 403, 'common:forbiddenTitle');
    if (path === '/dashboard') return respond(config, 200, { data: dashboard.summary });
    const isTasks = path === '/dashboard/tasks';
    const sort = query.sort || (isTasks ? 'due_at' : '-uploaded_at');
    const allowed = isTasks ? ['title', 'due_at', 'course', 'status', 'submission_rate'] : ['name', 'course', 'uploaded_at'];
    const sorts = sort.split(',').map(value => ({ field: value.replace(/^-/, ''), descending: value.startsWith('-') }));
    if (sorts.some(item => !allowed.includes(item.field))) return failure(config, 422, 'common:validationError', 'sort');
    const rows = [...(isTasks ? dashboard.tasks : dashboard.files)].sort((a, b) => {
      for (const { field, descending } of sorts) {
        const value = (item: typeof a): string | number => field === 'course' ? item.course[locale] : (item as unknown as Record<string, string | number>)[field];
        const first = value(a), second = value(b);
        const compared = typeof first === 'number' && typeof second === 'number' ? first - second : String(first).localeCompare(String(second), locale);
        if (compared) return descending ? -compared : compared;
      }
      return a.id - b.id;
    });
    return respond(config, 200, { data: rows.slice((query.page - 1) * query.per_page, query.page * query.per_page), meta: { current_page: query.page, per_page: query.per_page, total: rows.length, last_page: Math.max(1, Math.ceil(rows.length / query.per_page)) } });
  }
  if (path === '/profile' && method === 'PATCH') {
    if (!canSubmitProfileUpdate(user, body)) return failure(config, 403, 'profile:managedAccount');
    const input = validate(profileSchema, body, config);
    if (input.name !== undefined) user.name = input.name;
    user.locale = input.locale;
    return respond(config, 200, { data: publicUser(user) });
  }
  if (path === '/profile/context' && method === 'GET') return respond(config, 200, { data: {
    department: departments.find(item => item.id === user.profile.department_id) ?? null,
    semester: semesters.find(item => item.id === user.profile.current_semester_id) ?? null,
  } });
  if (path === '/settings' && method === 'GET') return respond(config, 200, { data: structuredClone(settings) });
  return failure(config, 404, 'common:notFoundTitle');
};
