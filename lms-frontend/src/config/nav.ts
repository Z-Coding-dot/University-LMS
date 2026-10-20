import { Home, UserRound, ShieldCheck, UsersRound, CalendarDays, BookOpen, GraduationCap, ChartNoAxesCombined, Megaphone, type LucideIcon } from 'lucide-react';
import { SELF_SERVICE_ROLES } from '../lib/account-policy';
import type { Role } from './constants';
import { can, PERMISSIONS, type Permission } from '../lib/permissions';
import type { User } from '../api/types';
export interface NavItem { id: string; to: string; label: string; icon: LucideIcon; roles?: Role[]; permission?: Permission; permissionsByRole?: Partial<Record<Role, Permission[]>>; bottomTab?: boolean }
export const navigation: NavItem[] = [
  { id: 'workspace', to: '/', label: 'navigation:workspace', icon: Home, bottomTab: true },
  { id: 'schedule', to: '/#schedule', label: 'navigation:schedule', icon: CalendarDays, bottomTab: true },
  { id: 'courses', to: '/#courses', label: 'navigation:courses', icon: BookOpen, bottomTab: true },
  { id: 'grades', to: '/#grades', label: 'navigation:grades', icon: GraduationCap, permissionsByRole: { teacher: [PERMISSIONS.enterGrades, PERMISSIONS.publishGrades] }, bottomTab: true },
  { id: 'performance', to: '/#performance', label: 'navigation:performance', icon: ChartNoAxesCombined },
  { id: 'announcements', to: '/#announcements', label: 'navigation:announcements', icon: Megaphone },
  { id: 'student-accounts', to: '/admin/student-accounts', label: 'navigation:studentAccounts', icon: UsersRound, roles: ['admin'] },
  { id: 'profile', to: '/profile', label: 'navigation:profile', icon: UserRound },
  { id: 'security', to: '/profile/security', label: 'navigation:security', icon: ShieldCheck, roles: SELF_SERVICE_ROLES },
];
export const visibleNavigation = (user: User) => navigation.filter(item => (!item.roles || item.roles.includes(user.role)) && (!item.permission || can(user, item.permission)) && (!item.permissionsByRole?.[user.role] || item.permissionsByRole[user.role]!.some(permission => can(user, permission))));
export function isNavigationActive(item: NavItem, location: { pathname: string; hash: string }): boolean {
  const [pathname, hash] = item.to.split('#');
  return location.pathname === pathname && (hash ? location.hash === `#${hash}` : !location.hash);
}
