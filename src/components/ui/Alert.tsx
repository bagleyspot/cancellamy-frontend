import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

type AlertTone = 'info' | 'success' | 'warning' | 'danger';

const STYLES: Record<AlertTone, string> = {
  info: 'bg-primary-soft text-fg border-primary/30',
  success: 'bg-success-soft text-fg border-success/30',
  warning: 'bg-warning-soft text-fg border-warning/30',
  danger: 'bg-danger-soft text-fg border-danger/30',
};

const ICON_STYLES: Record<AlertTone, string> = {
  info: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
};

const ICONS = { info: Info, success: CheckCircle2, warning: AlertTriangle, danger: XCircle } as const;

interface AlertProps {
  tone?: AlertTone;
  title?: string;
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function Alert({ tone = 'info', title, children, actions, className }: AlertProps) {
  const Icon = ICONS[tone];
  return (
    <div
      role={tone === 'danger' || tone === 'warning' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-xl border p-4 text-sm', STYLES[tone], className)}
    >
      <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', ICON_STYLES[tone])} aria-hidden="true" />
      <div className="min-w-0 flex-1 space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="space-y-1 leading-relaxed">{children}</div>}
        {actions && <div className="pt-2">{actions}</div>}
      </div>
    </div>
  );
}
