import type { ReactNode } from 'react';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Input } from '../ui/fields';
export function FilterBar({ search, onSearchChange, children }: { search: string; onSearchChange: (value: string) => void; children?: ReactNode }) {
  const { t } = useTranslation();
  return <div className="flex flex-col gap-3 sm:flex-row sm:items-center"><div className="relative min-w-0 flex-1"><Search size={18} className="pointer-events-none absolute start-3 top-3.5 text-gray-400" aria-hidden="true" /><Input type="search" value={search} onChange={event => onSearchChange(event.target.value)} placeholder={t('search')} aria-label={t('search')} className="ps-10" /></div>{children}</div>;
}
