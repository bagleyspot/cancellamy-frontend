import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

export function Card({ className, ...rest }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'rounded-xl border border-line bg-surface p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-6',
        className,
      )}
      {...rest}
    />
  );
}

export function CardTitle({ className, ...rest }: ComponentProps<'h2'>) {
  return <h2 className={cn('text-base font-semibold tracking-[-0.015em] text-fg', className)} {...rest} />;
}
