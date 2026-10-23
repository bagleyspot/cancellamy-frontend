import type { BlobResult } from '@/api/http';

const REVOKE_DELAY_MS = 60_000;

export function downloadBlob({ blob, filename }: BlobResult, fallbackName: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename ?? fallbackName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), REVOKE_DELAY_MS);
}

/**
 * Opens a Bearer-protected PDF in a new tab. The tab is opened synchronously (inside the click handler)
 * so popup blockers allow it, then pointed at the blob once downloaded. Falls back to a download.
 */
export async function openPdfInNewTab(fetcher: () => Promise<BlobResult>, fallbackName: string): Promise<void> {
  const tab = window.open('', '_blank');
  try {
    const result = await fetcher();
    const pdf = new Blob([result.blob], { type: 'application/pdf' });
    if (!tab) {
      downloadBlob({ blob: pdf, filename: result.filename }, fallbackName);
      return;
    }
    const objectUrl = URL.createObjectURL(pdf);
    tab.location.href = objectUrl;
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), REVOKE_DELAY_MS);
  } catch (error) {
    tab?.close();
    throw error;
  }
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
