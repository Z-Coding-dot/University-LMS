import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../../components/layout/page-header';
import { StaffActivityTables } from '../components/staff-activity';

export function ActivityPage() {
  const { t } = useTranslation('dashboard');
  return <><PageHeader title={t('staffActivity')} description={t('staffActivityDescription')} /><StaffActivityTables /></>;
}
