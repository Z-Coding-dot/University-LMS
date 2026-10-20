import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { academicApi } from '../../../api/endpoints/academic';
import type { AnnouncementView } from '../../../api/types/academic';
import { useAcademicMutation, useAcademicQuery } from '../../../hooks/useAcademic';
import { useAuthStore } from '../../auth/store';
import { useDir } from '../../../hooks/useDir';
import { can, PERMISSIONS } from '../../../lib/permissions';
import { formatDate } from '../../../lib/date';
import { DataTable, type DataColumn } from '../../../components/ui/data-table';
import { Dialog } from '../../../components/ui/overlays';
import { Button } from '../../../components/ui/button';
import { ConfigForm } from '../../../components/shared/config-form';
import { PageHeader } from '../../../components/layout/page-header';
import { announcementSchema } from '../schemas';
export function AnnouncementsPage({ offeringId, embedded = false }: { offeringId?: number; embedded?: boolean }) {
  const { t } = useTranslation('academic'); const { locale } = useDir(); const user = useAuthStore(state => state.user);
  const [selected, setSelected] = useState<AnnouncementView | null>(null); const [editor, setEditor] = useState<AnnouncementView | 'new' | null>(null);
  const choices = useAcademicQuery(['course-choices'], () => academicApi.courses({ per_page: 100 }, new AbortController().signal));
  const save = useAcademicMutation((input: { values: unknown; id?: number }) => academicApi.saveAnnouncement(input.values, input.id));
  const manage = can(user, PERMISSIONS.postAnnouncements); const teacher = user?.role === 'teacher';
  const columns: DataColumn<AnnouncementView>[] = [
    { id: 'title', header: t('title'), accessor: row => row.title, mobile: 'primary', sortable: true },
    { id: 'author_name', header: t('author'), accessor: row => row.author_name, mobile: 'secondary' },
    { id: 'created_at', header: t('date'), accessor: row => row.created_at, mobile: 'primary', sortable: true, cell: row => formatDate(row.created_at, locale) },
  ];
  const row = editor && editor !== 'new' ? editor : null;
  return <div className="space-y-5">{!embedded && <PageHeader title={t('announcements')} />}{manage && <Button disabled={teacher && !choices.data?.data.length} onClick={() => setEditor('new')}>{t('createAnnouncement')}</Button>}<DataTable columns={columns} queryKey={['announcements', user?.id, locale]} filterValues={{ offering_id: offeringId }} fetchPage={academicApi.announcements} getRowId={item => String(item.id)} label={t('announcements')} actions={item => <div className="flex gap-2"><Button variant="secondary" onClick={() => setSelected(item)}>{t('details')}</Button>{manage && (user?.role === 'admin' || item.author_id === user?.id) && <Button variant="ghost" onClick={() => setEditor(item)}>{t('edit')}</Button>}</div>} /><Dialog title={selected?.title ?? t('announcements')} description={selected?.author_name} open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}><p className="whitespace-pre-wrap text-gray-600">{selected?.body}</p></Dialog><Dialog title={t('createAnnouncement')} open={!!editor} onOpenChange={open => { if (!open) setEditor(null); }}>{editor && <ConfigForm key={row?.id ?? 'new'} schema={announcementSchema} defaults={{ title: row?.title ?? '', body: row?.body ?? '', audience: row?.audience ?? (teacher || offeringId ? 'offering' : 'all'), role: row?.role ?? 'student', offering_id: row?.offering_id ?? offeringId ?? (teacher ? choices.data?.data[0]?.id : null) }} fields={[{ name: 'title', label: 'academic:title' }, { name: 'body', label: 'academic:description', type: 'textarea' }, { name: 'audience', label: 'academic:audience', type: 'select', options: (teacher ? ['offering'] : ['all', 'role', 'offering']).map(value => ({ value, label: t(`audiences.${value}`) })) }, ...(!teacher ? [{ name: 'role', label: 'academic:role', type: 'select' as const, options: ['admin', 'teacher', 'student'].map(value => ({ value, label: t(`common:roles.${value}`) })) }] : []), { name: 'offering_id', label: 'academic:course', type: 'select', options: (choices.data?.data ?? []).map(course => ({ value: String(course.id), label: course.course.name[locale] })) }]} onSubmit={async values => { await save.mutateAsync({ values, id: row?.id }); setEditor(null); }} pending={save.isPending} />}</Dialog></div>;
}
