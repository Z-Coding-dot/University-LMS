import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../../api/endpoints/auth';
import { useAuthStore } from '../store';
import i18n from '../../../i18n';
import { requiresPasswordChange } from '../../../lib/account-policy';

export function useLogin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: authApi.login, onSuccess: async ({ user, token }) => {
    queryClient.clear(); useAuthStore.getState().setSession(user, token);
    await i18n.changeLanguage(user.locale);
    navigate(requiresPasswordChange(user) ? '/change-password' : '/', { replace: true });
  } });
}
export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: authApi.logout, onSuccess: () => {
    useAuthStore.getState().clearSession(); queryClient.clear(); navigate('/login', { replace: true });
  } });
}
