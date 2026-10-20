export const ROLES = ['admin', 'teacher', 'student'] as const;
export const ATTENDANCE_STATUSES = ['present', 'absent', 'late', 'excused'] as const;
export const GRADE_STATUSES = ['draft', 'published', 'locked'] as const;
export const USER_STATUSES = ['active', 'inactive'] as const;
// ISO weekdays: Monday = 1, Sunday = 7.
export const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const;
export const MOBILE_PAGE_SIZE = 10;
export type Role = typeof ROLES[number];
export type Locale = 'fa' | 'en';
export type AttendanceStatus = typeof ATTENDANCE_STATUSES[number];
export type GradeStatus = typeof GRADE_STATUSES[number];
