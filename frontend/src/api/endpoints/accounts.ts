import { api } from '../client';
import type { ApiResponse, ListParams, PaginatedResponse, User } from '../types';
import type { CreateAccountInput, AccountIdentityInput } from '../../features/admin/schemas';
import type { ManagedRole } from '../../config/constants';
import type { TeacherPermission } from '../../lib/permissions';

export interface IssuedCredentialsResponse { user: User; initial_password: string }
export function accountsApi(role: ManagedRole) {
  const path = `/admin/${role}s`;
  return {
    list: async (params: ListParams, signal: AbortSignal) => (await api.get<PaginatedResponse<User>>(path, { params, signal })).data,
    create: async (input: CreateAccountInput) => (await api.post<ApiResponse<IssuedCredentialsResponse>>(path, input)).data.data,
    update: async ({ id, ...input }: AccountIdentityInput & { id: number }) => (await api.patch<ApiResponse<User>>(`${path}/${id}`, input)).data.data,
    resetPassword: async (id: number) => (await api.post<ApiResponse<IssuedCredentialsResponse>>(`${path}/${id}/reset-password`)).data.data,
    status: async ({ id, status }: { id: number; status: User['status'] }) => (await api.patch<ApiResponse<User>>(`${path}/${id}/status`, { status })).data.data,
  };
}
export const saveTeacherPermissions = async ({ id, permissions }: { id: number; permissions: TeacherPermission[] }) => (await api.put<ApiResponse<User>>(`/admin/teachers/${id}/permissions`, { permissions })).data.data;
export const saveStudentAcademicProfile = async ({ id, values }: { id: number; values: unknown }) => (await api.patch<ApiResponse<User>>(`/admin/students/${id}/academic-profile`, values)).data.data;
