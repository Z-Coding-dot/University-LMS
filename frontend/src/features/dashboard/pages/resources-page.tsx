import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../../components/layout/page-header';
import { LearningFilesTable } from '../components/academic-tables';
export function ResourcesPage() {
  const { t } = useTranslation('dashboard');
  return <><PageHeader title={t('latestFiles')} description={t('latestFilesDescription')} /><LearningFilesTable /></>;
}
