import type { ReactNode } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import * as DropdownPrimitive from '@radix-ui/react-dropdown-menu';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/cn';
import { useDir } from '../../hooks/useDir';
import { Button, IconButton } from './button';

interface DialogProps { title: string; description?: string; children: ReactNode; open: boolean; onOpenChange: (open: boolean) => void; trigger?: ReactNode; footer?: ReactNode; variant?: 'dialog' | 'sheet' | 'drawer' }
export function Dialog({ title, description, children, open, onOpenChange, trigger, footer, variant = 'dialog' }: DialogProps) {
  const { t } = useTranslation(); const { dir } = useDir();
  return <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>{trigger && <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>}<DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/45 backdrop-blur-sm data-[state=open]:animate-overlay" />
    <DialogPrimitive.Content dir={dir} className={cn('fixed z-50 max-h-[90dvh] overflow-y-auto bg-white p-6 shadow-xl outline-none', variant === 'drawer' ? 'inset-y-0 start-0 max-h-dvh w-[min(88vw,22rem)]' : 'inset-x-0 bottom-0 rounded-t-3xl pb-[max(1.5rem,env(safe-area-inset-bottom))]', variant === 'dialog' && 'md:inset-x-auto md:start-1/2 md:top-1/2 md:bottom-auto md:w-[min(90vw,36rem)] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl rtl:md:translate-x-1/2', variant === 'sheet' && 'md:start-auto md:w-[28rem]')}>
      <div className="mb-6 pe-10"><DialogPrimitive.Title className="text-xl font-semibold">{title}</DialogPrimitive.Title><DialogPrimitive.Description className={cn('mt-2 text-gray-500', !description && 'sr-only')}>{description ?? title}</DialogPrimitive.Description></div>
      <DialogPrimitive.Close asChild><IconButton label={t('close')} className="absolute end-3 top-3"><X size={20} /></IconButton></DialogPrimitive.Close>
      {children}{footer && <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">{footer}</div>}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal></DialogPrimitive.Root>;
}
export const Sheet = (props: Omit<DialogProps, 'variant'> & { drawer?: boolean }) => <Dialog {...props} variant={props.drawer ? 'drawer' : 'sheet'} />;
export function ConfirmDialog({ onConfirm, loading, confirmLabel, ...props }: Omit<DialogProps, 'children' | 'footer'> & { onConfirm: () => void; loading?: boolean; confirmLabel?: string }) {
  const { t } = useTranslation();
  return <Dialog {...props} footer={<><Button variant="secondary" disabled={loading} onClick={() => props.onOpenChange(false)}>{t('cancel')}</Button><Button variant="danger" loading={loading} onClick={onConfirm}>{confirmLabel ?? t('confirm')}</Button></>}><div /></Dialog>;
}
export function Tooltip({ children, content }: { children: ReactNode; content: string }) {
  return <TooltipPrimitive.Root><TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger><TooltipPrimitive.Portal><TooltipPrimitive.Content sideOffset={6} className="z-[80] max-w-64 rounded-lg bg-ink px-3 py-2 text-base text-white">{content}<TooltipPrimitive.Arrow className="fill-ink" /></TooltipPrimitive.Content></TooltipPrimitive.Portal></TooltipPrimitive.Root>;
}
export function Popover({ trigger, children, open, onOpenChange }: { trigger: ReactNode; children: ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void }) {
  const { dir } = useDir();
  return <PopoverPrimitive.Root open={open} onOpenChange={onOpenChange}><PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger><PopoverPrimitive.Portal><PopoverPrimitive.Content dir={dir} sideOffset={8} align="start" className="z-[70] w-[min(90vw,22rem)] rounded-2xl border bg-white p-4 shadow-soft">{children}</PopoverPrimitive.Content></PopoverPrimitive.Portal></PopoverPrimitive.Root>;
}
export interface DropdownItem { label: string; onSelect: () => void; disabled?: boolean; danger?: boolean }
export function Dropdown({ trigger, items }: { trigger: ReactNode; items: DropdownItem[] }) {
  const { dir } = useDir();
  return <DropdownPrimitive.Root dir={dir}><DropdownPrimitive.Trigger asChild>{trigger}</DropdownPrimitive.Trigger><DropdownPrimitive.Portal><DropdownPrimitive.Content sideOffset={8} align="end" className="z-[70] min-w-48 rounded-xl border bg-white p-1 shadow-soft">{items.map(item => <DropdownPrimitive.Item key={item.label} disabled={item.disabled} onSelect={item.onSelect} className={cn('flex min-h-11 cursor-pointer items-center rounded-lg px-3 outline-none data-[highlighted]:bg-gray-100 data-[disabled]:opacity-40', item.danger && 'text-red-700')}>{item.label}</DropdownPrimitive.Item>)}</DropdownPrimitive.Content></DropdownPrimitive.Portal></DropdownPrimitive.Root>;
}
