import { Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LockKeyhole } from 'lucide-react';
import { useAuthStore } from '../store';
import { useLogout } from '../hooks/useAuth';
import { AuthLayout } from '../../../components/layout/auth-layout';
import { PasswordForm } from '../components/password-form';
import { Button } from '../../../components/ui/button';
import { requiresPasswordChange } from '../../../lib/account-policy';
export function ChangePasswordPage() {
  const { t } = useTranslation(['auth', 'common']); const user = useAuthStore(state => state.user); const navigate = useNavigate(); const logout = useLogout();
  if (!user) return <Navigate to="/login" replace />;
  if (!requiresPasswordChange(user)) return <Navigate to="/" replace />;
  return <AuthLayout><span className="mb-5 text-brand"><LockKeyhole size={32} /></span><h1 className="text-3xl font-semibold">{t('changeTitle')}</h1><p className="mb-7 mt-3 text-gray-500">{t('changeDescription')}</p><PasswordForm forced onSuccess={() => navigate('/', { replace: true })} /><Button variant="ghost" className="mt-4" loading={logout.isPending} onClick={() => logout.mutate()}>{t('common:signOut')}</Button></AuthLayout>;
}
