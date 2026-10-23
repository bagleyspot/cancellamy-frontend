import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from './endpoints';
import type { AdminBrokerListQuery, BrokerListQuery, DelistingListQuery, LeaderboardQuery, PageQuery } from './endpoints';
import type { BreachSummaryDto, FeatureFlags, ListRequestsQuery } from './types';

export const queryKeys = {
  config: ['config'] as const,
  brokerStats: ['brokers', 'stats'] as const,
  brokers: (query: BrokerListQuery) => ['brokers', 'list', query] as const,
  profiles: ['profiles'] as const,
  profile: (id: string) => ['profiles', id] as const,
  authorizationText: (id: string) => ['profiles', id, 'authorization-text'] as const,
  requestsRoot: ['requests'] as const,
  requests: (query: ListRequestsQuery) => ['requests', 'list', query] as const,
  request: (id: string) => ['requests', 'detail', id] as const,
  summary: (profileId: string | undefined) => ['requests', 'summary', profileId ?? null] as const,
  complaint: (id: string) => ['requests', 'complaint', id] as const,
  notificationsRoot: ['notifications'] as const,
  notifications: (query: PageQuery & { unread?: boolean }) => ['notifications', 'list', query] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
  reports: (profileId: string | undefined) => ['reports', profileId ?? null] as const,
  sender: (profileId: string) => ['profiles', profileId, 'sender'] as const,
  identity: (profileId: string) => ['profiles', profileId, 'identity'] as const,
  breaches: (profileId: string) => ['profiles', profileId, 'breaches'] as const,
  dataMap: (profileId: string) => ['profiles', profileId, 'data-map'] as const,
  delistingsRoot: ['delistings'] as const,
  delistings: (query: DelistingListQuery) => ['delistings', 'list', query] as const,
  delisting: (id: string) => ['delistings', 'detail', id] as const,
  delistingGuide: (id: string) => ['delistings', 'guide', id] as const,
  leaderboard: (query: LeaderboardQuery) => ['brokers', 'leaderboard', query] as const,
  nuisance: (profileId: string) => ['nuisance', profileId] as const,
  adminStats: ['admin', 'stats'] as const,
  adminBrokers: (query: AdminBrokerListQuery) => ['admin', 'brokers', query] as const,
  adminUnmatched: ['admin', 'unmatched'] as const,
  adminOutbox: (query: PageQuery) => ['admin', 'outbox', query] as const,
};

export const useConfig = () =>
  useQuery({ queryKey: queryKeys.config, queryFn: api.config, staleTime: 5 * 60_000 });

/** All features off until the config is loaded (and when it cannot be loaded): optional UI stays hidden. */
export const NO_FEATURES: FeatureFlags = {
  senderSmtp: false,
  dossier: false,
  dossierTimestamp: false,
  accessRequests: false,
  identityPhone: false,
  breachCheck: false,
  delisting: false,
  leaderboard: false,
  nuisance: false,
};

export function useFeatures(): { features: FeatureFlags; isLoading: boolean } {
  const { data, isPending } = useConfig();
  return { features: data?.features ?? NO_FEATURES, isLoading: isPending };
}

export const useBrokerStats = () => useQuery({ queryKey: queryKeys.brokerStats, queryFn: api.brokers.stats });

export const useBrokers = (query: BrokerListQuery) =>
  useQuery({
    queryKey: queryKeys.brokers(query),
    queryFn: () => api.brokers.list(query),
    placeholderData: keepPreviousData,
  });

export const useProfiles = (enabled = true) =>
  useQuery({ queryKey: queryKeys.profiles, queryFn: api.profiles.list, enabled });

export const useProfile = (id: string) =>
  useQuery({ queryKey: queryKeys.profile(id), queryFn: () => api.profiles.get(id) });

export const useAuthorizationText = (id: string) =>
  useQuery({ queryKey: queryKeys.authorizationText(id), queryFn: () => api.profiles.authorizationText(id) });

export const useSummary = (profileId: string | undefined, enabled = true) =>
  useQuery({
    queryKey: queryKeys.summary(profileId),
    queryFn: () => api.requests.summary(profileId),
    enabled,
  });

