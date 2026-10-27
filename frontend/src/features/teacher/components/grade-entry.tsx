import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { academicApi } from '../../../api/endpoints/academic';
import type { GradeBook } from '../../../api/types/academic';
import type { GradeComponent, User } from '../../../api/types';
import { useAcademicMutation, useAcademicQuery } from '../../../hooks/useAcademic';
import { useAuthStore } from '../../auth/store';
import { useDir } from '../../../hooks/useDir';
import { can, PERMISSIONS } from '../../../lib/permissions';
import { courseTotal } from '../../../lib/grading';
import { formatNumber, normalizeDigits } from '../../../lib/number';
import { DataTable, type DataColumn } from '../../../components/ui/data-table';
import { FormField, Input, Textarea } from '../../../components/ui/fields';
import { Button } from '../../../components/ui/button';
import { Dialog, ConfirmDialog } from '../../../components/ui/overlays';
import { StatusBadge } from '../../../components/shared/identity';
import { QueryState } from '../../../components/shared/query-state';
import { componentSchema } from '../schemas';

function ComponentEditor({ id, initial, onClose }: { id: number; initial: GradeComponent[]; onClose: () => void }) {
  const { t } = useTranslation('academic'); const [rows, setRows] = useState(initial.map(row => ({ id: row.id, name: row.name, max_score: String(row.max_score), weight: String(row.weight) })));
  const [error, setError] = useState(''); const save = useAcademicMutation((values: unknown) => academicApi.components(id, values));
  const change = (index: number, field: 'max_score' | 'weight' | 'fa' | 'en', value: string) => setRows(previous => previous.map((row, i) => i !== index ? row : field === 'fa' || field === 'en' ? { ...row, name: { ...row.name, [field]: value } } : { ...row, [field]: normalizeDigits(value) }));
  return <form className="space-y-5" onSubmit={async event => { event.preventDefault(); const parsed = componentSchema.safeParse({ components: rows.map(row => ({ ...row, id: row.id || undefined })) }); if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? 'common:validationError'); return; } try { await save.mutateAsync(parsed.data); onClose(); } catch { /* Error toast from mutation. */ } }}>{rows.map((row, index) => <fieldset key={index} className="space-y-3 rounded-xl border p-4"><FormField label={t('nameFa')}>{props => <Input {...props} value={row.name.fa} onChange={event => change(index, 'fa', event.target.value)} />}</FormField><FormField label={t('nameEn')}>{props => <Input {...props} value={row.name.en} onChange={event => change(index, 'en', event.target.value)} />}</FormField><div className="grid gap-3 sm:grid-cols-2">{(['max_score', 'weight'] as const).map(field => <FormField key={field} label={t(field === 'weight' ? 'weight' : 'maxScore')}>{props => <Input {...props} inputMode="decimal" value={row[field]} onChange={event => change(index, field, event.target.value)} />}</FormField>)}</div><Button variant="ghost" onClick={() => setRows(previous => previous.filter((_, i) => i !== index))}>{t('remove')}</Button></fieldset>)}<Button variant="secondary" onClick={() => setRows(previous => [...previous, { id: 0, name: { fa: '', en: '' }, max_score: '100', weight: '0' }])}>{t('addComponent')}</Button>{error && <p role="alert" className="text-red-700">{t(error)}</p>}<Button type="submit" className="w-full" loading={save.isPending}>{t('saveComponents')}</Button></form>;
}

