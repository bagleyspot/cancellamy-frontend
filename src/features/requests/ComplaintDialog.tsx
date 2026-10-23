import { useMutation } from '@tanstack/react-query';
import { Download, ExternalLink as ExternalLinkIcon } from 'lucide-react';
import type { BlobResult } from '@/api/http';
import type { ComplaintDto } from '@/api/types';
import { it } from '@/i18n/it';
import { downloadBlob } from '@/lib/files';
import { formatDateTime } from '@/lib/format';
import { CopyButton } from '@/components/CopyButton';
import { ApiErrorAlert } from '@/components/ApiErrorAlert';
import { Button, ExternalLink } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';

interface ComplaintDialogProps {
  /** Fetches the (Bearer-protected) PDF of this complaint: the dialog is shared by escalated requests and telemarketing reports. */
  fetchPdf: () => Promise<BlobResult>;
  pdfFileName: string;
  complaint: ComplaintDto | undefined;
  onClose: () => void;
  /** Defaults to "Reclamo preparato". */
  title?: string;
}

export function ComplaintDialog({ fetchPdf, pdfFileName, complaint, onClose, title }: ComplaintDialogProps) {
  const t = it.requests.escalate;
  const pdf = useMutation({
    mutationFn: async () => downloadBlob(await fetchPdf(), pdfFileName),
  });

  return (
    <Dialog
      open={complaint !== undefined}
      onClose={onClose}
      title={title ?? t.done}
      description={complaint ? formatDateTime(complaint.generatedAt) : undefined}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={() => pdf.mutate()} loading={pdf.isPending}>
            <Download className="h-4 w-4" aria-hidden="true" />
            {t.downloadPdf}
          </Button>
          {complaint && (
            <ExternalLink href={complaint.submitUrl} asButton>
              {t.submitOnline}
              <ExternalLinkIcon className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only"> {it.common.externalLink}</span>
            </ExternalLink>
          )}
        </>
      }
    >
      {complaint && (
        <div className="space-y-5">
          <section className="space-y-2">
            <h3 className="text-sm font-semibold">{t.textLabel}</h3>
            <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-xl border border-line bg-sunken p-3 text-sm">{complaint.text}</pre>
            <CopyButton text={complaint.text} />
          </section>
          <section className="space-y-2">
            <h3 className="text-sm font-semibold">{t.stepsTitle}</h3>
            <ol className="list-decimal space-y-1.5 pl-5 text-sm">
              {complaint.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>
          {pdf.isError && <ApiErrorAlert error={pdf.error} />}
        </div>
      )}
    </Dialog>
  );
}
