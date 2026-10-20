import { describe, expect, it } from 'vitest';
import { formatNumber, normalizeDigits } from './number';
describe('number localization', () => {
  it('normalizes mixed Persian and Arabic digits and separators', () => {
    expect(normalizeDigits('ST-۰۱۲٣٤٥۶۷۸۹')).toBe('ST-0123456789');
    expect(normalizeDigits('۱٬۲۳۴٫۵')).toBe('1234.5');
  });
  it('keeps passwords and nonnumeric text untouched', () => expect(normalizeDigits('abc-12')).toBe('abc-12'));
  it('displays locale-specific digits', () => {
    expect(formatNumber(123, 'fa', { useGrouping: false })).toBe('۱۲۳');
    expect(formatNumber(123, 'en')).toBe('123');
  });
});
