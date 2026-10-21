import type { Role } from '../config/constants';

type Account = { role: Role };
export const SELF_SERVICE_ROLES: Role[] = ['admin'];
export const canEditOwnIdentity = (user: Account | null): boolean => !!user && SELF_SERVICE_ROLES.includes(user.role);
export const canChangeOwnPassword = canEditOwnIdentity;
const CREDENTIAL_FIELDS = ['name', 'email', 'password', 'current_password', 'password_confirmation'] as const;
export function canSubmitProfileUpdate(user: Account | null, input: unknown): boolean {
  if (!user) return false;
  return canEditOwnIdentity(user) || !input || typeof input !== 'object' || !CREDENTIAL_FIELDS.some(field => field in input);
}
export const canManageAccounts = (user: Account | null): boolean => user?.role === 'admin';
export const requiresPasswordChange = (user: (Account & { must_change_password: boolean }) | null): boolean =>
  !!user && canChangeOwnPassword(user) && user.must_change_password;
