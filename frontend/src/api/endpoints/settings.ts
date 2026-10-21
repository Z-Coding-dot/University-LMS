import { api } from '../client';
import type { AcademicSettings, ApiResponse } from '../types';
export const settingsApi = { get: async () => (await api.get<ApiResponse<AcademicSettings>>('/settings')).data.data };
