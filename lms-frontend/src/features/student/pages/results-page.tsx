import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { academicApi } from '../../../api/endpoints/academic';
import type { ResultCourse } from '../../../api/types/academic';
import { useAcademicQuery } from '../../../hooks/useAcademic';
import { useAuthStore } from '../../auth/store';
import { useDir } from '../../../hooks/useDir';
import { QueryState } from '../../../components/shared/query-state';
import { ChartCard } from '../../../components/shared/chart-card';
import { Card } from '../../../components/ui/surfaces';
import { Select } from '../../../components/ui/fields';
import { DataTable, type DataColumn } from '../../../components/ui/data-table';
import { PageHeader } from '../../../components/layout/page-header';
import { formatNumber } from '../../../lib/number';
export function ResultsPage() {
  const { t } = useTranslation('academic'); const { locale } = useDir(); const user = useAuthStore(state => state.user);
  const query = useAcademicQuery(['results'], academicApi.results); const [semester, setSemester] = useState<number | null>(null);
  const selected = query.data?.semesters.find(item => item.semester.id === semester) ?? query.data?.semesters.at(-1);
  const display = (value: number | null | undefined) => value === null || value === undefined ? t('notPublished') : formatNumber(value, locale, { maximumFractionDigits: 1 });
  const columns: DataColumn<ResultCourse>[] = [
    { id: 'name', header: t('course'), accessor: row => row.name[locale], mobile: 'primary' },
    { id: 'total', header: t('total'), accessor: row => row.total, mobile: 'primary', cell: row => display(row.total) },
    { id: 'credits', header: t('credits'), accessor: row => row.credits, mobile: 'secondary' },
    { id: 'letter', header: t('letter'), accessor: row => row.letter, mobile: 'secondary', cell: row => row.letter ?? t('notPublished') },
  ];
  return <><PageHeader title={t('results')} /><QueryState pending={query.isPending} error={query.isError} retry={query.refetch}>{query.data && <div className="space-y-6"><div className="grid gap-4 sm:grid-cols-2"><Card><p className="text-gray-500">{t('semesterAverage')}</p><p className="mt-2 text-3xl font-semibold">{display(selected?.average)}</p></Card><Card><p className="text-gray-500">{t('cumulativeAverage')}</p><p className="mt-2 text-3xl font-semibold">{display(query.data.cumulative_average)}</p></Card></div>{selected && <DataTable columns={columns} queryKey={['result-courses', user?.id, locale]} fetchPage={academicApi.resultCourses} filterValues={{ semester_id: selected.semester.id }} getRowId={row => String(row.id)} label={t('results')} filters={<Select aria-label={t('semester')} value={String(selected.semester.id)} onValueChange={value => setSemester(Number(value))} options={query.data.semesters.map(item => ({ value: String(item.semester.id), label: item.semester.name[locale] }))} />}<ChartCard title={t('semesterProgress')} data={query.data.semesters.flatMap(item => item.average === null ? [] : [{ label: item.semester.name[locale], average: item.average }])} series={[{ key: 'average', label: t('semesterAverage') }]} /></div>}</QueryState></>;
}
