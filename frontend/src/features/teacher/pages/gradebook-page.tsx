import { CoursesPage } from '../../student/pages/courses-page';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../auth/store';
import { can, PERMISSIONS } from '../../../lib/permissions';
export function GradebookPage() {
  const user = useAuthStore(state => state.user);
  return can(user, PERMISSIONS.enterGrades) || can(user, PERMISSIONS.publishGrades) ? <CoursesPage gradebook /> : <Navigate to="/403" replace />;
}
