import type { Role } from '../config/constants';

type Account = { role: Role };
export const SELF_SERVICE_ROLES: Role[] = ['admin', 'teacher'];
export const canEditOwnIdentity = (user: Account | null): boolean => !!user && SELF_SERVICE_ROLES.includes(user.role);
export const canChangeOwnPassword = canEditOwnIdentity;
export const canManageStudentAccounts = (user: Account | null): boolean => user?.role === 'admin';
export const requiresPasswordChange = (user: (Account & { must_change_password: boolean }) | null): boolean =>
  !!user && canChangeOwnPassword(user) && user.must_change_password;
