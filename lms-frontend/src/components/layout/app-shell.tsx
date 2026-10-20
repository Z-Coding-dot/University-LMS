import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../features/auth/store';
import { cn } from '../../lib/cn';
import { MobileDrawer, MobileTabBar, Sidebar } from './navigation';
import { Topbar } from './topbar';
import { PageTransition } from '../ui/surfaces';
export function AppShell() {
  const user = useAuthStore(state => state.user); const { t } = useTranslation(); const location = useLocation();
  return <div className="flex min-h-dvh bg-canvas"><a href="#main-content" className="fixed start-4 top-4 z-[100] -translate-y-24 rounded-xl bg-brand p-3 text-white focus:translate-y-0">{t('skipToContent')}</a><Sidebar /><div className="min-w-0 flex-1"><Topbar /><main id="main-content" tabIndex={-1} className={cn('mx-auto w-full max-w-[1440px] p-4 outline-none sm:p-6 lg:p-8', user?.role !== 'admin' && 'pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-8')}><PageTransition key={location.pathname}><Outlet /></PageTransition></main></div><MobileTabBar /><MobileDrawer /></div>;
}
