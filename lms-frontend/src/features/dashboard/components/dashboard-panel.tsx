import type { ReactNode } from 'react';
import { Card } from '../../../components/ui/surfaces';
import { cn } from '../../../lib/cn';

export function DashboardPanel({ id, title, description, action, children, className }: { id: string; title: string; description?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section id={id} aria-labelledby={`${id}-heading`} className={cn('min-w-0 scroll-mt-28', className)}>
    <Card className="overflow-hidden p-0 sm:p-0"><header className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 px-5 py-4"><div><h2 id={`${id}-heading`} className="text-xl font-semibold tracking-tight">{title}</h2>{description && <p className="mt-1 text-gray-500">{description}</p>}</div>{action}</header><div className="p-4 sm:p-5">{children}</div></Card>
  </section>;
}
