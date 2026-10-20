import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { t, i18n } = useTranslation(); const next = i18n.language === 'en' ? 'fa' : 'en';
  return <Button variant="secondary" size={compact ? 'icon' : 'default'} className="shrink-0" aria-label={`${t('language')}: ${t(`languages.${next}`)}`} title={`${t('language')}: ${t(`languages.${next}`)}`} onClick={() => void i18n.changeLanguage(next)}><Languages size={18} aria-hidden="true" /><span className={compact ? 'sr-only' : undefined} lang={next === 'fa' ? 'fa-AF' : 'en'}>{t(`languages.${next}`)}</span></Button>;
}
