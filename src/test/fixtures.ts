import type {
  AuthorizationTextDto,
  BreachSummaryDto,
  BrokerDto,
  BrokerPerformanceDto,
  BrokerStatsDto,
  DataMapDto,
  DelistingDto,
  DelistingGuideDto,
  FeatureFlags,
  IdentityDto,
  LeaderboardDto,
  MessageDto,
  NotificationDto,
  NuisanceOverviewDto,
  NuisanceReportDto,
  Paginated,
  ProfileDto,
  PublicConfigDto,
  RequestDetail,
  RequestListItem,
  SenderDto,
  SummaryDto,
  UserDto,
} from '@/api/types';

/** Contract-conformant fixtures. Every factory accepts overrides. */

export const TEST_PASSWORD = 'password-molto-lunga';

export function makeUser(overrides: Partial<UserDto> = {}): UserDto {
  return {
    id: 'user-1',
    email: 'mario@example.it',
    role: 'user',
    emailVerified: true,
    maxProfiles: 4,
    settings: { notifyByEmail: true, monthlyReport: false },
    createdAt: '2026-01-10T09:00:00.000Z',
    ...overrides,
  };
}

/** Every optional feature on, as on a fully configured instance. */
export function makeFeatures(overrides: Partial<FeatureFlags> = {}): FeatureFlags {
  return {
    senderSmtp: true,
    senderGmail: false,
    dossier: true,
    dossierTimestamp: true,
    accessRequests: true,
    identityPhone: false,
    breachCheck: true,
    delisting: true,
    leaderboard: true,
    nuisance: true,
    ...overrides,
  };
}

export function makeConfig(overrides: Partial<PublicConfigDto> = {}): PublicConfigDto {
  return {
    features: makeFeatures(),
    leaderboardMinUsers: 5,
    attachmentRetentionDays: 30,
    mailMode: 'resend',
    maxProfiles: 4,
    customRequestsPerMonth: 5,
    appVersion: '0.1.0',
    supportEmail: 'aiuto@cancellamy.example',
    registryEntries: 120,
    sendableBrokers: 40,
    ...overrides,
  };
}

export function makeBroker(overrides: Partial<BrokerDto> = {}): BrokerDto {
  return {
    id: 'broker-1',
    name: 'Pagine Esempio',
    website: 'https://pagine.example',
    category: 'phone_directory',
    hqCountry: 'IT',
    verificationStatus: 'verified',
    lastVerified: '2026-03-01T00:00:00.000Z',
    channelTypes: ['email'],
    channels: [{ type: 'email', value: 'privacy@pagine.example', verified: true }],
    legalBasisNote: 'Art. 17 GDPR: cancellazione senza ingiustificato ritardo.',
    obstacles: 'Può chiedere un documento di identità.',
    idRequested: 'maybe',
    sendEnabled: true,
    notes: null,
    ...overrides,
  };
}

export function makeBrokerStats(overrides: Partial<BrokerStatsDto> = {}): BrokerStatsDto {
  return {
    total: 120,
    sendable: 40,
    italySpecific: 55,
    byCategory: [
      { category: 'phone_directory', count: 12 },
      { category: 'data_broker', count: 30 },
    ],
    byStatus: [{ status: 'verified', count: 90 }],
    ...overrides,
  };
}

export function makeProfile(overrides: Partial<ProfileDto> = {}): ProfileDto {
  return {
    id: 'profile-1',
    identityVerified: true,
    senderMode: 'cancellamy',
    firstName: 'Mario',
    lastName: 'Rossi',
    dateOfBirth: '1985-04-23',
    emails: ['mario@example.it'],
    phones: [],
    addresses: [],
    aliases: [],
    status: 'active',
    authorization: {
      id: 'auth-1',
      signedAt: '2026-02-01T10:00:00.000Z',
      signatureName: 'Mario Rossi',
      textVersion: '1.0',
      revokedAt: null,
    },
    requestCounts: { total: 10, inProgress: 6, actionRequired: 2, completed: 2, notRemovable: 0 },
    createdAt: '2026-01-15T09:00:00.000Z',
    activatedAt: '2026-02-01T10:05:00.000Z',
    ...overrides,
  };
}

