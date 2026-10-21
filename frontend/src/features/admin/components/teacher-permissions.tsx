import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { User } from '../../../api/types';
import { PERMISSION_PRESETS, TEACHER_PERMISSIONS, type TeacherPermission } from '../../../lib/permissions';
import { apiErrorMessage } from '../../../api/client';
import { Button } from '../../../components/ui/button';
import { Switch } from '../../../components/ui/fields';

export function TeacherPermissions({ teacher, pending, onSubmit }: { teacher: User; pending: boolean; onSubmit: (permissions: TeacherPermission[]) => Promise<void> }) {
  const { t } = useTranslation(['admin', 'common']);
  const [selected, setSelected] = useState<TeacherPermission[]>(TEACHER_PERMISSIONS.filter(permission => teacher.permissions.includes(permission)));
  const [error, setError] = useState('');
  return <form className="space-y-5" aria-busy={pending} onSubmit={async event => {
    event.preventDefault(); if (pending) return; setError('');
    try { await onSubmit(selected); } catch (err) { setError(apiErrorMessage(err)); }
  }}>
    <p className="text-gray-600">{t('permissionsDescription')}</p>
    <div role="group" aria-label={t('permissionPresets')} className="flex flex-wrap gap-2">{(Object.keys(PERMISSION_PRESETS) as (keyof typeof PERMISSION_PRESETS)[]).map(preset => <Button key={preset} variant="secondary" disabled={pending} aria-pressed={selected.length === PERMISSION_PRESETS[preset].length && PERMISSION_PRESETS[preset].every(value => selected.includes(value))} onClick={() => setSelected([...PERMISSION_PRESETS[preset]])}>{t(`presets.${preset}`)}</Button>)}</div>
    <div className="divide-y rounded-2xl border px-4">{TEACHER_PERMISSIONS.map(permission => <div key={permission} className="flex min-h-16 items-center justify-between gap-4 py-3"><span>{t(`permissionLabels.${permission}`)}</span><Switch label={t(`permissionLabels.${permission}`)} disabled={pending} checked={selected.includes(permission)} onCheckedChange={checked => setSelected(previous => checked ? [...previous, permission] : previous.filter(value => value !== permission))} /></div>)}</div>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    <Button type="submit" loading={pending} className="w-full sm:w-auto">{t('savePermissions')}</Button>
  </form>;
}
