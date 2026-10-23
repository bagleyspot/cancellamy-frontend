import type { ReactNode } from 'react';
import { Ban } from 'lucide-react';
import { useFeatures } from '@/api/queries';
import type { FeatureFlags } from '@/api/types';
import { it } from '@/i18n/it';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonList } from '@/components/ui/Skeleton';

interface FeatureRouteProps {
  feature: keyof FeatureFlags;
  /** Where the "back" button of the unavailable screen leads. */
  area?: 'app' | 'public';
  children: ReactNode;
}

/** Renders `children` only when the instance has the feature enabled; otherwise a friendly "not available" screen. */
export function FeatureRoute({ feature, area = 'app', children }: FeatureRouteProps) {
  const { features, isLoading } = useFeatures();
  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6">
        <SkeletonList label={it.common.loading} />
      </div>
    );
  }
  if (!features[feature]) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <EmptyState
          icon={Ban}
          title={it.features.unavailableTitle}
          description={it.features.unavailableBody}
          action={
            <ButtonLink to={area === 'app' ? '/app' : '/'} variant="secondary">
              {area === 'app' ? it.features.unavailableCta : it.features.unavailablePublicCta}
            </ButtonLink>
          }
        />
      </div>
    );
  }
  return <>{children}</>;
}
