import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, LogOut, MoreHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { create } from 'zustand';
import { useAuthStore } from '../../features/auth/store';
import { useLogout } from '../../features/auth/hooks/useAuth';
import { visibleNavigation, isNavigationActive, type NavItem } from '../../config/nav';
import { cn } from '../../lib/cn';
import { Button, IconButton } from '../ui/button';
import { Sheet, Tooltip } from '../ui/overlays';
import { Brand } from './brand';
import { UserCell } from '../shared/identity';
import { storage } from '../../lib/storage';
interface UIState { collapsed: boolean; drawerOpen: boolean; toggleSidebar: () => void; setDrawerOpen: (open: boolean) => void }
export const useUIStore = create<UIState>(set => ({
  collapsed: storage.get('lms-sidebar-collapsed') === 'true', drawerOpen: false,
  toggleSidebar: () => set(state => { storage.set('lms-sidebar-collapsed', String(!state.collapsed)); return { collapsed: !state.collapsed }; }),
  setDrawerOpen: drawerOpen => set({ drawerOpen }),
}));
function NavItems({ items, compact = false, dark = false, onNavigate }: { items: NavItem[]; compact?: boolean; dark?: boolean; onNavigate?: () => void }) {
  const { t } = useTranslation(); const location = useLocation();
  return <>{items.map(item => {
    const Icon = item.icon; const isActive = isNavigationActive(item, location);
    const link = <Link key={item.id} to={item.to} aria-current={isActive ? 'page' : undefined} onClick={onNavigate} aria-label={compact ? t(item.label) : undefined} className={cn('flex min-h-12 min-w-0 items-center gap-3 rounded-xl px-3 py-3 font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand', isActive ? 'border-s-4 border-brand bg-white text-orange-700 shadow-sm' : dark ? 'text-gray-300 hover:bg-white/5 hover:text-white' : 'text-gray-600 hover:bg-gray-100', compact && 'justify-center px-0')}><Icon size={21} className="shrink-0" aria-hidden="true" />{!compact && <span className="truncate">{t(item.label)}</span>}</Link>;
    return compact ? <Tooltip key={item.id} content={t(item.label)}>{link}</Tooltip> : link;
  })}</>;
}
export function Sidebar() {
  const { t } = useTranslation(); const user = useAuthStore(state => state.user); const collapsed = useUIStore(state => state.collapsed); const toggle = useUIStore(state => state.toggleSidebar); const logout = useLogout();
  if (!user) return null;
  return <aside className={cn('sticky top-0 hidden h-dvh shrink-0 flex-col bg-gradient-to-b from-gray-800 via-ink to-[#36200f] p-4 lg:flex', collapsed ? 'w-24' : 'w-60 2xl:w-64')}><Brand compact={collapsed} light showDescription={false} /><div className="my-5 h-px shrink-0 bg-white/10" /><nav aria-label={t('navigation:navigation')} className="min-h-0 flex-1 space-y-1 overflow-y-auto py-1"><NavItems items={visibleNavigation(user)} compact={collapsed} dark /></nav><div className="space-y-4 border-t border-white/10 pt-5">{!collapsed && <div className="text-white"><UserCell name={user.name} secondary={t(`roles.${user.role}`)} /></div>}<Button variant="ghost" loading={logout.isPending} onClick={() => logout.mutate()} className={cn('w-full text-gray-300 hover:bg-white/5 hover:text-white', collapsed ? 'px-0' : 'justify-start')} aria-label={t('signOut')}><LogOut size={20} />{!collapsed && t('signOut')}</Button><IconButton label={t(collapsed ? 'expandSidebar' : 'collapseSidebar')} onClick={toggle} className="w-full text-gray-400 hover:bg-white/5 hover:text-white"><ChevronLeft size={18} className={cn('rtl:rotate-180', collapsed && 'rotate-180 rtl:rotate-0')} /></IconButton></div></aside>;
}
export function MobileDrawer() {
  const { t } = useTranslation(); const user = useAuthStore(state => state.user); const open = useUIStore(state => state.drawerOpen); const setOpen = useUIStore(state => state.setDrawerOpen); const logout = useLogout();
  if (!user) return null;
  return <Sheet title={t('navigation:navigation')} open={open} onOpenChange={setOpen} drawer={user.role === 'admin'}><div className="space-y-6"><Brand /><nav className="space-y-2"><NavItems items={visibleNavigation(user)} onNavigate={() => setOpen(false)} /></nav><Button variant="secondary" className="w-full" loading={logout.isPending} onClick={() => logout.mutate(undefined, { onSuccess: () => setOpen(false) })}><LogOut size={18} />{t('signOut')}</Button></div></Sheet>;
}
export function MobileTabBar() {
  const user = useAuthStore(state => state.user); const { t } = useTranslation(); const location = useLocation(); const setOpen = useUIStore(state => state.setDrawerOpen);
  if (!user || user.role === 'admin') return null;
  const items = visibleNavigation(user); const tabs = items.filter(item => item.bottomTab).slice(0, 4);
  return <nav aria-label={t('navigation:navigation')} className="fixed inset-x-0 bottom-0 z-30 flex border-t border-gray-200 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden">{tabs.map(item => <Link key={item.id} to={item.to} aria-current={isNavigationActive(item, location) ? 'page' : undefined} className={cn('flex min-h-16 min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-2 text-base', isNavigationActive(item, location) ? 'text-brand' : 'text-gray-500')}><item.icon size={21} /><span className="max-w-full truncate">{t(item.label)}</span></Link>)}{items.length > tabs.length && <button type="button" onClick={() => setOpen(true)} className="flex min-h-16 flex-1 flex-col items-center justify-center gap-1 text-gray-500"><MoreHorizontal size={21} />{t('more')}</button>}</nav>;
}
