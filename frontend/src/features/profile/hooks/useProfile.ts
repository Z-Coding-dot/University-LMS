import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '../../../api/endpoints/profile';
import { useAuthStore } from '../../auth/store';
import i18n from '../../../i18n';
import { requiresPasswordChange } from '../../../lib/account-policy';
export function useProfileContext() {
  const user = useAuthStore(state => state.user);
  return useQuery({ queryKey: ['profile-context', user?.id], queryFn: profileApi.context, enabled: !!user && !requiresPasswordChange(user) });
}
export function useUpdateProfile() {
  return useMutation({ mutationFn: profileApi.update, onSuccess: async user => {
    useAuthStore.getState().setUser(user); await i18n.changeLanguage(user.locale);
  } });
}
export function useChangePassword() {
  const client = useQueryClient();
  return useMutation({ mutationFn: profileApi.password, onSuccess: user => {
    useAuthStore.getState().setUser(user);
    void client.invalidateQueries({ queryKey: ['profile-context'] });
  } });
}
