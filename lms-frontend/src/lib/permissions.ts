import type { Role } from '../config/constants';

export const PERMISSIONS = {
  takeAttendance: 'attendance.take', enterGrades: 'grades.enter', publishGrades: 'grades.publish',
  manageAssignments: 'assignments.manage', postAnnouncements: 'announcements.post',
  viewTimetable: 'timetable.view', unlockGrades: 'grades.unlock',
} as const;
export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];
export interface PermissionUser { role: Role; permissions: string[] }

export function can(user: PermissionUser | null, permission: Permission): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (permission === PERMISSIONS.unlockGrades) return false;
  // The teacher permission grants are never applicable to student accounts.
  return user.role === 'teacher' && user.permissions.includes(permission);
}
