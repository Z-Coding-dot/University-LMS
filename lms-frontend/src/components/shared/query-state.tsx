import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { EmptyState, LoadingState } from '../ui/surfaces';
export function QueryState({ pending, error, retry, children }: { pending: boolean; error: boolean; retry: () => unknown; children: ReactNode }) {
  const { t } = useTranslation();
  if (pending) return <LoadingState />;
  if (error) return <EmptyState error title={t('errorTitle')} description={t('errorDescription')} action={<Button onClick={() => void retry()}>{t('retry')}</Button>} />;
  return children;
}
