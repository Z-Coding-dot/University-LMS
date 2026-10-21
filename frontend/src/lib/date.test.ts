import { describe, expect, it } from 'vitest';
import { AFGHAN_MONTHS, formatDate, parseISO, toISODate } from './date';
describe('calendar boundary', () => {
  it('uses Afghan Solar Hijri month names and Persian digits', () => {
    expect(formatDate('2026-03-21', 'fa')).toContain('حمل');
    expect(formatDate('2026-03-21', 'fa')).toContain('۱۴۰۵');
    expect(formatDate('2026-10-20', 'fa')).toContain('میزان');
    expect(AFGHAN_MONTHS).toHaveLength(12);
  });
  it('uses Gregorian dates in English', () => expect(formatDate('2026-10-20', 'en')).toBe('October 20, 2026'));
  it('formats timestamp instants in Kabul time', () => expect(formatDate('2026-03-20T23:00:00Z', 'en')).toBe('March 21, 2026'));
  it('rejects invalid dates and timezone-ambiguous timestamps', () => {
    for (const value of ['bad', '2026-02-30', '2026-02-30T12:00:00Z', '2026-03-21T12:00:00']) expect(() => parseISO(value)).toThrow(RangeError);
  });
  it('emits a calendar day without UTC conversion', () => expect(toISODate(new Date(2026, 2, 21))).toBe('2026-03-21'));
});
