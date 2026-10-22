import type { ReactNode } from 'react';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Input } from '../ui/fields';
export function FilterBar({ search, onSearchChange, children }: { search: string; onSearchChange: (value: string) => void; children?: ReactNode }) {
  const { t } = useTranslation();
  return <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"><div className="relative w-full min-w-0 sm:flex-1 sm:basis-52"><Search size={15} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" /><Input type="search" value={search} onChange={event => onSearchChange(event.target.value)} placeholder={t('search')} aria-label={t('search')} className="ps-9 pe-3" /></div>{children && <div className="w-full min-w-0 sm:w-auto sm:max-w-72 sm:flex-1">{children}</div>}</div>;
}
