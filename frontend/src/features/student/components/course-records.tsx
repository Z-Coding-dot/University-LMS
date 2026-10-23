import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { academicApi } from '../../../api/endpoints/academic';
import { DataTable, type DataColumn } from '../../../components/ui/data-table';
import { AttendanceBadge } from '../../../components/shared/identity';
import { useAuthStore } from '../../auth/store';
import { useDir } from '../../../hooks/useDir';
import { formatNumber } from '../../../lib/number';
import { formatDate } from '../../../lib/date';
import type { AttendanceHistoryRow, StudentGradeItem } from '../../../api/types/academic';
import { Badge } from '../../../components/ui/surfaces';
export function CourseRecords({ id, kind }: { id: number; kind: 'grades' | 'attendance' }) {
  const { t } = useTranslation('academic'); const { locale } = useDir(); const user = useAuthStore(state => state.user);
  if (kind === 'attendance') {
    const columns: DataColumn<AttendanceHistoryRow>[] = [
      { id: 'date', header: t('date'), accessor: row => row.date, mobile: 'primary', sortable: true, cell: row => formatDate(row.date, locale) },
      { id: 'status', header: t('status'), accessor: row => row.status, mobile: 'primary', cell: row => row.status ? <AttendanceBadge status={row.status} /> : t('notMarked') },
    ];
    return <DataTable columns={columns} queryKey={['attendance-history', user?.id, id, locale]} fetchPage={(params, signal) => academicApi.history(id, params, signal)} getRowId={row => String(row.id)} label={t('attendance')} />;
  }
  const statusLabels: Record<StudentGradeItem['status'], string> = { draft: 'notPublished', published: 'common:statuses.published', locked: 'common:statuses.locked', not_submitted: 'notSubmitted', submitted: 'submitted', graded: 'graded' };
  const columns: DataColumn<StudentGradeItem>[] = [
    { id: 'title', header: t('assessmentTitle'), accessor: row => row.title, mobile: 'primary', sortable: true, cell: row => row.kind === 'assignment' ? <Link to={`/assignments/${row.source_id}`} className="inline-flex min-h-11 items-center text-brand-action">{row.title}</Link> : row.title },
    { id: 'kind', header: t('assessmentType'), accessor: row => row.kind, mobile: 'primary', cell: row => t(row.kind === 'component' ? 'component' : 'assignmentType') },
    { id: 'score', header: t('score'), accessor: row => row.score, mobile: 'primary', sortable: true, cell: row => row.score === null ? t(row.kind === 'component' ? 'notPublished' : 'notGraded') : <bdi>{formatNumber(row.score, locale)} / {formatNumber(row.max_score, locale)}</bdi> },
    { id: 'week_number', header: t('week'), accessor: row => row.week_number, mobile: 'secondary', sortable: true, cell: row => row.week_number === null ? t('notApplicable') : t('weekNumber', { value: formatNumber(row.week_number, locale) }) },
    { id: 'weight', header: t('weight'), accessor: row => row.weight, mobile: 'secondary', sortable: true, cell: row => row.weight === null ? t('notApplicable') : formatNumber(row.weight / 100, locale, { style: 'percent' }) },
    { id: 'status', header: t('status'), accessor: row => row.status, mobile: 'secondary', cell: row => <Badge tone={['published', 'locked', 'graded'].includes(row.status) ? 'success' : 'neutral'}>{t(statusLabels[row.status])}</Badge> },
    { id: 'feedback', header: t('feedback'), accessor: row => row.feedback, mobile: 'secondary', cell: row => row.feedback ?? t('noFeedback') },
  ];
  return <div className="space-y-3"><p className="text-gray-500">{t('combinedGradesHint')}</p><DataTable columns={columns} queryKey={['grade-breakdown', user?.id, id, locale]} fetchPage={(params, signal) => academicApi.breakdown(id, params, signal)} getRowId={row => `${row.kind}:${row.source_id}`} label={t('grades')} /></div>;
}
