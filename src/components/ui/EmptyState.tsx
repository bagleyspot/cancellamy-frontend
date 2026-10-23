import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
}

export function EmptyState({ title, description, icon: Icon = Inbox, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line bg-surface/60 px-6 py-12 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-line bg-sunken text-muted">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <h2 className="text-base font-semibold tracking-tight text-fg">{title}</h2>
      {description && <p className="max-w-md text-sm text-muted">{description}</p>}
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}
