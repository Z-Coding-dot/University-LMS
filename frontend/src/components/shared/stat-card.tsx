import type { LucideIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { Card, CountUp } from '../ui/surfaces';
import { cn } from '../../lib/cn';
import { useTranslation } from 'react-i18next';
export function StatCard({ title, value, description, icon: Icon, highlight = false, suffix }: { title: string; value: number | null; description?: string; icon: LucideIcon; highlight?: boolean; suffix?: string }) {
  const reduced = useReducedMotion();
  const { t } = useTranslation('dashboard');
  return <motion.div whileHover={reduced ? undefined : { y: -3 }}><Card className={cn('h-full', highlight && 'border-transparent bg-gradient-to-br from-brand to-orange-500 text-white')}><div className="flex items-start justify-between gap-3"><p className={highlight ? 'text-white/90' : 'text-gray-500'}>{title}</p><span className={cn('rounded-xl p-2.5', highlight ? 'bg-white/15' : 'bg-orange-50 text-brand')}><Icon size={22} /></span></div><p className="mt-3 text-3xl font-semibold tracking-tight">{value === null ? <span className="text-xl">{t('notAvailable')}</span> : <><CountUp value={value} />{suffix && <span className="ms-1 text-xl">{suffix}</span>}</>}</p>{description && <p className={cn('mt-2', highlight ? 'text-white/90' : 'text-gray-500')}>{description}</p>}</Card></motion.div>;
}
