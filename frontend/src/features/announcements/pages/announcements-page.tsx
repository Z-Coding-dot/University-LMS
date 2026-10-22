import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { academicApi } from '../../../api/endpoints/academic';
import type { AnnouncementView } from '../../../api/types/academic';
import { COURSE_WEEKS } from '../../../config/constants';
import { useAcademicMutation, useAcademicQuery } from '../../../hooks/useAcademic';
import { useAuthStore } from '../../auth/store';
import { useDir } from '../../../hooks/useDir';
import { can, PERMISSIONS } from '../../../lib/permissions';
import { formatDate } from '../../../lib/date';
import { formatNumber } from '../../../lib/number';
import { DataTable, type DataColumn } from '../../../components/ui/data-table';
import { Dialog } from '../../../components/ui/overlays';
import { Button } from '../../../components/ui/button';
import { ConfigForm } from '../../../components/shared/config-form';
import { PageHeader } from '../../../components/layout/page-header';
import { announcementSchema } from '../schemas';

export function AnnouncementsPage({ offeringId, weekNumber, courseWide = false, embedded = false }: { offeringId?: number; weekNumber?: number; courseWide?: boolean; embedded?: boolean }) {
  const { t } = useTranslation('academic'); const { locale } = useDir(); const user = useAuthStore(state => state.user);
  const [selected, setSelected] = useState<AnnouncementView | null>(null); const [editor, setEditor] = useState<AnnouncementView | 'new' | null>(null);
  const manage = can(user, PERMISSIONS.postAnnouncements); const teacher = user?.role === 'teacher';
  const choices = useAcademicQuery(['course-choices'], () => academicApi.courses({ per_page: 100 }, new AbortController().signal), manage && !embedded);
  const save = useAcademicMutation((input: { values: unknown; id?: number }) => academicApi.saveAnnouncement(input.values, input.id));
  const columns: DataColumn<AnnouncementView>[] = [
    { id: 'title', header: t('title'), accessor: row => row.title, mobile: 'primary', sortable: true },
    ...(embedded ? [{ id: 'body', header: t('instructions'), accessor: (row: AnnouncementView) => row.body, mobile: 'primary' as const, cell: (row: AnnouncementView) => <p className="max-w-prose whitespace-pre-wrap">{row.body}</p> }] : []),
    { id: 'author_name', header: t('author'), accessor: row => row.author_name, mobile: 'secondary' },
    ...(!embedded ? [{ id: 'week', header: t('week'), accessor: (row: AnnouncementView) => row.week_number, mobile: 'secondary' as const, cell: (row: AnnouncementView) => row.week_number ? t('weekNumber', { value: formatNumber(row.week_number, locale) }) : t('courseWideNotice') }] : []),
    { id: 'created_at', header: t('date'), accessor: row => row.created_at, mobile: 'secondary', sortable: true, cell: row => formatDate(row.created_at, locale) },
  ];
  const row = editor && editor !== 'new' ? editor : null;
  return <div className="space-y-3">
    {!embedded && <PageHeader title={t('announcements')} />}
    {manage && <Button disabled={!offeringId && teacher && !choices.data?.data.length} onClick={() => setEditor('new')}>{t(embedded ? 'addNotice' : 'createAnnouncement')}</Button>}
    <DataTable columns={columns} queryKey={['announcements', user?.id, locale]} filterValues={{ offering_id: offeringId, week_number: weekNumber, course_wide: courseWide ? 1 : undefined }} fetchPage={academicApi.announcements} getRowId={item => String(item.id)} label={t('announcements')} showSearch={!embedded} actions={item => <div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => setSelected(item)}>{t('details')}</Button>{manage && (user?.role === 'admin' || item.author_id === user?.id) && <Button variant="ghost" onClick={() => setEditor(item)}>{t('edit')}</Button>}</div>} />
    <Dialog title={selected?.title ?? t('announcements')} description={selected?.author_name} open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}><p className="whitespace-pre-wrap text-gray-600">{selected?.body}</p></Dialog>
    <Dialog title={t('createAnnouncement')} open={!!editor} onOpenChange={open => { if (!open) setEditor(null); }}>{editor && <ConfigForm key={row?.id ?? 'new'} schema={announcementSchema}
      defaults={{ title: row?.title ?? '', body: row?.body ?? '', audience: row?.audience ?? (teacher || offeringId ? 'offering' : 'all'), role: row?.role ?? 'student', offering_id: row?.offering_id ?? offeringId ?? (teacher ? choices.data?.data[0]?.id : null), week_number: row?.week_number ?? weekNumber ?? 'all' }}
      externalValues={embedded ? { audience: 'offering', offering_id: offeringId, week_number: weekNumber ?? null } : undefined}
      fields={[{ name: 'title', label: 'academic:title' }, { name: 'body', label: 'academic:instructions', type: 'textarea' }, ...(!embedded ? [
        { name: 'audience', label: 'academic:audience', type: 'select' as const, options: (teacher ? ['offering'] : ['all', 'role', 'offering']).map(value => ({ value, label: t(`audiences.${value}`) })) },
        ...(!teacher ? [{ name: 'role', label: 'academic:role', type: 'select' as const, options: ['admin', 'teacher', 'student'].map(value => ({ value, label: t(`common:roles.${value}`) })) }] : []),
        { name: 'offering_id', label: 'academic:course', type: 'select' as const, options: (choices.data?.data ?? []).map(course => ({ value: String(course.id), label: course.course.name[locale] })) },
        { name: 'week_number', label: 'academic:week', type: 'select' as const, options: [{ value: 'all', label: t('courseWideNotice') }, ...COURSE_WEEKS.map(week => ({ value: String(week), label: t('weekNumber', { value: formatNumber(week, locale) }) }))] },
      ] : [])]}
      onSubmit={async values => { await save.mutateAsync({ values, id: row?.id }); setEditor(null); }} pending={save.isPending} />}</Dialog>
  </div>;
}
