import { Check } from 'lucide-react';
import { it } from '@/i18n/it';
import { cn } from '@/lib/cn';

/**
 * Horizontal progress indicator; `current` is 1-based on the full four-step flow. Without a delega to sign
 * (`withAuthorization` false) the authorization step is dropped and the later steps shift up.
 */
export function Stepper({ current: fullCurrent, withAuthorization = true }: { current: number; withAuthorization?: boolean }) {
  const steps = withAuthorization ? it.profiles.steps : it.profiles.stepsOwnMailbox;
  const current = !withAuthorization && fullCurrent > 3 ? fullCurrent - 1 : fullCurrent;
  return (
    <nav aria-label={it.profiles.stepper}>
      <ol className="grid gap-2" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
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
