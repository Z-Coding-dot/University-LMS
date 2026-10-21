import type { AttendanceStatus, GradeStatus, Locale, Role } from '../../config/constants';
import type { LetterRange } from '../../lib/grading';

export interface LocalizedName { fa: string; en: string }
export interface User {
  id: number; name: string; email: string; role: Role; permissions: string[]; locale: Locale;
  must_change_password: boolean; status: 'active' | 'inactive';
  profile: { institutional_id: string; department_id: number | null; current_semester_id: number | null };
}
export interface Faculty { id: number; name: LocalizedName }
export interface Department { id: number; faculty_id: number; name: LocalizedName }
export interface AcademicYear { id: number; name: string; starts_at: string; ends_at: string }
export interface Semester { id: number; academic_year_id: number; name: LocalizedName; starts_at: string; ends_at: string }
export interface Course { id: number; code: string; name: LocalizedName; credits: number; department_id: number }
export interface TimetableSlot { id: number; offering_id: number; weekday: number; start: string; end: string; room: string }
export interface CourseOffering { id: number; course_id: number; semester_id: number; teacher_id: number; capacity: number; schedule: TimetableSlot[] }
export interface Enrollment { id: number; student_id: number; offering_id: number }
export interface GradeComponent { id: number; offering_id: number; name: LocalizedName; max_score: number; weight: number }
export interface GradeEntry { id: number; student_id: number; component_id: number; score: number; feedback: string | null; status: GradeStatus; updated_at: string }
export interface AttendanceSession { id: number; offering_id: number; date: string }
export interface AttendanceRecord { id: number; session_id: number; student_id: number; status: AttendanceStatus }
export interface Attachment { id: number; name: string; url: string; size: number; mime_type: string; created_at: string }
export interface Lecture { id: number; offering_id: number; week_number: number; title: string; description: string; attachments: Attachment[]; updated_at: string }
export interface Assignment { id: number; offering_id: number; week_number: number; submission_enabled: boolean; title: string; description: string; due_at: string; attachments: Attachment[] }
export interface Submission { id: number; assignment_id: number; student_id: number; files: Attachment[]; submitted_at: string; score: number | null; feedback: string | null }
export interface Announcement { id: number; title: string; body: string; audience: 'all' | 'role' | 'offering'; role: Role | null; offering_id: number | null; author_id: number; created_at: string }
export interface AcademicSettings { pass_mark: number; letter_scale: LetterRange[]; attendance_counted_statuses: AttendanceStatus[]; attendance_warning_threshold: number; weekend_days: number[] }
export interface ApiResponse<T> { data: T }
export interface PaginationMeta { current_page: number; per_page: number; total: number; last_page: number }
export interface PaginatedResponse<T> { data: T[]; meta: PaginationMeta }
export interface ListParams { page?: number; per_page?: number; sort?: string; search?: string; [filter: string]: string | number | undefined }
export interface ValidationError { message: string; errors: Record<string, string[]> }
export interface LoginInput { identifier: string; password: string }
export interface LoginResult { user: User; token?: string }
export interface PasswordInput { current_password: string; password: string; password_confirmation: string }
