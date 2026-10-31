import { FlaskConical, Mail } from 'lucide-react';
import { useConfig } from '@/api/queries';
import { it } from '@/i18n/it';

/** Tells the user when emails do not go out the usual way: nothing leaves (dry-run) or only the own mailbox is used. */
export function DryRunBanner() {
  const { data } = useConfig();
  if (data?.mailMode === 'dry-run') {
    return (
      <div role="status" className="border-b border-warning/25 bg-warning-soft px-4 py-2 text-xs text-fg">
        <div className="mx-auto flex max-w-6xl items-center gap-2">
          <FlaskConical className="h-3.5 w-3.5 shrink-0 text-warning" aria-hidden="true" />
          <p>
            <strong className="font-semibold text-warning">{it.banner.dryRun}</strong>
            <span className="hidden text-muted sm:inline"> · {it.banner.dryRunHint}</span>
          </p>
        </div>
      </div>
    );
  }
  if (data?.mailMode === 'mailbox') {
    const redirect = data.mailRedirect;
    return (
      <div role="status" className="border-b border-primary/25 bg-primary-soft px-4 py-2 text-xs text-fg">
        <div className="mx-auto flex max-w-6xl items-center gap-2">
          <Mail className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
          <p>
            <strong className="font-semibold text-primary">{redirect ? it.banner.mailboxRedirect : it.banner.mailbox}</strong>
            <span className="hidden text-muted sm:inline"> · {redirect ? it.banner.mailboxRedirectHint : it.banner.mailboxHint}</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
}
