import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import * as SelectPrimitive from '@radix-ui/react-select';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { Check, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/cn';
import { IconButton } from './button';
import { useDir } from '../../hooks/useDir';

export const inputStyles = 'min-h-11 w-full min-w-0 rounded-xl border border-gray-300 bg-white px-3 py-2 text-base text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15 disabled:bg-gray-100 disabled:text-gray-500 aria-[invalid=true]:border-red-600';
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => <input ref={ref} className={cn(inputStyles, className)} {...props} />);
Input.displayName = 'Input';
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => <textarea ref={ref} className={cn(inputStyles, 'min-h-28 resize-y', className)} {...props} />);
Textarea.displayName = 'Textarea';
export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>>((props, ref) => {
  const [visible, setVisible] = useState(false); const { t } = useTranslation();
  return <div className="relative" dir={props.dir}><Input {...props} ref={ref} type={visible ? 'text' : 'password'} className={cn(props.className, 'pe-14')} />
    <IconButton label={t('togglePassword')} disabled={props.disabled} aria-pressed={visible} aria-controls={props.id} className="absolute end-0 top-1/2 -translate-y-1/2" onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</IconButton></div>;
});
PasswordInput.displayName = 'PasswordInput';

interface FieldControl { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string }
export function FormField({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: (props: FieldControl) => ReactNode }) {
  const id = useId(); const { t } = useTranslation();
  return <div className="space-y-2"><label htmlFor={id} className="block font-medium text-ink">{label}</label>
    {children({ id, 'aria-invalid': !!error, 'aria-describedby': error || hint ? `${id}-message` : undefined })}
    {(error || hint) && <p id={`${id}-message`} role={error ? 'alert' : undefined} className={cn('text-base', error ? 'text-red-700' : 'text-gray-500')}>{error ? t(error) : hint}</p>}</div>;
}
export interface SelectOption { value: string; label: string; disabled?: boolean }
interface SelectProps { id?: string; value?: string; onValueChange: (value: string) => void; options: SelectOption[]; placeholder?: string; disabled?: boolean; 'aria-invalid'?: boolean; 'aria-describedby'?: string; 'aria-label'?: string }
export function Select({ options, onValueChange, value, placeholder, disabled, ...props }: SelectProps) {
  const { dir } = useDir(); const { t } = useTranslation();
  return <SelectPrimitive.Root value={value} onValueChange={onValueChange} disabled={disabled} dir={dir}>
    <SelectPrimitive.Trigger className={cn(inputStyles, 'flex items-center justify-between gap-2 text-start')} {...props}>
      <span className="min-w-0 flex-1 truncate text-start"><SelectPrimitive.Value placeholder={placeholder ?? t('select')} /></span><SelectPrimitive.Icon className="shrink-0"><ChevronDown size={16} /></SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
    <SelectPrimitive.Portal><SelectPrimitive.Content position="popper" sideOffset={6} className="z-[70] max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-auto rounded-xl border bg-white p-1 shadow-soft" dir={dir}>
      <SelectPrimitive.Viewport>{options.map(option => <SelectPrimitive.Item key={option.value} value={option.value} disabled={option.disabled} className="relative flex min-h-11 cursor-pointer items-center rounded-lg ps-9 pe-3 outline-none data-[highlighted]:bg-orange-50 data-[disabled]:opacity-40">
        <SelectPrimitive.ItemIndicator className="absolute start-3"><Check size={16} /></SelectPrimitive.ItemIndicator><SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
      </SelectPrimitive.Item>)}</SelectPrimitive.Viewport>
    </SelectPrimitive.Content></SelectPrimitive.Portal>
  </SelectPrimitive.Root>;
}
export function Checkbox({ checked, onCheckedChange, label, id, disabled }: { checked: boolean | 'indeterminate'; onCheckedChange: (checked: boolean) => void; label: string; id?: string; disabled?: boolean }) {
  const generated = useId(); const controlId = id ?? generated;
  return <label htmlFor={controlId} className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-3"><CheckboxPrimitive.Root id={controlId} checked={checked} disabled={disabled} onCheckedChange={value => onCheckedChange(value === true)} aria-label={label} className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-gray-400 text-white outline-none focus-visible:ring-2 focus-visible:ring-brand data-[state=checked]:border-brand data-[state=checked]:bg-brand data-[state=indeterminate]:bg-brand disabled:opacity-50"><CheckboxPrimitive.Indicator><Check size={15} /></CheckboxPrimitive.Indicator></CheckboxPrimitive.Root><span className="sr-only">{label}</span></label>;
}
export function Switch({ checked, onCheckedChange, label, disabled }: { checked: boolean; onCheckedChange: (checked: boolean) => void; label: string; disabled?: boolean }) {
  const { dir } = useDir();
  return <SwitchPrimitive.Root dir={dir} checked={checked} onCheckedChange={onCheckedChange} aria-label={label} disabled={disabled} className="inline-flex h-11 w-14 shrink-0 items-center rounded-full border-4 border-transparent bg-gray-200 px-0.5 outline-none focus-visible:ring-2 focus-visible:ring-brand data-[state=checked]:bg-brand disabled:opacity-50"><SwitchPrimitive.Thumb className="h-6 w-6 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-4 rtl:data-[state=checked]:-translate-x-4" /></SwitchPrimitive.Root>;
}
export function SegmentedControl({ value, onChange, options, label }: { value: string; onChange: (value: string) => void; options: SelectOption[]; label: string }) {
  return <div role="group" aria-label={label} className="flex flex-wrap gap-1 rounded-xl bg-gray-100 p-1">{options.map(option => <button type="button" key={option.value} disabled={option.disabled} aria-pressed={value === option.value} onClick={() => onChange(option.value)} className={cn('min-h-11 flex-1 rounded-lg px-3 py-2 font-medium outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-40', value === option.value ? 'bg-white text-brand shadow-sm' : 'text-gray-600')}>{option.label}</button>)}</div>;
}
