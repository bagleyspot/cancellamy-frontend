import { request, requestBlob } from './http';
import type {
  AccessFindingsInput,
  ActivateProfileResponse,
  AdminBrokerPatch,
  AdminStatsDto,
  AuthResponse,
  AuthorizationDto,
  AuthorizationTextDto,
  AutoVerifyResultDto,
  BreachSummaryDto,
  BrokerCategory,
  BrokerDto,
  BrokerStatsDto,
  ChangePasswordRequest,
  ComplaintDto,
  ConfirmCodeRequest,
  CreateAccessRequestsInput,
  CreateAccessRequestsResponse,
  CustomRequestInput,
  DataMapDto,
  DelistingDto,
  DelistingGuideDto,
  DelistingInput,
  DelistingPatch,
  DelistingStatus,
  DeleteAccountRequest,
  ForgotPasswordRequest,
  IdentityDto,
  LeaderboardDto,
  LeaderboardSort,
  ListRequestsQuery,
  LoginRequest,
  NotificationDto,
  NuisanceComplaintRequest,
  NuisanceOverviewDto,
  NuisanceReportDto,
  NuisanceReportInput,
  OutboxItemDto,
  OutcomeRequest,
  Paginated,
  ProfileDto,
  ProfileInput,
  PublicConfigDto,
  RegisterRequest,
  ReportDto,
  RequestDetail,
  RequestListItem,
  ResetPasswordRequest,
  SendCodeRequest,
  SenderDto,
  SetSenderRequest,
  SignAuthorizationRequest,
  SimulateReplyRequest,
  SmtpSettingsInput,
  SummaryDto,
  TokenRequest,
  UnmatchedInboundDto,
  UpdateMeRequest,
  UserDto,
  VerificationStatus,
} from './types';

export interface BrokerListQuery {
  q?: string;
  category?: BrokerCategory;
  status?: VerificationStatus;
  sendable?: boolean;
  page?: number;
  limit?: number;
}

export interface AdminBrokerListQuery {
  q?: string;
  category?: BrokerCategory;
  status?: VerificationStatus;
  page?: number;
  limit?: number;
}

export interface PageQuery {
  page?: number;
  limit?: number;
}

export interface DelistingListQuery extends PageQuery {
  profileId?: string;
  status?: DelistingStatus;
}

/** `order` is accepted by GET /brokers/leaderboard but is not part of the shared types: it is defined here. */
export interface LeaderboardQuery {
  sort?: LeaderboardSort;
  order?: 'asc' | 'desc';
  category?: BrokerCategory;
}

