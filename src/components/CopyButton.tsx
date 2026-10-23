import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { it } from '@/i18n/it';
import { copyToClipboard } from '@/lib/files';
import { Button } from './ui/Button';

const FEEDBACK_MS = 2500;

export function CopyButton({ text, label = it.common.copy }: { text: string; label?: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    const ok = await copyToClipboard(text);
    setState(ok ? 'copied' : 'failed');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState('idle'), FEEDBACK_MS);
  };

  return (
    <span className="inline-flex items-center gap-2">
      <Button variant="secondary" size="sm" onClick={() => void copy()}>
        {state === 'copied' ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
        {label}
      </Button>
      <span role="status" className="text-sm text-muted">
        {state === 'copied' ? it.common.copied : state === 'failed' ? it.common.copyFailed : ''}
      </span>
    </span>
  );
}
