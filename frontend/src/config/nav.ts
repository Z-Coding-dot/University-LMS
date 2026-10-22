import { Home, UserRound, ShieldCheck, UsersRound, CalendarDays, BookOpen, GraduationCap, ChartNoAxesCombined, ClipboardList, FolderOpen, Megaphone, Network, Layers, Settings2, LockKeyholeOpen, type LucideIcon } from 'lucide-react';
import { SELF_SERVICE_ROLES } from '../lib/account-policy';
import type { Role } from './constants';
import { can, PERMISSIONS, type Permission } from '../lib/permissions';
import type { User } from '../api/types';
export interface NavItem { id: string; to: string; label: string; icon: LucideIcon; roles?: Role[]; permission?: Permission; permissionsByRole?: Partial<Record<Role, Permission[]>>; bottomTab?: boolean; matchChildren?: boolean; accountOnly?: boolean }
export const navigation: NavItem[] = [
  { id: 'workspace', to: '/', label: 'navigation:workspace', icon: Home, bottomTab: true },
  { id: 'activity', to: '/activity', label: 'navigation:activity', icon: ClipboardList, roles: ['admin', 'teacher'], permissionsByRole: { teacher: [PERMISSIONS.takeAttendance, PERMISSIONS.enterGrades, PERMISSIONS.publishGrades, PERMISSIONS.manageAssignments] } },
  { id: 'schedule', to: '/timetable', label: 'navigation:schedule', icon: CalendarDays, permissionsByRole: { teacher: [PERMISSIONS.viewTimetable] }, bottomTab: true },
  { id: 'courses', to: '/courses', label: 'navigation:courses', icon: BookOpen, bottomTab: true, matchChildren: true },
  { id: 'results', to: '/results', label: 'navigation:results', icon: GraduationCap, roles: ['student'], bottomTab: true },
  { id: 'grades', to: '/gradebook', label: 'navigation:grades', icon: GraduationCap, roles: ['admin', 'teacher'], permissionsByRole: { teacher: [PERMISSIONS.enterGrades, PERMISSIONS.publishGrades] }, bottomTab: true },
  { id: 'assignments', roles: ['admin', 'teacher'], to: '/assignments', label: 'navigation:assignments', icon: ClipboardList, matchChildren: true },
  { id: 'resources', roles: ['admin', 'teacher'], to: '/resources', label: 'navigation:resources', icon: FolderOpen },
  { id: 'performance', roles: ['admin', 'teacher'], to: '/performance', label: 'navigation:performance', icon: ChartNoAxesCombined },
  { id: 'announcements', roles: ['admin', 'teacher'], to: '/announcements', label: 'navigation:announcements', icon: Megaphone },
  { id: 'student-accounts', to: '/admin/student-accounts', label: 'navigation:studentAccounts', icon: UsersRound, roles: ['admin'] },
  { id: 'teacher-accounts', to: '/admin/teacher-accounts', label: 'navigation:teacherAccounts', icon: UsersRound, roles: ['admin'] },
  { id: 'structure', to: '/admin/structure', label: 'navigation:structure', icon: Network, roles: ['admin'] },
  { id: 'offerings', to: '/admin/offerings', label: 'navigation:offerings', icon: Layers, roles: ['admin'] },
  { id: 'academic-settings', to: '/admin/settings', label: 'navigation:academicSettings', icon: Settings2, roles: ['admin'] },
  { id: 'unlock-grades', to: '/admin/unlock-grades', label: 'navigation:unlockGrades', icon: LockKeyholeOpen, roles: ['admin'] },
  { id: 'profile', to: '/profile', label: 'navigation:profile', icon: UserRound, accountOnly: true },
  { id: 'security', to: '/profile/security', label: 'navigation:security', icon: ShieldCheck, roles: SELF_SERVICE_ROLES, accountOnly: true },
];
export const visibleNavigation = (user: User) => navigation.filter(item => (!item.roles || item.roles.includes(user.role)) && (!item.permission || can(user, item.permission)) && (!item.permissionsByRole?.[user.role] || item.permissionsByRole[user.role]!.some(permission => can(user, permission))));
export const workspaceNavigation = (user: User) => visibleNavigation(user).filter(item => !item.accountOnly);
export function isNavigationActive(item: NavItem, location: { pathname: string; hash: string }): boolean {
  const [pathname, hash] = item.to.split('#');
  return hash ? location.pathname === pathname && location.hash === `#${hash}` : (location.pathname === pathname || (item.matchChildren === true && location.pathname.startsWith(`${pathname}/`))) && !location.hash;
}
