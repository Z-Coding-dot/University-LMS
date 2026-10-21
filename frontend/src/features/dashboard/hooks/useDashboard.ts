import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../auth/store';
import { dashboardApi } from '../../../api/endpoints/dashboard';
import { useDir } from '../../../hooks/useDir';
import { useDebounce } from '../../../hooks/useDebounce';
import { requiresPasswordChange } from '../../../lib/account-policy';

export function useDashboardFilters() {
  const [params, setParams] = useSearchParams();
  const search = params.get('search') ?? '';
  const offeringId = Number(params.get('offering_id')) || undefined;
  const update = (key: string, value: string) => setParams(previous => {
    const next = new URLSearchParams(previous);
    if (value) next.set(key, value); else next.delete(key);
    return next;
  }, { replace: true });
  return { search, offeringId, setSearch: (value: string) => update('search', value), setOfferingId: (id?: number) => update('offering_id', id ? String(id) : '') };
}
export function useDashboard(filtered = true) {
  const user = useAuthStore(state => state.user); const { locale } = useDir();
  const filters = useDashboardFilters(); const offeringId = filtered ? filters.offeringId : undefined; const debounced = useDebounce(filtered ? filters.search : '');
  return useQuery({ queryKey: ['dashboard', user?.id, locale, offeringId, debounced],
    queryFn: ({ signal }) => dashboardApi.summary({ offering_id: offeringId, search: debounced }, signal),
    placeholderData: (previous, previousQuery) => previousQuery?.queryKey[1] === user?.id ? previous : undefined,
    enabled: !!user && !requiresPasswordChange(user),
  });
}
