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
      { path: '/profile', lazy: async () => ({ Component: (await import('../features/profile/pages/profile-page')).ProfilePage }) },
      { element: <RequireRole roles={SELF_SERVICE_ROLES} />, children: [
        { path: '/profile/security', lazy: async () => ({ Component: (await import('../features/profile/pages/security-page')).SecurityPage }) },
      ] },
      { element: <RequireRole roles={['admin']} />, children: [
        { path: '/admin/student-accounts', lazy: async () => ({ Component: (await import('../features/admin/pages/student-accounts-page')).StudentAccountsPage }) },
      ] },
      { path: '/403', element: <ErrorPage kind="forbidden" /> },
    ] },
  ] },
  { path: '*', element: <ErrorPage kind="notFound" /> },
]);
