import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../features/auth/store';
import { useDir } from './useDir';
import { apiErrorMessage } from '../api/client';
export function useAcademicQuery<T>(key: readonly unknown[], queryFn: () => Promise<T>, enabled = true) {
  const user = useAuthStore(state => state.user); const { locale } = useDir();
  return useQuery({ queryKey: ['academic', user?.id, locale, ...key], queryFn, enabled: !!user && enabled });
}
export function useAcademicMutation<T, R>(mutationFn: (input: T) => Promise<R>) {
  const client = useQueryClient(); const { t } = useTranslation('academic');
  return useMutation({ mutationFn, onSuccess: () => { void client.invalidateQueries(); toast.success(t('saved')); }, onError: error => toast.error(apiErrorMessage(error)) });
}
