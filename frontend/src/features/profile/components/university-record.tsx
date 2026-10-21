import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../auth/store';
import { useProfileContext } from '../hooks/useProfile';
import { useDir } from '../../../hooks/useDir';
import { Card, LoadingState, EmptyState } from '../../../components/ui/surfaces';
import { StatusBadge } from '../../../components/shared/identity';
import { Button } from '../../../components/ui/button';
export function UniversityRecord() {
  const { t } = useTranslation(['profile', 'common']); const { locale } = useDir(); const user = useAuthStore(state => state.user); const context = useProfileContext();
  if (!user) return null;
  return <Card><h2 className="text-xl font-semibold">{t('institutionalTitle')}</h2><p className="mt-2 text-gray-500">{t('institutionalDescription')}</p>{context.isPending ? <LoadingState /> : context.isError ? <EmptyState error title={t('common:errorTitle')} description={t('common:errorDescription')} action={<Button variant="secondary" onClick={() => void context.refetch()}>{t('common:retry')}</Button>} /> : <dl className="mt-6 space-y-5">{[
    [t('id'), <bdi key="id">{user.profile.institutional_id}</bdi>],
    [t('role'), t(`common:roles.${user.role}`)],
    [t('department'), context.data.department?.name[locale] ?? t('notAssigned')],
    [t('currentSemester'), context.data.semester?.name[locale] ?? t('notAssigned')],
    [t('accountStatus'), <StatusBadge key="status" status={user.status} />],
  ].map(([label, value], index) => <div key={index}><dt className="text-gray-500">{label}</dt><dd className="mt-1 break-words font-medium">{value}</dd></div>)}</dl>}</Card>;
}
