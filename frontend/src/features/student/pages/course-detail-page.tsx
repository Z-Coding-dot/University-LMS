import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import type { User } from '../../../api/types';
import { academicApi } from '../../../api/endpoints/academic';
import { useAcademicQuery } from '../../../hooks/useAcademic';
import { useDir } from '../../../hooks/useDir';
import { useAuthStore } from '../../auth/store';
import { can, PERMISSIONS } from '../../../lib/permissions';
import { formatNumber } from '../../../lib/number';
import { PageHeader } from '../../../components/layout/page-header';
import { QueryState } from '../../../components/shared/query-state';
import { UserCell } from '../../../components/shared/identity';
import { DataTable, type DataColumn } from '../../../components/ui/data-table';
import { Tabs } from '../../../components/ui/disclosure';
import { Badge, Card } from '../../../components/ui/surfaces';
import { buttonStyles } from '../../../components/ui/button';
import { ErrorPage } from '../../../app/error-page';
import { CourseRecords } from '../components/course-records';
import { CourseWeeks } from '../components/course-weeks';
import { AttendanceEntry } from '../../teacher/components/attendance-entry';
import { GradeEntry } from '../../teacher/components/grade-entry';
import { Assignments } from '../../teacher/components/assignments';
import { AnnouncementsPage } from '../../announcements/pages/announcements-page';

function CourseRoster({ id }: { id: number }) {
  const { t } = useTranslation('academic'); const { locale } = useDir();
  const user = useAuthStore(state => state.user);
  const columns: DataColumn<User>[] = [
    { id: 'name', header: t('student'), mobile: 'primary', sortable: true, accessor: row => row.name, cell: row => <UserCell name={row.name} secondary={row.profile.institutional_id} /> },
    { id: 'email', header: t('email'), mobile: 'secondary', sortable: true, accessor: row => row.email, cell: row => <bdi className="break-all">{row.email}</bdi> },
  ];
  return <DataTable columns={columns} queryKey={['course-roster', user?.id, id, locale]} fetchPage={(params, signal) => academicApi.roster(id, params, signal)} getRowId={row => String(row.id)} label={t('students')} />;
}

export function CourseDetailPage() {
  const { courseId } = useParams(); const id = Number(courseId);
  const validId = Number.isSafeInteger(id) && id > 0;
  const { t } = useTranslation('academic'); const { locale } = useDir();
  const user = useAuthStore(state => state.user); const [params, setParams] = useSearchParams();
  const query = useAcademicQuery(['course', id], () => academicApi.course(id), validId);
  if (!validId) return <ErrorPage kind="notFound" />;
  const student = user?.role === 'student';
  const tabs = [
    { value: 'weeks', label: t('weeklyLearning'), content: <CourseWeeks offeringId={id} /> },
    ...(!student ? [{ value: 'students', label: t('students'), content: <CourseRoster id={id} /> }] : []),
    { value: 'attendance', label: t('attendance'), content: student ? <CourseRecords id={id} kind="attendance" /> : <AttendanceEntry id={id} /> },
    ...(student || can(user, PERMISSIONS.enterGrades) || can(user, PERMISSIONS.publishGrades) ? [{ value: 'grades', label: t('grades'), content: student ? <CourseRecords id={id} kind="grades" /> : <GradeEntry id={id} /> }] : []),
    { value: 'assignments', label: t('assignments'), content: <Assignments offeringId={id} /> },
    { value: 'announcements', label: t('announcements'), content: <AnnouncementsPage offeringId={id} embedded /> },
  ];
  const active = tabs.find(tab => tab.value === params.get('tab'))?.value ?? tabs[0].value;
  return <>
    <Link to="/courses" className={buttonStyles({ variant: 'ghost' })}><ArrowLeft size={18} aria-hidden="true" className="rtl:rotate-180" />{t('backToCourses')}</Link>
    <QueryState pending={query.isPending} error={query.isError} retry={query.refetch}>
      {query.data && <div className="space-y-6">
        <PageHeader title={query.data.course.name[locale]} description={`${query.data.course.code} · ${query.data.semester.name[locale]}`} actions={<Badge tone="brand">{t('creditCount', { value: formatNumber(query.data.course.credits, locale) })}</Badge>} />
        <Card className="flex flex-wrap gap-x-8 gap-y-3">
          <p><span className="text-gray-500">{t('teacher')}: </span>{query.data.teacher.name}</p>
          {student ? <p><span className="text-gray-500">{t('attendance')}: </span>{query.data.attendance_percent === null ? t('notMarked') : formatNumber(query.data.attendance_percent / 100, locale, { style: 'percent', maximumFractionDigits: 0 })}</p> : <p><span className="text-gray-500">{t('students')}: </span>{formatNumber(query.data.student_count, locale)}</p>}
        </Card>
        <Tabs label={t('courseSections')} tabs={tabs} value={active} onValueChange={value => setParams(previous => { previous.set('tab', value); return previous; }, { replace: true })} />
      </div>}
    </QueryState>
  </>;
}
