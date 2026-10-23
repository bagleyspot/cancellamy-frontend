import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import type { Tone } from '@/lib/requestStatus';

const TONES: Record<Tone, string> = {
  neutral: 'bg-sunken text-muted border-line',
  info: 'bg-primary-soft text-primary border-primary/20',
  success: 'bg-success-soft text-success border-success/20',
  warning: 'bg-warning-soft text-warning border-warning/20',
  danger: 'bg-danger-soft text-danger border-danger/20',
  accent: 'bg-accent-soft text-accent border-accent/20',
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
