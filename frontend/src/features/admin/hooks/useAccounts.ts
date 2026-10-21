import { useMutation, useQueryClient } from '@tanstack/react-query';
import { accountsApi, saveTeacherPermissions } from '../../../api/endpoints/accounts';
import type { ManagedRole } from '../../../config/constants';

export function useAccountMutations(role: ManagedRole) {
  const client = useQueryClient();
  const api = accountsApi(role);
  const refresh = async () => { await Promise.all([client.invalidateQueries({ queryKey: ['admin-accounts', role] }), client.invalidateQueries({ queryKey: ['dashboard'] })]); };
  const create = useMutation({ mutationFn: api.create, onSuccess: refresh, gcTime: 0 });
  const update = useMutation({ mutationFn: api.update, onSuccess: refresh });
  const reset = useMutation({ mutationFn: api.resetPassword, onSuccess: refresh, gcTime: 0 });
  const status = useMutation({ mutationFn: api.status, onSuccess: refresh });
  const permissions = useMutation({ mutationFn: saveTeacherPermissions, onSuccess: refresh });
  return { create, update, reset, status, permissions };
}
