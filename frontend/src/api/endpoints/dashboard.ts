import { api } from '../client';
import type { ApiResponse, ListParams, PaginatedResponse } from '../types';
import type { DashboardFile, DashboardSummary, DashboardTask } from '../types/dashboard';

export const dashboardApi = {
  summary: async (params: ListParams, signal: AbortSignal) => (await api.get<ApiResponse<DashboardSummary>>('/dashboard', { params, signal })).data.data,
  tasks: async (params: ListParams, signal: AbortSignal) => (await api.get<PaginatedResponse<DashboardTask>>('/dashboard/tasks', { params, signal })).data,
  files: async (params: ListParams, signal: AbortSignal) => (await api.get<PaginatedResponse<DashboardFile>>('/dashboard/files', { params, signal })).data,
};
