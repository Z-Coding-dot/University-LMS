import { useMutation, useQueryClient } from '@tanstack/react-query';
import { studentsApi } from '../../../api/endpoints/students';

export function useStudentAccountMutations() {
  const client = useQueryClient();
  const refresh = () => { void client.invalidateQueries({ queryKey: ['admin-students'] }); };
  const create = useMutation({ mutationFn: studentsApi.create, onSuccess: refresh });
  const update = useMutation({ mutationFn: studentsApi.update, onSuccess: refresh });
  const reset = useMutation({ mutationFn: studentsApi.resetPassword, onSuccess: refresh });
  return { create, update, reset };
}
