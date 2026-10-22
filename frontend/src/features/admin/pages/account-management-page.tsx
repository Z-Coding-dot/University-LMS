import { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { User } from '../../../api/types';
import { accountsApi, type IssuedCredentialsResponse } from '../../../api/endpoints/accounts';
import type { ManagedRole } from '../../../config/constants';
import { apiErrorMessage } from '../../../api/client';
import { useAuthStore } from '../../auth/store';
import { canManageAccounts } from '../../../lib/account-policy';
import { useDir } from '../../../hooks/useDir';
import { PageHeader } from '../../../components/layout/page-header';
import { DataTable, type DataColumn } from '../../../components/ui/data-table';
import { Button } from '../../../components/ui/button';
import { Dialog, ConfirmDialog } from '../../../components/ui/overlays';
import { StatusBadge, UserCell } from '../../../components/shared/identity';
import { useAccountMutations } from '../hooks/useAccounts';
import { AccountForm } from '../components/account-form';
import { TeacherPermissions } from '../components/teacher-permissions';
import { IssuedCredentials } from '../components/issued-credentials';
import { adminAcademicApi } from '../../../api/endpoints/admin-academic';
import { useAcademicQuery } from '../../../hooks/useAcademic';
import { ConfigForm } from '../../../components/shared/config-form';
import { studentAcademicProfileSchema } from '../academic-schemas';

function AccountManagementPage({ role }: { role: ManagedRole }) {
  const { t } = useTranslation(['admin', 'common', 'profile']);
  const { locale } = useDir();
  const user = useAuthStore(state => state.user);
  const { create, update, reset, status, permissions, academicProfile } = useAccountMutations(role);
  const catalog = useAcademicQuery(['admin-catalog'], adminAcademicApi.catalog, role === 'student');
  const [editor, setEditor] = useState<User | 'new' | null>(null);
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [credentials, setCredentials] = useState<IssuedCredentialsResponse | null>(null);
  const [statusTarget, setStatusTarget] = useState<User | null>(null);
  const [permissionsTarget, setPermissionsTarget] = useState<User | null>(null);
  const [academicTarget, setAcademicTarget] = useState<User | null>(null);
  const title = t(role === 'teacher' ? 'teacherTitle' : 'title');
  const createLabel = t(role === 'teacher' ? 'createTeacher' : 'create');
  const editLabel = t(role === 'teacher' ? 'editTeacher' : 'edit');
  const columns = useMemo<DataColumn<User>[]>(() => [
    { id: 'name', header: t('common:name'), accessor: row => row.name, cell: row => <UserCell name={row.name} />, mobile: 'primary', sortable: true },
    { id: 'email', header: t('common:email'), accessor: row => row.email, cell: row => <bdi className="break-all">{row.email}</bdi>, mobile: 'primary', sortable: true },
    { id: 'id', header: t('profile:id'), accessor: row => row.id, cell: row => <bdi>{row.profile.institutional_id}</bdi>, mobile: 'secondary', sortable: true },
    { id: 'status', header: t('profile:accountStatus'), accessor: row => row.status, cell: row => <StatusBadge status={row.status} />, mobile: 'secondary' },
  ], [t]);
  if (!canManageAccounts(user)) return <Navigate to="/403" replace />;
  const pending = create.isPending || update.isPending;
  return <>
    <PageHeader title={title} description={t(role === 'teacher' ? 'teacherDescription' : 'description')} actions={<Button onClick={() => setEditor('new')}><Plus size={18} />{createLabel}</Button>} />
    <DataTable columns={columns} queryKey={['admin-accounts', role, user?.id, locale]} fetchPage={accountsApi(role).list} getRowId={row => String(row.id)} label={title} actions={row => <div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => setEditor(row)}>{editLabel}</Button>{role === 'teacher' ? <Button variant="secondary" onClick={() => setPermissionsTarget(row)}>{t('managePermissions')}</Button> : <Button variant="secondary" disabled={!catalog.data} onClick={() => setAcademicTarget(row)}>{t('academicPlacement')}</Button>}<Button variant="ghost" disabled={reset.isPending} onClick={() => setResetTarget(row)}>{t('resetPassword')}</Button><Button variant="ghost" disabled={status.isPending} onClick={() => setStatusTarget(row)}>{t(row.status === 'active' ? 'deactivate' : 'activate')}</Button></div>} />
    <Dialog title={editor === 'new' ? createLabel : editLabel} open={editor !== null} onOpenChange={open => { if (!open && !pending) setEditor(null); }}>
      {editor && <AccountForm key={editor === 'new' ? 'new' : editor.id} initial={editor === 'new' ? { name: '', email: '' } : { name: editor.name, email: editor.email }} pending={pending} create={editor === 'new'} submitLabel={editor === 'new' ? createLabel : t('common:save')} onSubmit={async input => {
        if (editor === 'new') { const issued = await create.mutateAsync({ ...input, locale }); setCredentials(issued); }
        else { await update.mutateAsync({ ...input, id: editor.id }); toast.success(t('accountUpdated')); }
        setEditor(null);
      }} />}
    </Dialog>
    <ConfirmDialog title={t('resetPassword')} description={t('resetDescription', { name: resetTarget?.name ?? '' })} open={!!resetTarget} onOpenChange={open => { if (!open && !reset.isPending) setResetTarget(null); }} loading={reset.isPending} confirmLabel={t('resetPassword')} onConfirm={() => {
      if (!resetTarget) return;
      reset.mutate(resetTarget.id, { onSuccess: issued => { setResetTarget(null); setCredentials(issued); }, onError: error => toast.error(apiErrorMessage(error)) });
    }} />
    <ConfirmDialog title={t(statusTarget?.status === 'active' ? 'deactivate' : 'activate')} description={t(statusTarget?.status === 'active' ? 'deactivateDescription' : 'activateDescription', { name: statusTarget?.name ?? '' })} open={!!statusTarget} onOpenChange={open => { if (!open && !status.isPending) setStatusTarget(null); }} loading={status.isPending} onConfirm={() => {
      if (!statusTarget) return;
      status.mutate({ id: statusTarget.id, status: statusTarget.status === 'active' ? 'inactive' : 'active' }, { onSuccess: () => { setStatusTarget(null); toast.success(t('accountUpdated')); }, onError: error => toast.error(apiErrorMessage(error)) });
    }} />
    <Dialog title={t('managePermissions')} description={permissionsTarget?.name} open={!!permissionsTarget} onOpenChange={open => { if (!open && !permissions.isPending) setPermissionsTarget(null); }}>{permissionsTarget && <TeacherPermissions key={permissionsTarget.id} teacher={permissionsTarget} pending={permissions.isPending} onSubmit={async values => { await permissions.mutateAsync({ id: permissionsTarget.id, permissions: values }); setPermissionsTarget(null); toast.success(t('permissionsSaved')); }} />}</Dialog>
    <Dialog title={t('academicPlacement')} description={academicTarget?.name} open={!!academicTarget} onOpenChange={open => { if (!open && !academicProfile.isPending) setAcademicTarget(null); }}>{academicTarget && catalog.data && <ConfigForm key={academicTarget.id} schema={studentAcademicProfileSchema} defaults={{ department_id: academicTarget.profile.department_id ?? 'none', current_semester_id: academicTarget.profile.current_semester_id ?? 'none' }} fields={[{ name: 'department_id', label: 'admin:department', type: 'select', options: [{ value: 'none', label: t('profile:notAssigned') }, ...catalog.data.departments.map(row => ({ value: String(row.id), label: row.name[locale] }))] }, { name: 'current_semester_id', label: 'profile:currentSemester', type: 'select', options: [{ value: 'none', label: t('profile:notAssigned') }, ...catalog.data.semesters.map(row => ({ value: String(row.id), label: row.name[locale] }))] }]} pending={academicProfile.isPending} onSubmit={async values => { await academicProfile.mutateAsync({ id: academicTarget.id, values }); setAcademicTarget(null); toast.success(t('accountUpdated')); }}><p className="text-gray-600">{t('placementHint')}</p></ConfigForm>}</Dialog>
    {credentials && <IssuedCredentials key={credentials.initial_password} credentials={credentials} onClose={() => { setCredentials(null); create.reset(); reset.reset(); }} />}
  </>;
}

export function StudentAccountsPage() { return <AccountManagementPage role="student" />; }
export function TeacherAccountsPage() { return <AccountManagementPage role="teacher" />; }
