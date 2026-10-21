import type { Role } from '../config/constants';

export const PERMISSIONS = {
  takeAttendance: 'attendance.take', enterGrades: 'grades.enter', publishGrades: 'grades.publish',
  manageAssignments: 'assignments.manage', manageMaterials: 'materials.manage', postAnnouncements: 'announcements.post',
  viewTimetable: 'timetable.view', unlockGrades: 'grades.unlock',
} as const;
export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];
export const TEACHER_PERMISSIONS = [PERMISSIONS.takeAttendance, PERMISSIONS.enterGrades, PERMISSIONS.publishGrades, PERMISSIONS.manageAssignments, PERMISSIONS.manageMaterials, PERMISSIONS.postAnnouncements, PERMISSIONS.viewTimetable] as const;
export type TeacherPermission = typeof TEACHER_PERMISSIONS[number];
export const PERMISSION_PRESETS: Record<'none' | 'teaching' | 'full', readonly TeacherPermission[]> = {
  none: [],
  teaching: [PERMISSIONS.takeAttendance, PERMISSIONS.enterGrades, PERMISSIONS.manageAssignments, PERMISSIONS.manageMaterials, PERMISSIONS.postAnnouncements, PERMISSIONS.viewTimetable],
  full: TEACHER_PERMISSIONS,
};
export interface PermissionUser { role: Role; permissions: string[] }

export function can(user: PermissionUser | null, permission: Permission): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (permission === PERMISSIONS.unlockGrades) return false;
  // The teacher permission grants are never applicable to student accounts.
  return user.role === 'teacher' && user.permissions.includes(permission);
}