export function makeRequestListItem(overrides: Partial<RequestListItem> = {}): RequestListItem {
  return {
    kind: 'erasure',
    id: 'req-1',
    shortRef: 'CNC-7K2P9Q',
    profileId: 'profile-1',
    broker: { id: 'broker-1', name: 'Pagine Esempio', website: 'https://pagine.example', category: 'phone_directory' },
    channel: 'email',
    status: 'sent',
    group: 'in_progress',
    actionReason: null,
    cycle: 1,
    custom: false,
    dryRun: false,
    createdAt: '2026-02-01T10:05:00.000Z',
    sentAt: '2026-02-01T10:06:00.000Z',
    dueAt: '2026-03-03T10:06:00.000Z',
    completedAt: null,
    nextCheckAt: null,
    nextAttemptAt: null,
    lastActivityAt: '2026-02-01T10:06:00.000Z',
    ...overrides,
  };
}

export function makeRequestDetail(overrides: Partial<RequestDetail> = {}): RequestDetail {
  const base = makeRequestListItem();
  return {
    ...base,
    broker: makeBroker(),
    findings: null,
    timeline: [
      { at: base.createdAt, type: 'created' },
      { at: base.sentAt ?? base.createdAt, type: 'sent', status: 'sent' },
    ],
    messages: [],
    manual: null,
    canRemind: false,
    canEscalate: false,
    canProvideId: false,
    canSimulateReply: false,
    ...overrides,
  };
}

export function makeSummary(overrides: Partial<SummaryDto> = {}): SummaryDto {
  return {
    counts: { total: 10, inProgress: 6, actionRequired: 2, completed: 2, notRemovable: 0 },
    coverage: { brokersTracked: 120, brokersCovered: 10, brokersNotYetCovered: 110 },
    completionRate: 0.2,
    byCategory: [{ category: 'phone_directory', total: 4, completed: 1 }],
    completedByMonth: [
      { month: '2026-01', count: 0 },
      { month: '2026-02', count: 2 },
    ],
    recentActivity: [{ at: '2026-02-02T08:00:00.000Z', requestId: 'req-1', brokerName: 'Pagine Esempio', text: 'Richiesta inviata' }],
    ...overrides,
  };
}

export function makeAuthorizationText(overrides: Partial<AuthorizationTextDto> = {}): AuthorizationTextDto {
  return { version: '1.0', text: 'Io sottoscritto Mario Rossi autorizzo Cancellamy a inviare richieste a mio nome.', ...overrides };
}

export function makeNotification(overrides: Partial<NotificationDto> = {}): NotificationDto {
  return {
    id: 'notif-1',
    type: 'request_status',
    title: 'Richiesta completata',
    body: 'Pagine Esempio ha confermato la cancellazione.',
    requestId: 'req-1',
    readAt: null,
    createdAt: '2026-02-05T08:00:00.000Z',
    ...overrides,
  };
}

export function paginated<T>(items: T[], overrides: Partial<Paginated<T>> = {}): Paginated<T> {
  return { items, total: items.length, page: 1, limit: 20, ...overrides };
}

export function makeMessage(overrides: Partial<MessageDto> = {}): MessageDto {
  return {
    id: 'msg-1',
    direction: 'in',
    at: '2026-02-10T09:00:00.000Z',
    from: 'privacy@pagine.example',
    to: ['alias@cancellamy.example'],
    subject: 'Re: richiesta [CNC-7K2P9Q]',
    text: 'Abbiamo preso in carico la richiesta.',
    classification: null,
    dryRun: false,
    via: 'inbound',
    attachments: [],
    ...overrides,
  };
}

export function makeSender(overrides: Partial<SenderDto> = {}): SenderDto {
  return { mode: 'cancellamy', smtp: null, gmail: null, verifiedAt: null, lastError: null, replyAddress: 'r-abc123@reply.cancellamy.example', ...overrides };
}

export function makeIdentity(overrides: Partial<IdentityDto> = {}): IdentityDto {
  return {
    verified: false,
    requiresPhone: false,
    contacts: [{ type: 'email', value: 'mario@example.it', verified: false, verifiedAt: null }],
    ...overrides,
  };
}

