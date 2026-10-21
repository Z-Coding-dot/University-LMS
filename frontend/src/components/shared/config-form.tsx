import { Controller, useForm } from 'react-hook-form';
import type { ReactNode } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { FormField, Input, Select, Textarea, type SelectOption } from '../ui/fields';
import { DatePicker } from '../ui/date-picker';
import { Button } from '../ui/button';
import { apiErrorMessage, applyValidationErrors } from '../../api/client';
import { normalizeDigits } from '../../lib/number';
export interface ConfigField { name: string; label: string; type?: 'text' | 'email' | 'number' | 'textarea' | 'select' | 'date' | 'time'; options?: SelectOption[] }
export function ConfigForm({ fields, schema, defaults, externalValues, onSubmit, submitLabel, pending, children }: { fields: ConfigField[]; schema: z.ZodType<Record<string, unknown>, z.ZodTypeDef, unknown>; defaults: Record<string, unknown>; externalValues?: Record<string, unknown>; onSubmit: (values: Record<string, unknown>) => Promise<unknown>; submitLabel?: string; pending?: boolean; children?: ReactNode }) {
  const { t } = useTranslation();
  const form = useForm<Record<string, unknown>>({ resolver: (values, context, options) => zodResolver(schema)({ ...values, ...externalValues }, context, options), defaultValues: defaults });
  return <form noValidate className="space-y-5" onSubmit={form.handleSubmit(async values => {
    form.clearErrors();
    try { await onSubmit(values); } catch (error) { if (!applyValidationErrors(error, form.setError, fields.map(field => field.name))) form.setError('root', { message: apiErrorMessage(error) }); }
  })}>{fields.map(config => <FormField key={config.name} label={t(config.label)} error={form.getFieldState(config.name, form.formState).error?.message}>{props => <Controller control={form.control} name={config.name} render={({ field }) => config.type === 'select' ? <Select {...props} value={String(field.value ?? '')} onValueChange={field.onChange} options={config.options ?? []} /> : config.type === 'date' ? <DatePicker {...props} label={t(config.label)} value={field.value ? String(field.value) : null} onChange={field.onChange} /> : config.type === 'textarea' ? <Textarea {...props} {...field} value={String(field.value ?? '')} /> : <Input {...props} {...field} value={String(field.value ?? '')} type={config.type === 'number' ? 'text' : config.type ?? 'text'} inputMode={config.type === 'number' ? 'decimal' : config.type === 'email' ? 'email' : undefined} onChange={event => field.onChange(config.type === 'number' ? normalizeDigits(event.target.value) : event.target.value)} />} />}</FormField>)}{form.formState.errors.root?.message && <p role="alert" className="text-red-700">{String(form.formState.errors.root.message)}</p>}{children}<Button type="submit" className="w-full sm:w-auto" loading={pending || form.formState.isSubmitting}>{submitLabel ?? t('save')}</Button></form>;
}
