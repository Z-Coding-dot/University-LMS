import { useEffect, useState, type HTMLAttributes, type ReactNode } from 'react';
import { useReducedMotion, motion } from 'motion/react';
import { Inbox, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/cn';
import { formatNumber } from '../../lib/number';
import { useDir } from '../../hooks/useDir';
import { Button } from './button';

export const Card = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => <div className={cn('rounded-2xl border border-gray-200/80 bg-surface p-5 shadow-soft sm:p-6', className)} {...props} />;
export function Badge({ children, tone = 'neutral', className }: { children: ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'brand'; className?: string }) {
  const tones = { neutral: 'bg-gray-100 text-gray-700', success: 'bg-emerald-50 text-emerald-800', warning: 'bg-amber/15 text-yellow-900', danger: 'bg-red-50 text-red-700', brand: 'bg-brand/10 text-orange-800' };
  return <span className={cn('inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-base font-medium', tones[tone], className)}>{children}</span>;
}
export function Avatar({ name, className }: { name: string; className?: string }) {
  return <span aria-hidden="true" className={cn('inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-100 font-semibold text-orange-800', className)}>{name.trim().split(/\s+/).slice(0, 2).map(word => Array.from(word)[0]).join('')}</span>;
}
export const Skeleton = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => <div aria-hidden="true" className={cn('h-5 animate-pulse rounded-lg bg-gray-200 motion-reduce:animate-none', className)} {...props} />;
export function LoadingState() { const { t } = useTranslation(); return <div role="status" className="space-y-4 p-6"><span className="sr-only">{t('loading')}</span><Skeleton className="h-10 w-2/3" /><Skeleton className="h-28 w-full" /><Skeleton className="h-28 w-full" /></div>; }
export function EmptyState({ title, description, action, error = false }: { title?: string; description?: string; action?: ReactNode; error?: boolean }) {
  const { t } = useTranslation(); const Icon = error ? AlertCircle : Inbox;
  return <div className="flex flex-col items-center gap-3 py-12 text-center"><span className={cn('mb-2 rounded-2xl p-4', error ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-brand')}><Icon size={28} aria-hidden="true" /></span><h2 className="text-xl font-semibold text-ink">{title ?? t('emptyTitle')}</h2><p className="max-w-md text-gray-500">{description ?? t('emptyDescription')}</p>{action && <div className="mt-3">{action}</div>}</div>;
}
export function Progress({ value, label }: { value: number; label: string }) {
  const percent = Math.min(100, Math.max(0, value));
  return <div role="progressbar" aria-label={label} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} className="h-2 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-brand transition-[width] motion-reduce:transition-none" style={{ width: `${percent}%` }} /></div>;
}
export function ProgressRing({ value, label }: { value: number; label: string }) {
  const { locale } = useDir(); const percent = Math.min(100, Math.max(0, value));
  return <div className="relative inline-flex h-24 w-24 shrink-0 items-center justify-center" role="progressbar" aria-label={label} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}><svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true"><circle cx="50" cy="50" r="42" fill="none" stroke="#F3F4F6" strokeWidth="8" /><circle cx="50" cy="50" r="42" fill="none" stroke="#FF6B00" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${percent * 2.639} 263.9`} /></svg><span className="absolute font-semibold">{formatNumber(percent / 100, locale, { style: 'percent', maximumFractionDigits: 0 })}</span></div>;
}
export function CountUp({ value }: { value: number }) {
  const reduced = useReducedMotion(); const [display, setDisplay] = useState(value); const { locale } = useDir();
  useEffect(() => {
    if (reduced) { setDisplay(value); return; }
    let frame = 0; const start = performance.now();
    const tick = (now: number) => { const progress = Math.min(1, (now - start) / 650); setDisplay(value * (1 - Math.pow(1 - progress, 3))); if (progress < 1) frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame);
  }, [value, reduced]);
  return <span>{formatNumber(display, locale, { maximumFractionDigits: Number.isInteger(value) ? 0 : 1 })}</span>;
}
export function PageTransition({ children }: { children: ReactNode }) {
  const { direction } = useDir(); const reduced = useReducedMotion();
  return <motion.div initial={reduced ? false : { opacity: 0, x: direction * 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }} className="space-y-6">{children}</motion.div>;
}
export function Pagination({ page, lastPage, onChange, disabled }: { page: number; lastPage: number; onChange: (page: number) => void; disabled?: boolean }) {
  const { t } = useTranslation(); const { locale } = useDir();
  return <nav aria-label={t('page', { page: formatNumber(page, locale), total: formatNumber(lastPage, locale) })} className="flex flex-wrap items-center justify-between gap-3"><Button variant="secondary" disabled={disabled || page <= 1} onClick={() => onChange(page - 1)}>{t('previous')}</Button><span className="text-gray-500">{t('page', { page: formatNumber(page, locale), total: formatNumber(lastPage, locale) })}</span><Button variant="secondary" disabled={disabled || page >= lastPage} onClick={() => onChange(page + 1)}>{t('next')}</Button></nav>;
}
