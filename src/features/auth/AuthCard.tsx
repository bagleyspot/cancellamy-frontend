import type { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';

export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="cnc-soft-mesh flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12 sm:py-16">
      <div className="w-full max-w-md">
        <Card className="space-y-6 border-line/90 p-6 shadow-md sm:p-8">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-[-0.025em] text-fg">{title}</h1>
            {subtitle && <p className="text-sm leading-relaxed text-muted">{subtitle}</p>}
          </div>
          {children}
        </Card>
      </div>
    </div>
  );
}
