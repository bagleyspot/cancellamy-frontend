import { useFeatures } from '@/api/queries';
import type { FeatureFlags } from '@/api/types';
import { it } from '@/i18n/it';
import { ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Steps } from './Steps';

function BulletCard({ title, items }: { title: string; items: readonly string[] }) {
  return (
    <Card className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      <ul className="list-disc space-y-2 pl-5 text-sm text-muted">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </Card>
  );
}

const EXTRAS: (keyof typeof it.howItWorks.extras)[] = ['accessRequests', 'dossier', 'delisting', 'nuisance', 'senderSmtp', 'breachCheck', 'leaderboard'];

/** Short mention of the optional capabilities; only the ones this instance has enabled. */
function Extras({ features }: { features: FeatureFlags }) {
  const t = it.howItWorks;
  const enabled = EXTRAS.filter((key) => features[key]);
  if (enabled.length === 0) return null;
  return (
    <section aria-labelledby="extras" className="space-y-4">
      <div className="max-w-3xl space-y-1">
        <h2 id="extras" className="text-2xl font-semibold tracking-tight">
          {t.extrasTitle}
        </h2>
        <p className="text-muted">{t.extrasIntro}</p>
      </div>
      <ul className="grid gap-4 md:grid-cols-2">
        {enabled.map((key) => (
          <li key={key}>
            <Card className="h-full space-y-1">
              <h3 className="font-semibold">{t.extras[key].title}</h3>
              <p className="text-sm text-muted">{t.extras[key].body}</p>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function HowItWorksPage() {
  const t = it.howItWorks;
  const { features } = useFeatures();
  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-12 sm:px-6 sm:py-16">
      <header className="max-w-3xl space-y-3 border-b border-line pb-8">
        <span className="inline-flex items-center rounded-md bg-primary-soft px-2.5 py-1 font-mono text-xs font-semibold text-primary">
          Procedura e garanzie GDPR
        </span>
        <h1 className="text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">{t.title}</h1>
        <p className="text-base leading-relaxed text-muted sm:text-lg">{t.intro}</p>
      </header>

      <Steps items={t.steps} />

      <Card className="space-y-2 border-primary/20 bg-primary-soft/50">
        <h2 className="text-lg font-bold tracking-tight text-fg">{t.gdpr.title}</h2>
        <p className="text-sm leading-relaxed text-muted sm:text-base">{t.gdpr.body}</p>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <BulletCard title={t.afterTitle} items={t.after} />
        <BulletCard title={t.humanTitle} items={t.human} />
      </div>

      <Extras features={features} />

      <Card className="flex flex-col items-start justify-between gap-4 bg-sunken/60 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <h2 className="text-lg font-bold tracking-tight">{t.privacyTitle}</h2>
          <p className="text-sm text-muted">{t.privacyBody}</p>
        </div>
        <ButtonLink to="/registrati" className="shrink-0">
          {t.cta}
        </ButtonLink>
      </Card>
    </div>
  );
}
