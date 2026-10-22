import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '../components/layout/app-shell';
import { LoginPage } from '../features/auth/pages/login-page';
import { ChangePasswordPage } from '../features/auth/pages/change-password-page';
import { RequireAuth } from './guards/RequireAuth';
import { ErrorPage } from './error-page';
import { RequireRole } from './guards/RequireRole';
import { SELF_SERVICE_ROLES } from '../lib/account-policy';
export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage />, errorElement: <ErrorPage /> },
  { element: <RequireAuth />, errorElement: <ErrorPage />, children: [
    { path: '/change-password', element: <ChangePasswordPage /> },
    { element: <AppShell />, children: [
      { index: true, lazy: async () => ({ Component: (await import('../features/dashboard/pages/dashboard-page')).DashboardPage }) },
      { path: '/performance', lazy: async () => ({ Component: (await import('../features/dashboard/pages/performance-page')).PerformancePage }) },
      { path: '/resources', lazy: async () => ({ Component: (await import('../features/dashboard/pages/resources-page')).ResourcesPage }) },
      { path: '/courses', lazy: async () => ({ Component: (await import('../features/student/pages/courses-page')).CoursesPage }) },
      { path: '/courses/:courseId', lazy: async () => ({ Component: (await import('../features/student/pages/course-detail-page')).CourseDetailPage }) },
      { path: '/assignments', lazy: async () => ({ Component: (await import('../features/student/pages/assignments-page')).AssignmentsPage }) },
      { path: '/assignments/:assignmentId', lazy: async () => ({ Component: (await import('../features/student/pages/assignment-detail-page')).AssignmentDetailPage }) },
      { path: '/timetable', lazy: async () => ({ Component: (await import('../features/timetable/pages/timetable-page')).TimetablePage }) },
      { path: '/announcements', lazy: async () => ({ Component: (await import('../features/announcements/pages/announcements-page')).AnnouncementsPage }) },
      { element: <RequireRole roles={['student']} />, children: [
        { path: '/results', lazy: async () => ({ Component: (await import('../features/student/pages/results-page')).ResultsPage }) },
      ] },
      { element: <RequireRole roles={['admin', 'teacher']} />, children: [
        { path: '/activity', lazy: async () => ({ Component: (await import('../features/dashboard/pages/activity-page')).ActivityPage }) },
        { path: '/gradebook', lazy: async () => ({ Component: (await import('../features/teacher/pages/gradebook-page')).GradebookPage }) },
      ] },
      { path: '/profile', lazy: async () => ({ Component: (await import('../features/profile/pages/profile-page')).ProfilePage }) },
      { element: <RequireRole roles={SELF_SERVICE_ROLES} />, children: [
        { path: '/profile/security', lazy: async () => ({ Component: (await import('../features/profile/pages/security-page')).SecurityPage }) },
      ] },
      { element: <RequireRole roles={['admin']} />, children: [
        { path: '/admin/student-accounts', lazy: async () => ({ Component: (await import('../features/admin/pages/account-management-page')).StudentAccountsPage }) },
        { path: '/admin/teacher-accounts', lazy: async () => ({ Component: (await import('../features/admin/pages/account-management-page')).TeacherAccountsPage }) },
        { path: '/admin/structure', lazy: async () => ({ Component: (await import('../features/admin/pages/structure-page')).StructurePage }) },
        { path: '/admin/offerings', lazy: async () => ({ Component: (await import('../features/admin/pages/offerings-page')).OfferingsPage }) },
        { path: '/admin/settings', lazy: async () => ({ Component: (await import('../features/admin/pages/academic-settings-page')).AcademicSettingsPage }) },
        { path: '/admin/unlock-grades', lazy: async () => ({ Component: (await import('../features/admin/pages/unlock-grades-page')).UnlockGradesPage }) },
      ] },
      { path: '/403', element: <ErrorPage kind="forbidden" /> },
    ] },
  ] },
  { path: '*', element: <ErrorPage kind="notFound" /> },
]);
