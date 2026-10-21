import { useEffect, useId, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { academicApi } from '../../api/endpoints/academic';
import { useAuthStore } from '../../features/auth/store';
import { useDir } from '../../hooks/useDir';
import { Button, IconButton } from '../ui/button';
import { cn } from '../../lib/cn';

export function CourseNavigation({ trigger, dark, compact, onNavigate }: { trigger: ReactNode; dark: boolean; compact: boolean; onNavigate?: () => void }) {
  const { t } = useTranslation(['academic', 'common']); const { locale } = useDir(); const location = useLocation();
  const user = useAuthStore(state => state.user); const id = useId();
  const [open, setOpen] = useState(location.pathname.startsWith('/courses'));
  useEffect(() => { if (location.pathname.startsWith('/courses')) setOpen(true); }, [location.pathname]);
  const query = useInfiniteQuery({ queryKey: ['semester-subjects', user?.id, locale], initialPageParam: 1, queryFn: ({ pageParam, signal }) => academicApi.courses({ page: pageParam, per_page: 10 }, signal), getNextPageParam: page => page.meta.current_page < page.meta.last_page ? page.meta.current_page + 1 : undefined, enabled: open && !compact && user?.role === 'student' });
  if (compact) return trigger;
  const rows = query.data?.pages.flatMap(page => page.data) ?? [];
  return <div><div className="flex items-center gap-1"><div className="min-w-0 flex-1">{trigger}</div><IconButton label={t('semesterSubjects')} aria-expanded={open} aria-controls={id} onClick={() => setOpen(value => !value)} className={dark ? 'text-gray-300 hover:bg-white/5 hover:text-white' : ''}><ChevronDown size={18} className={cn('transition-transform', open && 'rotate-180')} /></IconButton></div>
    {open && <div id={id} className={cn('ms-5 mt-2 space-y-1 border-s ps-3', dark ? 'border-white/15' : 'border-gray-200')}><p className={cn('py-2', dark ? 'text-gray-400' : 'text-gray-600')}>{t('currentSemester')}</p>{query.isPending ? <p role="status" className={dark ? 'text-gray-300' : 'text-gray-600'}>{t('common:loading')}</p> : query.isError ? <Button variant="secondary" onClick={() => void query.refetch()}>{t('common:retry')}</Button> : !rows.length ? <p className={dark ? 'text-gray-300' : 'text-gray-600'}>{t('noSemesterSubjects')}</p> : <ul>{rows.map(row => <li key={row.id}><Link to={`/courses/${row.id}?tab=weeks`} onClick={onNavigate} aria-current={location.pathname === `/courses/${row.id}` ? 'page' : undefined} className={cn('block min-h-11 rounded-lg px-2 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand', location.pathname === `/courses/${row.id}` ? dark ? 'bg-brand/15 text-orange-200' : 'bg-orange-50 text-brand-action' : dark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-50')}><span className="block truncate" title={row.course.name[locale]}>{row.course.name[locale]}</span><span className={cn('mt-1 block truncate', dark ? 'text-gray-400' : 'text-gray-500')} title={row.teacher.name}>{row.course.code} · {row.teacher.name}</span></Link></li>)}</ul>}{query.hasNextPage && <Button variant="secondary" className="w-full" loading={query.isFetchingNextPage} onClick={() => void query.fetchNextPage()}>{t('common:loadMore')}</Button>}</div>}
  </div>;
}
