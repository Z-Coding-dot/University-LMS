import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { appConfig } from '../../config/app';
import { useDir } from '../../hooks/useDir';
import { cn } from '../../lib/cn';
export function Brand({ compact = false, light = false, link = '/', showDescription = true }: { compact?: boolean; light?: boolean; link?: string; showDescription?: boolean }) {
  const { locale } = useDir(); const { t } = useTranslation();
  return <Link to={link} aria-label={appConfig.name[locale]} className="flex min-h-11 min-w-0 items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-brand"><img src={appConfig.logo} alt="" width={44} height={44} className="shrink-0" />{!compact && <span className="min-w-0"><span className={cn('block truncate text-2xl font-semibold tracking-tight', light ? 'text-white' : 'text-ink')}>{appConfig.name[locale]}</span>{showDescription && <span className={cn('block text-base', light ? 'text-gray-400' : 'text-gray-500')}>{t('appDescription')}</span>}</span>}</Link>;
}
