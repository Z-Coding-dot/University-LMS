import { api } from '../client';
import type { ApiResponse, Assignment, Attachment, Lecture, ListParams, PaginatedResponse, Semester, Submission, User } from '../types';
import type { GradeStatus } from '../../config/constants';
import type { AnnouncementView, AssignmentView, AttendanceBook, AttendanceHistoryRow, CourseDetail, CourseView, CourseWeeksResponse, GradeBook, ResultCourse, ResultsResponse, StudentGradeItem, SubmissionView } from '../types/academic';
import type { TimetableItem } from '../../components/shared/week-timetable';
const get = async <T>(url: string, params?: ListParams) => (await api.get<ApiResponse<T>>(url, { params })).data.data;
const send = async <T>(method: 'post' | 'put' | 'patch', url: string, data: unknown) => (await api[method]<ApiResponse<T>>(url, data)).data.data;
export const academicApi = {
  courses: async (params: ListParams, signal: AbortSignal) => (await api.get<PaginatedResponse<CourseView>>('/courses', { params, signal })).data,
  course: (id: number) => get<CourseDetail>(`/courses/${id}`),
  weeks: (id: number) => get<CourseWeeksResponse>(`/courses/${id}/weeks`),
  breakdown: (id: number, params: ListParams, signal: AbortSignal) => api.get<PaginatedResponse<StudentGradeItem>>(`/courses/${id}/grade-breakdown`, { params, signal }).then(response => response.data),
  history: (id: number, params: ListParams, signal: AbortSignal) => api.get<PaginatedResponse<AttendanceHistoryRow>>(`/courses/${id}/attendance-history`, { params, signal }).then(response => response.data),
  catalog: () => get<{ semesters: Semester[] }>('/catalog'),
  roster: (id: number, params: ListParams, signal: AbortSignal) => api.get<PaginatedResponse<User>>(`/courses/${id}/roster`, { params, signal }).then(response => response.data),
  attendance: (id: number) => get<AttendanceBook>(`/courses/${id}/attendance`),
  saveAttendance: (id: number, input: unknown) => send('post', `/courses/${id}/attendance`, input),
  grades: (id: number) => get<GradeBook>(`/courses/${id}/grades`),
  saveGrades: (id: number, input: unknown) => send('put', `/courses/${id}/grades`, input),
  components: (id: number, input: unknown) => send('put', `/courses/${id}/grade-components`, input),
  gradeStatus: (id: number, status: GradeStatus) => send('put', `/courses/${id}/grade-status`, { status }),
  results: () => get<ResultsResponse>('/results'),
  resultCourses: (params: ListParams, signal: AbortSignal) => api.get<PaginatedResponse<ResultCourse>>('/results/courses', { params, signal }).then(response => response.data),
  timetable: (params?: ListParams) => get<{ slots: TimetableItem[]; weekend_days: number[] }>('/timetable', params),
  assignments: (params: ListParams, signal: AbortSignal) => api.get<PaginatedResponse<AssignmentView>>('/assignments', { params, signal }).then(response => response.data),
  assignment: (id: number) => get<AssignmentView>(`/assignments/${id}`),
  lectures: (id: number, params: ListParams, signal: AbortSignal) => api.get<PaginatedResponse<Lecture>>(`/courses/${id}/lectures`, { params, signal }).then(response => response.data),
  saveLecture: (offeringId: number, input: unknown, id?: number) => send<Lecture>(id ? 'patch' : 'post', `/courses/${offeringId}/lectures${id ? `/${id}` : ''}`, input),
  saveAssignment: (input: unknown, id?: number) => send<Assignment>(id ? 'patch' : 'post', id ? `/assignments/${id}` : '/assignments', input),
  submit: (id: number, fileIds: number[]) => send<Submission>('post', `/assignments/${id}/submissions`, { file_ids: fileIds }),
  submissions: (id: number, params: ListParams, signal: AbortSignal) => api.get<PaginatedResponse<SubmissionView>>(`/assignments/${id}/submissions`, { params, signal }).then(response => response.data),
  scoreSubmission: (id: number, input: unknown) => send('patch', `/submissions/${id}`, input),
  announcements: (params: ListParams, signal: AbortSignal) => api.get<PaginatedResponse<AnnouncementView>>('/announcements', { params, signal }).then(response => response.data),
  saveAnnouncement: (input: unknown, id?: number) => send(id ? 'patch' : 'post', id ? `/announcements/${id}` : '/announcements', input),
  upload: async (files: File[], offeringId: number, purpose: 'submission' | 'assignment' | 'lecture', onProgress: (progress: number) => void) => {
    const body = new FormData(); body.set('offering_id', String(offeringId)); body.set('purpose', purpose); files.forEach(file => body.append('files[]', file));
    return (await api.post<ApiResponse<Attachment[]>>('/uploads', body, { timeout: 120000, onUploadProgress: event => onProgress(event.total ? event.loaded / event.total * 100 : 0) })).data.data;
  },
};
