import { it } from '@/i18n/it';
import type {
  BrokerCategory,
  DataCategory,
  DelistingReason,
  DelistingStatus,
  LeaderboardSort,
  NuisanceChannel,
  RequestArea,
  RequestGroup,
  SearchEngine,
  VerificationStatus,
} from '@/api/types';

export const CATEGORY_OPTIONS = Object.keys(it.categories) as BrokerCategory[];
export const VERIFICATION_OPTIONS = Object.keys(it.verification) as VerificationStatus[];

/** Geographic area filter of the requests list, seen from Italy. */
export const AREA_OPTIONS = Object.keys(it.requests.areas) as RequestArea[];

export function parseArea(value: string | null): RequestArea | undefined {
  return AREA_OPTIONS.find((option) => option === value);
}

export function parseCategory(value: string | null): BrokerCategory | undefined {
  return CATEGORY_OPTIONS.find((option) => option === value);
}

export function parseVerification(value: string | null): VerificationStatus | undefined {
  return VERIFICATION_OPTIONS.find((option) => option === value);
}

export function parseGroup(value: string | null, fallback: RequestGroup): RequestGroup {
  const groups: RequestGroup[] = ['to_send', 'in_progress', 'action_required', 'completed', 'not_removable'];
  return groups.find((option) => option === value) ?? fallback;
}

export function parsePage(value: string | null): number {
  const page = Number.parseInt(value ?? '', 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

export const DATA_CATEGORY_OPTIONS = Object.keys(it.dataCategories) as DataCategory[];
export const SEARCH_ENGINE_OPTIONS = Object.keys(it.delisting.engine) as SearchEngine[];
export const DELISTING_REASON_OPTIONS = Object.keys(it.delisting.reason) as DelistingReason[];
export const DELISTING_STATUS_OPTIONS = Object.keys(it.delisting.status) as DelistingStatus[];
export const NUISANCE_CHANNEL_OPTIONS = Object.keys(it.nuisance.channels) as NuisanceChannel[];
export const LEADERBOARD_SORT_OPTIONS = Object.keys(it.leaderboard.sort) as LeaderboardSort[];

export function parseDelistingStatus(value: string | null): DelistingStatus | undefined {
  return DELISTING_STATUS_OPTIONS.find((option) => option === value);
}

export function parseLeaderboardSort(value: string | null): LeaderboardSort {
  return LEADERBOARD_SORT_OPTIONS.find((option) => option === value) ?? 'responseRate';
}
