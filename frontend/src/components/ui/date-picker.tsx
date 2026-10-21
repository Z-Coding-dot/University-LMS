import DatePickerPrimitive, { DateObject } from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import gregorian from 'react-date-object/calendars/gregorian';
import persianFa from 'react-date-object/locales/persian_fa';
import gregorianEn from 'react-date-object/locales/gregorian_en';
import { useDir } from '../../hooks/useDir';
import { AFGHAN_MONTHS, parseISO, toISODate } from '../../lib/date';
import { Input } from './fields';
export function DatePicker({ value, onChange, label, id, disabled, weekendDays = [5], ...aria }: { value: string | null; onChange: (iso: string | null) => void; label: string; id?: string; disabled?: boolean; weekendDays?: number[]; 'aria-invalid'?: boolean; 'aria-describedby'?: string }) {
  const { locale, dir } = useDir();
  // Construct date-only values from calendar fields, never a timezone-shifted instant.
  if (value) parseISO(value);
  const parts = value?.slice(0, 10).split('-').map(Number);
  const selected = parts ? new DateObject({ year: parts[0], month: parts[1], day: parts[2], calendar: gregorian }).convert(locale === 'fa' ? persian : gregorian) : null;
  return <div dir={dir} className="date-picker"><DatePickerPrimitive
    key={locale} value={selected}
    calendar={locale === 'fa' ? persian : gregorian} locale={locale === 'fa' ? persianFa : gregorianEn}
    months={locale === 'fa' ? AFGHAN_MONTHS : undefined} weekStartDayIndex={0}
    format="YYYY/MM/DD" disabled={disabled} calendarPosition="bottom-center" portal
    mapDays={({ date }) => weekendDays.includes(((date.toDate().getDay() + 6) % 7) + 1) ? { className: 'calendar-weekend' } : {}}
    onChange={date => onChange(date ? toISODate(date.toDate()) : null)}
    render={(display, openCalendar) => <Input id={id} aria-label={label} {...aria} readOnly disabled={disabled} value={display} onClick={openCalendar} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openCalendar(); } if (event.key === 'Backspace' || event.key === 'Delete') onChange(null); }} />}
  /></div>;
}
