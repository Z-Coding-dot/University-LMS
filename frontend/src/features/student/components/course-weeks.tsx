import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { COURSE_WEEKS } from '../../../config/constants';
import { formatNumber } from '../../../lib/number';
import { useDir } from '../../../hooks/useDir';
import { Card } from '../../../components/ui/surfaces';
import { Select } from '../../../components/ui/fields';
import { Lectures } from '../../teacher/components/lectures';
import { Assignments } from '../../teacher/components/assignments';
export function CourseWeeks({ offeringId }: { offeringId: number }) {
  const { t } = useTranslation('academic'); const { locale } = useDir(); const [params, setParams] = useSearchParams();
  const requested = Number(params.get('week')); const week = COURSE_WEEKS.includes(requested) ? requested : 1;
  return <div className="space-y-6"><Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-semibold">{t('weeklyLearning')}</h2><p className="mt-1 text-gray-600">{t('weeksDescription')}</p></div><div className="w-full sm:w-52"><Select aria-label={t('week')} value={String(week)} onValueChange={value => setParams(previous => { previous.set('week', value); return previous; }, { replace: true })} options={COURSE_WEEKS.map(value => ({ value: String(value), label: t('weekNumber', { value: formatNumber(value, locale) }) }))} /></div></Card>
    <section aria-label={t('lectures')} className="space-y-4"><h2 className="text-xl font-semibold">{t('lectures')}</h2><Lectures key={`${offeringId}-${week}`} offeringId={offeringId} week={week} /></section>
    <section aria-label={t('assignments')} className="space-y-4"><h2 className="text-xl font-semibold">{t('assignments')}</h2><Assignments key={`${offeringId}-${week}`} offeringId={offeringId} weekNumber={week} /></section>
  </div>;
}
