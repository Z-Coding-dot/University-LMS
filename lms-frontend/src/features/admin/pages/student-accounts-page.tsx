import { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { User } from '../../../api/types';
import { studentsApi, type IssuedStudentCredentials } from '../../../api/endpoints/students';
import { apiErrorMessage } from '../../../api/client';
import { useAuthStore } from '../../auth/store';
import { canManageStudentAccounts } from '../../../lib/account-policy';
import { useDir } from '../../../hooks/useDir';
import { PageHeader } from '../../../components/layout/page-header';
import { DataTable, type DataColumn } from '../../../components/ui/data-table';
import { Button } from '../../../components/ui/button';
import { Dialog, ConfirmDialog } from '../../../components/ui/overlays';
import { StatusBadge, UserCell } from '../../../components/shared/identity';
import { useStudentAccountMutations } from '../hooks/useStudentAccounts';
import { StudentAccountForm } from '../components/student-account-form';
import { IssuedCredentials } from '../components/issued-credentials';

export function StudentAccountsPage() {
  const { t } = useTranslation(['admin', 'common', 'profile']);
  const { locale } = useDir();
  const user = useAuthStore(state => state.user);
  const { create, update, reset } = useStudentAccountMutations();
  const [editor, setEditor] = useState<User | 'new' | null>(null);
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [credentials, setCredentials] = useState<IssuedStudentCredentials | null>(null);
  const columns = useMemo<DataColumn<User>[]>(() => [
    { id: 'name', header: t('common:name'), accessor: row => row.name, cell: row => <UserCell name={row.name} />, mobile: 'primary', sortable: true },
    { id: 'email', header: t('common:email'), accessor: row => row.email, cell: row => <bdi className="break-all">{row.email}</bdi>, mobile: 'primary', sortable: true },
    { id: 'id', header: t('profile:id'), accessor: row => row.id, cell: row => <bdi>{row.profile.institutional_id}</bdi>, mobile: 'secondary', sortable: true },
    { id: 'status', header: t('profile:accountStatus'), accessor: row => row.status, cell: row => <StatusBadge status={row.status} />, mobile: 'secondary' },
  ], [t]);
  if (!canManageStudentAccounts(user)) return <Navigate to="/403" replace />;
  const pending = create.isPending || update.isPending;
  return <>
    <PageHeader title={t('title')} description={t('description')} actions={<Button onClick={() => setEditor('new')}><Plus size={18} />{t('create')}</Button>} />
    <DataTable columns={columns} queryKey={['admin-students', user?.id, locale]} fetchPage={studentsApi.list} getRowId={row => String(row.id)} label={t('title')} actions={row => <div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => setEditor(row)}>{t('edit')}</Button><Button variant="ghost" disabled={reset.isPending} onClick={() => setResetTarget(row)}>{t('resetPassword')}</Button></div>} />
    <Dialog title={t(editor === 'new' ? 'create' : 'edit')} open={editor !== null} onOpenChange={open => { if (!open && !pending) setEditor(null); }}>
      {editor && <StudentAccountForm key={editor === 'new' ? 'new' : editor.id} initial={editor === 'new' ? { name: '', email: '' } : { name: editor.name, email: editor.email }} pending={pending} create={editor === 'new'} onSubmit={async input => {
        if (editor === 'new') { const issued = await create.mutateAsync({ ...input, locale }); setCredentials(issued); }
        else { await update.mutateAsync({ ...input, id: editor.id }); toast.success(t('updated')); }
        setEditor(null);
      }} />}
    </Dialog>
    <ConfirmDialog title={t('resetPassword')} description={t('resetDescription', { name: resetTarget?.name ?? '' })} open={!!resetTarget} onOpenChange={open => { if (!open && !reset.isPending) setResetTarget(null); }} loading={reset.isPending} confirmLabel={t('resetPassword')} onConfirm={() => {
      if (!resetTarget) return;
      reset.mutate(resetTarget.id, { onSuccess: issued => { setResetTarget(null); setCredentials(issued); }, onError: error => toast.error(apiErrorMessage(error)) });
    }} />
    {credentials && <IssuedCredentials key={credentials.initial_password} credentials={credentials} onClose={() => { setCredentials(null); create.reset(); reset.reset(); }} />}
  </>;
}
