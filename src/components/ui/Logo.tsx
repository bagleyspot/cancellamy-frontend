import { cn } from '@/lib/cn';
import { it } from '@/i18n/it';

/** Geometric privacy mark: precision shield with a clean redaction/erasure bar. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('h-7 w-7 shrink-0', className)} aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="8" fill="var(--primary)" />
      <path
        d="M16 5.5 7.5 9v6.6c0 5.6 3.7 9.9 8.5 11.4 4.8-1.5 8.5-5.8 8.5-11.4V9L16 5.5Z"
        fill="none"
        stroke="var(--primary-fg)"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <rect x="11" y="14.2" width="10" height="3.2" rx="1.6" fill="var(--primary-fg)" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark />
      <span className="text-[1.125rem] font-bold tracking-[-0.03em] text-fg">{it.brand.name}</span>
    </span>
  );
}
