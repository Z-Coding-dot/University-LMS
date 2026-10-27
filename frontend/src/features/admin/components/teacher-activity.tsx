import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { adminAcademicApi } from '../../../api/endpoints/admin-academic';
import type { TeacherActivity as Activity } from '../../../api/types/academic';
import { DataTable, type DataColumn } from '../../../components/ui/data-table';
import { DashboardPanel } from '../../dashboard/components/dashboard-panel';
import { useAuthStore } from '../../auth/store';
import { useDir } from '../../../hooks/useDir';
import { formatDate } from '../../../lib/date';

export function TeacherActivity() {
  const { t } = useTranslation(['admin', 'academic', 'common']); const { locale } = useDir(); const user = useAuthStore(state => state.user);
  const columns: DataColumn<Activity>[] = [
    { id: 'name', header: t('academic:teacher'), accessor: row => row.name, mobile: 'primary', sortable: true, cell: row => <Link className="inline-flex min-h-11 items-center text-brand-action" to={`/admin/offerings?teacher_id=${row.id}`}>{row.name}</Link> },
    { id: 'courses', header: t('dashboard:metrics.courses'), accessor: row => row.courses, mobile: 'primary', sortable: true },
    { id: 'assignments', header: t('academic:assignments'), accessor: row => row.assignments, mobile: 'primary', sortable: true },
    { id: 'materials', header: t('activityMaterials'), accessor: row => row.materials, mobile: 'secondary', sortable: true },
    { id: 'graded', header: t('activityGrades'), accessor: row => row.graded, mobile: 'secondary', sortable: true },
    { id: 'students', header: t('academic:students'), accessor: row => row.students, mobile: 'secondary' },
    { id: 'last_activity', header: t('lastAcademicActivity'), accessor: row => row.last_activity, mobile: 'secondary', sortable: true, cell: row => row.last_activity ? formatDate(row.last_activity, locale) : t('common:notAvailable') },
  ];
  return <DashboardPanel title={t('teacherActivityTitle')} description={t('teacherActivityDescription')}><DataTable columns={columns} queryKey={['teacher-activity', user?.id, locale]} fetchPage={adminAcademicApi.teacherActivity} getRowId={row => String(row.id)} label={t('teacherActivityTitle')} /></DashboardPanel>;
}
