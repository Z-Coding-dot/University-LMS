import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useReducedMotion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Card, EmptyState } from '../../../components/ui/surfaces';
import { useDir } from '../../../hooks/useDir';
import { formatNumber } from '../../../lib/number';
import type { DashboardSummary } from '../../../api/types/dashboard';

export function GradeChart({ data }: { data: DashboardSummary['grade_distribution'] }) {
  const { t } = useTranslation('dashboard'); const { locale, dir } = useDir(); const reduced = useReducedMotion();
  return <Card className="min-w-0"><h2 className="text-xl font-semibold">{t('studentGradesChart')}</h2><p className="mt-1 text-gray-500">{t('studentGradesChartDescription')}</p>{!data?.length ? <EmptyState title={t('noCompleteGrades')} /> : <>
    <div className="mt-5 h-64 w-full" role="img" aria-label={t('studentGradesChart')}><ResponsiveContainer width="100%" height="100%"><BarChart data={data} accessibilityLayer margin={{ top: 8, right: 12, left: 0, bottom: 8 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" reversed={dir === 'rtl'} tick={{ fontSize: 11 }} tickLine={false} interval={0} /><YAxis orientation={dir === 'rtl' ? 'right' : 'left'} allowDecimals={false} width={40} tickFormatter={value => formatNumber(Number(value), locale)} /><Tooltip formatter={(value: number) => [formatNumber(value, locale), t('gradeResults')]} /><Bar dataKey="students" name={t('gradeResults')} fill="#FF6B00" radius={[4, 4, 0, 0]} isAnimationActive={!reduced} /></BarChart></ResponsiveContainer></div>
    <details><summary className="min-h-11 cursor-pointer py-2 text-gray-600">{t('gradeResults')}</summary><ul className="space-y-1">{data.map(bucket => <li key={bucket.label}><bdi>{bucket.label}</bdi>: {formatNumber(bucket.students, locale)}</li>)}</ul></details>
  </>}</Card>;
}
