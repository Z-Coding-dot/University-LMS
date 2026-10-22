import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { adminAcademicApi } from '../../../api/endpoints/admin-academic';
import type { CourseView } from '../../../api/types/academic';
import { useAcademicQuery } from '../../../hooks/useAcademic';
import { useAuthStore } from '../../auth/store';
import { useDir } from '../../../hooks/useDir';
import { PageHeader } from '../../../components/layout/page-header';
import { QueryState } from '../../../components/shared/query-state';
import { DataTable, type DataColumn } from '../../../components/ui/data-table';
import { Button, buttonStyles } from '../../../components/ui/button';
import { Select } from '../../../components/ui/fields';
import { Dialog } from '../../../components/ui/overlays';
import { EnrollmentEditor, OfferingEditor, ScheduleEditor } from '../components/offering-editors';
export function OfferingsPage() {
  const { t } = useTranslation(['admin', 'academic', 'common']); const { locale } = useDir(); const user = useAuthStore(state => state.user);
  const catalog = useAcademicQuery(['admin-catalog'], adminAcademicApi.catalog); const [semester, setSemester] = useState('all');
  const [editor, setEditor] = useState<CourseView | 'new' | null>(null); const [roster, setRoster] = useState<CourseView | null>(null); const [schedule, setSchedule] = useState<CourseView | null>(null);
  const columns: DataColumn<CourseView>[] = [
    { id: 'name', header: t('academic:course'), accessor: row => row.course.name[locale], mobile: 'primary', sortable: true },
    { id: 'teacher', header: t('academic:teacher'), accessor: row => row.teacher.name, mobile: 'primary', sortable: true },
    { id: 'semester', header: t('academic:semester'), accessor: row => row.semester.name[locale], mobile: 'secondary' },
    { id: 'students', header: t('academic:students'), accessor: row => row.student_count, mobile: 'secondary', sortable: true },
    { id: 'capacity', header: t('capacity'), accessor: row => row.capacity, mobile: 'secondary', sortable: true },
  ];
  return <><PageHeader title={t('offeringsTitle')} description={t('offeringsDescription')} actions={<Button disabled={!catalog.data} onClick={() => setEditor('new')}>{t('createOffering')}</Button>} /><QueryState pending={catalog.isPending} error={catalog.error} retry={catalog.refetch}>{catalog.data && <DataTable columns={columns} queryKey={['admin-offerings', user?.id, locale]} fetchPage={adminAcademicApi.offerings} filterValues={{ semester_id: semester === 'all' ? undefined : semester }} getRowId={row => String(row.id)} label={t('offeringsTitle')} filters={<Select aria-label={t('academic:semester')} value={semester} onValueChange={setSemester} options={[{ value: 'all', label: t('allSemesters') }, ...catalog.data.semesters.map(row => ({ value: String(row.id), label: row.name[locale] }))]} />} actions={row => <div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => setEditor(row)}>{t('common:edit')}</Button><Button variant="secondary" onClick={() => setRoster(row)}>{t('enrollStudents')}</Button><Button variant="ghost" onClick={() => setSchedule(row)}>{t('editSchedule')}</Button><Link to={`/courses/${row.id}`} className={buttonStyles({ variant: 'ghost' })}>{t('academic:openCourse')}</Link></div>} />}</QueryState>
    <Dialog title={t(editor === 'new' ? 'createOffering' : 'editOffering')} open={!!editor} onOpenChange={open => { if (!open) setEditor(null); }}>{editor && catalog.data && <OfferingEditor key={editor === 'new' ? 'new' : editor.id} initial={editor === 'new' ? undefined : editor} catalog={catalog.data} onClose={() => setEditor(null)} />}</Dialog>
    <Dialog title={t('enrollStudents')} description={roster?.course.name[locale]} open={!!roster} onOpenChange={open => { if (!open) setRoster(null); }}>{roster && <EnrollmentEditor key={roster.id} offering={roster} onClose={() => setRoster(null)} />}</Dialog>
    <Dialog title={t('editSchedule')} description={schedule?.course.name[locale]} open={!!schedule} onOpenChange={open => { if (!open) setSchedule(null); }}>{schedule && <ScheduleEditor key={schedule.id} offering={schedule} onClose={() => setSchedule(null)} />}</Dialog>
  </>;
}
