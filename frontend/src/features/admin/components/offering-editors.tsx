import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { User } from '../../../api/types';
import type { AcademicCatalog, CourseView } from '../../../api/types/academic';
import { adminAcademicApi } from '../../../api/endpoints/admin-academic';
import { academicApi } from '../../../api/endpoints/academic';
import { useAcademicMutation } from '../../../hooks/useAcademic';
import { useDir } from '../../../hooks/useDir';
import { useAuthStore } from '../../auth/store';
import { ConfigForm, type ConfigField } from '../../../components/shared/config-form';
import { FormField, Input, Select, Switch } from '../../../components/ui/fields';
import { DataTable, type DataColumn } from '../../../components/ui/data-table';
import { Button } from '../../../components/ui/button';
import { Tabs } from '../../../components/ui/disclosure';
import { WEEKDAYS } from '../../../config/constants';
import { apiErrorMessage } from '../../../api/client';
import { offeringSchema, scheduleSchema } from '../academic-schemas';

export function OfferingEditor({ initial, catalog, onClose }: { initial?: CourseView; catalog: AcademicCatalog; onClose: () => void }) {
  const { locale } = useDir(); const { t } = useTranslation('admin');
  const save = useAcademicMutation((values: unknown) => adminAcademicApi.saveOffering(values, initial?.id));
  const fields: ConfigField[] = [
    ...(!initial ? [{ name: 'course_id', label: 'academic:course', type: 'select' as const, options: catalog.courses.map(row => ({ value: String(row.id), label: `${row.code} · ${row.name[locale]}` })) }, { name: 'semester_id', label: 'academic:semester', type: 'select' as const, options: catalog.semesters.map(row => ({ value: String(row.id), label: row.name[locale] })) }] : []),
    { name: 'teacher_id', label: 'academic:teacher', type: 'select', options: catalog.teachers.filter(row => row.status === 'active').map(row => ({ value: String(row.id), label: row.name })) },
    { name: 'capacity', label: 'admin:capacity', type: 'number' },
  ];
  return <ConfigForm fields={fields} defaults={{ course_id: initial?.course_id ?? catalog.courses[0]?.id ?? '', semester_id: initial?.semester_id ?? catalog.semesters.at(-1)?.id ?? '', teacher_id: initial?.teacher_id ?? catalog.teachers.find(row => row.status === 'active')?.id ?? '', capacity: initial?.capacity ?? 35 }} schema={offeringSchema} pending={save.isPending} onSubmit={async values => { await save.mutateAsync(values); onClose(); }}>{initial && <p className="text-gray-600">{t('immutableOffering')}</p>}</ConfigForm>;
}
export function EnrollmentEditor({ offering, onClose }: { offering: CourseView; onClose: () => void }) {
  const { t } = useTranslation(['admin', 'common']); const { locale } = useDir(); const user = useAuthStore(state => state.user);
  const [tab, setTab] = useState('enroll'); const [selected, setSelected] = useState<string[]>([]); const [current, setCurrent] = useState(true); const [error, setError] = useState('');
  const save = useAcademicMutation((ids: number[]) => adminAcademicApi.enroll(offering.id, { student_ids: ids, make_current: current }));
  const columns: DataColumn<User>[] = [{ id: 'name', header: t('common:name'), accessor: row => row.name, mobile: 'primary', sortable: true }, { id: 'institutional_id', header: t('profile:id'), accessor: row => row.profile.institutional_id, mobile: 'primary', sortable: true }, { id: 'email', header: t('common:email'), accessor: row => row.email, mobile: 'secondary' }];
  return <div className="space-y-4"><p className="text-gray-600">{t('enrollmentHint')}</p><Tabs label={t('enrollStudents')} value={tab} onValueChange={setTab} tabs={[
    { value: 'enroll', label: t('enrollStudents'), content: <div className="space-y-4"><DataTable columns={columns} queryKey={['candidates', user?.id, locale, offering.id]} fetchPage={(params, signal) => adminAcademicApi.candidates(offering.id, params, signal)} getRowId={row => String(row.id)} label={t('enrollStudents')} selectable onSelectionChange={setSelected} /><div className="flex items-center justify-between gap-4"><span>{t('makeCurrent')}</span><Switch label={t('makeCurrent')} checked={current} onCheckedChange={setCurrent} disabled={save.isPending} /></div>{error && <p role="alert" className="text-red-700">{error}</p>}<Button className="w-full" disabled={!selected.length} loading={save.isPending} onClick={async () => { setError(''); try { await save.mutateAsync(selected.map(Number)); onClose(); } catch (err) { setError(apiErrorMessage(err)); } }}>{t('enrollSelected')}</Button></div> },
    { value: 'roster', label: t('academic:students'), content: <DataTable columns={columns} queryKey={['enrollment-roster', user?.id, locale, offering.id]} fetchPage={(params, signal) => academicApi.roster(offering.id, params, signal)} getRowId={row => String(row.id)} label={t('academic:students')} /> },
  ]} /></div>;
}
export function ScheduleEditor({ offering, onClose }: { offering: CourseView; onClose: () => void }) {
  const { t } = useTranslation(['admin', 'common']); const [slots, setSlots] = useState(offering.schedule.map(({ weekday, start, end, room }) => ({ weekday, start, end, room }))); const [error, setError] = useState('');
  const save = useAcademicMutation((values: unknown) => adminAcademicApi.schedule(offering.id, values));
  const change = (index: number, field: string, value: string | number) => setSlots(previous => previous.map((row, i) => i === index ? { ...row, [field]: value } : row));
  return <form className="space-y-5" onSubmit={async event => { event.preventDefault(); setError(''); const parsed = scheduleSchema.safeParse({ slots }); if (!parsed.success) { setError(t(parsed.error.issues[0].message)); return; } try { await save.mutateAsync(parsed.data); onClose(); } catch (err) { setError(apiErrorMessage(err)); } }}>
    {slots.map((slot, index) => <fieldset key={index} className="space-y-3 rounded-xl border p-4"><FormField label={t('weekday')}>{props => <Select {...props} value={String(slot.weekday)} onValueChange={value => change(index, 'weekday', Number(value))} options={WEEKDAYS.map(value => ({ value: String(value), label: t(`common:weekdays.${value}`) }))} />}</FormField><div className="grid gap-3 sm:grid-cols-2">{(['start', 'end'] as const).map(field => <FormField key={field} label={t(field === 'start' ? 'startTime' : 'endTime')}>{props => <Input {...props} type="time" value={slot[field]} onChange={event => change(index, field, event.target.value)} />}</FormField>)}</div><FormField label={t('roomLabel')}>{props => <Input {...props} value={slot.room} onChange={event => change(index, 'room', event.target.value)} />}</FormField><Button variant="ghost" onClick={() => setSlots(previous => previous.filter((_, i) => i !== index))}>{t('academic:remove')}</Button></fieldset>)}
    <Button variant="secondary" disabled={slots.length >= 30} onClick={() => setSlots(previous => [...previous, { weekday: 6, start: '09:00', end: '10:00', room: '' }])}>{t('addSlot')}</Button>{error && <p role="alert" className="text-red-700">{error}</p>}<Button type="submit" className="w-full" loading={save.isPending}>{t('common:save')}</Button>
  </form>;
}
