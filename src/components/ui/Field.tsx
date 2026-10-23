import { useId } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface FieldShellProps {
  id: string;
  label: ReactNode;
  error?: string | undefined;
  hint?: ReactNode;
  children: ReactNode;
}

function FieldShell({ id, label, error, hint, children }: FieldShellProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-fg">
        {label}
      </label>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

const CONTROL =
  'block w-full rounded-lg border bg-surface px-3.5 py-2 text-sm text-fg shadow-2xs transition-colors placeholder:text-muted/65 focus:border-primary disabled:opacity-60';

function controlClass(error: string | undefined, extra?: string): string {
  return cn(CONTROL, error ? 'border-danger' : 'border-line hover:border-muted/60', extra);
}

function describedBy(id: string, error?: string, hint?: ReactNode): string | undefined {
  const ids = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean);
  return ids.length > 0 ? ids.join(' ') : undefined;
}

interface CommonFieldProps {
  label: ReactNode;
  error?: string | undefined;
  hint?: ReactNode;
}

export function TextField({ label, error, hint, className, id: idProp, ...rest }: CommonFieldProps & ComponentProps<'input'>) {
  const generated = useId();
  const id = idProp ?? generated;
  return (
    <FieldShell id={id} label={label} error={error} hint={hint}>
      <input
        id={id}
        className={controlClass(error, className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        {...rest}
      />
    </FieldShell>
  );
}

export function TextAreaField({ label, error, hint, className, id: idProp, ...rest }: CommonFieldProps & ComponentProps<'textarea'>) {
  const generated = useId();
  const id = idProp ?? generated;
  return (
    <FieldShell id={id} label={label} error={error} hint={hint}>
      <textarea
        id={id}
        rows={4}
        className={controlClass(error, className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        {...rest}
      />
    </FieldShell>
  );
}

export function SelectField({ label, error, hint, className, id: idProp, children, ...rest }: CommonFieldProps & ComponentProps<'select'>) {
  const generated = useId();
  const id = idProp ?? generated;
  return (
    <FieldShell id={id} label={label} error={error} hint={hint}>
      <select
        id={id}
        className={controlClass(error, className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        {...rest}
      >
        {children}
      </select>
    </FieldShell>
  );
}

export function CheckboxField({ label, error, hint, className, id: idProp, ...rest }: CommonFieldProps & ComponentProps<'input'>) {
  const generated = useId();
  const id = idProp ?? generated;
  return (
    <div className="space-y-1.5">
      <div className="flex items-start gap-3">
        <input
          id={id}
          type="checkbox"
          className={cn('mt-0.5 h-5 w-5 shrink-0 rounded border-line accent-primary', className)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, hint)}
          {...rest}
        />
        <label htmlFor={id} className="text-sm leading-snug text-fg">
          {label}
        </label>
      </div>
      {hint && (
        <p id={`${id}-hint`} className="pl-8 text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="pl-8 text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
