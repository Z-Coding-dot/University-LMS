import { api } from '../client';
import type { AcademicSettings, ApiResponse, ListParams, PaginatedResponse, User } from '../types';
import type { AcademicCatalog, CourseView, StructureResource, StructureRow } from '../types/academic';
export const adminAcademicApi = {
  catalog: async () => (await api.get<ApiResponse<AcademicCatalog>>('/admin/catalog')).data.data,
  structure: (resource: StructureResource, params: ListParams, signal: AbortSignal) => api.get<PaginatedResponse<StructureRow>>(`/admin/structure/${resource}`, { params, signal }).then(response => response.data),
  saveStructure: async (resource: StructureResource, values: unknown, id?: number) => (await api[id ? 'patch' : 'post']<ApiResponse<StructureRow>>(`/admin/structure/${resource}${id ? `/${id}` : ''}`, values)).data.data,
  offerings: (params: ListParams, signal: AbortSignal) => api.get<PaginatedResponse<CourseView>>('/admin/offerings', { params, signal }).then(response => response.data),
  saveOffering: async (values: unknown, id?: number) => (await api[id ? 'patch' : 'post']<ApiResponse<CourseView>>(`/admin/offerings${id ? `/${id}` : ''}`, values)).data.data,
  candidates: (id: number, params: ListParams, signal: AbortSignal) => api.get<PaginatedResponse<User>>(`/admin/offerings/${id}/candidates`, { params, signal }).then(response => response.data),
  enroll: async (id: number, values: unknown) => (await api.post<ApiResponse<CourseView>>(`/admin/offerings/${id}/enrollments`, values)).data.data,
  schedule: async (id: number, values: unknown) => (await api.put<ApiResponse<CourseView>>(`/admin/offerings/${id}/schedule`, values)).data.data,
  settings: async () => (await api.get<ApiResponse<AcademicSettings>>('/settings')).data.data,
  saveSettings: async (values: unknown) => (await api.put<ApiResponse<AcademicSettings>>('/admin/settings', values)).data.data,
  lockedGrades: (params: ListParams, signal: AbortSignal) => api.get<PaginatedResponse<CourseView>>('/admin/locked-grades', { params, signal }).then(response => response.data),
};
