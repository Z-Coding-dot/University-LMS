import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Attachment, Lecture } from '../../../api/types';
import { academicApi } from '../../../api/endpoints/academic';
import { useAcademicMutation } from '../../../hooks/useAcademic';
import { useAuthStore } from '../../auth/store';
import { can, PERMISSIONS } from '../../../lib/permissions';
import { useDir } from '../../../hooks/useDir';
import { formatDate } from '../../../lib/date';
import { ConfigForm } from '../../../components/shared/config-form';
import { FileUpload } from '../../../components/shared/file-upload';
import { DataTable, type DataColumn } from '../../../components/ui/data-table';
import { Button } from '../../../components/ui/button';
import { Dialog } from '../../../components/ui/overlays';
import { lectureSchema } from '../schemas';

function LectureEditor({ offeringId, week, initial, onClose }: { offeringId: number; week: number; initial?: Lecture; onClose: () => void }) {
  const [files, setFiles] = useState<Attachment[]>(initial?.attachments ?? []); const [uploading, setUploading] = useState(false);
  const save = useAcademicMutation((values: unknown) => academicApi.saveLecture(offeringId, values, initial?.id));
  return <ConfigForm schema={lectureSchema} defaults={{ offering_id: offeringId, week_number: week, title: initial?.title ?? '', description: initial?.description ?? '' }} externalValues={{ attachment_ids: files.map(file => file.id) }} fields={[{ name: 'title', label: 'academic:title' }, { name: 'description', label: 'academic:lectureText', type: 'textarea' }]} pending={uploading || save.isPending} onSubmit={async values => { await save.mutateAsync(values); onClose(); }}><FileUpload offeringId={offeringId} purpose="lecture" files={files} onChange={setFiles} onBusyChange={setUploading} /></ConfigForm>;
}
export function Lectures({ offeringId, week }: { offeringId: number; week: number }) {
  const { t } = useTranslation('academic'); const { locale } = useDir(); const user = useAuthStore(state => state.user);
  const [editor, setEditor] = useState<Lecture | 'new' | null>(null); const [selected, setSelected] = useState<Lecture | null>(null);
  const manage = can(user, PERMISSIONS.manageMaterials);
  const columns: DataColumn<Lecture>[] = [
    { id: 'title', header: t('title'), accessor: row => row.title, mobile: 'primary', sortable: true },
    { id: 'updated_at', header: t('date'), accessor: row => row.updated_at, mobile: 'secondary', sortable: true, cell: row => formatDate(row.updated_at, locale) },
  ];
  return <div className="space-y-4">{manage && <Button onClick={() => setEditor('new')}>{t('addLecture')}</Button>}<DataTable columns={columns} queryKey={['lectures', user?.id, offeringId, locale]} filterValues={{ week_number: week }} fetchPage={(params, signal) => academicApi.lectures(offeringId, params, signal)} getRowId={row => String(row.id)} label={t('lectures')} actions={row => <div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => setSelected(row)}>{t('openLecture')}</Button>{manage && <Button variant="ghost" onClick={() => setEditor(row)}>{t('edit')}</Button>}</div>} />
    <Dialog title={t(editor === 'new' ? 'addLecture' : 'editLecture')} open={!!editor} onOpenChange={open => { if (!open) setEditor(null); }}>{editor && <LectureEditor key={editor === 'new' ? 'new' : editor.id} offeringId={offeringId} week={week} initial={editor === 'new' ? undefined : editor} onClose={() => setEditor(null)} />}</Dialog>
    <Dialog title={selected?.title ?? t('lectures')} open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}>{selected && <div className="space-y-4"><p className="whitespace-pre-wrap text-gray-700">{selected.description}</p>{selected.attachments.map(file => <a key={file.id} href={file.url} download className="block min-h-11 break-all py-2 text-brand-action">{file.name}</a>)}</div>}</Dialog>
  </div>;
}
