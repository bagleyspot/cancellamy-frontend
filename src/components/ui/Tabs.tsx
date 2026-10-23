import type { KeyboardEvent, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface TabItem<Id extends string> {
  id: Id;
  label: string;
  badge?: ReactNode;
}

interface TabsProps<Id extends string> {
  tabs: readonly TabItem<Id>[];
  value: Id;
  onChange: (id: Id) => void;
  ariaLabel: string;
  idPrefix: string;
}

export const tabId = (prefix: string, id: string) => `${prefix}-tab-${id}`;
export const panelId = (prefix: string, id: string) => `${prefix}-panel-${id}`;

/** WAI-ARIA tabs with roving tabindex and arrow-key navigation. */
export function Tabs<Id extends string>({ tabs, value, onChange, ariaLabel, idPrefix }: TabsProps<Id>) {
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = tabs.findIndex((tab) => tab.id === value);
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault();
    const target = tabs[next];
    if (target) {
      onChange(target.id);
      document.getElementById(tabId(idPrefix, target.id))?.focus();
    }
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      className="inline-flex max-w-full gap-1 overflow-x-auto rounded-lg border border-line bg-sunken/80 p-1"
    >
      {tabs.map((tab) => {
        const selected = tab.id === value;
        return (
          <button
            key={tab.id}
            id={tabId(idPrefix, tab.id)}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={panelId(idPrefix, tab.id)}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex min-h-9 shrink-0 items-center gap-2 rounded-md px-3.5 text-sm font-medium transition-all',
              selected ? 'bg-surface text-fg shadow-2xs ring-1 ring-line' : 'text-muted hover:text-fg',
            )}
          >
            {tab.label}
            {tab.badge}
          </button>
        );
      })}
    </div>
  );
}
