import { Check } from 'lucide-react';
import { it } from '@/i18n/it';
import { cn } from '@/lib/cn';

/** Horizontal progress indicator; `current` is 1-based. */
export function Stepper({ current }: { current: number }) {
  const steps = it.profiles.steps;
  return (
    <nav aria-label={it.profiles.stepper}>
      <ol className="grid grid-cols-4 gap-2">
        {steps.map((label, index) => {
          const number = index + 1;
          const done = number < current;
          const active = number === current;
          return (
            <li key={label} aria-current={active ? 'step' : undefined} className="space-y-1.5">
              <div className={cn('h-1.5 rounded-full', done || active ? 'bg-primary' : 'bg-line')} aria-hidden="true" />
              <p className={cn('flex items-center gap-1 text-xs font-medium sm:text-sm', active ? 'text-fg' : 'text-muted')}>
                {done ? <Check className="h-4 w-4 text-success" aria-hidden="true" /> : <span aria-hidden="true">{number}.</span>}
                <span>{label}</span>
              </p>
            </li>
          );
        })}
      </ol>
      <p className="sr-only">{it.profiles.stepOf(current, steps.length)}</p>
    </nav>
  );
}
