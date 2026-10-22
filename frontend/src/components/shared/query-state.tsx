import type { ReactNode } from 'react';
import { isAxiosError } from 'axios';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, buttonStyles } from '../ui/button';
import { EmptyState, LoadingState } from '../ui/surfaces';
export function QueryError({ error, retry }: { error: unknown; retry: () => unknown }) {
  const { t } = useTranslation();
  const status = isAxiosError(error) ? error.response?.status : undefined;
  const prefix = status === 403 ? 'forbidden' : status === 404 ? 'notFound' : 'error';
  return <EmptyState error title={t(`${prefix}Title`)} description={t(`${prefix}Description`)} action={prefix === 'error' ? <Button onClick={() => void retry()}>{t('retry')}</Button> : <Link to="/" className={buttonStyles({ variant: 'secondary' })}>{t('backHome')}</Link>} />;
}
export function QueryState({ pending, error, retry, children }: { pending: boolean; error: unknown; retry: () => unknown; children: ReactNode }) {
  if (pending) return <LoadingState />;
  if (error) return <QueryError error={error} retry={retry} />;
  return children;
}
