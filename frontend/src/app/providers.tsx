import { useEffect, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { MotionConfig } from 'motion/react';
import { Toaster } from 'sonner';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { authApi } from '../api/endpoints/auth';
import { useAuthStore } from '../features/auth/store';
import { useDir } from '../hooks/useDir';
import { EmptyState, LoadingState } from '../components/ui/surfaces';
import { Button } from '../components/ui/button';

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 60000, retry: (count, error) => {
  if (axios.isAxiosError(error) && error.response && error.response.status < 500) return false;
  return count < 1;
} }, mutations: { retry: false } } });
function SessionBootstrap({ children }: { children: ReactNode }) {
  const initialized = useAuthStore(state => state.initialized); const { t } = useTranslation();
  const session = useQuery({ queryKey: ['session'], queryFn: authApi.me, enabled: !initialized, retry: false });
  useEffect(() => { if (session.data && !useAuthStore.getState().initialized) useAuthStore.getState().setUser(session.data); }, [session.data]);
  useEffect(() => useAuthStore.subscribe((state, previous) => {
    if (previous.user && !state.user) queryClient.clear();
  }), []);
  if (!initialized) {
    if (session.isError) return <div className="mx-auto max-w-lg p-6"><EmptyState error title={t('errorTitle')} description={t('networkError')} action={<Button onClick={() => void session.refetch()} loading={session.isFetching}>{t('retry')}</Button>} /></div>;
    return <div className="mx-auto max-w-3xl py-20"><LoadingState /></div>;
  }
  return children;
}
export function Providers({ children }: { children: ReactNode }) {
  const { dir } = useDir(); const { t } = useTranslation();
  return <QueryClientProvider client={queryClient}><MotionConfig reducedMotion="user"><TooltipPrimitive.Provider delayDuration={300}><SessionBootstrap>{children}</SessionBootstrap><Toaster position="top-center" dir={dir} richColors closeButton containerAriaLabel={t('notifications')} toastOptions={{ closeButtonAriaLabel: t('close') }} /></TooltipPrimitive.Provider></MotionConfig></QueryClientProvider>;
}
