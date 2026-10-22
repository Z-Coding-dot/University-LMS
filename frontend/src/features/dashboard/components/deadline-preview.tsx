import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { dashboardApi } from '../../../api/endpoints/dashboard';
import { useAuthStore } from '../../auth/store';
import { useDir } from '../../../hooks/useDir';
import { formatDate } from '../../../lib/date';
import { Badge, EmptyState } from '../../../components/ui/surfaces';
import { buttonStyles } from '../../../components/ui/button';
import { QueryState } from '../../../components/shared/query-state';
import { DashboardPanel } from './dashboard-panel';

export function DeadlinePreview() {
  const { t } = useTranslation('dashboard'); const { locale } = useDir();
  const user = useAuthStore(state => state.user);
  const query = useQuery({ queryKey: ['overview-deadlines', user?.id, locale], queryFn: ({ signal }) => dashboardApi.tasks({ per_page: 3, sort: 'due_at', attention_only: 1 }, signal), enabled: !!user });
  return <DashboardPanel id="deadlines" title={t('whatsDue')} description={t('deadlinePreviewDescription')} action={<Link to={user?.role === 'student' ? '/courses' : '/assignments'} className={buttonStyles({ variant: 'ghost' })}>{t('viewAll')}</Link>}>
    <QueryState pending={query.isPending} error={query.error} retry={query.refetch}>
      {query.data?.data.length ? <div className="divide-y divide-gray-100">{query.data.data.map(task => <Link key={task.id} to={`/assignments/${task.id}`} className="flex min-h-11 flex-wrap items-center justify-between gap-3 rounded-xl py-4 hover:bg-gray-50">
        <div className="min-w-0"><p className="font-semibold text-ink">{task.title}</p><p className="mt-1 text-gray-600">{task.course[locale]} · {formatDate(task.due_at, locale)}</p></div>
        <Badge tone={task.status === 'overdue' ? 'danger' : ['submitted', 'graded', 'complete'].includes(task.status) ? 'success' : 'warning'}>{t(`taskStatuses.${task.status}`)}</Badge>
      </Link>)}</div> : <EmptyState title={t('noDeadlines')} description={t('noDeadlinesDescription')} />}
    </QueryState>
  </DashboardPanel>;
}
