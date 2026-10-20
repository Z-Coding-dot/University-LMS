import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { PageHeader } from '../../../components/layout/page-header';
import { Card, Avatar } from '../../../components/ui/surfaces';
import { FormField, Input, Select } from '../../../components/ui/fields';
import { Button } from '../../../components/ui/button';
import { useAuthStore } from '../../auth/store';
import { profileSchema, type ProfileInput } from '../schemas';
import { useUpdateProfile } from '../hooks/useProfile';
import { UniversityRecord } from '../components/university-record';
import { apiErrorMessage, applyValidationErrors } from '../../../api/client';
import { canEditOwnIdentity } from '../../../lib/account-policy';
export function ProfilePage() {
  const { t, i18n } = useTranslation(['profile', 'common']); const user = useAuthStore(state => state.user); const mutation = useUpdateProfile();
  const form = useForm<ProfileInput>({ resolver: zodResolver(profileSchema), defaultValues: { name: user?.name ?? '', locale: i18n.language === 'en' ? 'en' : 'fa' } });
  if (!user) return null;
  const editable = canEditOwnIdentity(user);
  const submit = form.handleSubmit(async input => { form.clearErrors(); try { const updated = await mutation.mutateAsync(editable ? input : { locale: input.locale }); form.reset({ name: updated.name, locale: updated.locale }); toast.success(t('saved')); } catch (error) { if (!applyValidationErrors(error, form.setError, ['name', 'locale'])) form.setError('root', { message: apiErrorMessage(error) }); } });
  return <><PageHeader title={t('title')} description={t('description')} /><div className="grid items-start gap-6 xl:grid-cols-[1.5fr_1fr]"><Card><div className="mb-7 flex items-center gap-4"><Avatar name={user.name} className="h-16 w-16 text-xl" /><div><h2 className="text-xl font-semibold">{t('personalTitle')}</h2><p className="mt-1 text-gray-500">{t('personalDescription')}</p></div></div><form onSubmit={submit} noValidate className="space-y-5" aria-busy={mutation.isPending}>
    {!editable && <p className="rounded-xl bg-orange-50 p-4 text-orange-900">{t('managedAccount')}</p>}
    <FormField label={t('common:name')} error={form.formState.errors.name?.message}>{props => <Input {...props} {...form.register('name')} autoComplete="name" dir="auto" readOnly={!editable} />}</FormField>
    <FormField label={t('common:email')}>{props => <Input {...props} value={user.email} type="email" autoComplete="email" readOnly disabled dir="ltr" />}</FormField>
    <FormField label={t('common:language')} error={form.formState.errors.locale?.message}>{props => <Controller control={form.control} name="locale" render={({ field }) => <Select {...props} value={field.value} onValueChange={field.onChange} options={['fa', 'en'].map(locale => ({ value: locale, label: t(`common:languages.${locale}`) }))} />} />}</FormField>
    {form.formState.errors.root && <p role="alert" className="text-red-700">{form.formState.errors.root.message}</p>}<Button type="submit" loading={mutation.isPending} className="w-full sm:w-auto">{t('common:save')}</Button>
  </form></Card><UniversityRecord /></div></>;
}
