import { ExternalLink as ExternalLinkIcon } from 'lucide-react';
import type { ManualInstructions as ManualInstructionsDto } from '@/api/types';
import { it } from '@/i18n/it';
import { CopyButton } from '@/components/CopyButton';
import { ExternalLink } from '@/components/ui/Button';

export function ManualInstructions({ manual }: { manual: ManualInstructionsDto }) {
  const t = it.requests.manual;
  return (
    <div className="space-y-4">
      {manual.steps.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">{t.steps}</p>
          <ol className="list-decimal space-y-1.5 pl-5 text-sm">
            {manual.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      )}
      <ul className="space-y-1 text-sm">
        {manual.url && (
          <li>
            <ExternalLink href={manual.url}>
              {t.openUrl}
              <ExternalLinkIcon className="ml-1 inline h-3.5 w-3.5" aria-hidden="true" />
              <span className="sr-only"> {it.common.externalLink}</span>
            </ExternalLink>
          </li>
        )}
        {manual.phone && <li>{t.call(manual.phone)}</li>}
        {manual.email && <li>{t.writeTo(manual.email)}</li>}
      </ul>
      <div className="space-y-2">
        <p className="text-sm font-medium">{t.prefillTitle}</p>
        <p className="text-xs text-muted">{t.prefillHint}</p>
        <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-xl border border-line bg-sunken p-3 text-sm">{manual.prefillText}</pre>
        <CopyButton text={manual.prefillText} />
      </div>
    </div>
  );
}