type GradeForm = { entries: Record<string, { score: string; feedback: string }> };
function GradeEditor({ id, book }: { id: number; book: GradeBook }) {
  const { t } = useTranslation(['academic', 'common']); const { locale } = useDir(); const user = useAuthStore(state => state.user);
  const [componentsOpen, setComponentsOpen] = useState(false); const [transition, setTransition] = useState<'published' | 'locked' | null>(null);
  const enter = can(user, PERMISSIONS.enterGrades) && book.status !== 'locked'; const publish = can(user, PERMISSIONS.publishGrades);
  const schema = z.object({ entries: z.record(z.object({ score: z.string().transform(normalizeDigits), feedback: z.string().max(2000) })) }).superRefine((data, ctx) => {
    for (const [key, value] of Object.entries(data.entries)) { const component = book.components.find(item => item.id === Number(key.split('_')[1])); const score = Number(value.score); if (value.score.trim() && (!component || !Number.isFinite(score) || score < 0 || score > component.max_score)) ctx.addIssue({ code: 'custom', path: ['entries', key, 'score'], message: 'academic:invalidGrades' }); }
  });
  const form = useForm<GradeForm>({ resolver: zodResolver(schema), defaultValues: { entries: {} } });
  const { reset } = form;
  const save = useAcademicMutation((values: unknown) => academicApi.saveGrades(id, values));
  const status = useAcademicMutation((value: 'published' | 'locked') => academicApi.gradeStatus(id, value));
  useEffect(() => {
    reset({ entries: Object.fromEntries(book.entries.map(entry => [`${entry.student_id}_${entry.component_id}`, { score: String(entry.score), feedback: entry.feedback ?? '' }])) }, { keepDirtyValues: true });
  }, [book.entries, reset]);
  const values = form.watch('entries');
  // Subscribe so background refreshes preserve edited scores and feedback.
  const dirty = Object.keys(form.formState.dirtyFields).length > 0;
  const input = (student: User, component: GradeComponent) => {
    const key = `${student.id}_${component.id}`; const existing = book.entries.find(entry => entry.student_id === student.id && entry.component_id === component.id);
    const error = form.formState.errors.entries?.[key];
    return <div className="w-28 space-y-1 sm:w-32"><Input aria-label={`${student.name} - ${component.name[locale]} / ${formatNumber(component.max_score, locale)}`} aria-invalid={!!error?.score} {...form.register(`entries.${key}.score`)} inputMode="decimal" defaultValue={existing?.score === undefined ? '' : String(existing.score)} disabled={!enter || save.isPending} className="px-2 py-1" />{error?.score?.message && <p role="alert" className="text-red-700">{t(error.score.message)}</p>}<details><summary className="min-h-11 cursor-pointer py-2 text-gray-500 sm:min-h-7 sm:py-1">{t('feedback')}</summary><Textarea aria-label={`${t('feedback')} ${student.name} ${component.name[locale]}`} aria-invalid={!!error?.feedback} {...form.register(`entries.${key}.feedback`)} defaultValue={existing?.feedback ?? ''} disabled={!enter || save.isPending} rows={2} className="min-h-16 px-2 py-1" />{error?.feedback?.message && <p role="alert" className="text-red-700">{t(error.feedback.message)}</p>}</details></div>;
  };
  const columns: DataColumn<User>[] = [
    { id: 'name', header: t('student'), accessor: row => row.name, mobile: 'primary', cell: row => <div className="min-w-36"><span className="font-medium">{row.name}</span><bdi className="block text-gray-500">{row.profile.institutional_id}</bdi></div> },
    ...book.components.map(component => ({ id: `component_${component.id}`, header: `${component.name[locale]} / ${formatNumber(component.max_score, locale)}`, accessor: () => null, mobile: 'hidden' as const, cell: (row: User) => input(row, component) })),
    { id: 'total', header: t('totalPreview'), accessor: () => null, mobile: 'secondary', cell: row => { const scores = book.components.map(component => { const key = `${row.id}_${component.id}`; const value = values[key]?.score ?? book.entries.find(entry => entry.student_id === row.id && entry.component_id === component.id)?.score; return value === undefined || value === '' ? null : { score: Number(normalizeDigits(String(value))), max_score: component.max_score, weight: component.weight }; }); if (!scores.length || scores.some(score => score === null)) return t('notGraded'); try { return formatNumber(courseTotal(scores.filter(score => score !== null)), locale, { maximumFractionDigits: 1 }); } catch { return t('invalidGrades'); } } },
  ];
  return <div className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><StatusBadge status={book.status} />{enter && book.status === 'draft' && <Button variant="secondary" onClick={() => setComponentsOpen(true)}>{t('manageComponents')}</Button>}</div><form onSubmit={form.handleSubmit(async data => {
    const entries = Object.entries(data.entries).flatMap(([key, row]) => { if (!row.score.trim() || !form.formState.dirtyFields.entries?.[key]) return []; const [student_id, component_id] = key.split('_').map(Number); return [{ student_id, component_id, score: Number(row.score), feedback: row.feedback }]; });
    if (!entries.length) { form.setError('root', { message: 'academic:enterScores' }); return; }
    try { await save.mutateAsync({ entries }); form.reset(form.getValues()); } catch { /* Error toast from mutation. */ }
  })} className="space-y-4"><DataTable layout="table" compact columns={columns} queryKey={['grade-roster', user?.id, id, locale]} fetchPage={(params, signal) => academicApi.roster(id, params, signal)} getRowId={row => String(row.id)} label={t('gradebook')} />{form.formState.errors.root && <p role="alert" className="text-red-700">{t(form.formState.errors.root.message ?? 'common:validationError')}</p>}<div className="sticky bottom-[calc(var(--mobile-tabs-height)+.75rem)] z-10 flex flex-wrap gap-3 rounded-2xl border bg-white/95 p-4 shadow-soft backdrop-blur lg:bottom-4">{enter && <Button type="submit" loading={save.isPending} disabled={!form.formState.isDirty}>{t(book.status === 'draft' ? 'saveDraft' : 'saveChanges')}</Button>}{publish && book.status === 'draft' && <Button variant="secondary" disabled={form.formState.isDirty || save.isPending} onClick={() => setTransition('published')}>{t('publish')}</Button>}{publish && book.status === 'published' && <Button variant="secondary" disabled={form.formState.isDirty || save.isPending} onClick={() => setTransition('locked')}>{t('lockGrades')}</Button>}{dirty && <span className="self-center text-gray-500">{t('saveBeforePublish')}</span>}{book.status === 'locked' && <p className="text-gray-500">{t('gradesLocked')}</p>}</div></form><Dialog title={t('manageComponents')} open={componentsOpen} onOpenChange={setComponentsOpen}><ComponentEditor id={id} initial={book.components} onClose={() => setComponentsOpen(false)} /></Dialog><ConfirmDialog title={t(transition === 'locked' ? 'lockGrades' : 'publish')} description={t('confirmGradeStatus')} open={!!transition} onOpenChange={open => { if (!open) setTransition(null); }} loading={status.isPending} onConfirm={() => { if (transition) status.mutate(transition, { onSuccess: () => setTransition(null) }); }} /></div>;
}
export function GradeEntry({ id }: { id: number }) {
  const query = useAcademicQuery(['grade-book', id], () => academicApi.grades(id), true, false);
  return <QueryState pending={query.isPending} error={query.error} retry={query.refetch}>{query.data && <GradeEditor key={id} id={id} book={query.data} />}</QueryState>;
}
