import { useTranslation } from 'react-i18next';
import { Assignments } from '../../teacher/components/assignments';
import { academicApi } from '../../../api/endpoints/academic';
import { DataTable, type DataColumn } from '../../../components/ui/data-table';
import { AttendanceBadge } from '../../../components/shared/identity';
import { useAuthStore } from '../../auth/store';
import { useDir } from '../../../hooks/useDir';
import { formatNumber } from '../../../lib/number';
import { formatDate } from '../../../lib/date';
import type { AttendanceHistoryRow } from '../../../api/types/academic';
import type { GradeComponent } from '../../../api/types';
export function CourseRecords({ id, kind }: { id: number; kind: 'grades' | 'attendance' }) {
  const { t } = useTranslation('academic'); const { locale } = useDir(); const user = useAuthStore(state => state.user);
  if (kind === 'attendance') {
    const columns: DataColumn<AttendanceHistoryRow>[] = [
      { id: 'date', header: t('date'), accessor: row => row.date, mobile: 'primary', sortable: true, cell: row => formatDate(row.date, locale) },
      { id: 'status', header: t('status'), accessor: row => row.status, mobile: 'primary', cell: row => row.status ? <AttendanceBadge status={row.status} /> : t('notMarked') },
    ];
    return <DataTable columns={columns} queryKey={['attendance-history', user?.id, id, locale]} fetchPage={(params, signal) => academicApi.history(id, params, signal)} getRowId={row => String(row.id)} label={t('attendance')} />;
  }
  const columns: DataColumn<GradeComponent & { score: number | null; feedback: string | null }>[] = [
    { id: 'name', header: t('component'), accessor: row => row.name[locale], mobile: 'primary' },
    { id: 'score', header: t('score'), accessor: row => row.score, mobile: 'primary', cell: row => row.score === null ? t('notPublished') : `${formatNumber(row.score, locale)} / ${formatNumber(row.max_score, locale)}` },
    { id: 'weight', header: t('weight'), accessor: row => row.weight, mobile: 'secondary', cell: row => formatNumber(row.weight / 100, locale, { style: 'percent' }) },
    { id: 'feedback', header: t('feedback'), accessor: row => row.feedback, mobile: 'secondary', cell: row => row.feedback ?? t('noFeedback') },
  ];
  return <div className="space-y-6"><section className="space-y-3"><h2 className="font-semibold">{t('components')}</h2><DataTable columns={columns} queryKey={['grade-breakdown', user?.id, id, locale]} fetchPage={(params, signal) => academicApi.breakdown(id, params, signal)} getRowId={row => String(row.id)} label={t('grades')} /></section><section className="space-y-3"><h2 className="font-semibold">{t('assignmentGrades')}</h2><p className="text-gray-500">{t('assignmentGradesHint')}</p><Assignments offeringId={id} /></section></div>;
}
