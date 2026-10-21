import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LockKeyhole } from 'lucide-react';
import { useAuthStore } from '../store';
import { useLogout } from '../hooks/useAuth';
import { AuthLayout } from '../../../components/layout/auth-layout';
import { PasswordForm } from '../components/password-form';
import { Button } from '../../../components/ui/button';
import { requiresPasswordChange } from '../../../lib/account-policy';
import { authDestination } from '../../../lib/auth-redirect';
export function ChangePasswordPage() {
  const { t } = useTranslation(['auth', 'common']); const user = useAuthStore(state => state.user); const navigate = useNavigate(); const logout = useLogout();
  const location = useLocation();
  const destination = authDestination((location.state as { returnTo?: unknown } | null)?.returnTo);
  if (!user) return <Navigate to="/login" replace />;
  if (!requiresPasswordChange(user)) return <Navigate to={destination} replace />;
  return <AuthLayout><span className="mb-5 text-brand-action"><LockKeyhole size={32} /></span><h1 className="text-3xl font-semibold">{t('changeTitle')}</h1><p className="mb-7 mt-3 text-gray-500">{t('changeDescription')}</p><PasswordForm forced onSuccess={() => navigate(destination, { replace: true })} /><Button variant="ghost" className="mt-4" loading={logout.isPending} onClick={() => logout.mutate()}>{t('common:signOut')}</Button></AuthLayout>;
}
