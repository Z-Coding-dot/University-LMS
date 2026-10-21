import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { academicApi } from '../../../api/endpoints/academic';
import { useAcademicQuery } from '../../../hooks/useAcademic';
import { QueryState } from '../../../components/shared/query-state';
import { Card } from '../../../components/ui/surfaces';
import { PageHeader } from '../../../components/layout/page-header';
import { buttonStyles } from '../../../components/ui/button';
import { AssignmentDetails } from '../../teacher/components/assignments';
import { ErrorPage } from '../../../app/error-page';
import { useDir } from '../../../hooks/useDir';
import { formatNumber } from '../../../lib/number';
export function AssignmentDetailPage() {
  const id = Number(useParams().assignmentId); const valid = Number.isSafeInteger(id) && id > 0;
  const { t } = useTranslation('academic'); const { locale } = useDir();
  const query = useAcademicQuery(['assignment', id], () => academicApi.assignment(id), valid);
  if (!valid) return <ErrorPage kind="notFound" />;
  return <QueryState pending={query.isPending} error={query.isError} retry={query.refetch}>{query.data && <div className="space-y-6">
    <PageHeader title={query.data.title} description={`${query.data.course_name[locale]} · ${t('weekNumber', { value: formatNumber(query.data.week_number, locale) })}`} actions={<Link className={buttonStyles({ variant: 'secondary' })} to={`/courses/${query.data.offering_id}?tab=weeks&week=${query.data.week_number}`}>{t('backToWeek')}</Link>} />
    <Card><AssignmentDetails key={`${id}-${query.data.submission?.submitted_at ?? 'new'}`} assignment={query.data} /></Card>
  </div>}</QueryState>;
}