/** Every backend call of the app, typed against src/api/types.ts. A contract change is a change here. */
export const api = {
  config: () => request<PublicConfigDto>('GET', '/config'),

  auth: {
    register: (body: RegisterRequest) => request<AuthResponse>('POST', '/auth/register', { body }),
    login: (body: LoginRequest) => request<AuthResponse>('POST', '/auth/login', { body }),
    logout: () => request<void>('POST', '/auth/logout'),
    verifyEmail: (body: TokenRequest) => request<void>('POST', '/auth/verify-email', { body }),
    resendVerification: () => request<void>('POST', '/auth/resend-verification'),
    forgotPassword: (body: ForgotPasswordRequest) => request<void>('POST', '/auth/forgot-password', { body }),
    resetPassword: (body: ResetPasswordRequest) => request<void>('POST', '/auth/reset-password', { body }),
  },

  me: {
    get: () => request<UserDto>('GET', '/me'),
    update: (body: UpdateMeRequest) => request<UserDto>('PATCH', '/me', { body }),
    changePassword: (body: ChangePasswordRequest) => request<void>('POST', '/me/change-password', { body }),
    export: () => requestBlob('/me/export'),
    delete: (body: DeleteAccountRequest) => request<void>('DELETE', '/me', { body }),
  },

  profiles: {
    list: () => request<ProfileDto[]>('GET', '/profiles'),
    get: (id: string) => request<ProfileDto>('GET', `/profiles/${id}`),
    create: (body: ProfileInput) => request<ProfileDto>('POST', '/profiles', { body }),
    update: (id: string, body: Partial<ProfileInput>) => request<ProfileDto>('PATCH', `/profiles/${id}`, { body }),
    remove: (id: string) => request<void>('DELETE', `/profiles/${id}`),
    authorizationText: (id: string) => request<AuthorizationTextDto>('GET', `/profiles/${id}/authorization/text`),
    sign: (id: string, body: SignAuthorizationRequest) =>
      request<AuthorizationDto>('POST', `/profiles/${id}/authorization`, { body }),
    authorizationPdf: (id: string) => requestBlob(`/profiles/${id}/authorization/pdf`),
    revokeAuthorization: (id: string) => request<void>('DELETE', `/profiles/${id}/authorization`),
    activate: (id: string) => request<ActivateProfileResponse>('POST', `/profiles/${id}/activate`),
    pause: (id: string) => request<ProfileDto>('POST', `/profiles/${id}/pause`),
    resume: (id: string) => request<ProfileDto>('POST', `/profiles/${id}/resume`),

    sender: {
      get: (id: string) => request<SenderDto>('GET', `/profiles/${id}/sender`),
      set: (id: string, body: SetSenderRequest) => request<SenderDto>('PUT', `/profiles/${id}/sender`, { body }),
      test: (id: string, body?: SmtpSettingsInput) =>
        request<{ ok: true }>('POST', `/profiles/${id}/sender/test`, body ? { body } : {}),
      reset: (id: string) => request<SenderDto>('DELETE', `/profiles/${id}/sender`),
    },
    identity: {
      get: (id: string) => request<IdentityDto>('GET', `/profiles/${id}/identity`),
      sendCode: (id: string, body: SendCodeRequest) => request<void>('POST', `/profiles/${id}/identity/send-code`, { body }),
      confirm: (id: string, body: ConfirmCodeRequest) => request<IdentityDto>('POST', `/profiles/${id}/identity/confirm`, { body }),
    },
    dataMap: (id: string) => request<DataMapDto>('GET', `/profiles/${id}/data-map`),
    breaches: {
      get: (id: string) => request<BreachSummaryDto>('GET', `/profiles/${id}/breaches`),
      check: (id: string) => request<{ queued: number }>('POST', `/profiles/${id}/breaches/check`),
    },
  },

  requests: {
    list: (query: ListRequestsQuery) => request<Paginated<RequestListItem>>('GET', '/requests', { query }),
    summary: (profileId?: string) => request<SummaryDto>('GET', '/requests/summary', { query: { profileId } }),
    get: (id: string) => request<RequestDetail>('GET', `/requests/${id}`),
    createCustom: (body: CustomRequestInput) => request<RequestListItem>('POST', '/requests/custom', { body }),
    markDone: (id: string) => request<RequestDetail>('POST', `/requests/${id}/mark-done`),
    outcome: (id: string, body: OutcomeRequest) => request<RequestDetail>('POST', `/requests/${id}/outcome`, { body }),
    provideId: (id: string, file: File, note?: string) => {
      const formData = new FormData();
      formData.append('file', file);
      if (note) formData.append('note', note);
      return request<RequestDetail>('POST', `/requests/${id}/provide-id`, { formData });
    },
    remind: (id: string) => request<RequestDetail>('POST', `/requests/${id}/reminder`),
    escalate: (id: string) => request<ComplaintDto>('POST', `/requests/${id}/escalate`),
    complaintPdf: (id: string) => requestBlob(`/requests/${id}/complaint.pdf`),
    cancel: (id: string) => request<RequestDetail>('POST', `/requests/${id}/cancel`),
    simulateReply: (id: string, body: SimulateReplyRequest) =>
      request<RequestDetail>('POST', `/requests/${id}/simulate-reply`, { body }),
    dossier: (id: string, timestamp: boolean) => requestBlob(`/requests/${id}/dossier.zip`, { timestamp }),
    attachment: (id: string, messageId: string, attachmentId: string) =>
      requestBlob(`/requests/${id}/messages/${messageId}/attachments/${attachmentId}`),
    createAccess: (body: CreateAccessRequestsInput) =>
      request<CreateAccessRequestsResponse>('POST', '/requests/access', { body }),
    putFindings: (id: string, body: AccessFindingsInput) => request<RequestDetail>('PUT', `/requests/${id}/findings`, { body }),
  },

  delistings: {
    list: (query: DelistingListQuery) => request<Paginated<DelistingDto>>('GET', '/delistings', { query }),
    get: (id: string) => request<DelistingDto>('GET', `/delistings/${id}`),
    guide: (id: string) => request<DelistingGuideDto>('GET', `/delistings/${id}/guide`),
    create: (body: DelistingInput) => request<DelistingDto>('POST', '/delistings', { body }),
    patch: (id: string, body: DelistingPatch) => request<DelistingDto>('PATCH', `/delistings/${id}`, { body }),
    remove: (id: string) => request<void>('DELETE', `/delistings/${id}`),
  },

  nuisance: {
    overview: (profileId: string) => request<NuisanceOverviewDto>('GET', '/nuisance', { query: { profileId } }),
    create: (body: NuisanceReportInput) => request<NuisanceReportDto>('POST', '/nuisance', { body }),
    remove: (id: string) => request<void>('DELETE', `/nuisance/${id}`),
    complaint: (body: NuisanceComplaintRequest) => request<ComplaintDto>('POST', '/nuisance/complaint', { body }),
    complaintPdf: (profileId: string) => requestBlob('/nuisance/complaint.pdf', { profileId }),
  },

  brokers: {
    list: (query: BrokerListQuery) => request<Paginated<BrokerDto>>('GET', '/brokers', { query }),
    stats: () => request<BrokerStatsDto>('GET', '/brokers/stats'),
    get: (id: string) => request<BrokerDto>('GET', `/brokers/${id}`),
    leaderboard: (query: LeaderboardQuery) => request<LeaderboardDto>('GET', '/brokers/leaderboard', { query }),
  },

  notifications: {
    list: (query: PageQuery & { unread?: boolean }) =>
      request<Paginated<NotificationDto>>('GET', '/notifications', { query }),
    unreadCount: () => request<{ count: number }>('GET', '/notifications/unread-count'),
    markRead: (ids?: string[]) => request<void>('POST', '/notifications/read', { body: ids ? { ids } : {} }),
  },

  reports: {
    list: (profileId?: string) => request<ReportDto[]>('GET', '/reports', { query: { profileId } }),
    generate: (profileId: string) => request<ReportDto>('POST', '/reports/generate', { body: { profileId } }),
  },

  admin: {
    stats: () => request<AdminStatsDto>('GET', '/admin/stats'),
    brokers: (query: AdminBrokerListQuery) => request<Paginated<BrokerDto>>('GET', '/admin/brokers', { query }),
    patchBroker: (id: string, body: AdminBrokerPatch) => request<BrokerDto>('PATCH', `/admin/brokers/${id}`, { body }),
    reseed: () => request<{ created: number; updated: number }>('POST', '/admin/brokers/reseed'),
    autoVerify: (crawlWebsites = true) =>
      request<AutoVerifyResultDto>('POST', '/admin/brokers/auto-verify', { body: { crawlWebsites } }),
    unmatched: () => request<UnmatchedInboundDto[]>('GET', '/admin/inbound-unmatched'),
    assignInbound: (id: string, requestId: string) =>
      request<void>('POST', `/admin/inbound-unmatched/${id}/assign`, { body: { requestId } }),
    outbox: (query: PageQuery) => request<Paginated<OutboxItemDto>>('GET', '/admin/outbox', { query }),
  },
};
