import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookOpen, ClipboardCheck, GraduationCap, Percent, UsersRound, UserRoundCheck, type LucideIcon } from 'lucide-react';
import { useAuthStore } from '../../auth/store';
import { useDashboard, useDashboardFilters } from '../hooks/useDashboard';
import { useDir } from '../../../hooks/useDir';
import { PageHeader } from '../../../components/layout/page-header';
import { Badge, EmptyState, LoadingState } from '../../../components/ui/surfaces';
import { Button } from '../../../components/ui/button';
import { Select } from '../../../components/ui/fields';
import { StatCard } from '../../../components/shared/stat-card';
import { ChartCard } from '../../../components/shared/chart-card';
import { formatDate } from '../../../lib/date';
import { can, PERMISSIONS } from '../../../lib/permissions';
import { CourseProgress } from '../components/course-progress';
import { TaskTable, LearningFilesTable } from '../components/academic-tables';
import { AnnouncementPanel, LatestGrades, TodaySchedule } from '../components/activity-panels';
import { DashboardSearch } from '../components/dashboard-search';
import type { DashboardMetricKey } from '../../../api/types/dashboard';

const metricIcons: Record<DashboardMetricKey, LucideIcon> = { average: GraduationCap, attendance: Percent, courses: BookOpen, students: UsersRound, teachers: UserRoundCheck, reviews: ClipboardCheck };

export function DashboardPage() {
  const { t } = useTranslation(['dashboard', 'common']); const { locale } = useDir();
  const user = useAuthStore(state => state.user); const query = useDashboard();
  const { offeringId, setOfferingId, search, setSearch } = useDashboardFilters(); const location = useLocation();
  useEffect(() => {
    if (!location.hash || !query.data) return;
    const id = location.hash.slice(1);
    // Hash navigation also works after a lazy route or server response finishes.
    const frame = requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: 'start', behavior: 'instant' }));
    return () => cancelAnimationFrame(frame);
  }, [location.hash, query.data]);
  if (query.isPending) return <LoadingState />;
  if (query.isError) return <EmptyState error title={t('common:errorTitle')} description={t('common:errorDescription')} action={<Button onClick={() => void query.refetch()}>{t('common:retry')}</Button>} />;
  if (!user) return null;
  const data = query.data;
  const showGrades = user.role !== 'teacher' || can(user, PERMISSIONS.enterGrades) || can(user, PERMISSIONS.publishGrades);
  return <>
    <PageHeader title={t(`titles.${user.role}`)} description={`${data.semester?.name[locale] ?? t('semesterNotAssigned')} · ${formatDate(data.as_of, locale)}`} actions={<Badge tone="brand">{t(`common:roles.${user.role}`)}</Badge>} />
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="md:hidden"><DashboardSearch /></div><p className="text-gray-500">{t('overview')}</p><div className="w-full sm:max-w-72"><Select aria-label={t('filterCourses')} value={offeringId ? String(offeringId) : 'all'} onValueChange={value => setOfferingId(value === 'all' ? undefined : Number(value))} options={[{ value: 'all', label: t('allCourses') }, ...data.courses.map(course => ({ value: String(course.id), label: course.name[locale] }))]} /></div></div>
    <div className={`grid gap-4 sm:grid-cols-2 ${data.metrics.length === 4 ? '2xl:grid-cols-4' : 'xl:grid-cols-3'}`}>{data.metrics.map((metric, index) => <StatCard key={metric.key} title={t(`metrics.${metric.key}`)} value={metric.value} description={t(`metricHints.${metric.key}`)} icon={metricIcons[metric.key]} highlight={index === 0} suffix={metric.percent ? t('percentSign') : undefined} />)}</div>
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_19rem]"><div className="min-w-0 space-y-6"><CourseProgress courses={data.courses} role={user.role} /><TaskTable /><LearningFilesTable /><section id="performance" className="scroll-mt-28"><ChartCard title={t('attendanceOverview')} description={t('attendanceOverviewDescription')} data={data.attendance_series} series={[{ key: 'attendance', label: t('common:attendance') }]} /></section><AnnouncementPanel announcements={data.announcements} /></div><aside className="min-w-0 space-y-6"><TodaySchedule data={data} />{showGrades && <LatestGrades grades={data.latest_grades} role={user.role} />}{search && <Button variant="secondary" onClick={() => setSearch('')}>{t('clearSearch')}</Button>}</aside></div>
  </>;
}
