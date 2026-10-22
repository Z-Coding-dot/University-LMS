import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { COURSE_WEEKS } from '../../../config/constants';
import { academicApi } from '../../../api/endpoints/academic';
import { useAcademicQuery } from '../../../hooks/useAcademic';
import { useAuthStore } from '../../auth/store';
import { can, PERMISSIONS } from '../../../lib/permissions';
import { formatNumber } from '../../../lib/number';
import { useDir } from '../../../hooks/useDir';
import { Badge, Card } from '../../../components/ui/surfaces';
import { Accordion } from '../../../components/ui/disclosure';
import { Select } from '../../../components/ui/fields';
import { Button } from '../../../components/ui/button';
import { QueryState } from '../../../components/shared/query-state';
import { Lectures } from '../../teacher/components/lectures';
import { Assignments } from '../../teacher/components/assignments';
import { AnnouncementsPage } from '../../announcements/pages/announcements-page';

function WeekContent({ offeringId, week }: { offeringId: number; week: number }) {
  const { t } = useTranslation('academic');
  return <div className="space-y-6 pt-3">
    <section aria-label={t('weekNotices')} className="space-y-3"><h3 className="font-semibold text-ink">{t('weekNotices')}</h3><AnnouncementsPage offeringId={offeringId} weekNumber={week} embedded /></section>
    <section aria-label={t('lectures')} className="space-y-3"><h3 className="font-semibold text-ink">{t('lectures')}</h3><Lectures offeringId={offeringId} week={week} /></section>
    <section aria-label={t('assignments')} className="space-y-3"><h3 className="font-semibold text-ink">{t('assignments')}</h3><Assignments offeringId={offeringId} weekNumber={week} /></section>
  </div>;
}

export function CourseWeeks({ offeringId }: { offeringId: number }) {
  const { t } = useTranslation('academic'); const { locale } = useDir(); const [params, setParams] = useSearchParams();
  const user = useAuthStore(state => state.user);
  const query = useAcademicQuery(['course-weeks', offeringId], () => academicApi.weeks(offeringId));
  const currentWeek = query.data?.current_week;
  const requested = params.get('week');
  const selected = requested === 'all' ? 'all' : COURSE_WEEKS.includes(Number(requested)) ? requested! : String(currentWeek ?? 'all');
  const select = (value: string) => setParams(previous => { previous.set('week', value); return previous; }, { replace: true });
  const label = (week: number) => t('weekNumber', { value: formatNumber(week, locale) });
  return <QueryState pending={query.isPending} error={query.error} retry={query.refetch}>{query.data && <div className="space-y-5">
    <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-semibold">{t('weeklyLearning')}</h2><p className="mt-1 text-gray-600">{t('weeksDescription')}</p>{currentWeek && <Button variant="ghost" className="mt-1 px-0" onClick={() => select(String(currentWeek))}>{t('currentWeekLabel', { week: label(currentWeek) })}</Button>}</div><div className="w-full min-w-0 sm:w-52"><Select aria-label={t('week')} value={selected} onValueChange={select} options={[{ value: 'all', label: t('allWeeks') }, ...COURSE_WEEKS.map(week => ({ value: String(week), label: `${label(week)}${week === currentWeek ? ` · ${t('currentWeek')}` : ''}` }))]} /></div></Card>
    {(query.data.course_announcement_count > 0 || can(user, PERMISSIONS.postAnnouncements)) && <section className="space-y-3" aria-label={t('courseNotices')}><h2 className="font-semibold">{t('courseNotices')}</h2><AnnouncementsPage offeringId={offeringId} courseWide embedded /></section>}
    {selected === 'all' ? <Accordion key={`all-${offeringId}`} defaultValue={[String(currentWeek ?? query.data.weeks.find(week => week.lecture_count + week.assignment_count + week.announcement_count > 0)?.week_number ?? 1)]} items={query.data.weeks.map(week => ({ value: String(week.week_number), className: week.week_number === currentWeek ? 'rounded-xl bg-orange-50/60 px-3 ring-1 ring-inset ring-orange-200' : undefined,
      title: <span className="flex flex-wrap items-center gap-x-3 gap-y-1"><span>{label(week.week_number)}</span>{week.week_number === currentWeek && <Badge tone="brand">{t('currentWeek')}</Badge>}<span className="font-normal text-gray-500">{t('weekContentCounts', { lectures: formatNumber(week.lecture_count, locale), assignments: formatNumber(week.assignment_count, locale), notices: formatNumber(week.announcement_count, locale) })}</span></span>,
      content: <WeekContent offeringId={offeringId} week={week.week_number} /> }))} /> : <Card className={Number(selected) === currentWeek ? 'border-orange-200' : ''}><div className="flex items-center gap-3"><h2 className="font-semibold">{label(Number(selected))}</h2>{Number(selected) === currentWeek && <Badge tone="brand">{t('currentWeek')}</Badge>}</div><WeekContent key={`${offeringId}-${selected}`} offeringId={offeringId} week={Number(selected)} /></Card>}
  </div>}</QueryState>;
}
