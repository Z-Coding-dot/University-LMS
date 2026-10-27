import { DownloadLink } from './download-link';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Attachment } from '../../api/types';
import { academicApi } from '../../api/endpoints/academic';
import { validateUpload } from '../../lib/upload';
import { UPLOAD_LIMITS } from '../../config/uploads';
import { apiErrorMessage } from '../../api/client';
import { FormField, Input } from '../ui/fields';
import { Progress } from '../ui/surfaces';
import { Button } from '../ui/button';
export function FileUpload({ offeringId, purpose, files, onChange, onBusyChange }: { offeringId: number; purpose: 'submission' | 'assignment' | 'lecture'; files: Attachment[]; onChange: (files: Attachment[]) => void; onBusyChange?: (busy: boolean) => void }) {
  const { t } = useTranslation('academic'); const [progress, setProgress] = useState<number | null>(null); const [error, setError] = useState('');
  return <div className="space-y-3"><FormField label={t('attachments')} hint={t('uploadHint')} error={error}>{props => <Input {...props} type="file" multiple accept={UPLOAD_LIMITS.extensions.map(extension => `.${extension}`).join(',')} disabled={progress !== null} onChange={async event => {
    const selected = Array.from(event.target.files ?? []); event.target.value = ''; setError('');
    if (!selected.length) return;
    if (files.length + selected.length > UPLOAD_LIMITS.maxFiles) { setError('academic:tooManyFiles'); return; }
    const invalid = selected.map(validateUpload).find(Boolean); if (invalid) { setError(invalid); return; }
    setProgress(0); onBusyChange?.(true);
    try { const uploaded = await academicApi.upload(selected, offeringId, purpose, setProgress); onChange([...files, ...uploaded]); } catch (err) { setError(apiErrorMessage(err)); } finally { setProgress(null); onBusyChange?.(false); }
  }} />}</FormField>{progress !== null && <Progress value={progress} label={t('uploading')} />}{files.map(file => <div key={file.id} className="flex min-w-0 items-center justify-between gap-2 rounded-xl bg-gray-50 p-2"><DownloadLink file={file} className="min-h-11 min-w-0 break-all py-2 text-brand">{file.name}</DownloadLink><Button variant="ghost" disabled={progress !== null} onClick={() => onChange(files.filter(item => item.id !== file.id))}>{t('remove')}</Button></div>)}</div>;
}
