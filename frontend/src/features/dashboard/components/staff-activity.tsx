import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { dashboardApi } from '../../../api/endpoints/dashboard';
import type { DashboardGrade, DashboardSubmission, DashboardSummary, DashboardWork } from '../../../api/types/dashboard';
import { useAuthStore } from '../../auth/store';
import { useDir } from '../../../hooks/useDir';
import { can, PERMISSIONS } from '../../../lib/permissions';
import { formatDate } from '../../../lib/date';
import { formatNumber } from '../../../lib/number';
import { DataTable, type DataColumn } from '../../../components/ui/data-table';
import { Badge, EmptyState } from '../../../components/ui/surfaces';
import { buttonStyles } from '../../../components/ui/button';
import { DashboardPanel } from './dashboard-panel';

const workKey = (row: DashboardWork) => `${row.kind}:${row.offering_id}:${row.date ?? ""}`;
const workLink = (row: DashboardWork) => `/courses/${row.offering_id}?tab=${row.kind}${row.date ? `&date=${row.date}` : ''}`;

export function StaffPreview({ data }: { data: DashboardSummary }) {
  const { t } = useTranslation('dashboard'); const { locale } = useDir();
  const user = useAuthStore(state => state.user);
  if (!user || user.role === 'student') return null;
  const work = can(user, PERMISSIONS.takeAttendance) || can(user, PERMISSIONS.enterGrades) || can(user, PERMISSIONS.publishGrades);
  return <div className="space-y-6">
    {work && <DashboardPanel title={t(user?.role === 'admin' ? 'pendingGrades' : 'pendingWork')} description={t(user?.role === 'admin' ? 'pendingGradesDescription' : 'pendingWorkDescription')} action={<Link to="/activity" className={buttonStyles({ variant: 'ghost' })}>{t('viewAll')}</Link>}>
      {!data.pending_work.length ? <EmptyState title={t(user?.role === 'admin' ? 'noPendingGrades' : 'noPendingWork')} /> : <div className="divide-y">{data.pending_work.map(row => <Link key={workKey(row)} to={workLink(row)} className="flex min-h-11 items-center justify-between gap-3 py-3 text-brand-action"><span>{row.course[locale]}<span className="block text-gray-600">{t(`workKinds.${row.kind}`)}{row.date && ` · ${formatDate(row.date, locale)}`}</span></span><Badge tone="warning">{formatNumber(row.pending, locale)}</Badge></Link>)}</div>}
    </DashboardPanel>}
    {can(user, PERMISSIONS.manageAssignments) && <DashboardPanel title={t('recentSubmissions')} action={<Link to="/activity" className={buttonStyles({ variant: 'ghost' })}>{t('viewAll')}</Link>}>
      {!data.recent_submissions.length ? <EmptyState title={t('noSubmissions')} /> : <div className="divide-y">{data.recent_submissions.map(row => <Link key={row.id} to={`/assignments/${row.assignment_id}`} className="block min-h-11 py-3 font-medium text-brand-action">{row.title}<span className="block font-normal text-gray-600">{row.student_name} · {formatDate(row.submitted_at, locale)}</span></Link>)}</div>}
    </DashboardPanel>}
  </div>;
}

