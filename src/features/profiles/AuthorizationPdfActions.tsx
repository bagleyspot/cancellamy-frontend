import { useMutation } from '@tanstack/react-query';
import { Download, FileText } from 'lucide-react';
import { api } from '@/api/endpoints';
import { it } from '@/i18n/it';
import { downloadBlob, openPdfInNewTab } from '@/lib/files';
import { Button } from '@/components/ui/Button';

/** The PDF endpoint needs the Bearer header, so it is fetched as a blob and opened through an object URL. */
export function AuthorizationPdfActions({ profileId }: { profileId: string }) {
  const t = it.profiles.auth;
  const open = useMutation({
    mutationFn: () => openPdfInNewTab(() => api.profiles.authorizationPdf(profileId), 'delega.pdf'),
  });
  const download = useMutation({
    mutationFn: async () => downloadBlob(await api.profiles.authorizationPdf(profileId), 'delega.pdf'),
  });
  const failed = open.isError || download.isError;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={() => open.mutate()} loading={open.isPending}>
          <FileText className="h-4 w-4" aria-hidden="true" />
          {t.pdfView}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => download.mutate()} loading={download.isPending}>
          <Download className="h-4 w-4" aria-hidden="true" />
          {t.pdfDownload}
        </Button>
      </div>
      {failed && (
        <p role="alert" className="text-sm font-medium text-danger">
          {t.pdfError}
        </p>
      )}
    </div>
  );
}
