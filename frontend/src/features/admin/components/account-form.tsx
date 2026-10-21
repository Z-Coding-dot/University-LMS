import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { apiErrorMessage, applyValidationErrors } from '../../../api/client';
import { FormField, Input } from '../../../components/ui/fields';
import { Button } from '../../../components/ui/button';
import { accountIdentitySchema, type AccountIdentityInput } from '../schemas';

export function AccountForm({ initial, onSubmit, pending, create = false, submitLabel }: { initial: AccountIdentityInput; onSubmit: (input: AccountIdentityInput) => Promise<void>; pending: boolean; create?: boolean; submitLabel: string }) {
  const { t } = useTranslation(['admin', 'common']);
  const form = useForm<AccountIdentityInput>({ resolver: zodResolver(accountIdentitySchema), defaultValues: initial });
  const submit = form.handleSubmit(async input => {
    form.clearErrors();
    try { await onSubmit(input); } catch (error) {
      if (!applyValidationErrors(error, form.setError, ['name', 'email'])) form.setError('root', { message: apiErrorMessage(error) });
    }
  });
  return <form onSubmit={submit} noValidate className="space-y-5" aria-busy={pending}>
    <FormField label={t('common:name')} error={form.formState.errors.name?.message}>{props => <Input {...props} {...form.register('name')} disabled={pending} autoComplete="name" dir="auto" />}</FormField>
    <FormField label={t('common:email')} error={form.formState.errors.email?.message}>{props => <Input {...props} {...form.register('email')} disabled={pending} type="email" inputMode="email" autoComplete="off" autoCapitalize="none" spellCheck={false} dir="ltr" />}</FormField>
    {create && <p className="rounded-xl bg-orange-50 p-4 text-orange-900">{t('generatedPasswordNote')}</p>}
    {form.formState.errors.root && <p role="alert" className="text-red-700">{form.formState.errors.root.message}</p>}
    <Button type="submit" loading={pending} className="w-full sm:w-auto">{submitLabel}</Button>
  </form>;
}
