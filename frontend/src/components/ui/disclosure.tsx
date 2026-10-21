import type { ReactNode } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import { useDir } from '../../hooks/useDir';
export function Tabs({ tabs, value, onValueChange, label }: { tabs: { value: string; label: string; content: ReactNode }[]; value: string; onValueChange: (value: string) => void; label: string }) {
  const { dir } = useDir();
  return <TabsPrimitive.Root dir={dir} value={value} onValueChange={onValueChange}><TabsPrimitive.List aria-label={label} className="mb-5 flex max-w-full gap-1 overflow-x-auto border-b">{tabs.map(tab => <TabsPrimitive.Trigger value={tab.value} key={tab.value} className="min-h-11 shrink-0 border-b-2 border-transparent px-4 py-2 font-medium text-gray-500 outline-none focus-visible:ring-2 focus-visible:ring-brand data-[state=active]:border-brand data-[state=active]:text-brand">{tab.label}</TabsPrimitive.Trigger>)}</TabsPrimitive.List>{tabs.map(tab => <TabsPrimitive.Content key={tab.value} value={tab.value} className="outline-none focus-visible:ring-2 focus-visible:ring-brand">{tab.content}</TabsPrimitive.Content>)}</TabsPrimitive.Root>;
}
export function Accordion({ items }: { items: { value: string; title: string; content: ReactNode }[] }) {
  return <AccordionPrimitive.Root type="multiple" className="divide-y rounded-xl border px-4">{items.map(item => <AccordionPrimitive.Item key={item.value} value={item.value}><AccordionPrimitive.Header><AccordionPrimitive.Trigger className="group flex min-h-11 w-full items-center justify-between gap-3 py-3 text-start font-medium"><span>{item.title}</span><ChevronDown size={18} className="shrink-0 transition-transform group-data-[state=open]:rotate-180" /></AccordionPrimitive.Trigger></AccordionPrimitive.Header><AccordionPrimitive.Content className="pb-4 text-gray-600">{item.content}</AccordionPrimitive.Content></AccordionPrimitive.Item>)}</AccordionPrimitive.Root>;
}
