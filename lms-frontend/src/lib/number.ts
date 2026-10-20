import type { Locale } from '../config/constants';

export function normalizeDigits(value: string): string {
  return value.replace(/[۰-۹٠-٩]/g, digit => String(digit.charCodeAt(0) - (digit >= '۰' ? 0x6f0 : 0x660)))
    .replace(/٫/g, '.').replace(/٬/g, '');
}

export function formatNumber(value: number, locale: Locale, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(locale === 'fa' ? 'fa-AF-u-nu-arabext' : 'en', options).format(value);
}
