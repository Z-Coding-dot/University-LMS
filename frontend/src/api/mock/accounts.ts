import type { User } from '../types';
import { canManageAccounts } from '../../lib/account-policy';
import { accountIdentitySchema, accountStatusSchema, createAccountSchema, teacherPermissionsSchema } from '../../features/admin/schemas';
import { fail, nextId, page, respond, validate, type MockContext } from './http';
import { users } from './fixtures';

export function handleAccounts(ctx: MockContext) {
  const match = ctx.path.match(/^\/admin\/(students|teachers)(?:\/(\d+)(?:\/(reset-password|status|permissions))?)?$/);
  if (!match) return undefined;
  if (!canManageAccounts(ctx.user)) return fail(ctx);
  const role = match[1] === 'students' ? 'student' : 'teacher';
  const id = Number(match[2]); const action = match[3];
  const ok = (data: unknown, status = 200) => respond(ctx.config, status, { data: structuredClone(data) });
  if (!match[2] && ctx.method === 'GET') {
    return page(ctx, users.filter(user => user.role === role).map(user => structuredClone(user)), { name: user => user.name, email: user => user.email, id: user => user.id, institutional_id: user => user.profile.institutional_id, status: user => user.status }, 'name');
  }
  if (!match[2] && ctx.method === 'POST') {
    const input = validate(createAccountSchema, ctx.body, ctx.config);
    if (users.some(user => user.email.toLowerCase() === input.email)) return fail(ctx, 422, 'admin:emailTaken', 'email');
    const prefix = role === 'student' ? 'ST' : 'TC';
    const number = Math.max(0, ...users.filter(user => user.role === role).map(user => Number(user.profile.institutional_id.slice(3)) || 0)) + 1;
    const user: User = { id: nextId(users), name: input.name, email: input.email, role, permissions: [], locale: input.locale, status: 'active', must_change_password: false, profile: { institutional_id: `${prefix}-${String(number).padStart(3, '0')}`, department_id: null, current_semester_id: null } };
    users.push(user);
    return ok({ user, initial_password: ctx.issuePassword(user) }, 201);
  }
  const target = users.find(user => user.id === id && user.role === role);
  if (!target) return fail(ctx, 404, 'common:notFoundTitle');
  if (!action && ctx.method === 'PATCH') {
    const input = validate(accountIdentitySchema, ctx.body, ctx.config);
    if (users.some(user => user.id !== id && user.email.toLowerCase() === input.email)) return fail(ctx, 422, 'admin:emailTaken', 'email');
    Object.assign(target, input);
    return ok(target);
  }
  if (action === 'reset-password' && ctx.method === 'POST') return ok({ user: target, initial_password: ctx.issuePassword(target) });
  if (action === 'status' && ctx.method === 'PATCH') {
    target.status = validate(accountStatusSchema, ctx.body, ctx.config).status;
    return ok(target);
  }
  if (action === 'permissions' && role === 'teacher' && ctx.method === 'PUT') {
    target.permissions = validate(teacherPermissionsSchema, ctx.body, ctx.config).permissions;
    return ok(target);
  }
  return fail(ctx, 404, 'common:notFoundTitle');
}
