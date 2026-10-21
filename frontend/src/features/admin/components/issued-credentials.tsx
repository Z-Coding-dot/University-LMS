import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ClipboardCheck, Copy } from 'lucide-react';
import type { IssuedCredentialsResponse } from '../../../api/endpoints/accounts';
import { Dialog } from '../../../components/ui/overlays';
import { FormField, Input } from '../../../components/ui/fields';
import { Button } from '../../../components/ui/button';

export function IssuedCredentials({ credentials, onClose }: { credentials: IssuedCredentialsResponse; onClose: () => void }) {
  const { t } = useTranslation(['admin', 'auth', 'common']);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${t('common:name')}: ${credentials.user.name}\n${t('common:email')}: ${credentials.user.email}\n${t('auth:password')}: ${credentials.initial_password}`);
      setCopied(true); setCopyError(false);
    } catch { setCopyError(true); }
  };
  return <Dialog title={t('credentialsTitle')} description={t('credentialsDescription')} open onOpenChange={open => { if (!open) onClose(); }} footer={<Button variant="secondary" onClick={onClose}>{t('common:close')}</Button>}>
    <div className="space-y-4"><p className="font-medium">{credentials.user.name}</p>
      <FormField label={t('common:email')}>{props => <Input {...props} value={credentials.user.email} readOnly dir="ltr" onFocus={event => event.target.select()} />}</FormField>
      <FormField label={t('auth:password')}>{props => <Input {...props} value={credentials.initial_password} readOnly dir="ltr" autoComplete="off" onFocus={event => event.target.select()} />}</FormField>
      <Button onClick={() => void copy()} className="w-full" variant="secondary">{copied ? <ClipboardCheck size={18} /> : <Copy size={18} />}{t(copied ? 'copied' : 'copyCredentials')}</Button>
      {copyError && <p role="alert" className="text-red-700">{t('copyError')}</p>}
      <p className="rounded-xl bg-orange-50 p-4 text-orange-900">{t('handoverNote')}</p>
    </div>
  </Dialog>;
}
