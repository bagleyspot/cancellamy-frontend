import type { ComponentProps } from 'react';
import { Link } from 'react-router';
import { cn } from '@/lib/cn';
import { Spinner } from './Spinner';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';
type Size = 'md' | 'sm';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-primary text-primary-fg hover:bg-primary-hover border border-transparent shadow-xs',
  secondary: 'bg-surface text-fg border border-line hover:bg-sunken hover:border-muted/40 shadow-2xs',
  ghost: 'bg-transparent text-muted hover:text-fg border border-transparent hover:bg-sunken',
  danger: 'bg-danger-soft text-danger border border-danger/30 hover:bg-danger/15 hover:border-danger/50',
  accent: 'bg-accent text-primary-fg border border-transparent hover:opacity-95 shadow-xs',
};

const SIZES: Record<Size, string> = {
  md: 'min-h-10 px-4 py-2 text-sm',
  sm: 'min-h-8.5 px-3 py-1.5 text-xs',
};

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', extra?: string): string {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-lg font-semibold tracking-[-0.01em] transition-all duration-150',
    'disabled:cursor-not-allowed disabled:opacity-55 aria-disabled:cursor-not-allowed aria-disabled:opacity-55',
    VARIANTS[variant],
    SIZES[size],
    extra,
  );
}

interface ButtonProps extends ComponentProps<'button'> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export function Button({ variant, size, loading = false, disabled, className, children, type = 'button', ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClass(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

interface ButtonLinkProps extends ComponentProps<typeof Link> {
  variant?: Variant;
  size?: Size;
}

export function ButtonLink({ variant, size, className, ...rest }: ButtonLinkProps) {
  return <Link className={buttonClass(variant, size, className)} {...rest} />;
}

interface ExternalLinkProps extends ComponentProps<'a'> {
  variant?: Variant;
  size?: Size;
  asButton?: boolean;
}

export function ExternalLink({ variant, size, asButton = false, className, children, ...rest }: ExternalLinkProps) {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      className={asButton ? buttonClass(variant, size, className) : cn('font-medium text-primary underline underline-offset-2', className)}
      {...rest}
    >
      {children}
    </a>
  );
}
