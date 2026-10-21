import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation } from 'react-router-dom';
import { ArrowRight, KeyRound, Mail } from 'lucide-react';
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
import { authDestination } from '../../../lib/auth-redirect';

export function LoginPage() {
  const { t } = useTranslation(['auth', 'common']);
  const location = useLocation();
  const destination = authDestination((location.state as { returnTo?: unknown } | null)?.returnTo);
  const login = useLogin(destination);
  const user = useAuthStore(state => state.user);
  const [helpOpen, setHelpOpen] = useState(false);
  const form = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { identifier: '', password: '' }, mode: 'onSubmit', reValidateMode: 'onChange' });
  if (user) return <Navigate to={requiresPasswordChange(user) ? '/change-password' : destination} state={{ returnTo: destination }} replace />;
  const submit = form.handleSubmit(async input => {
    if (login.isPending) return;
    form.clearErrors();
    try { await login.mutateAsync(input); } catch (error) {
      if (!applyValidationErrors(error, form.setError, ['identifier', 'password'])) form.setError('root', { message: apiErrorMessage(error) });
    }
  });
  return <AuthLayout>
    <div className="mb-8"><p className="mb-3 font-medium text-brand-action">{t('portalLabel')}</p><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t('welcome')}</h1><p className="mt-3 text-gray-600">{t('subtitle')}</p></div>
    <form onSubmit={submit} noValidate className="space-y-5" aria-busy={login.isPending}>
      <FormField label={t('identifier')} error={form.formState.errors.identifier?.message}>{props => <div className="relative" dir="ltr"><Mail size={18} aria-hidden="true" className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-gray-400" /><Input {...props} {...form.register('identifier')} disabled={login.isPending} type="email" inputMode="email" autoComplete="username" autoCapitalize="none" spellCheck={false} dir="ltr" placeholder={t('identifierPlaceholder')} className="h-14 ps-12 pe-4" /></div>}</FormField>
      <FormField label={t('password')} error={form.formState.errors.password?.message}>{props => <PasswordInput {...props} {...form.register('password')} disabled={login.isPending} autoComplete="current-password" dir="ltr" className="h-14 ps-4" />}</FormField>
      <div className="flex justify-end"><Button variant="ghost" className="px-0 text-orange-700 hover:bg-transparent hover:text-orange-800" onClick={() => setHelpOpen(true)}>{t('forgotPassword')}</Button></div>
      {form.formState.errors.root && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{form.formState.errors.root.message}</p>}
      <Button type="submit" loading={login.isPending} className="h-14 w-full">{t(login.isPending ? 'signingIn' : 'signIn')}{!login.isPending && <ArrowRight size={18} aria-hidden="true" className="rtl:rotate-180" />}</Button>
    </form>
    <div className="mt-6 flex items-start gap-3 rounded-2xl border border-gray-200 bg-canvas/50 p-4"><KeyRound size={20} aria-hidden="true" className="mt-1 shrink-0 text-brand-action" /><p className="leading-relaxed text-gray-600">{t('issuedCredentials')}</p></div>
    {useMock && <details className="mt-8 border-t border-gray-100 pt-4"><summary className="min-h-11 cursor-pointer py-2 text-gray-500">{t('demoTitle')}</summary><p className="mt-2 text-gray-500">{t('demoDescription')}</p><div className="mt-3 grid grid-cols-3 gap-2">{ROLES.map(role => <Button key={role} variant="secondary" className="px-2" disabled={login.isPending} onClick={() => form.reset(DEMO_ACCOUNTS[role])}>{t(`common:roles.${role}`)}</Button>)}</div></details>}
    <Dialog title={t('forgotPassword')} description={t('help')} open={helpOpen} onOpenChange={setHelpOpen}><p className="text-gray-600">{t('issuedCredentials')}</p></Dialog>
  </AuthLayout>;
}
