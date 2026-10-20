import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AttendanceStatus } from '../../../config/constants';
import { ATTENDANCE_STATUSES, MOBILE_PAGE_SIZE } from '../../../config/constants';
import { academicApi } from '../../../api/endpoints/academic';
import { useAcademicMutation, useAcademicQuery } from '../../../hooks/useAcademic';
import { useAuthStore } from '../../auth/store';
import { can, PERMISSIONS } from '../../../lib/permissions';
import { calendarDay } from '../../../lib/date';
import { formatNumber } from '../../../lib/number';
import { useDir } from '../../../hooks/useDir';
import { QueryState } from '../../../components/shared/query-state';
import { UserCell } from '../../../components/shared/identity';
import { DatePicker } from '../../../components/ui/date-picker';
import { Card } from '../../../components/ui/surfaces';
import { Button } from '../../../components/ui/button';
import { SegmentedControl } from '../../../components/ui/fields';
export function AttendanceEntry({ id }: { id: number }) {
  const { t } = useTranslation(['academic', 'common']); const { locale } = useDir(); const user = useAuthStore(state => state.user);
  const query = useAcademicQuery(['attendance-book', id], () => academicApi.attendance(id));
  const [date, setDate] = useState(calendarDay(new Date())); const [changes, setChanges] = useState<Record<string, AttendanceStatus>>({}); const [visible, setVisible] = useState(MOBILE_PAGE_SIZE);
  const save = useAcademicMutation((records: { student_id: number; status: AttendanceStatus }[]) => academicApi.saveAttendance(id, { date, records }));
  const take = can(user, PERMISSIONS.takeAttendance);
  const sessionId = query.data?.sessions.find(session => session.date === date)?.id;
  const status = (student: number) => changes[`${date}:${student}`] ?? query.data?.records.find(record => record.session_id === sessionId && record.student_id === student)?.status;
  const marked = query.data?.students.filter(student => !!status(student.id)).length ?? 0;
  return <QueryState pending={query.isPending} error={query.isError} retry={query.refetch}>{query.data && <div className="space-y-4"><div className="flex flex-col gap-3 sm:flex-row"><DatePicker label={t('date')} value={date} onChange={value => { if (value) setDate(value); }} />{take && <Button variant="secondary" onClick={() => setChanges(previous => ({ ...previous, ...Object.fromEntries(query.data.students.map(student => [`${date}:${student.id}`, 'present' as const])) }))}>{t('markAllPresent')}</Button>}</div>{query.data.students.slice(0, visible).map(student => <Card key={student.id} className="space-y-4"><UserCell name={student.name} secondary={student.profile.institutional_id} />{take ? <SegmentedControl label={`${t('attendance')} ${student.name}`} value={status(student.id) ?? ''} onChange={value => setChanges(previous => ({ ...previous, [`${date}:${student.id}`]: value as AttendanceStatus }))} options={ATTENDANCE_STATUSES.map(value => ({ value, label: t(`common:statuses.${value}`) }))} /> : <p>{status(student.id) ? t(`common:statuses.${status(student.id)}`) : t('notMarked')}</p>}</Card>)}{visible < query.data.students.length && <Button variant="secondary" className="w-full" onClick={() => setVisible(value => value + MOBILE_PAGE_SIZE)}>{t('common:loadMore')}</Button>}<div className="sticky bottom-[calc(5rem+env(safe-area-inset-bottom))] z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white/95 p-4 shadow-soft backdrop-blur lg:bottom-4"><p>{t('markedCount', { value: formatNumber(marked, locale), total: formatNumber(query.data.students.length, locale) })}</p>{take && <Button loading={save.isPending} disabled={!marked || date > calendarDay(new Date())} onClick={async () => { try { await save.mutateAsync(query.data.students.flatMap(student => { const value = status(student.id); return value ? [{ student_id: student.id, status: value }] : []; })); setChanges(previous => Object.fromEntries(Object.entries(previous).filter(([key]) => !key.startsWith(`${date}:`)))); } catch { /* Error toast is provided by mutation. */ } }}>{t('saveAttendance')}</Button>}</div></div>}</QueryState>;
}
