import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/store';
import { requiresPasswordChange } from '../../lib/account-policy';
export function RequireAuth() {
  const user = useAuthStore(state => state.user); const location = useLocation();
  const returnTo = `${location.pathname}${location.search}${location.hash}`;
  if (!user) return <Navigate to="/login" state={{ returnTo }} replace />;
  if (requiresPasswordChange(user) && location.pathname !== '/change-password') return <Navigate to="/change-password" state={{ returnTo }} replace />;
  return <Outlet />;
}
