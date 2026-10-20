import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Input } from '../../../components/ui/fields';
import { useDashboardFilters } from '../hooks/useDashboard';

export function DashboardSearch() {
  const { t } = useTranslation('dashboard'); const { search, setSearch } = useDashboardFilters();
  return <div className="relative min-w-0"><Search size={18} aria-hidden="true" className="pointer-events-none absolute start-3 top-3.5 text-gray-400" /><Input type="search" value={search} onChange={event => setSearch(event.target.value)} maxLength={200} placeholder={t('search')} aria-label={t('search')} className="rounded-full border-gray-200 bg-gray-50/60 ps-10" /></div>;
}
