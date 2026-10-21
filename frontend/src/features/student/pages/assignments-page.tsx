import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../../components/layout/page-header';
import { Assignments } from '../../teacher/components/assignments';
export function AssignmentsPage() {
  const { t } = useTranslation('academic');
  return <><PageHeader title={t('assignments')} /><Assignments /></>;
}
