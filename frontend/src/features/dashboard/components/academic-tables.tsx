import { DownloadLink } from '../../../components/shared/download-link';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ClipboardList, Download, FileArchive, MoreVertical } from 'lucide-react';
import type { DashboardFile, DashboardTask } from '../../../api/types/dashboard';
import { dashboardApi } from '../../../api/endpoints/dashboard';
import { useAuthStore } from '../../auth/store';
import { useDir } from '../../../hooks/useDir';
import { useDebounce } from '../../../hooks/useDebounce';
import { formatDate } from '../../../lib/date';
import { formatNumber } from '../../../lib/number';
import { DataTable, type DataColumn } from '../../../components/ui/data-table';
import { Badge } from '../../../components/ui/surfaces';
import { buttonStyles, IconButton } from '../../../components/ui/button';
import { Dialog, Dropdown } from '../../../components/ui/overlays';
import { DashboardPanel } from './dashboard-panel';
import { useDashboardFilters } from '../hooks/useDashboard';

export function TaskTable() {
  const { t } = useTranslation(['dashboard', 'common']); const { locale } = useDir();
  const user = useAuthStore(state => state.user); const { search, offeringId } = useDashboardFilters();
  const debounced = useDebounce(search); const [selected, setSelected] = useState<DashboardTask | null>(null);
  const columns = useMemo<DataColumn<DashboardTask>[]>(() => [
    { id: 'title', header: t('courseTopic'), accessor: row => row.title, mobile: 'primary', sortable: true, cell: row => <div className="flex min-w-0 items-start gap-3"><ClipboardList size={20} className="mt-1 shrink-0 text-brand" aria-hidden="true" /><div><p className="font-medium">{row.title}</p><p className="mt-1 text-gray-500">{row.course[locale]}</p></div></div> },
    { id: 'due_at', header: t('dueDate'), accessor: row => row.due_at, mobile: 'primary', sortable: true, cell: row => <span className="whitespace-nowrap">{formatDate(row.due_at, locale)}</span> },
    ...(user?.role !== 'student' ? [{ id: 'submission_rate', header: t('submissionRate'), accessor: (row: DashboardTask) => row.submission_rate, mobile: 'secondary' as const, sortable: true, cell: (row: DashboardTask) => formatNumber(row.submission_rate / 100, locale, { style: 'percent', maximumFractionDigits: 0 }) }] : []),
    { id: 'status', header: t('status'), accessor: row => row.status, mobile: 'secondary', sortable: true, cell: row => <Badge tone={['complete', 'graded', 'submitted'].includes(row.status) ? 'success' : row.status === 'overdue' ? 'danger' : 'warning'}>{t(`taskStatuses.${row.status}`)}</Badge> },
  ], [t, locale, user?.role]);
  return <DashboardPanel id="tasks" title={t('whatsDue')} description={t(user?.role === 'student' ? 'dueStudentDescription' : 'dueStaffDescription')}>
    <DataTable columns={columns} queryKey={['dashboard-tasks', user?.id, locale]} fetchPage={dashboardApi.tasks} getRowId={row => String(row.id)} label={t('whatsDue')} externalSearch={debounced} showSearch={false} pageSize={5} filterValues={{ offering_id: offeringId }} actions={row => <Dropdown trigger={<IconButton label={t('common:actions')}><MoreVertical size={19} /></IconButton>} items={[{ label: t('viewDetails'), onSelect: () => setSelected(row) }]} />} />
    <Dialog title={selected?.title ?? t('viewDetails')} description={selected?.course[locale]} open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}>
      {selected && <div className="space-y-5"><p className="whitespace-pre-wrap text-gray-600">{selected.description}</p><dl className="space-y-3"><div><dt className="text-gray-500">{t('dueDate')}</dt><dd className="font-medium">{formatDate(selected.due_at, locale)}</dd></div><div><dt className="text-gray-500">{t('status')}</dt><dd>{t(`taskStatuses.${selected.status}`)}</dd></div>{selected.score !== null && <div><dt className="text-gray-500">{t('score')}</dt><dd>{formatNumber(selected.score, locale)}</dd></div>}{selected.feedback && <div><dt className="text-gray-500">{t('feedback')}</dt><dd>{selected.feedback}</dd></div>}</dl></div>}
    </Dialog>
  </DashboardPanel>;
}

export function LearningFilesTable() {
  const { t } = useTranslation(['dashboard', 'common']); const { locale } = useDir();
  const user = useAuthStore(state => state.user); const { offeringId } = useDashboardFilters();
  const columns = useMemo<DataColumn<DashboardFile>[]>(() => [
    { id: 'name', header: t('file'), accessor: row => row.name, mobile: 'primary', sortable: true, cell: row => <div className="flex items-start gap-3"><FileArchive size={20} className="mt-1 shrink-0 text-brand" aria-hidden="true" /><div className="min-w-0"><bdi className="break-all font-medium">{row.name}</bdi><p className="mt-1 text-gray-500">{t('fileSize', { value: formatNumber(row.size / 1024, locale, { maximumFractionDigits: 1 }) })}</p></div></div> },
    { id: 'course', header: t('course'), accessor: row => row.course[locale], mobile: 'secondary', sortable: true },
    { id: 'uploaded_at', header: t('common:date'), accessor: row => row.uploaded_at, mobile: 'secondary', sortable: true, cell: row => <span className="whitespace-nowrap">{formatDate(row.uploaded_at, locale)}</span> },
  ], [t, locale]);
  return <DataTable columns={columns} queryKey={['dashboard-files', user?.id, locale]} fetchPage={dashboardApi.files} getRowId={row => `${row.offering_id}:${row.id}`} label={t('latestFiles')} filterValues={{ offering_id: offeringId }} actions={row => <DownloadLink file={row} className={buttonStyles({ variant: 'ghost', size: 'icon' })} aria-label={t('downloadFile', { name: row.name })} title={t('downloadFile', { name: row.name })}><Download size={19} /></DownloadLink>} />;
}