export const useRequests = (query: ListRequestsQuery, enabled = true) =>
  useQuery({
    queryKey: queryKeys.requests(query),
    queryFn: () => api.requests.list(query),
    placeholderData: keepPreviousData,
    enabled,
  });

export const useRequest = (id: string) =>
  useQuery({ queryKey: queryKeys.request(id), queryFn: () => api.requests.get(id) });

export const useNotifications = (query: PageQuery & { unread?: boolean }) =>
  useQuery({
    queryKey: queryKeys.notifications(query),
    queryFn: () => api.notifications.list(query),
    placeholderData: keepPreviousData,
  });

export const UNREAD_POLL_MS = 60_000;

export const useUnreadCount = (enabled: boolean) =>
  useQuery({
    queryKey: queryKeys.unreadCount,
    queryFn: api.notifications.unreadCount,
    enabled,
    refetchInterval: UNREAD_POLL_MS,
  });

export const useReports = (profileId: string | undefined) =>
  useQuery({
    queryKey: queryKeys.reports(profileId),
    queryFn: () => api.reports.list(profileId),
    enabled: profileId !== undefined,
  });

export const useAdminStats = () => useQuery({ queryKey: queryKeys.adminStats, queryFn: api.admin.stats });

export const useAdminBrokers = (query: AdminBrokerListQuery) =>
  useQuery({
    queryKey: queryKeys.adminBrokers(query),
    queryFn: () => api.admin.brokers(query),
    placeholderData: keepPreviousData,
  });

export const useUnmatchedInbound = () =>
  useQuery({ queryKey: queryKeys.adminUnmatched, queryFn: api.admin.unmatched });

export const useOutbox = (query: PageQuery) =>
  useQuery({
    queryKey: queryKeys.adminOutbox(query),
    queryFn: () => api.admin.outbox(query),
    placeholderData: keepPreviousData,
  });

export const useBrokerLeaderboard = (query: LeaderboardQuery) =>
  useQuery({
    queryKey: queryKeys.leaderboard(query),
    queryFn: () => api.brokers.leaderboard(query),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

export const useSender = (profileId: string, enabled = true) =>
  useQuery({ queryKey: queryKeys.sender(profileId), queryFn: () => api.profiles.sender.get(profileId), enabled });

export const useIdentity = (profileId: string) =>
  useQuery({ queryKey: queryKeys.identity(profileId), queryFn: () => api.profiles.identity.get(profileId) });

export const BREACH_POLL_MS = 5_000;

const hasPendingCheck = (data: BreachSummaryDto | undefined) => data?.emails.some((entry) => entry.status === 'pending') ?? false;

/** Polls while any email is still being checked by the backend. */
export const useBreaches = (profileId: string, enabled = true) =>
  useQuery({
    queryKey: queryKeys.breaches(profileId),
    queryFn: () => api.profiles.breaches.get(profileId),
    enabled,
    refetchInterval: (query) => (hasPendingCheck(query.state.data) ? BREACH_POLL_MS : false),
  });

export const useDataMap = (profileId: string | undefined, enabled = true) =>
  useQuery({
    queryKey: queryKeys.dataMap(profileId ?? ''),
    queryFn: () => api.profiles.dataMap(profileId ?? ''),
    enabled: enabled && profileId !== undefined,
  });

export const useDelistings = (query: DelistingListQuery, enabled = true) =>
  useQuery({
    queryKey: queryKeys.delistings(query),
    queryFn: () => api.delistings.list(query),
    placeholderData: keepPreviousData,
    enabled,
  });

export const useDelisting = (id: string | null) =>
  useQuery({
    queryKey: queryKeys.delisting(id ?? ''),
    queryFn: () => api.delistings.get(id ?? ''),
    enabled: id !== null,
  });

export const useDelistingGuide = (id: string | null) =>
  useQuery({
    queryKey: queryKeys.delistingGuide(id ?? ''),
    queryFn: () => api.delistings.guide(id ?? ''),
    enabled: id !== null,
    staleTime: 10 * 60_000,
  });

export const useNuisance = (profileId: string | undefined) =>
  useQuery({
    queryKey: queryKeys.nuisance(profileId ?? ''),
    queryFn: () => api.nuisance.overview(profileId ?? ''),
    enabled: profileId !== undefined,
  });
