import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Archive } from 'lucide-react';
import { api } from '@/api/endpoints';
import { useFeatures } from '@/api/queries';
import type { RequestDetail } from '@/api/types';
import { it } from '@/i18n/it';
import { downloadBlob } from '@/lib/files';
import { ApiErrorAlert } from '@/components/ApiErrorAlert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CheckboxField } from '@/components/ui/Field';

/** Evidence dossier (ZIP). The timestamp option exists only when the instance has a timestamp authority. */
export function DossierCard({ detail }: { detail: RequestDetail }) {
  const t = it.dossier;
  const { features } = useFeatures();
  const [timestamp, setTimestamp] = useState(false);
  const download = useMutation({
    mutationFn: async () => downloadBlob(await api.requests.dossier(detail.id, features.dossierTimestamp && timestamp), t.fileName(detail.shortRef)),
  });

  if (!features.dossier) return null;

  return (
    <Card className="space-y-4" aria-labelledby="dossier-title">
      <div className="flex items-center gap-2">
        <Archive className="h-5 w-5 text-primary" aria-hidden="true" />
        <h2 id="dossier-title" className="text-lg font-semibold">
          {t.title}
        </h2>
      </div>
      <p className="text-sm text-muted">{t.body}</p>
      {features.dossierTimestamp && (
        <CheckboxField label={t.timestamp} hint={t.timestampHint} checked={timestamp} onChange={(event) => setTimestamp(event.target.checked)} />
      )}
      <ApiErrorAlert error={download.isError ? download.error : null} />
      <Button variant="secondary" onClick={() => download.mutate()} loading={download.isPending}>
        {t.download}
      </Button>
    </Card>
  );
}
