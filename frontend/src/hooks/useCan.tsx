import type { ReactNode } from 'react';
import { useAuthStore } from '../features/auth/store';
import { can, type Permission } from '../lib/permissions';
export const useCan = (permission: Permission) => can(useAuthStore(state => state.user), permission);
export function Can({ permission, children, fallback = null }: { permission: Permission; children: ReactNode; fallback?: ReactNode }) {
  return useCan(permission) ? children : fallback;
}
