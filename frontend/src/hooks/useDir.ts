import { useTranslation } from 'react-i18next';
import type { Locale } from '../config/constants';
export function useDir() {
  const { i18n } = useTranslation();
  const locale: Locale = i18n.language === 'en' ? 'en' : 'fa';
  return { locale, dir: locale === 'fa' ? 'rtl' as const : 'ltr' as const, direction: locale === 'fa' ? -1 : 1 };
}
