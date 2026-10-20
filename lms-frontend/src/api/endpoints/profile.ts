import { api } from '../client';
import type { ApiResponse, Department, PasswordInput, Semester, User } from '../types';
import type { ProfileInput } from '../../features/profile/schemas';
export const profileApi = {
  update: async (input: ProfileInput) => (await api.patch<ApiResponse<User>>('/profile', input)).data.data,
  password: async (input: PasswordInput) => (await api.put<ApiResponse<User>>('/profile/password', input)).data.data,
  context: async () => (await api.get<ApiResponse<{ department: Department | null; semester: Semester | null }>>('/profile/context')).data.data,
};
