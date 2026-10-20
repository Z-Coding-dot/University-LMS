import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AssignmentView, SubmissionView } from '../../../api/types/academic';
import type { Attachment } from '../../../api/types';
import { academicApi } from '../../../api/endpoints/academic';
import { useAcademicMutation, useAcademicQuery } from '../../../hooks/useAcademic';
import { useAuthStore } from '../../auth/store';
import { useDir } from '../../../hooks/useDir';
import { can, PERMISSIONS } from '../../../lib/permissions';
import { formatDate, calendarDay } from '../../../lib/date';
import { formatNumber } from '../../../lib/number';
import { DataTable, type DataColumn } from '../../../components/ui/data-table';
import { Dialog } from '../../../components/ui/overlays';
import { Button } from '../../../components/ui/button';
import { Select } from '../../../components/ui/fields';
import { Badge } from '../../../components/ui/surfaces';
import { ConfigForm } from '../../../components/shared/config-form';
import { FileUpload } from '../../../components/shared/file-upload';
import { assignmentSchema, submissionGradeSchema } from '../schemas';

function SubmissionList({ assignment }: { assignment: AssignmentView }) {
  const { t } = useTranslation('academic'); const { locale } = useDir(); const user = useAuthStore(state => state.user);
  const [selected, setSelected] = useState<SubmissionView | null>(null);
  const grade = useAcademicMutation((input: { id: number; values: unknown }) => academicApi.scoreSubmission(input.id, input.values));
  const columns: DataColumn<SubmissionView>[] = [
    { id: 'student_name', header: t('student'), accessor: row => row.student_name, mobile: 'primary' },
    { id: 'submitted_at', header: t('submittedAt'), accessor: row => row.submitted_at, mobile: 'secondary', cell: row => formatDate(row.submitted_at, locale) },
    { id: 'score', header: t('score'), accessor: row => row.score, mobile: 'primary', cell: row => row.score === null ? t('notGraded') : formatNumber(row.score, locale) },
  ];
  return <><DataTable columns={columns} queryKey={['submissions', user?.id, assignment.id, locale]} fetchPage={(params, signal) => academicApi.submissions(assignment.id, params, signal)} getRowId={row => String(row.id)} label={t('submissions')} actions={row => <Button variant="secondary" onClick={() => setSelected(row)}>{t('review')}</Button>} /><Dialog title={selected?.student_name ?? t('review')} open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}>{selected && <div className="space-y-5">{selected.files.map(file => <a key={file.id} className="block min-h-11 break-all py-2 text-brand" href={file.url} download>{file.name}</a>)}<ConfigForm key={selected.id} schema={submissionGradeSchema} defaults={{ score: selected.score ?? '', feedback: selected.feedback ?? '' }} fields={[{ name: 'score', label: 'academic:scoreOutOf100', type: 'number' }, { name: 'feedback', label: 'academic:feedback', type: 'textarea' }]} onSubmit={async values => { await grade.mutateAsync({ id: selected.id, values }); setSelected(null); }} pending={grade.isPending} /></div>}</Dialog></>;
}
function AssignmentEditor({ offeringId, assignment, onClose }: { offeringId: number; assignment?: AssignmentView; onClose: () => void }) {
  const [files, setFiles] = useState<Attachment[]>(assignment?.attachments ?? []); const [uploading, setUploading] = useState(false);
  const save = useAcademicMutation((values: unknown) => academicApi.saveAssignment(values, assignment?.id));
  return <ConfigForm schema={assignmentSchema} defaults={{ offering_id: offeringId, title: assignment?.title ?? '', description: assignment?.description ?? '', due_date: assignment?.due_at.slice(0, 10) ?? calendarDay(new Date()), attachment_ids: files.map(file => file.id) }} fields={[{ name: 'title', label: 'academic:title' }, { name: 'description', label: 'academic:description', type: 'textarea' }, { name: 'due_date', label: 'academic:dueDate', type: 'date' }]} onSubmit={async values => { await save.mutateAsync({ ...values, attachment_ids: files.map(file => file.id) }); onClose(); }} pending={save.isPending || uploading}><FileUpload offeringId={offeringId} purpose="assignment" files={files} onChange={setFiles} onBusyChange={setUploading} /></ConfigForm>;
}
function AssignmentDetails({ assignment, onClose }: { assignment: AssignmentView; onClose: () => void }) {
  const { t } = useTranslation('academic'); const { locale } = useDir(); const user = useAuthStore(state => state.user);
  const [files, setFiles] = useState<Attachment[]>(assignment.submission?.files ?? []); const [uploading, setUploading] = useState(false);
  const submit = useAcademicMutation((ids: number[]) => academicApi.submit(assignment.id, ids));
  const editable = user?.role === 'student' && new Date(assignment.due_at).getTime() >= Date.now() && assignment.submission?.score == null;
  return <div className="space-y-5"><p className="whitespace-pre-wrap text-gray-600">{assignment.description}</p><p>{t('dueDate')}: {formatDate(assignment.due_at, locale)}</p>{assignment.attachments.map(file => <a key={file.id} className="block min-h-11 break-all py-2 text-brand" href={file.url} download>{file.name}</a>)}{assignment.submission?.score != null && <div className="rounded-xl bg-emerald-50 p-4"><p>{t('score')}: {formatNumber(assignment.submission.score, locale)}</p><p className="mt-2">{assignment.submission.feedback ?? t('noFeedback')}</p></div>}{editable ? <><FileUpload offeringId={assignment.offering_id} purpose="submission" files={files} onChange={setFiles} onBusyChange={setUploading} /><Button className="w-full" loading={submit.isPending} disabled={!files.length || uploading} onClick={async () => { try { await submit.mutateAsync(files.map(file => file.id)); onClose(); } catch { /* Mutation displays server error. */ } }}>{t(assignment.submission ? 'resubmit' : 'submitAssignment')}</Button></> : assignment.submission?.files.map(file => <a className="block min-h-11 break-all py-2 text-brand" key={file.id} href={file.url} download>{file.name}</a>)}</div>;
}
export function Assignments({ offeringId }: { offeringId?: number }) {
  const { t } = useTranslation('academic'); const { locale } = useDir(); const user = useAuthStore(state => state.user);
  const [courseFilter, setCourseFilter] = useState('all'); const selectedOffering = offeringId ?? (courseFilter === 'all' ? undefined : Number(courseFilter));
  const choices = useAcademicQuery(['course-choices'], () => academicApi.courses({ per_page: 100 }, new AbortController().signal));
  const [editor, setEditor] = useState<AssignmentView | 'new' | null>(null); const [detail, setDetail] = useState<AssignmentView | null>(null); const [review, setReview] = useState<AssignmentView | null>(null);
  const manage = can(user, PERMISSIONS.manageAssignments);
  const columns: DataColumn<AssignmentView>[] = [
    { id: 'title', header: t('title'), accessor: row => row.title, mobile: 'primary', sortable: true },
    { id: 'course', header: t('course'), accessor: row => row.course_name[locale], mobile: 'secondary', sortable: true },
    { id: 'due_at', header: t('dueDate'), accessor: row => row.due_at, mobile: 'primary', sortable: true, cell: row => formatDate(row.due_at, locale) },
    { id: 'status', header: t('status'), accessor: row => row.submission ? 'submitted' : '', mobile: 'secondary', cell: row => <Badge tone={row.submission ? 'success' : 'neutral'}>{user?.role === 'student' ? t(row.submission ? 'submitted' : 'notSubmitted') : `${formatNumber(row.submission_count, locale)} ${t('submissions')}`}</Badge> },
  ];
  return <div className="space-y-4"><div className="flex flex-col gap-3 sm:flex-row sm:justify-between">{!offeringId && <div className="sm:w-72"><Select aria-label={t('course')} value={courseFilter} onValueChange={setCourseFilter} options={[{ value: 'all', label: t('allCourses') }, ...(choices.data?.data ?? []).map(row => ({ value: String(row.id), label: row.course.name[locale] }))]} /></div>}{manage && <Button disabled={!selectedOffering} onClick={() => setEditor('new')}>{t('createAssignment')}</Button>}</div>{manage && !selectedOffering && <p className="text-gray-500">{t('selectCourseToCreate')}</p>}<DataTable columns={columns} queryKey={['assignments', user?.id, locale]} filterValues={{ offering_id: selectedOffering }} fetchPage={academicApi.assignments} getRowId={row => String(row.id)} label={t('assignments')} actions={row => <div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => setDetail(row)}>{t('details')}</Button>{manage && <><Button variant="ghost" onClick={() => setEditor(row)}>{t('edit')}</Button><Button variant="ghost" onClick={() => setReview(row)}>{t('submissions')}</Button></>}</div>} /><Dialog title={t(editor === 'new' ? 'createAssignment' : 'editAssignment')} open={!!editor} onOpenChange={open => { if (!open) setEditor(null); }}>{editor && <AssignmentEditor key={editor === 'new' ? 'new' : editor.id} offeringId={editor === 'new' ? selectedOffering! : editor.offering_id} assignment={editor === 'new' ? undefined : editor} onClose={() => setEditor(null)} />}</Dialog><Dialog title={detail?.title ?? t('details')} open={!!detail} onOpenChange={open => { if (!open) setDetail(null); }}>{detail && <AssignmentDetails key={detail.id} assignment={detail} onClose={() => setDetail(null)} />}</Dialog><Dialog title={t('submissions')} open={!!review} onOpenChange={open => { if (!open) setReview(null); }}>{review && <SubmissionList assignment={review} />}</Dialog></div>;
}
