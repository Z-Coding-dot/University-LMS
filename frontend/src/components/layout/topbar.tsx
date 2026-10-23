import { useState } from 'react';
import { ChevronDown, Bell, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../features/auth/store';
import { useLogout } from '../../features/auth/hooks/useAuth';
import { IconButton, Button } from '../ui/button';
import { Avatar, EmptyState } from '../ui/surfaces';
import { Dialog, Dropdown, Popover } from '../ui/overlays';
import { UserCell } from '../shared/identity';
import type { DashboardAnnouncement } from '../../api/types/dashboard';
import { LanguageSwitcher } from '../shared/language-switcher';
import { visibleNavigation } from '../../config/nav';
import { useDashboard } from '../../features/dashboard/hooks/useDashboard';
import { formatDate } from '../../lib/date';
import { useDir } from '../../hooks/useDir';
export function Topbar() {
  const { t } = useTranslation(); const { locale } = useDir();
  const navigate = useNavigate(); const user = useAuthStore(state => state.user);
  const logout = useLogout();
  const dashboard = useDashboard(false); const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [announcement, setAnnouncement] = useState<DashboardAnnouncement | null>(null);
  if (!user) return null;
  return <header className="sticky top-0 z-20 flex min-h-20 items-center justify-between gap-3 border-b border-gray-200/70 bg-white/95 px-4 pb-3 pt-[max(.75rem,env(safe-area-inset-top))] backdrop-blur-xl sm:px-6 lg:px-8">
    <div className="flex min-w-0 items-center gap-3"><div className="min-w-0"><p className="truncate text-lg font-semibold tracking-tight lg:text-xl">{t('dashboard:welcome', { name: user.name })}</p><p className="hidden text-gray-500 sm:block">{t(`roles.${user.role}`)}</p></div></div>
    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
      <span className="lg:hidden"><LanguageSwitcher compact /></span><span className="hidden lg:block"><LanguageSwitcher /></span>
      <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen} trigger={<IconButton label={t('dashboard:notifications')} className="relative"><Bell size={21} className="text-gray-600" />{(dashboard.data?.announcements.length ?? 0) > 0 && <span aria-hidden="true" className="absolute end-2 top-2 h-2 w-2 rounded-full bg-brand ring-2 ring-white" />}</IconButton>}>
        <h2 className="mb-3 font-semibold">{t('dashboard:notifications')}</h2>
        {dashboard.data?.announcements.length ? <div className="max-h-80 overflow-y-auto">{dashboard.data.announcements.map(item => <button type="button" key={item.id} onClick={() => { setNotificationsOpen(false); setAnnouncement(item); }} className="block min-h-11 w-full border-b border-gray-100 py-3 text-start last:border-0"><span className="block font-medium">{item.title}</span><span className="mt-1 block text-gray-500">{formatDate(item.created_at, locale)}</span></button>)}</div> : dashboard.isPending ? <p role="status" className="py-4 text-gray-500">{t('loading')}</p> : <EmptyState title={t(dashboard.isError ? 'errorTitle' : 'dashboard:noAnnouncements')} description={t(dashboard.isError ? 'errorDescription' : 'dashboard:noAnnouncementsDescription')} />}
      </Popover>
      <Dropdown header={<div className="space-y-2"><UserCell name={user.name} secondary={t(`roles.${user.role}`)} /><bdi className="block break-all text-gray-500">{user.email}</bdi></div>} trigger={<Button variant="ghost" className="px-1 sm:px-2" aria-label={t('navigation:account')}><Avatar name={user.name} className="rounded-full" /><ChevronDown size={16} className="hidden sm:block" /></Button>} items={[...visibleNavigation(user).filter(item => item.accountOnly).map(item => ({ icon: <item.icon size={16} aria-hidden="true" />, label: t(item.label), onSelect: () => navigate(item.to) })), { icon: <LogOut size={16} aria-hidden="true" />, label: t('signOut'), onSelect: () => logout.mutate(), disabled: logout.isPending, danger: true }]} />
    </div>
    <Dialog title={announcement?.title ?? t('dashboard:announcements')} description={announcement?.author_name} open={!!announcement} onOpenChange={open => { if (!open) setAnnouncement(null); }}><p className="whitespace-pre-wrap text-gray-600">{announcement?.body}</p></Dialog>
  </header>;
}
