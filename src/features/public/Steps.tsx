interface StepItem {
  title: string;
  body: string;
}

const STEP_META = [
  { tag: 'Profilo cifrato AES-256-GCM', pill: 'Dati protetti' },
  { tag: 'Mandato ex artt. 17 e 21 GDPR', pill: 'Delega PDF' },
  { tag: 'Invio automatico + guida manuale', pill: 'PEC / Email' },
  { tag: 'Scadenza 30 gg e reclamo Garante', pill: 'Monitoraggio' },
] as const;

export function Steps({ items }: { items: readonly StepItem[] }) {
  return (
    <ol className="grid gap-4 sm:grid-cols-2">
      {items.map((item, index) => {
        const meta = STEP_META[index] ?? { tag: 'Procedura guidata', pill: `Passo ${index + 1}` };
        return (
          <li
            key={item.title}
            className="group relative flex flex-col justify-between gap-5 rounded-xl border border-line bg-surface p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:border-primary/40"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span
                  aria-hidden="true"
                  className="inline-flex h-7 items-center rounded-md bg-primary-soft px-2.5 font-mono text-xs font-semibold text-primary"
                >
                  0{index + 1}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-sunken px-2.5 py-0.5 text-[11px] font-medium text-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
                  {meta.pill}
                </span>
              </div>
              <h3 className="text-lg font-semibold tracking-[-0.015em] text-fg">
                <span className="sr-only">{`${index + 1}. `}</span>
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted">{item.body}</p>
            </div>
            <div className="flex items-center justify-between border-t border-line/70 pt-3 text-xs text-muted">
              <span className="font-mono text-[11px]">{meta.tag}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
