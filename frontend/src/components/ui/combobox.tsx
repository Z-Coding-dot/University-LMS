import { useId, useRef, useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from './button';
import { Input, type SelectOption } from './fields';
import { Popover } from './overlays';
export function Combobox({ value, onChange, options, label, disabled }: { value: string; onChange: (value: string) => void; options: SelectOption[]; label: string; disabled?: boolean }) {
  const { t } = useTranslation(); const [open, setOpen] = useState(false); const [search, setSearch] = useState('');
  const [active, setActive] = useState(0); const listId = useId(); const input = useRef<HTMLInputElement>(null);
  const filtered = options.filter(option => option.label.toLocaleLowerCase().includes(search.toLocaleLowerCase()) && !option.disabled);
  const choose = (next: string) => { onChange(next); setOpen(false); setSearch(''); setActive(0); };
  return <Popover open={open} onOpenChange={setOpen} trigger={<Button variant="secondary" disabled={disabled} className="w-full justify-between" aria-label={label} aria-expanded={open} aria-haspopup="listbox">{options.find(option => option.value === value)?.label ?? t('select')}<ChevronsUpDown size={16} /></Button>}>
    <Input ref={input} role="combobox" aria-label={label} autoFocus value={search} aria-controls={listId} aria-expanded={open} aria-autocomplete="list" aria-activedescendant={filtered[active] ? `${listId}-${active}` : undefined} placeholder={t('search')} onChange={event => { setSearch(event.target.value); setActive(0); }} onKeyDown={event => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); setActive(index => Math.max(0, Math.min(filtered.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1)))); }
      if (event.key === 'Enter' && filtered[active]) { event.preventDefault(); choose(filtered[active].value); }
    }} />
    <div id={listId} role="listbox" aria-label={label} className="mt-2 max-h-60 overflow-auto">{filtered.map((option, index) => <div key={option.value} id={`${listId}-${index}`} role="option" aria-selected={option.value === value} className={`flex min-h-11 cursor-pointer items-center justify-between rounded-lg px-3 ${index === active ? 'bg-orange-50' : ''}`} onMouseDown={event => event.preventDefault()} onPointerMove={() => setActive(index)} onClick={() => choose(option.value)}>{option.label}{option.value === value && <Check size={16} />}</div>)}{!filtered.length && <p className="p-3 text-gray-500">{t('noOptions')}</p>}</div>
  </Popover>;
}
