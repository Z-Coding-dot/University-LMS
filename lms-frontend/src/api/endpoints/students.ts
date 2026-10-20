import { api } from '../client';
import type { ApiResponse, ListParams, PaginatedResponse, User } from '../types';
import type { CreateStudentInput, StudentIdentityInput } from '../../features/admin/schemas';

export interface IssuedStudentCredentials { user: User; initial_password: string }
export const studentsApi = {
  list: async (params: ListParams, signal: AbortSignal) => (await api.get<PaginatedResponse<User>>('/admin/students', { params, signal })).data,
  create: async (input: CreateStudentInput) => (await api.post<ApiResponse<IssuedStudentCredentials>>('/admin/students', input)).data.data,
  update: async ({ id, ...input }: StudentIdentityInput & { id: number }) => (await api.patch<ApiResponse<User>>(`/admin/students/${id}`, input)).data.data,
  resetPassword: async (id: number) => (await api.post<ApiResponse<IssuedStudentCredentials>>(`/admin/students/${id}/reset-password`)).data.data,
};
