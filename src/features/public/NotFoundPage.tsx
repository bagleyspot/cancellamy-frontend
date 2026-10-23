import { it } from '@/i18n/it';
import { ButtonLink } from '@/components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
      <p className="font-mono text-6xl font-extrabold tracking-tight text-primary" aria-hidden="true">
        404
      </p>
      <h1 className="text-2xl font-bold tracking-tight">{it.notFound.title}</h1>
      <p className="text-sm text-muted sm:text-base">{it.notFound.body}</p>
      <ButtonLink to="/">{it.notFound.cta}</ButtonLink>
    </div>
  );
}
