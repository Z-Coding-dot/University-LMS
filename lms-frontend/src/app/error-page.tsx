import { Link, useRouteError } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '../components/ui/surfaces';
import { buttonStyles } from '../components/ui/button';
export function ErrorPage({ kind = 'error' }: { kind?: 'error' | 'forbidden' | 'notFound' }) {
  const { t } = useTranslation(); const error = useRouteError();
  const prefix = error ? 'error' : kind;
  return <div className="flex min-h-[70dvh] items-center justify-center p-5"><EmptyState error title={t(`${prefix}Title`)} description={t(`${prefix}Description`)} action={<Link className={buttonStyles({ variant: 'secondary' })} to="/">{t('backHome')}</Link>} /></div>;
}
