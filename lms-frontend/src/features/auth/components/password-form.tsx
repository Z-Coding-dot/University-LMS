import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { PasswordInput as PasswordValues } from '../../../api/types';
import { apiErrorMessage, applyValidationErrors } from '../../../api/client';
import { passwordSchema } from '../schemas';
import { useChangePassword } from '../../profile/hooks/useProfile';
import { FormField, PasswordInput } from '../../../components/ui/fields';
import { Button } from '../../../components/ui/button';
import { useAuthStore } from '../store';
import { canChangeOwnPassword } from '../../../lib/account-policy';
const passwordFields = [
  { name: 'current_password', label: 'currentPassword', autocomplete: 'current-password' },
  { name: 'password', label: 'newPassword', autocomplete: 'new-password' },
  { name: 'password_confirmation', label: 'confirmPassword', autocomplete: 'new-password' },
] as const;
export function PasswordForm({ forced = false, onSuccess }: { forced?: boolean; onSuccess?: () => void }) {
  const user = useAuthStore(state => state.user);
  const { t } = useTranslation(['profile', 'common', 'auth']); const mutation = useChangePassword();
  const form = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema), defaultValues: { current_password: '', password: '', password_confirmation: '' } });
  if (!canChangeOwnPassword(user)) return null;
  const submit = form.handleSubmit(async input => {
    form.clearErrors();
    try { await mutation.mutateAsync(input); form.reset(); toast.success(t('auth:changeSuccess')); onSuccess?.(); }
    catch (error) { if (!applyValidationErrors(error, form.setError, ['current_password', 'password', 'password_confirmation'])) form.setError('root', { message: apiErrorMessage(error) }); }
  });
  return <form onSubmit={submit} noValidate className="space-y-5" aria-busy={mutation.isPending}>{passwordFields.map(field => <FormField key={field.name} label={t(field.label)} error={form.formState.errors[field.name]?.message}>{props => <PasswordInput {...props} {...form.register(field.name)} autoComplete={field.autocomplete} dir="auto" />}</FormField>)}{form.formState.errors.root && <p role="alert" className="text-red-700">{form.formState.errors.root.message}</p>}<Button type="submit" className="w-full sm:w-auto" loading={mutation.isPending}>{t(forced ? 'auth:continue' : 'updatePassword')}</Button></form>;
}
