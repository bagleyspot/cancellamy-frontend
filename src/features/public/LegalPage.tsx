import { useConfig } from '@/api/queries';
import { it } from '@/i18n/it';
import { Alert } from '@/components/ui/Alert';

interface LegalSection {
  title: string;
  paragraphs: readonly string[];
}

interface LegalPageProps {
  title: string;
  sections: readonly LegalSection[];
}

function LegalPage({ title, sections }: LegalPageProps) {
  const { data } = useConfig();
  const t = it.legal;
  return (
    <article className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">{title}</h1>
      <Alert tone="warning">{t.draftNotice}</Alert>
      <p className="text-sm text-muted">{t.updated}</p>
      {sections.map((section) => (
        <section key={section.title} className="space-y-2">
          <h2 className="text-xl font-semibold">{section.title}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph} className="text-muted">
              {paragraph}
            </p>
          ))}
        </section>
      ))}
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">{t.contactTitle}</h2>
        <p className="text-muted">{data ? t.contactBody(data.supportEmail) : t.contactFallback}</p>
      </section>
    </article>
  );
}

export const PrivacyPage = () => <LegalPage title={it.legal.privacy.title} sections={it.legal.privacy.sections} />;
export const TermsPage = () => <LegalPage title={it.legal.terms.title} sections={it.legal.terms.sections} />;
