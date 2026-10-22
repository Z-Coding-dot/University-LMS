import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { DashboardCourse } from '../../../api/types/dashboard';
import type { Role } from '../../../config/constants';
import { ProgressRing, EmptyState } from '../../../components/ui/surfaces';
import { IconButton, buttonStyles } from '../../../components/ui/button';
import { useDir } from '../../../hooks/useDir';
import { formatNumber, normalizeDigits } from '../../../lib/number';
import { cn } from '../../../lib/cn';
import { DashboardPanel } from './dashboard-panel';
import { useDashboardFilters } from '../hooks/useDashboard';

export function CourseProgress({ courses, role }: { courses: DashboardCourse[]; role: Role }) {
  const { t } = useTranslation(['dashboard', 'common']); const { locale } = useDir();
  const { search, offeringId, setOfferingId } = useDashboardFilters(); const [page, setPage] = useState(0);
  const filtered = courses.filter(course => normalizeDigits(`${course.name[locale]} ${course.code}`).toLocaleLowerCase().includes(normalizeDigits(search).trim().toLocaleLowerCase()));
  const pages = Math.max(1, Math.ceil(filtered.length / 4)); const activePage = Math.min(page, pages - 1);
  const shown = filtered.slice(activePage * 4, (activePage + 1) * 4);
  return <DashboardPanel id="courses" title={t('courseProgress')} description={t('courseProgressDescription')} action={filtered.length > 4 ? <div className="flex gap-1"><IconButton label={t('common:previous')} disabled={activePage === 0} onClick={() => setPage(activePage - 1)}><ChevronLeft className="rtl:rotate-180" size={18} /></IconButton><IconButton label={t('common:next')} disabled={activePage >= pages - 1} onClick={() => setPage(activePage + 1)}><ChevronRight className="rtl:rotate-180" size={18} /></IconButton></div> : undefined}>
    {!shown.length ? <EmptyState title={search ? t('common:noResults') : t('noCourses')} description={search ? t('common:noResultsDescription') : t('noCoursesDescription')} /> : <div className={cn('grid grid-cols-2 gap-3', shown.length === 3 ? 'sm:grid-cols-3' : shown.length > 3 && 'xl:grid-cols-4')}>
      {shown.map(course => <button key={course.id} type="button" aria-pressed={offeringId === course.id} onClick={() => setOfferingId(offeringId === course.id ? undefined : course.id)} className={cn('hover-lift flex min-w-0 flex-col items-center rounded-2xl border border-transparent px-2 py-4 text-center transition-colors hover:bg-orange-50/60', offeringId === course.id && 'border-orange-200 bg-orange-50/70')}>
        {course.attendance_percent === null ? <span className="flex h-24 w-24 items-center justify-center rounded-full border-[7px] border-gray-100 text-gray-500">{t('notAvailable')}</span> : <ProgressRing value={course.attendance_percent} label={`${t('common:attendance')} · ${course.name[locale]}`} />}
        <bdi className="mt-4 font-semibold text-ink">{course.code}</bdi><span className="mt-1 text-gray-600">{course.name[locale]}</span>
        <span className="mt-2 text-gray-500">{t(role === 'student' ? 'sessionsCount' : 'studentsCount', { value: formatNumber(role === 'student' ? course.sessions : course.students, locale) })}</span>
      </button>)}
    </div>}
    {offeringId && filtered.some(course => course.id === offeringId) && <Link to={`/courses/${offeringId}`} className={cn(buttonStyles({ variant: 'secondary' }), 'mt-4 w-full')}>{t('academic:openCourse')} · {filtered.find(course => course.id === offeringId)?.name[locale]}</Link>}
  </DashboardPanel>;
}
