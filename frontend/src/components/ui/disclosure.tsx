import type { ReactNode } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import { useDir } from '../../hooks/useDir';
export function Tabs({ tabs, value, onValueChange, label }: { tabs: { value: string; label: string; content: ReactNode }[]; value: string; onValueChange: (value: string) => void; label: string }) {
  const { dir } = useDir();
  return <TabsPrimitive.Root dir={dir} value={value} onValueChange={onValueChange}><TabsPrimitive.List aria-label={label} className="mb-5 grid max-w-full grid-cols-2 gap-1 border-b sm:flex sm:flex-wrap">{tabs.map(tab => <TabsPrimitive.Trigger value={tab.value} key={tab.value} className="min-h-11 min-w-0 whitespace-normal break-words border-b-2 border-transparent px-4 py-2 font-medium text-gray-500 outline-none focus-visible:ring-2 focus-visible:ring-brand data-[state=active]:border-brand data-[state=active]:text-brand">{tab.label}</TabsPrimitive.Trigger>)}</TabsPrimitive.List>{tabs.map(tab => <TabsPrimitive.Content key={tab.value} value={tab.value} className="outline-none focus-visible:ring-2 focus-visible:ring-brand">{tab.content}</TabsPrimitive.Content>)}</TabsPrimitive.Root>;
}
export function Accordion({ items, defaultValue }: { items: { value: string; title: ReactNode; content: ReactNode; className?: string }[]; defaultValue?: string[] }) {
  return <AccordionPrimitive.Root type="multiple" defaultValue={defaultValue} className="divide-y rounded-xl border bg-white px-4">{items.map(item => <AccordionPrimitive.Item className={item.className} key={item.value} value={item.value}><AccordionPrimitive.Header><AccordionPrimitive.Trigger className="group flex min-h-11 w-full items-center justify-between gap-3 py-3 text-start font-medium"><span className="min-w-0 flex-1">{item.title}</span><ChevronDown size={18} className="shrink-0 transition-transform group-data-[state=open]:rotate-180" /></AccordionPrimitive.Trigger></AccordionPrimitive.Header><AccordionPrimitive.Content className="pb-4 text-gray-600">{item.content}</AccordionPrimitive.Content></AccordionPrimitive.Item>)}</AccordionPrimitive.Root>;
}
