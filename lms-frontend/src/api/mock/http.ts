import { AxiosError, AxiosHeaders, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { z } from 'zod';
import type { Locale } from '../../config/constants';
import type { User } from '../types';
import { normalizeDigits } from '../../lib/number';
export interface MockContext { config: InternalAxiosRequestConfig; user: User; path: string; method: string | undefined; body: unknown; locale: Locale; issuePassword: (user: User) => string }
export function respond(config: InternalAxiosRequestConfig, status: number, data: unknown): AxiosResponse {
  const response = { config, status, statusText: String(status), headers: new AxiosHeaders(), data };
  if (status >= 400) throw new AxiosError('Mock request failed', status < 500 ? AxiosError.ERR_BAD_REQUEST : AxiosError.ERR_BAD_RESPONSE, config, undefined, response);
  return response;
}
export const fail = (ctx: Pick<MockContext, 'config'>, status = 403, message = 'common:forbiddenTitle', field?: string) => respond(ctx.config, status, { message, ...(field ? { errors: { [field]: [message] } } : {}) });
export function validate<T extends z.ZodTypeAny>(schema: T, body: unknown, config: InternalAxiosRequestConfig): z.output<T> {
  const parsed = schema.safeParse(body);
  if (parsed.success) return parsed.data;
  const errors: Record<string, string[]> = {};
  parsed.error.issues.forEach(issue => { (errors[issue.path.join('.')] ??= []).push(issue.message); });
  respond(config, 422, { message: 'common:validationError', errors });
  throw new Error('Unreachable');
}
const listSchema = z.object({ page: z.coerce.number().int().min(1).default(1), per_page: z.coerce.number().int().min(1).max(100).default(20), search: z.string().max(200).default(''), sort: z.string().default('') });
export function page<T>(ctx: MockContext, items: T[], columns: Record<string, (item: T) => string | number | null>, defaultSort = '') {
  const query = validate(listSchema, ctx.config.params ?? {}, ctx.config);
  const search = normalizeDigits(query.search).toLocaleLowerCase();
  const sorts = (query.sort || defaultSort).split(',').filter(Boolean).map(value => ({ field: value.replace(/^-/, ''), descending: value.startsWith('-') }));
  if (sorts.some(item => !columns[item.field])) return fail(ctx, 422, 'common:validationError', 'sort');
  const rows = items.filter(item => !search || Object.values(columns).some(get => normalizeDigits(String(get(item) ?? '')).toLocaleLowerCase().includes(search))).sort((a, b) => {
    for (const sort of sorts) { const av = columns[sort.field](a), bv = columns[sort.field](b); const result = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av ?? '').localeCompare(String(bv ?? ''), ctx.locale); if (result) return sort.descending ? -result : result; }
    return 0;
  });
  return respond(ctx.config, 200, { data: rows.slice((query.page - 1) * query.per_page, query.page * query.per_page), meta: { current_page: query.page, per_page: query.per_page, total: rows.length, last_page: Math.max(1, Math.ceil(rows.length / query.per_page)) } });
}
export const nextId = (items: { id: number }[]) => Math.max(0, ...items.map(item => item.id)) + 1;
