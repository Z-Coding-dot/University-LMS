import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { adminAcademicApi } from '../../../api/endpoints/admin-academic';
import { academicApi } from '../../../api/endpoints/academic';
import type { CourseView } from '../../../api/types/academic';
import { useAcademicMutation } from '../../../hooks/useAcademic';
import { useAuthStore } from '../../auth/store';
import { useDir } from '../../../hooks/useDir';
import { PageHeader } from '../../../components/layout/page-header';
import { DataTable, type DataColumn } from '../../../components/ui/data-table';
import { Button } from '../../../components/ui/button';
import { ConfirmDialog } from '../../../components/ui/overlays';
export function UnlockGradesPage() {
  const { t } = useTranslation(['admin', 'academic']); const { locale } = useDir(); const user = useAuthStore(state => state.user); const [target, setTarget] = useState<CourseView | null>(null);
  const unlock = useAcademicMutation((id: number) => academicApi.gradeStatus(id, 'published'));
  const columns: DataColumn<CourseView>[] = [{ id: 'name', header: t('academic:course'), accessor: row => row.course.name[locale], mobile: 'primary', sortable: true }, { id: 'teacher', header: t('academic:teacher'), accessor: row => row.teacher.name, mobile: 'primary' }, { id: 'semester', header: t('academic:semester'), accessor: row => row.semester.name[locale], mobile: 'secondary' }];
  return <><PageHeader title={t('unlockTitle')} description={t('unlockDescription')} /><DataTable columns={columns} queryKey={['locked-grades', user?.id, locale]} fetchPage={adminAcademicApi.lockedGrades} getRowId={row => String(row.id)} label={t('unlockTitle')} actions={row => <Button variant="secondary" onClick={() => setTarget(row)}>{t('unlock')}</Button>} /><ConfirmDialog title={t('unlock')} description={t('unlockConfirm', { name: target?.course.name[locale] ?? '' })} open={!!target} onOpenChange={open => { if (!open && !unlock.isPending) setTarget(null); }} loading={unlock.isPending} onConfirm={() => { if (target) unlock.mutate(target.id, { onSuccess: () => setTarget(null) }); }} /></>;
}
