import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { adminAcademicApi } from '../../../api/endpoints/admin-academic';
import type { AcademicCatalog, StructureResource, StructureRow } from '../../../api/types/academic';
import { useAcademicMutation, useAcademicQuery } from '../../../hooks/useAcademic';
import { useAuthStore } from '../../auth/store';
import { useDir } from '../../../hooks/useDir';
import { PageHeader } from '../../../components/layout/page-header';
import { QueryState } from '../../../components/shared/query-state';
import { ConfigForm, type ConfigField } from '../../../components/shared/config-form';
import { Select } from '../../../components/ui/fields';
import { Button } from '../../../components/ui/button';
import { Dialog } from '../../../components/ui/overlays';
import { DataTable, type DataColumn } from '../../../components/ui/data-table';
import { calendarDay } from '../../../lib/date';
import { structureSchemas } from '../academic-schemas';

function StructureEditor({ resource, initial, catalog, onClose }: { resource: StructureResource; initial?: StructureRow; catalog: AcademicCatalog; onClose: () => void }) {
  const { locale } = useDir(); const today = calendarDay(new Date());
  const save = useAcademicMutation((values: unknown) => adminAcademicApi.saveStructure(resource, values, initial?.id));
  const fields: ConfigField[] = resource === 'academic-years' ? [{ name: 'name', label: 'common:name' }] : [{ name: 'name.fa', label: 'academic:nameFa' }, { name: 'name.en', label: 'academic:nameEn' }];
  const defaults: Record<string, unknown> = { name: initial?.name ?? (resource === 'academic-years' ? '' : { fa: '', en: '' }) };
  if (resource === 'departments') {
    defaults.faculty_id = initial?.faculty_id ?? catalog.faculties[0]?.id ?? '';
    fields.push({ name: 'faculty_id', label: 'admin:faculty', type: 'select', options: catalog.faculties.map(row => ({ value: String(row.id), label: row.name[locale] })) });
  }
  if (resource === 'semesters') {
    defaults.academic_year_id = initial?.academic_year_id ?? catalog.academic_years.at(-1)?.id ?? '';
    fields.push({ name: 'academic_year_id', label: 'admin:academicYear', type: 'select', options: catalog.academic_years.map(row => ({ value: String(row.id), label: row.name })) });
  }
  if (resource === 'academic-years' || resource === 'semesters') {
    defaults.starts_at = initial?.starts_at ?? today; defaults.ends_at = initial?.ends_at ?? today;
    fields.push({ name: 'starts_at', label: 'admin:startsAt', type: 'date' }, { name: 'ends_at', label: 'admin:endsAt', type: 'date' });
  }
  if (resource === 'courses') {
    defaults.department_id = initial?.department_id ?? catalog.departments[0]?.id ?? ''; defaults.code = initial?.code ?? ''; defaults.credits = initial?.credits ?? 3;
    fields.push({ name: 'department_id', label: 'admin:department', type: 'select', options: catalog.departments.map(row => ({ value: String(row.id), label: row.name[locale] })) }, { name: 'code', label: 'academic:code' }, { name: 'credits', label: 'academic:credits', type: 'number' });
  }
  return <ConfigForm fields={fields} defaults={defaults} schema={structureSchemas[resource]} pending={save.isPending} onSubmit={async values => { await save.mutateAsync(values); onClose(); }} />;
}
export function StructurePage() {
  const { t } = useTranslation(['admin', 'common']); const { locale } = useDir(); const user = useAuthStore(state => state.user);
  const [resource, setResource] = useState<StructureResource>('faculties'); const [editor, setEditor] = useState<StructureRow | 'new' | null>(null);
  const catalog = useAcademicQuery(['admin-catalog'], adminAcademicApi.catalog);
  const columns: DataColumn<StructureRow>[] = [
    { id: 'name', header: t('common:name'), accessor: row => typeof row.name === 'string' ? row.name : row.name[locale], mobile: 'primary', sortable: true },
    { id: 'code', header: t('academic:code'), accessor: row => row.code ?? '', mobile: 'secondary' },
    { id: 'credits', header: t('academic:credits'), accessor: row => row.credits ?? null, mobile: 'secondary' },
  ];
  const resources = Object.keys(structureSchemas) as StructureResource[];
  return <><PageHeader title={t('structureTitle')} description={t('structureDescription')} actions={<Button disabled={!catalog.data} onClick={() => setEditor('new')}>{t('addRecord')}</Button>} /><div className="max-w-sm"><Select aria-label={t('structureTitle')} value={resource} onValueChange={value => setResource(value as StructureResource)} options={resources.map(value => ({ value, label: t(`structureResources.${value}`) }))} /></div>
    <QueryState pending={catalog.isPending} error={catalog.error} retry={catalog.refetch}>{catalog.data && <DataTable key={resource} columns={columns.filter(column => resource === 'courses' || column.id === 'name')} queryKey={['structure', user?.id, locale, resource]} fetchPage={(params, signal) => adminAcademicApi.structure(resource, params, signal)} getRowId={row => String(row.id)} label={t(`structureResources.${resource}`)} actions={row => <Button variant="secondary" onClick={() => setEditor(row)}>{t('common:edit')}</Button>} />}</QueryState>
    <Dialog title={t(`structureResources.${resource}`)} open={!!editor} onOpenChange={open => { if (!open) setEditor(null); }}>{editor && catalog.data && <StructureEditor key={editor === 'new' ? 'new' : editor.id} resource={resource} initial={editor === 'new' ? undefined : editor} catalog={catalog.data} onClose={() => setEditor(null)} />}</Dialog>
  </>;
}
