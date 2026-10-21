import { useMemo, useState, type ReactNode } from 'react';
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef, type RowSelectionState, type SortingState } from '@tanstack/react-table';
import { useInfiniteQuery, useQuery, type QueryKey } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useDebounce } from '../../hooks/useDebounce';
import { useDir } from '../../hooks/useDir';
import { MOBILE_PAGE_SIZE, type Locale } from '../../config/constants';
import { formatNumber } from '../../lib/number';
import type { ListParams, PaginatedResponse } from '../../api/types';
import { FilterBar } from '../shared/filter-bar';
import { Button } from './button';
import { Checkbox, Select } from './fields';
import { Card, EmptyState, LoadingState, Pagination } from './surfaces';

export interface DataColumn<T> {
  id: string; header: string; accessor: (row: T) => string | number | null;
  cell?: (row: T) => ReactNode; mobile: 'primary' | 'secondary' | 'hidden'; sortable?: boolean;
  desktopHidden?: boolean;
}
const displayValue = (value: string | number | null, locale: Locale) => typeof value === 'number' ? formatNumber(value, locale) : value ?? '';
interface DataTableProps<T> {
  columns: DataColumn<T>[]; queryKey: QueryKey;
  fetchPage: (params: ListParams, signal: AbortSignal) => Promise<PaginatedResponse<T>>;
  getRowId: (row: T) => string; label: string;
  filters?: ReactNode; filterValues?: Record<string, string | number | undefined>;
  actions?: (row: T) => ReactNode; selectable?: boolean;
  onSelectionChange?: (ids: string[]) => void;
  externalSearch?: string; showSearch?: boolean; pageSize?: number;
}
export function DataTable<T>({ columns, queryKey, fetchPage, getRowId, label, filters, filterValues, actions, selectable, onSelectionChange, externalSearch, showSearch = true, pageSize = 20 }: DataTableProps<T>) {
  const { t } = useTranslation(); const { locale } = useDir(); const desktop = useMediaQuery('(min-width: 768px)');
  const [search, setSearch] = useState(''); const debounced = useDebounce(search); const [page, setPage] = useState(1);
  const [sorting, setSorting] = useState<SortingState>([]); const [selection, setSelection] = useState<RowSelectionState>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const sort = sorting.map(item => `${item.desc ? '-' : ''}${item.id}`).join(',');
  // Key the page against its filters so a filter change always requests page one.
  const effectiveSearch = externalSearch ?? debounced;
  const scope = JSON.stringify([effectiveSearch, sort, filterValues]);
  const [pageScope, setPageScope] = useState(scope);
  const currentPage = pageScope === scope ? page : 1;
  const params = { ...filterValues, search: effectiveSearch, sort };
  const paged = useQuery({ queryKey: [...queryKey, 'desktop', params, currentPage, pageSize], queryFn: ({ signal }) => fetchPage({ ...params, page: currentPage, per_page: pageSize }, signal), enabled: desktop });
  const infinite = useInfiniteQuery({ queryKey: [...queryKey, 'mobile', params], queryFn: ({ pageParam, signal }) => fetchPage({ ...params, page: pageParam, per_page: MOBILE_PAGE_SIZE }, signal), initialPageParam: 1, getNextPageParam: last => last.meta.current_page < last.meta.last_page ? last.meta.current_page + 1 : undefined, enabled: !desktop });
  const data = useMemo(() => desktop ? paged.data?.data ?? [] : infinite.data?.pages.flatMap(result => result.data) ?? [], [desktop, paged.data, infinite.data]);
  const definitions = useMemo<ColumnDef<T>[]>(() => columns.filter(column => !column.desktopHidden).map(column => ({ id: column.id, accessorFn: column.accessor, header: column.header, cell: info => column.cell ? column.cell(info.row.original) : displayValue(column.accessor(info.row.original), locale), enableSorting: column.sortable ?? false })), [columns, locale]);
  const table = useReactTable({
    data, columns: definitions, getRowId, getCoreRowModel: getCoreRowModel(),
    manualPagination: true, manualSorting: true, enableRowSelection: selectable,
    state: { sorting, rowSelection: selection },
    onSortingChange: setSorting,
    onRowSelectionChange: updater => {
      const next = typeof updater === 'function' ? updater(selection) : updater;
      setSelection(next); onSelectionChange?.(Object.keys(next).filter(key => next[key]));
    },
  });
  const query = desktop ? paged : infinite;
  const meta = desktop ? paged.data?.meta : infinite.data?.pages[0]?.meta;
  const primary = columns.filter(column => column.mobile === 'primary');
  const secondary = columns.filter(column => column.mobile === 'secondary');
  return <div className="space-y-4">{showSearch ? <FilterBar search={search} onSearchChange={setSearch}>{filters}</FilterBar> : filters && <div className="flex flex-wrap gap-3">{filters}</div>}
    {!desktop && columns.some(column => column.sortable) && <Select aria-label={t('sort')} value={sort || 'default'} onValueChange={value => setSorting(value === 'default' ? [] : [{ id: value.replace(/^-/, ''), desc: value.startsWith('-') }])} options={[{ value: 'default', label: t('defaultSort') }, ...columns.filter(column => column.sortable).flatMap(column => [{ value: column.id, label: `${column.header} · ${t('ascending')}` }, { value: `-${column.id}`, label: `${column.header} · ${t('descending')}` }])]} />}
    {query.isPending ? <LoadingState /> : query.isError && !data.length ? <EmptyState error title={t('errorTitle')} description={t('errorDescription')} action={<Button variant="secondary" onClick={() => void query.refetch()}>{t('retry')}</Button>} /> : !data.length ? <EmptyState title={search ? t('noResults') : undefined} description={search ? t('noResultsDescription') : undefined} /> : <>
      {desktop ? <div className="overflow-x-auto rounded-2xl border bg-white"><table className="w-full text-start"><caption className="sr-only">{label}</caption><thead className="border-b bg-gray-50"><tr>{selectable && <th className="w-14 px-3"><Checkbox label={t('selectAll')} checked={table.getIsAllRowsSelected() ? true : table.getIsSomeRowsSelected() ? 'indeterminate' : false} onCheckedChange={value => table.toggleAllRowsSelected(value)} /></th>}{table.getHeaderGroups()[0]?.headers.map(header => <th key={header.id} scope="col" aria-sort={header.column.getIsSorted() === 'asc' ? 'ascending' : header.column.getIsSorted() === 'desc' ? 'descending' : 'none'} className="px-4 py-2 text-start font-medium text-gray-600">{header.column.getCanSort() ? <button type="button" onClick={header.column.getToggleSortingHandler()} className="inline-flex min-h-11 items-center gap-2" aria-label={String(header.column.columnDef.header)}>{flexRender(header.column.columnDef.header, header.getContext())}{header.column.getIsSorted() === 'asc' ? <ArrowUp size={16} /> : header.column.getIsSorted() === 'desc' ? <ArrowDown size={16} /> : <ArrowUpDown size={16} />}</button> : flexRender(header.column.columnDef.header, header.getContext())}</th>)}{actions && <th className="px-4 text-start">{t('actions')}</th>}</tr></thead><tbody className="divide-y">{table.getRowModel().rows.map(row => <tr key={row.id} className="hover:bg-gray-50/70">{selectable && <td className="px-3"><Checkbox label={t('selectRow')} checked={row.getIsSelected()} onCheckedChange={value => row.toggleSelected(value)} /></td>}{row.getVisibleCells().map(cell => <td key={cell.id} className="px-4 py-4">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}{actions && <td className="px-4 py-3">{actions(row.original)}</td>}</tr>)}</tbody></table></div>
      : <div aria-label={label} className="space-y-3">{table.getRowModel().rows.map(row => <Card key={row.id} className="space-y-3">{selectable && <Checkbox checked={row.getIsSelected()} onCheckedChange={value => row.toggleSelected(value)} label={t('selectRow')} />}<dl className="space-y-3">{[...primary, ...(expanded[row.id] ? secondary : [])].map(column => <div key={column.id}><dt className="text-gray-500">{column.header}</dt><dd className="mt-1 break-words font-medium">{column.cell?.(row.original) ?? displayValue(column.accessor(row.original), locale)}</dd></div>)}</dl>{(secondary.length > 0 || actions) && <Button variant="ghost" className="w-full" aria-expanded={!!expanded[row.id]} onClick={() => setExpanded(previous => ({ ...previous, [row.id]: !previous[row.id] }))}>{t(expanded[row.id] ? 'showLess' : 'showMore')}</Button>}{expanded[row.id] && actions && <div className="flex flex-wrap gap-2 border-t pt-3">{actions(row.original)}</div>}</Card>)}</div>}
      <p role="status" className="text-gray-500">{t('rowCount', { count: formatNumber(meta?.total ?? data.length, locale) })}</p>
      {desktop ? <Pagination page={currentPage} lastPage={Math.max(1, meta?.last_page ?? 1)} disabled={paged.isFetching} onChange={next => { setPageScope(scope); setPage(next); }} /> : infinite.hasNextPage && <Button variant="secondary" className="w-full" loading={infinite.isFetchingNextPage} onClick={() => void infinite.fetchNextPage()}>{t('loadMore')}</Button>}
      {query.isError && data.length > 0 && <p role="alert" className="text-red-700">{t('errorDescription')}</p>}
    </>}
  </div>;
}
