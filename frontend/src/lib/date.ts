import type { Locale } from '../config/constants';
import { appConfig } from '../config/app';

export const AFGHAN_MONTHS = ['حمل', 'ثور', 'جوزا', 'سرطان', 'اسد', 'سنبله', 'میزان', 'عقرب', 'قوس', 'جدی', 'دلو', 'حوت'];

export function calendarDay(date: Date, timeZone = appConfig.timezone): string {
  const parts = new Intl.DateTimeFormat('en', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const part = (type: string) => parts.find(item => item.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function parseISO(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}.*(?:Z|[+-]\d{2}:\d{2}))?$/.test(value)) throw new RangeError('Invalid ISO date');
  const date = new Date(value.length === 10 ? `${value}T12:00:00Z` : value);
  if (Number.isNaN(date.getTime())) throw new RangeError('Invalid ISO date');
  const calendarDay = new Date(`${value.slice(0, 10)}T12:00:00Z`);
  if (calendarDay.toISOString().slice(0, 10) !== value.slice(0, 10)) throw new RangeError('Invalid calendar date');
  return date;
}

export function isoWeekday(date = new Date()): number {
  return ((parseISO(calendarDay(date)).getUTCDay() + 6) % 7) + 1;
}

export function formatDate(value: string, locale: Locale): string {
  const date = parseISO(value);
  const language = locale === 'fa' ? 'fa-AF-u-ca-persian-nu-arabext' : 'en-US';
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric', timeZone: appConfig.timezone };
  if (locale === 'en') return new Intl.DateTimeFormat(language, options).format(date);
  const month = Number(new Intl.DateTimeFormat('en-u-ca-persian', { month: 'numeric', timeZone: appConfig.timezone }).format(date));
  return new Intl.DateTimeFormat(language, options).formatToParts(date)
    .map(part => part.type === 'month' ? AFGHAN_MONTHS[month - 1] : part.value).join('');
}

// Calendar selections represent a day, not a UTC timestamp. Avoid toISOString shifts.
export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