export function StaffActivityTables() {
  const { t } = useTranslation(['dashboard', 'academic']); const { locale } = useDir();
  const user = useAuthStore(state => state.user);
  const work = can(user, PERMISSIONS.takeAttendance) || can(user, PERMISSIONS.enterGrades) || can(user, PERMISSIONS.publishGrades);
  const grades = can(user, PERMISSIONS.enterGrades) || can(user, PERMISSIONS.publishGrades);
  const workColumns: DataColumn<DashboardWork>[] = [
    { id: 'course', header: t('course'), accessor: row => row.course[locale], mobile: 'primary', sortable: true, cell: row => <Link to={workLink(row)} className="inline-flex min-h-11 items-center text-brand-action">{row.course[locale]}</Link> },
    { id: 'kind', header: t('workType'), accessor: row => row.kind, mobile: 'primary', cell: row => t(`workKinds.${row.kind}`) },
    { id: 'date', header: t('common:date'), accessor: row => row.date, mobile: 'secondary', sortable: true, cell: row => row.date ? formatDate(row.date, locale) : t('notAvailable') },
    { id: 'pending', header: t('missingRecords'), accessor: row => row.pending, mobile: 'secondary', sortable: true },
  ];
  const submissionColumns: DataColumn<DashboardSubmission>[] = [
    { id: 'title', header: t('academic:assignments'), accessor: row => row.title, mobile: 'primary', sortable: true, cell: row => <Link to={`/assignments/${row.assignment_id}`} className="inline-flex min-h-11 items-center text-brand-action">{row.title}</Link> },
    { id: 'student_name', header: t('academic:student'), accessor: row => row.student_name, mobile: 'primary', sortable: true },
    { id: 'course', header: t('course'), accessor: row => row.course[locale], mobile: 'secondary', sortable: true },
    { id: 'submitted_at', header: t('common:date'), accessor: row => row.submitted_at, mobile: 'secondary', sortable: true, cell: row => formatDate(row.submitted_at, locale) },
    { id: 'score', header: t('status'), accessor: row => row.score, mobile: 'secondary', cell: row => <Badge tone={row.score === null ? 'warning' : 'success'}>{t(row.score === null ? 'taskStatuses.review' : 'taskStatuses.graded')}</Badge> },
  ];
  const gradeColumns: DataColumn<DashboardGrade>[] = [
    { id: 'student_name', header: t('academic:student'), accessor: row => row.student_name, mobile: 'primary', sortable: true },
    { id: 'course', header: t('course'), accessor: row => row.course[locale], mobile: 'primary', sortable: true, cell: row => <Link to={`/courses/${row.offering_id}?tab=grades`} className="inline-flex min-h-11 items-center text-brand-action">{row.course[locale]}</Link> },
    { id: 'component', header: t('academic:components'), accessor: row => row.component[locale], mobile: 'secondary' },
    { id: 'score', header: t('score'), accessor: row => row.score, mobile: 'secondary', sortable: true, cell: row => <bdi>{formatNumber(row.score, locale)} / {formatNumber(row.max_score, locale)}</bdi> },
    { id: 'updated_at', header: t('common:date'), accessor: row => row.updated_at, mobile: 'secondary', sortable: true, cell: row => formatDate(row.updated_at, locale) },
    { id: 'feedback', header: t('feedback'), accessor: row => row.feedback, mobile: 'secondary' },
  ];
  return <div className="space-y-6">
    {work && <DashboardPanel title={t(user?.role === 'admin' ? 'pendingGrades' : 'pendingWork')} description={t(user?.role === 'admin' ? 'pendingGradesDescription' : 'pendingWorkDescription')}><DataTable columns={workColumns} queryKey={['staff-work', user?.id, locale]} fetchPage={dashboardApi.work} getRowId={workKey} label={t(user?.role === 'admin' ? 'pendingGrades' : 'pendingWork')} /></DashboardPanel>}
    {can(user, PERMISSIONS.manageAssignments) && <DashboardPanel title={t('recentSubmissions')}><DataTable columns={submissionColumns} queryKey={['staff-submissions', user?.id, locale]} fetchPage={dashboardApi.submissions} getRowId={row => String(row.id)} label={t('recentSubmissions')} /></DashboardPanel>}
    {grades && <DashboardPanel title={t('recentAcademicActivity')} description={t('latestGradesDescription')}><DataTable columns={gradeColumns} queryKey={['staff-grade-activity', user?.id, locale]} fetchPage={dashboardApi.grades} getRowId={row => String(row.id)} label={t('recentAcademicActivity')} /></DashboardPanel>}
    {!work && !grades && !can(user, PERMISSIONS.manageAssignments) && <EmptyState title={t('common:forbiddenTitle')} description={t('common:forbiddenDescription')} />}
  </div>;
}
