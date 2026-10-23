import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { PanelLeftClose, PanelLeftOpen, MoreHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { create } from 'zustand';
import { useAuthStore } from '../../features/auth/store';
import { workspaceNavigation, isNavigationActive, type NavItem } from '../../config/nav';
import { cn } from '../../lib/cn';
import { IconButton } from '../ui/button';
import { Dropdown, Tooltip } from '../ui/overlays';
import { Brand } from './brand';
import { CourseNavigation } from './course-navigation';
import { storage } from '../../lib/storage';
interface UIState { collapsed: boolean; toggleSidebar: () => void }
export const useUIStore = create<UIState>(set => ({
  collapsed: storage.get('lms-sidebar-collapsed') === 'true',
  toggleSidebar: () => set(state => { storage.set('lms-sidebar-collapsed', String(!state.collapsed)); return { collapsed: !state.collapsed }; }),
}));
function NavItems({ items, compact = false, dark = false, onNavigate }: { items: NavItem[]; compact?: boolean; dark?: boolean; onNavigate?: () => void }) {
  const { t } = useTranslation(); const location = useLocation(); const user = useAuthStore(state => state.user);
  return <>{items.map(item => {
    const Icon = item.icon; const isActive = isNavigationActive(item, location);
    const link = <Link key={item.id} to={item.to} aria-current={isActive ? 'page' : undefined} onClick={onNavigate} aria-label={compact ? t(item.label) : undefined} className={cn('flex min-h-12 min-w-0 items-center gap-3 rounded-xl border-s-2 border-transparent px-3 py-3 font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand', isActive ? dark ? 'border-brand bg-brand/15 text-orange-200' : 'border-brand bg-orange-50 text-brand-action' : dark ? 'text-gray-300 hover:bg-white/5 hover:text-white' : 'text-gray-600 hover:bg-gray-100', compact && 'justify-center px-0')}><Icon size={21} className="shrink-0" aria-hidden="true" />{!compact && <span className="truncate">{t(item.label)}</span>}</Link>;
    const content = compact ? <Tooltip key={item.id} content={t(item.label)}>{link}</Tooltip> : link;
    return item.id === 'courses' && user?.role === 'student' ? <CourseNavigation key={item.id} trigger={content} dark={dark} compact={compact} onNavigate={onNavigate} /> : content;
  })}</>;
}
export function Sidebar() {
  const { t } = useTranslation(); const user = useAuthStore(state => state.user); const collapsed = useUIStore(state => state.collapsed); const toggle = useUIStore(state => state.toggleSidebar);
  if (!user) return null;
  return <aside className={cn('sticky top-0 hidden h-dvh shrink-0 flex-col border-e border-white/5 bg-ink py-4 transition-[width] duration-200 lg:flex', collapsed ? 'w-20 px-2' : 'w-60 px-4')}>
    <div className={cn('flex min-h-12 shrink-0 items-center gap-2', collapsed ? 'justify-center' : 'justify-between')}>
      {collapsed ? <div className="group/logo relative h-11 w-11"><Brand compact light showDescription={false} tabIndex={-1} className="pointer-events-none transition-opacity group-hover/logo:opacity-0 group-focus-within/logo:opacity-0" /><Tooltip content={t('expandSidebar')}><IconButton label={t('expandSidebar')} aria-expanded={false} aria-controls="desktop-navigation" onClick={toggle} className="absolute inset-0 bg-ink text-gray-200 opacity-0 transition-opacity hover:bg-white/10 hover:text-white focus-visible:opacity-100 group-hover/logo:opacity-100 group-focus-within/logo:opacity-100"><PanelLeftOpen size={20} className="rtl:rotate-180" /></IconButton></Tooltip></div> : <><Brand light showDescription={false} /><Tooltip content={t('collapseSidebar')}><IconButton label={t('collapseSidebar')} aria-expanded aria-controls="desktop-navigation" onClick={toggle} className="text-gray-400 hover:bg-white/10 hover:text-white"><PanelLeftClose size={20} className="rtl:rotate-180" /></IconButton></Tooltip></>}
    </div>
    <div className="my-4 h-px shrink-0 bg-white/10" />
    <nav id="desktop-navigation" aria-label={t('navigation:navigation')} tabIndex={0} className="sidebar-scroll min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain rounded-xl py-1 outline-none focus-visible:ring-2 focus-visible:ring-brand"><NavItems items={workspaceNavigation(user)} compact={collapsed} dark /></nav>
  </aside>;
}
export function MobileTabBar() {
  const user = useAuthStore(state => state.user); const { t } = useTranslation(); const location = useLocation(); const navigate = useNavigate();
  if (!user) return null;
  const items = workspaceNavigation(user); const tabs = items.filter(item => item.bottomTab).slice(0, 4);
  const more = items.filter(item => !tabs.some(tab => tab.id === item.id));
  return createPortal(<nav aria-label={t('navigation:navigation')} className="fixed inset-x-0 bottom-0 z-40 flex border-t border-gray-200 bg-white/95 min-h-[var(--mobile-tabs-height)] px-2 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-lg lg:hidden">{tabs.map(item => <Link key={item.id} to={item.to} aria-current={isNavigationActive(item, location) ? 'page' : undefined} className={cn('flex min-h-16 min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-2 text-base', isNavigationActive(item, location) ? 'text-brand' : 'text-gray-500')}><item.icon size={21} /><span className="max-w-full truncate">{t(item.label)}</span></Link>)}{more.length > 0 && <Dropdown side="top" modal={false} trigger={<button type="button" className="flex min-h-16 min-w-0 flex-1 flex-col items-center justify-center gap-1 text-gray-500"><MoreHorizontal size={21} aria-hidden="true" />{t('more')}</button>} items={more.map(item => ({ label: t(item.label), icon: <item.icon size={18} aria-hidden="true" />, onSelect: () => navigate(item.to) }))} />}</nav>, document.body);
}
