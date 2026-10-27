import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../../components/layout/page-header';
import { ChartCard } from '../../../components/shared/chart-card';
import { QueryState } from '../../../components/shared/query-state';
import { useAuthStore } from '../../auth/store';
import { CourseProgress } from '../components/course-progress';
import { DashboardSearch } from '../components/dashboard-search';
import { useDashboard } from '../hooks/useDashboard';
import { GradeChart } from '../components/grade-chart';
import { can, PERMISSIONS } from '../../../lib/permissions';

export function PerformancePage() {
  const { t } = useTranslation(['dashboard', 'navigation', 'common']);
  const query = useDashboard(); const user = useAuthStore(state => state.user);
  return <><PageHeader title={t('navigation:performance')} description={t('performanceDescription')} actions={<DashboardSearch />} />
    <QueryState pending={query.isPending} error={query.error} retry={query.refetch}>{query.data && user && <div className="space-y-6">
      <CourseProgress courses={query.data.courses} role={user.role} />
      {(can(user, PERMISSIONS.enterGrades) || can(user, PERMISSIONS.publishGrades)) && <GradeChart data={query.data.grade_distribution} />}
      <ChartCard title={t('attendanceOverview')} data={query.data.attendance_series} series={[{ key: 'attendance', label: t('common:attendance') }]} />
    </div>}</QueryState>
  </>;
}
