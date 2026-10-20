import { Navigate, Outlet } from 'react-router-dom';
import { useCan } from '../../hooks/useCan';
import type { Permission } from '../../lib/permissions';
export function RequirePermission({ permission }: { permission: Permission }) {
  return useCan(permission) ? <Outlet /> : <Navigate to="/403" replace />;
}
