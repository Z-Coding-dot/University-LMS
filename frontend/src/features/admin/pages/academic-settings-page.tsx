import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AcademicSettings } from '../../../api/types';
import { adminAcademicApi } from '../../../api/endpoints/admin-academic';
import { useAcademicMutation, useAcademicQuery } from '../../../hooks/useAcademic';
import { ATTENDANCE_STATUSES, WEEKDAYS } from '../../../config/constants';
import { FormField, Input, Switch } from '../../../components/ui/fields';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/surfaces';
import { PageHeader } from '../../../components/layout/page-header';
import { QueryState } from '../../../components/shared/query-state';
import { apiErrorMessage } from '../../../api/client';
import { academicSettingsSchema } from '../academic-schemas';

function SettingsEditor({ initial }: { initial: AcademicSettings }) {
  const { t } = useTranslation(['admin', 'common']); const [pass, setPass] = useState(String(initial.pass_mark)); const [threshold, setThreshold] = useState(String(initial.attendance_warning_threshold));
  const [scale, setScale] = useState(initial.letter_scale.map(row => ({ min: String(row.min), max: String(row.max), letter: row.letter })));
  const [counted, setCounted] = useState([...initial.attendance_counted_statuses]); const [weekend, setWeekend] = useState([...initial.weekend_days]); const [error, setError] = useState('');
  const save = useAcademicMutation(adminAcademicApi.saveSettings);
  return <form className="space-y-6" onSubmit={async event => { event.preventDefault(); setError(''); const parsed = academicSettingsSchema.safeParse({ pass_mark: pass, attendance_warning_threshold: threshold, letter_scale: scale, attendance_counted_statuses: counted, weekend_days: weekend }); if (!parsed.success) { setError(t(parsed.error.issues[0].message)); return; } try { await save.mutateAsync(parsed.data); } catch (err) { setError(apiErrorMessage(err)); } }}>
    <Card className="grid gap-5 sm:grid-cols-2"><FormField label={t('passMark')}>{props => <Input {...props} inputMode="decimal" value={pass} onChange={event => setPass(event.target.value)} />}</FormField><FormField label={t('attendanceThreshold')}>{props => <Input {...props} inputMode="decimal" value={threshold} onChange={event => setThreshold(event.target.value)} />}</FormField></Card>
    <Card className="space-y-5"><h2 className="text-xl font-semibold">{t('letterScale')}</h2><p className="text-gray-600">{t('scaleHint')}</p>{scale.map((row, index) => <fieldset key={index} className="space-y-3 rounded-xl border p-4"><div className="grid gap-3 sm:grid-cols-3">{(['min', 'max', 'letter'] as const).map(field => <FormField key={field} label={t(field === 'min' ? 'rangeMin' : field === 'max' ? 'rangeMax' : 'academic:letter')}>{props => <Input {...props} value={row[field]} inputMode={field === 'letter' ? 'text' : 'decimal'} onChange={event => setScale(previous => previous.map((item, i) => i === index ? { ...item, [field]: event.target.value } : item))} />}</FormField>)}</div><Button variant="ghost" onClick={() => setScale(previous => previous.filter((_, i) => i !== index))}>{t('academic:remove')}</Button></fieldset>)}<Button variant="secondary" disabled={scale.length >= 20} onClick={() => setScale(previous => [...previous, { min: '', max: '', letter: '' }])}>{t('addRange')}</Button></Card>
    <div className="grid items-start gap-6 lg:grid-cols-2"><Card className="space-y-4"><h2 className="text-xl font-semibold">{t('countedAttendance')}</h2>{ATTENDANCE_STATUSES.map(status => <div key={status} className="flex min-h-11 items-center justify-between gap-4"><span>{t(`common:statuses.${status}`)}</span><Switch label={t(`common:statuses.${status}`)} checked={counted.includes(status)} onCheckedChange={checked => setCounted(previous => checked ? [...previous, status] : previous.filter(value => value !== status))} /></div>)}</Card><Card className="space-y-4"><h2 className="text-xl font-semibold">{t('weekendDays')}</h2>{WEEKDAYS.map(day => <div key={day} className="flex min-h-11 items-center justify-between gap-4"><span>{t(`common:weekdays.${day}`)}</span><Switch label={t(`common:weekdays.${day}`)} checked={weekend.includes(day)} onCheckedChange={checked => setWeekend(previous => checked ? [...previous, day] : previous.filter(value => value !== day))} /></div>)}</Card></div>
    {error && <p role="alert" className="text-red-700">{error}</p>}<Button type="submit" loading={save.isPending} className="w-full sm:w-auto">{t('common:save')}</Button>
  </form>;
}
export function AcademicSettingsPage() {
  const { t } = useTranslation('admin'); const query = useAcademicQuery(['admin-settings'], adminAcademicApi.settings);
  return <><PageHeader title={t('settingsTitle')} description={t('settingsDescription')} /><QueryState pending={query.isPending} error={query.error} retry={query.refetch}>{query.data && <SettingsEditor key={JSON.stringify(query.data)} initial={query.data} />}</QueryState></>;
}
