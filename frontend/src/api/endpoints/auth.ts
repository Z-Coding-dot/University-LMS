import { api, csrfCookie } from '../client';
import type { ApiResponse, LoginInput, LoginResult, User } from '../types';
export const authApi = {
  login: async (input: LoginInput) => {
    await csrfCookie();
    return (await api.post<ApiResponse<LoginResult>>('/auth/login', input)).data.data;
  },
  me: async () => (await api.get<ApiResponse<User>>('/auth/me')).data.data,
  logout: async () => { await api.post('/auth/logout'); },
};