export function makeBreachSummary(overrides: Partial<BreachSummaryDto> = {}): BreachSummaryDto {
  return {
    enabled: true,
    attribution: 'Breach data provided by Have I Been Pwned',
    emails: [
      {
        email: 'mario@example.it',
        status: 'checked',
        lastCheckedAt: '2026-03-01T10:00:00.000Z',
        breaches: [
          {
            name: 'ExampleLeak',
            title: 'Example Leak',
            breachDate: '2021-05-04',
            addedDate: '2021-06-01T00:00:00.000Z',
            dataClasses: ['Email addresses', 'Passwords'],
            domain: 'example.com',
            isVerified: true,
            isSensitive: false,
          },
        ],
      },
    ],
    unverifiedEmails: [],
    ...overrides,
  };
}

export function makeDataMap(overrides: Partial<DataMapDto> = {}): DataMapDto {
  return {
    entries: [
      {
        requestId: 'req-a1',
        shortRef: 'CNC-AAAA1111',
        broker: { id: 'broker-1', name: 'Pagine Esempio', website: null, category: 'phone_directory' },
        status: 'completed',
        found: true,
        categories: ['contacts', 'addresses'],
        updatedAt: '2026-03-02T10:00:00.000Z',
      },
      {
        requestId: 'req-a2',
        shortRef: 'CNC-BBBB2222',
        broker: { id: 'broker-2', name: 'Dati Srl', website: null, category: 'data_broker' },
        status: 'sent',
        found: null,
        categories: [],
        updatedAt: '2026-03-02T10:00:00.000Z',
      },
    ],
    totals: { asked: 2, answered: 1, found: 1, notFound: 0 },
    categoryCounts: [
      { category: 'contacts', count: 1 },
      { category: 'addresses', count: 1 },
    ],
    ...overrides,
  };
}

export function makeDelisting(overrides: Partial<DelistingDto> = {}): DelistingDto {
  return {
    id: 'del-1',
    profileId: 'profile-1',
    engine: 'google',
    url: 'https://news.example/articolo-vecchio',
    searchQuery: 'Mario Rossi',
    reason: 'outdated',
    explanation: null,
    status: 'to_submit',
    submittedAt: null,
    resolvedAt: null,
    followUpAt: null,
    note: null,
    createdAt: '2026-03-01T10:00:00.000Z',
    ...overrides,
  };
}

export function makeDelistingGuide(overrides: Partial<DelistingGuideDto> = {}): DelistingGuideDto {
  return {
    engineName: 'Google',
    formUrl: 'https://reportcontent.google.com/forms/rtbf',
    steps: ['Apri il modulo', 'Incolla il testo'],
    statement: 'Chiedo la rimozione di questo risultato perché non è più attuale.',
    tips: ['Indica l’indirizzo esatto della pagina'],
    ...overrides,
  };
}

export function makeNuisanceReport(overrides: Partial<NuisanceReportDto> = {}): NuisanceReportDto {
  return {
    id: 'nui-1',
    profileId: 'profile-1',
    channel: 'call',
    callerNumber: '+39 02 1234567',
    company: 'Energia Facile',
    receivedAt: '2026-03-05T09:30:00.000Z',
    summary: 'Offerta luce e gas',
    consentGiven: 'no',
    rpoActiveAtTime: true,
    createdAt: '2026-03-05T10:00:00.000Z',
    ...overrides,
  };
}

export function makeNuisanceOverview(overrides: Partial<NuisanceOverviewDto> = {}): NuisanceOverviewDto {
  return {
    rpo: { registered: false, requestId: null, completedAt: null, effectiveFrom: null },
    reports: [],
    topCallers: [],
    ...overrides,
  };
}

export function makePerformance(overrides: Partial<BrokerPerformanceDto> = {}): BrokerPerformanceDto {
  return {
    broker: { id: 'broker-1', name: 'Pagine Esempio', website: null, category: 'phone_directory' },
    requests: 40,
    users: 12,
    responseRate: 0.725,
    completionRate: 0.5,
    refusalRate: 0.125,
    overdueRate: 0.25,
    medianDaysToFirstReply: 3.5,
    medianDaysToCompletion: 12,
    ...overrides,
  };
}

export function makeLeaderboard(overrides: Partial<LeaderboardDto> = {}): LeaderboardDto {
  return { minUsers: 5, generatedAt: '2026-03-10T08:00:00.000Z', items: [makePerformance()], hiddenBrokers: 7, ...overrides };
}
