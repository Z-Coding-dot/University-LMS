import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookOpen, ClipboardCheck, GraduationCap, Percent, UsersRound, UserRoundCheck, type LucideIcon } from 'lucide-react';
import { useAuthStore } from '../../auth/store';
import { useDashboard } from '../hooks/useDashboard';
import { useDir } from '../../../hooks/useDir';
import { PageHeader } from '../../../components/layout/page-header';
import { Badge, EmptyState, LoadingState } from '../../../components/ui/surfaces';
import { Button, buttonStyles } from '../../../components/ui/button';
import { StatCard } from '../../../components/shared/stat-card';
import { formatDate } from '../../../lib/date';
import { AnnouncementPanel, TodaySchedule } from '../components/activity-panels';
import { DeadlinePreview } from '../components/deadline-preview';
import { visibleNavigation } from '../../../config/nav';
import type { DashboardMetricKey } from '../../../api/types/dashboard';

const metricIcons: Record<DashboardMetricKey, LucideIcon> = { average: GraduationCap, attendance: Percent, courses: BookOpen, students: UsersRound, teachers: UserRoundCheck, reviews: ClipboardCheck };

export function DashboardPage() {
  const { t } = useTranslation(['dashboard', 'common']); const { locale } = useDir();
  const user = useAuthStore(state => state.user); const query = useDashboard(false);
  if (query.isPending) return <LoadingState />;
  if (query.isError) return <EmptyState error title={t('common:errorTitle')} description={t('common:errorDescription')} action={<Button onClick={() => void query.refetch()}>{t('common:retry')}</Button>} />;
  if (!user) return null;
  const data = query.data;
  const shortcuts = visibleNavigation(user).filter(item => ['courses', 'assignments', 'student-accounts', 'teacher-accounts'].includes(item.id));
  return <>
    <PageHeader title={t(`titles.${user.role}`)} description={`${data.semester?.name[locale] ?? t('semesterNotAssigned')} · ${formatDate(data.as_of, locale)}`} actions={<Badge tone="brand">{t(`common:roles.${user.role}`)}</Badge>} />
    <p className="text-gray-600">{t('overview')}</p>
    <div className={`grid gap-4 sm:grid-cols-2 ${data.metrics.length === 4 ? '2xl:grid-cols-4' : 'xl:grid-cols-3'}`}>{data.metrics.map((metric, index) => <StatCard key={metric.key} title={t(`metrics.${metric.key}`)} value={metric.value} description={t(`metricHints.${metric.key}`)} icon={metricIcons[metric.key]} highlight={index === 0} suffix={metric.percent ? t('percentSign') : undefined} />)}</div>
    <nav aria-label={t('quickLinks')} className="flex flex-wrap gap-3">{shortcuts.map(item => <Link key={item.id} to={item.to} className={buttonStyles({ variant: 'secondary' })}><item.icon size={18} aria-hidden="true" />{t(item.label)}</Link>)}</nav>
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="min-w-0 space-y-6"><DeadlinePreview /><AnnouncementPanel announcements={data.announcements} limit={3} /></div>
      <aside className="min-w-0"><TodaySchedule data={data} limit={3} /></aside>
    </div>
  </>;
}
