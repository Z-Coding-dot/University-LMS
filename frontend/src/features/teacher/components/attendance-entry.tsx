import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { AttendanceStatus } from '../../../config/constants';
import { ATTENDANCE_STATUSES } from '../../../config/constants';
import { academicApi } from '../../../api/endpoints/academic';
import { useAcademicMutation, useAcademicQuery } from '../../../hooks/useAcademic';
import { useAuthStore } from '../../auth/store';
import { can, PERMISSIONS } from '../../../lib/permissions';
import { calendarDay, parseISO } from '../../../lib/date';
import { formatNumber } from '../../../lib/number';
import { useDir } from '../../../hooks/useDir';
import { QueryState } from '../../../components/shared/query-state';
import { DatePicker } from '../../../components/ui/date-picker';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/fields';
import { cn } from '../../../lib/cn';
export function AttendanceEntry({ id }: { id: number }) {
  const { t } = useTranslation(['academic', 'common']); const { locale } = useDir(); const user = useAuthStore(state => state.user);
  const query = useAcademicQuery(['attendance-book', id], () => academicApi.attendance(id));
  const [params] = useSearchParams();
  const [date, setDate] = useState(() => { const value = params.get('date'); try { if (value?.length === 10) { parseISO(value); return value; } } catch { /* Use today's date for invalid links. */ } return calendarDay(new Date()); });
  const [changes, setChanges] = useState<Record<string, AttendanceStatus>>({}); const [search, setSearch] = useState('');
  const save = useAcademicMutation((records: { student_id: number; status: AttendanceStatus }[]) => academicApi.saveAttendance(id, { date, records }));
  const take = can(user, PERMISSIONS.takeAttendance);
  const sessionId = query.data?.sessions.find(session => session.date === date)?.id;
  const status = (student: number) => changes[`${date}:${student}`] ?? query.data?.records.find(record => record.session_id === sessionId && record.student_id === student)?.status;
  const marked = query.data?.students.filter(student => !!status(student.id)).length ?? 0;
  const students = query.data?.students.filter(student => `${student.name} ${student.profile.institutional_id}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())) ?? [];
  return <QueryState pending={query.isPending} error={query.error} retry={query.refetch}>{query.data && <div className="space-y-4">
    <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-end"><DatePicker label={t('date')} value={date} disabled={save.isPending} onChange={value => { if (value) setDate(value); }} />{take && <Button variant="secondary" disabled={save.isPending} onClick={() => setChanges(previous => ({ ...previous, ...Object.fromEntries(query.data.students.map(student => [`${date}:${student.id}`, 'present' as const])) }))}>{t('markAllPresent')}</Button>}</div>
    <Input type="search" aria-label={t('common:search')} placeholder={t('common:search')} value={search} onChange={event => setSearch(event.target.value)} className="max-w-sm" />
    <div role="region" aria-label={t('attendance')} tabIndex={0} className="overflow-x-auto rounded-xl border bg-white"><table className="w-full min-w-[34rem] text-start"><caption className="sr-only">{t('attendance')} - {date}</caption><thead className="border-b bg-gray-50"><tr><th scope="col" className="sticky start-0 z-10 min-w-40 bg-gray-50 px-3 py-2 text-start">{t('student')}</th>{ATTENDANCE_STATUSES.map(value => <th key={value} scope="col" className="px-2 py-2 text-center">{t(`common:statuses.${value}`)}</th>)}</tr></thead><tbody className="divide-y">{students.map(student => <tr key={student.id} className="hover:bg-gray-50"><th scope="row" className="sticky start-0 z-10 bg-white px-3 py-2 text-start font-medium"><span>{student.name}</span><bdi className="block font-normal text-gray-500">{student.profile.institutional_id}</bdi></th>{ATTENDANCE_STATUSES.map(value => <td key={value} className="px-1 py-1 text-center"><label className={cn('inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-md border border-transparent sm:min-h-8', status(student.id) === value ? value === 'absent' ? 'border-red-200 bg-red-50 text-red-700' : value === 'late' ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'hover:bg-gray-100')}><input type="radio" name={`attendance-${id}-${student.id}`} value={value} checked={status(student.id) === value} disabled={!take || save.isPending} aria-label={`${student.name} - ${t(`common:statuses.${value}`)}`} onChange={() => setChanges(previous => ({ ...previous, [`${date}:${student.id}`]: value }))} className="h-4 w-4 accent-brand" /></label></td>)}</tr>)}</tbody></table>{!students.length && <p className="p-4 text-gray-500">{t('common:noResults')}</p>}</div>
    <div className="sticky bottom-[calc(var(--mobile-tabs-height)+.75rem)] z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white/95 p-4 shadow-soft backdrop-blur lg:bottom-4"><p>{t('markedCount', { value: formatNumber(marked, locale), total: formatNumber(query.data.students.length, locale) })}</p>{take && <Button loading={save.isPending} disabled={!marked || date > calendarDay(new Date())} onClick={async () => { try { await save.mutateAsync(query.data.students.flatMap(student => { const value = status(student.id); return value ? [{ student_id: student.id, status: value }] : []; })); setChanges(previous => Object.fromEntries(Object.entries(previous).filter(([key]) => !key.startsWith(`${date}:`)))); } catch { /* Error toast is provided by mutation. */ } }}>{t('saveAttendance')}</Button>}</div>
  </div>}</QueryState>;
}
