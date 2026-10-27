import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../../components/layout/page-header';
import { StaffActivityTables } from '../components/staff-activity';
import { TeacherActivity } from '../../admin/components/teacher-activity';
import { useAuthStore } from '../../auth/store';

export function ActivityPage() {
  const { t } = useTranslation('dashboard');
  const user = useAuthStore(state => state.user);
  return <><PageHeader title={t(user?.role === 'admin' ? 'admin:teacherActivityTitle' : 'staffActivity')} description={t(user?.role === 'admin' ? 'admin:teacherActivityDescription' : 'staffActivityDescription')} />{user?.role === 'admin' && <TeacherActivity />}<StaffActivityTables /></>;
}
