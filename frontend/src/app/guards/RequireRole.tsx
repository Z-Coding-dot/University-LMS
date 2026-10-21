import { Navigate, Outlet } from 'react-router-dom';
import type { Role } from '../../config/constants';
import { useAuthStore } from '../../features/auth/store';
export function RequireRole({ roles }: { roles: Role[] }) {
  const user = useAuthStore(state => state.user);
  return user && roles.includes(user.role) ? <Outlet /> : <Navigate to={user ? '/403' : '/login'} replace />;
}
