import { useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDir } from '../../hooks/useDir';
import { WEEKDAYS } from '../../config/constants';
import type { TimetableSlot } from '../../api/types';
import { Card } from '../ui/surfaces';
import { cn } from '../../lib/cn';
import { formatNumber } from '../../lib/number';
import { isoWeekday } from '../../lib/date';
import { useMediaQuery } from '../../hooks/useMediaQuery';
export interface TimetableItem extends TimetableSlot { title: string; teacher?: string }
export function WeekTimetable({ slots, weekendDays = [5] }: { slots: TimetableItem[]; weekendDays?: number[] }) {
  const { t } = useTranslation(); const { locale, direction } = useDir();
  const id = useId(); const buttons = useRef(new Map<number, HTMLButtonElement>()); const desktop = useMediaQuery('(min-width: 768px)');
  const days = locale === 'fa' ? [6, 7, 1, 2, 3, 4, 5] : [...WEEKDAYS];
  const [day, setDay] = useState(isoWeekday);
  const time = (value: string) => value.split(':').map(part => formatNumber(Number(part), locale, { minimumIntegerDigits: 2, useGrouping: false })).join(':');
  return <div className="space-y-4"><div className="flex gap-1 overflow-x-auto md:hidden" role="tablist" aria-label={t('date')}>{days.map(value => <button type="button" role="tab" aria-selected={day === value} aria-controls={`${id}-panel-${value}`} id={`${id}-day-${value}`} tabIndex={day === value ? 0 : -1} ref={element => { if (element) buttons.current.set(value, element); else buttons.current.delete(value); }} onKeyDown={event => { const index = days.indexOf(value); const step = event.key === "ArrowRight" ? direction : event.key === "ArrowLeft" ? -direction : 0; const next = event.key === "Home" ? days[0] : event.key === "End" ? days.at(-1)! : step ? days[(index + step + days.length) % days.length] : undefined; if (next !== undefined) { event.preventDefault(); setDay(next); buttons.current.get(next)?.focus(); } }} key={value} onClick={() => setDay(value)} className={cn('min-h-11 shrink-0 rounded-xl px-3', value === day ? 'bg-brand-action text-white' : 'bg-white text-gray-600')}>{t(`weekdays.${value}`)}</button>)}</div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{days.map(value => <section id={`${id}-panel-${value}`} role={desktop ? undefined : "tabpanel"} aria-labelledby={desktop ? undefined : `${id}-day-${value}`} tabIndex={desktop ? undefined : 0} key={value} className={cn('min-w-0', day !== value && 'hidden md:block')}><Card className="h-full p-4"><h3 className="font-semibold">{t(`weekdays.${value}`)}</h3>{weekendDays.includes(value) && <p className="mt-1 text-gray-500">{t('weekend')}</p>}<div className="mt-4 space-y-3">{slots.filter(slot => slot.weekday === value).sort((a, b) => a.start.localeCompare(b.start)).map(slot => <div key={slot.id} className="rounded-xl border-s-4 border-brand bg-orange-50 p-3"><p className="font-medium">{slot.title}</p><p className="mt-1 text-gray-600"><bdi>{time(slot.start)} – {time(slot.end)}</bdi></p><p className="text-gray-600">{t('room', { room: slot.room })}</p>{slot.teacher && <p className="text-gray-600">{slot.teacher}</p>}</div>)}{!slots.some(slot => slot.weekday === value) && <p className="text-gray-500">{t('noClasses')}</p>}</div></Card></section>)}</div></div>;
}
