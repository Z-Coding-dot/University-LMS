import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, Clock3, MapPin, Megaphone, UserRound } from 'lucide-react';
import type { DashboardAnnouncement, DashboardGrade, DashboardSummary } from '../../../api/types/dashboard';
import { Avatar, Badge, EmptyState } from '../../../components/ui/surfaces';
import { Dialog } from '../../../components/ui/overlays';
import { useDir } from '../../../hooks/useDir';
import { formatDate } from '../../../lib/date';
import { formatNumber } from '../../../lib/number';
import { DashboardPanel } from './dashboard-panel';

export function TodaySchedule({ data }: { data: DashboardSummary }) {
  const { t } = useTranslation(['dashboard', 'common']); const { locale } = useDir();
  const time = (value: string) => value.split(':').map(part => formatNumber(Number(part), locale, { minimumIntegerDigits: 2, useGrouping: false })).join(':');
  return <DashboardPanel id="schedule" title={t('todaySchedule')} description={formatDate(data.as_of, locale)}>
    {!data.today.length ? <EmptyState title={t('common:noClasses')} description={t('noClassesDescription')} /> : <div className="divide-y divide-gray-100">{data.today.map(slot => <article key={slot.id} className="py-5 first:pt-0"><p className="flex items-center gap-2 font-semibold text-ink"><Clock3 size={19} className="shrink-0 text-brand" /><bdi>{time(slot.start)} – {time(slot.end)}</bdi></p><h3 className="mt-3 font-medium">{slot.course[locale]}</h3><p className="mt-2 flex items-center gap-2 text-gray-500"><MapPin size={16} className="shrink-0" />{t('common:room', { room: slot.room })}</p><p className="mt-1 flex items-center gap-2 text-gray-500"><UserRound size={16} className="shrink-0" />{slot.teacher}</p></article>)}<p className="pt-5 text-center text-gray-400">{t('scheduleEnd')}</p></div>}
  </DashboardPanel>;
}

export function LatestGrades({ grades, role }: { grades: DashboardGrade[]; role: DashboardSummary['role'] }) {
  const { t } = useTranslation(['dashboard', 'common']); const { locale } = useDir();
  const [selected, setSelected] = useState<DashboardGrade | null>(null);
  return <DashboardPanel id="grades" title={t(role === 'admin' ? 'recentAcademicActivity' : 'latestGrades')} description={t('latestGradesDescription')}>
    {!grades.length ? <EmptyState title={t('noGrades')} description={t('noGradesDescription')} /> : <div className="divide-y divide-gray-100">{grades.map(grade => <button type="button" key={grade.id} onClick={() => setSelected(grade)} className="block min-h-11 w-full rounded-lg py-4 text-start first:pt-0 hover:bg-gray-50"><div className="flex items-start justify-between gap-3"><span className="flex items-center gap-2 font-medium"><BookOpen size={18} className="shrink-0 text-brand" />{grade.component[locale]}</span><span className="shrink-0 rounded-lg bg-orange-50 px-2 py-1 font-semibold text-orange-800"><bdi>{formatNumber(grade.score, locale)} / {formatNumber(grade.max_score, locale)}</bdi></span></div><p className="mt-2 text-gray-500">{grade.course[locale]}</p>{role !== 'student' && <p className="mt-1 text-gray-500">{grade.student_name}</p>}<p className="mt-1 text-gray-400">{formatDate(grade.updated_at, locale)}</p></button>)}</div>}
    <Dialog title={selected?.component[locale] ?? t('latestGrades')} description={selected?.course[locale]} open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}>{selected && <div className="space-y-4">{role !== 'student' && <p className="font-medium">{selected.student_name}</p>}<p className="text-3xl font-semibold text-brand"><bdi>{formatNumber(selected.score, locale)} / {formatNumber(selected.max_score, locale)}</bdi></p><Badge tone="success">{t(`common:statuses.${selected.status}`)}</Badge><h3 className="font-medium">{t('feedback')}</h3><p className="whitespace-pre-wrap text-gray-600">{selected.feedback ?? t('noFeedback')}</p></div>}</Dialog>
  </DashboardPanel>;
}

export function AnnouncementPanel({ announcements }: { announcements: DashboardAnnouncement[] }) {
  const { t } = useTranslation('dashboard'); const { locale } = useDir();
  const [selected, setSelected] = useState<DashboardAnnouncement | null>(null);
  return <DashboardPanel id="announcements" title={t('announcements')} description={t('announcementsDescription')} action={<Megaphone size={21} className="text-brand" aria-hidden="true" />}>
    {!announcements.length ? <EmptyState title={t('noAnnouncements')} description={t('noAnnouncementsDescription')} /> : <div className="divide-y divide-gray-100">{announcements.map(item => <button key={item.id} type="button" onClick={() => setSelected(item)} className="flex min-h-11 w-full gap-4 rounded-lg py-5 text-start first:pt-0 hover:bg-gray-50"><Avatar name={item.author_name} className="rounded-full" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{item.title}</h3><span className="text-gray-400">{formatDate(item.created_at, locale)}</span></div><p className="mt-1 text-gray-500">{item.author_name}</p><p className="mt-3 line-clamp-2 text-gray-600">{item.body}</p></div></button>)}</div>}
    <Dialog title={selected?.title ?? t('announcements')} description={selected ? `${selected.author_name} · ${formatDate(selected.created_at, locale)}` : undefined} open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}><p className="whitespace-pre-wrap leading-relaxed text-gray-600">{selected?.body}</p></Dialog>
  </DashboardPanel>;
}
