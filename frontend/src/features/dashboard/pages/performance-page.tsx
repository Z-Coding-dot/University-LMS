import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../../components/layout/page-header';
import { ChartCard } from '../../../components/shared/chart-card';
import { QueryState } from '../../../components/shared/query-state';
import { useAuthStore } from '../../auth/store';
import { CourseProgress } from '../components/course-progress';
import { DashboardSearch } from '../components/dashboard-search';
import { useDashboard } from '../hooks/useDashboard';

export function PerformancePage() {
  const { t } = useTranslation(['dashboard', 'navigation', 'common']);
  const query = useDashboard(); const user = useAuthStore(state => state.user);
  return <><PageHeader title={t('navigation:performance')} description={t('attendanceOverviewDescription')} actions={<DashboardSearch />} />
    <QueryState pending={query.isPending} error={query.isError} retry={query.refetch}>{query.data && user && <div className="space-y-6">
      <CourseProgress courses={query.data.courses} role={user.role} />
      <ChartCard title={t('attendanceOverview')} data={query.data.attendance_series} series={[{ key: 'attendance', label: t('common:attendance') }]} />
    </div>}</QueryState>
  </>;
}
