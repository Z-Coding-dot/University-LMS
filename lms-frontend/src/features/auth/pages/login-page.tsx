import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import type { LoginInput } from '../../../api/types';
import { apiErrorMessage, applyValidationErrors, useMock } from '../../../api/client';
import { loginSchema } from '../schemas';
import { useLogin } from '../hooks/useAuth';
import { useAuthStore } from '../store';
import { AuthLayout } from '../../../components/layout/auth-layout';
import { FormField, Input, PasswordInput } from '../../../components/ui/fields';
import { Button } from '../../../components/ui/button';
import { Dialog } from '../../../components/ui/overlays';
import { ROLES } from '../../../config/constants';
import { DEMO_ACCOUNTS } from '../../../config/demo';
import { requiresPasswordChange } from '../../../lib/account-policy';

export function LoginPage() {
  const { t } = useTranslation(['auth', 'common']);
  const login = useLogin();
  const user = useAuthStore(state => state.user);
  const [helpOpen, setHelpOpen] = useState(false);
  const form = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { identifier: '', password: '' } });
  if (user) return <Navigate to={requiresPasswordChange(user) ? '/change-password' : '/'} replace />;
  const submit = form.handleSubmit(async input => {
    form.clearErrors();
    try { await login.mutateAsync(input); } catch (error) {
      if (!applyValidationErrors(error, form.setError, ['identifier', 'password'])) form.setError('root', { message: apiErrorMessage(error) });
    }
  });
  return <AuthLayout>
    <div className="mb-8"><h1 className="text-3xl font-semibold tracking-tight">{t('welcome')}</h1><p className="mt-2 text-gray-600">{t('subtitle')}</p></div>
    <form onSubmit={submit} noValidate className="space-y-5" aria-busy={login.isPending}>
      <FormField label={t('identifier')} error={form.formState.errors.identifier?.message}>{props => <Input {...props} {...form.register('identifier')} type="email" inputMode="email" autoComplete="username" autoCapitalize="none" spellCheck={false} dir="ltr" placeholder={t('identifierPlaceholder')} className="h-12 rounded-lg border-gray-200 px-4" />}</FormField>
      <FormField label={t('password')} error={form.formState.errors.password?.message}>{props => <PasswordInput {...props} {...form.register('password')} autoComplete="current-password" dir="auto" className="h-12 rounded-lg border-gray-200 px-4" />}</FormField>
      <div className="flex justify-end"><Button variant="ghost" className="px-0 text-orange-700 hover:bg-transparent hover:text-orange-800" onClick={() => setHelpOpen(true)}>{t('forgotPassword')}</Button></div>
      {form.formState.errors.root && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{form.formState.errors.root.message}</p>}
      <Button type="submit" loading={login.isPending} className="h-12 w-full rounded-lg bg-[#ff5907] hover:bg-[#e74700]">{t(login.isPending ? 'signingIn' : 'signIn')}</Button>
    </form>
    <p className="mt-6 leading-relaxed text-gray-500">{t('issuedCredentials')}</p>
    {useMock && <details className="mt-8 border-t border-gray-100 pt-4"><summary className="min-h-11 cursor-pointer py-2 text-gray-500">{t('demoTitle')}</summary><p className="mt-2 text-gray-500">{t('demoDescription')}</p><div className="mt-3 grid grid-cols-3 gap-2">{ROLES.map(role => <Button key={role} variant="secondary" className="px-2" disabled={login.isPending} onClick={() => form.reset(DEMO_ACCOUNTS[role])}>{t(`common:roles.${role}`)}</Button>)}</div></details>}
    <Dialog title={t('forgotPassword')} description={t('help')} open={helpOpen} onOpenChange={setHelpOpen}><p className="text-gray-600">{t('issuedCredentials')}</p></Dialog>
  </AuthLayout>;
}
