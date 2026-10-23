import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import type { Tone } from '@/lib/requestStatus';

const TONES: Record<Tone, string> = {
  neutral: 'bg-sunken text-fg font-medium border-line',
  info: 'bg-primary-soft text-primary font-semibold border-primary/30',
  success: 'bg-success-soft text-success font-semibold border-success/30',
  warning: 'bg-warning-soft text-warning font-semibold border-warning/30',
  danger: 'bg-danger-soft text-danger font-semibold border-danger/30',
  accent: 'bg-accent-soft text-accent font-semibold border-accent/30',
};

export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium tracking-[-0.005em]',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
