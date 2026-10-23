import { cn } from '@/lib/cn';

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('cnc-skeleton rounded-lg bg-sunken', className)} />;
}

/** Wrapper announcing a loading region to assistive technology. */
export function SkeletonGroup({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div role="status" aria-live="polite" aria-label={label} className={className}>
      {children}
    </div>
  );
}

export function SkeletonList({ rows = 4, label }: { rows?: number; label: string }) {
  return (
    <SkeletonGroup label={label} className="space-y-3">
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-16 w-full rounded-xl" />
      ))}
    </SkeletonGroup>
  );
}
