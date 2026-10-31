import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './endpoints';
import { redirectTo } from '@/lib/navigation';
import { queryKeys } from './queries';
import type {
  AccessFindingsInput,
  AdminBrokerPatch,
  ComplaintDto,
  ConfirmCodeRequest,
  CreateAccessRequestsInput,
  CustomRequestInput,
  DelistingInput,
  DelistingPatch,
  NuisanceComplaintRequest,
  NuisanceReportInput,
  OutcomeRequest,
  ProfileInput,
  SendCodeRequest,
  SenderDto,
  CompleteGmailRequest,
  SetSenderRequest,
  SignAuthorizationRequest,
  SimulateReplyRequest,
  SmtpSettingsInput,
} from './types';

/** Mutations are intentionally simple: call the API, then invalidate the affected query roots. */

function useInvalidate() {
  const client = useQueryClient();
  return (...roots: (readonly unknown[])[]) =>
    Promise.all(roots.map((queryKey) => client.invalidateQueries({ queryKey })));
}

export function useCreateProfile() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: ProfileInput) => api.profiles.create(input),
    onSuccess: () => invalidate(queryKeys.profiles),
  });
}

export function useUpdateProfile(id: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: Partial<ProfileInput>) => api.profiles.update(id, input),
    onSuccess: () => invalidate(queryKeys.profiles),
  });
}

export function useDeleteProfile() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api.profiles.remove(id),
    onSuccess: () => invalidate(queryKeys.profiles, queryKeys.requestsRoot, ['reports']),
  });
}

export function useSignAuthorization(id: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (body: SignAuthorizationRequest) => api.profiles.sign(id, body),
    onSuccess: () => invalidate(queryKeys.profiles),
  });
}

export function useRevokeAuthorization(id: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: () => api.profiles.revokeAuthorization(id),
    onSuccess: () => invalidate(queryKeys.profiles, queryKeys.requestsRoot),
  });
}

export function useActivateProfile(id: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: () => api.profiles.activate(id),
    onSuccess: () => invalidate(queryKeys.profiles, queryKeys.requestsRoot, queryKeys.notificationsRoot),
  });
}

export function usePauseResumeProfile(id: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (action: 'pause' | 'resume') => (action === 'pause' ? api.profiles.pause(id) : api.profiles.resume(id)),
    onSuccess: () => invalidate(queryKeys.profiles),
  });
}

export function useRequestActions(id: string) {
  const client = useQueryClient();
  const invalidate = useInvalidate();
  const refresh = () => invalidate(queryKeys.requestsRoot, queryKeys.profiles, queryKeys.notificationsRoot);

  return {
    markDone: useMutation({ mutationFn: () => api.requests.markDone(id), onSuccess: refresh }),
    outcome: useMutation({ mutationFn: (body: OutcomeRequest) => api.requests.outcome(id, body), onSuccess: refresh }),
    provideId: useMutation({
      mutationFn: (input: { file: File; note?: string }) => api.requests.provideId(id, input.file, input.note),
      onSuccess: refresh,
    }),
    remind: useMutation({ mutationFn: () => api.requests.remind(id), onSuccess: refresh }),
    escalate: useMutation({
      mutationFn: () => api.requests.escalate(id),
      onSuccess: async (complaint: ComplaintDto) => {
        client.setQueryData(queryKeys.complaint(id), complaint);
        await refresh();
      },
    }),
    cancel: useMutation({ mutationFn: () => api.requests.cancel(id), onSuccess: refresh }),
    simulateReply: useMutation({
      mutationFn: (body: SimulateReplyRequest) => api.requests.simulateReply(id, body),
      onSuccess: refresh,
    }),
  };
}

export function useIdentityActions(profileId: string) {
  const invalidate = useInvalidate();
  return {
    sendCode: useMutation({ mutationFn: (body: SendCodeRequest) => api.profiles.identity.sendCode(profileId, body) }),
    confirm: useMutation({
      mutationFn: (body: ConfirmCodeRequest) => api.profiles.identity.confirm(profileId, body),
      // identityVerified lives on the profile too, and the access page depends on it.
      onSuccess: () => invalidate(queryKeys.profiles, queryKeys.dataMap(profileId)),
    }),
  };
}

/**
 * Sender (SMTP) actions. `save` and `test` carry the mailbox password, so they are plain async functions and NOT
 * useMutation: the mutation cache would keep the variables (the password) in memory after the call.
 */
export function useSenderActions(profileId: string) {
  const client = useQueryClient();
  const invalidate = useInvalidate();

  const store = async (sender: SenderDto) => {
    client.setQueryData(queryKeys.sender(profileId), sender);
    await invalidate(queryKeys.profiles);
    return sender;
  };

  return {
    save: async (smtp: SmtpSettingsInput) => store(await api.profiles.sender.set(profileId, { mode: 'smtp', smtp } satisfies SetSenderRequest)),
    test: (smtp: SmtpSettingsInput) => api.profiles.sender.test(profileId, smtp),
    reset: useMutation({ mutationFn: () => api.profiles.sender.reset(profileId), onSuccess: store }),
  };
}

/** "Collega con Google": asks the backend for the consent URL and sends the browser there. */
export function useGmailConnect(profileId: string) {
  return useMutation({
    mutationFn: () => api.profiles.sender.gmailStart(profileId),
    onSuccess: ({ url }) => redirectTo(url),
  });
}

/** Called by the /app/collega-google route with the `code` and `state` Google put in the redirect. */
export function useGmailComplete() {
  const client = useQueryClient();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (body: CompleteGmailRequest) => api.senderGmail.complete(body),
    onSuccess: async ({ profileId, sender }) => {
      client.setQueryData(queryKeys.sender(profileId), sender);
      await invalidate(queryKeys.profiles);
    },
  });
}

export function useCheckBreaches(profileId: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: () => api.profiles.breaches.check(profileId),
    onSuccess: () => invalidate(queryKeys.breaches(profileId)),
  });
}

export function useCreateAccessRequests() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: CreateAccessRequestsInput) => api.requests.createAccess(input),
    onSuccess: (_result, input) => invalidate(queryKeys.requestsRoot, queryKeys.profiles, queryKeys.dataMap(input.profileId)),
  });
}

export function useSaveFindings(requestId: string, profileId: string) {
  const client = useQueryClient();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: AccessFindingsInput) => api.requests.putFindings(requestId, input),
    onSuccess: async (detail) => {
      client.setQueryData(queryKeys.request(requestId), detail);
      await invalidate(queryKeys.dataMap(profileId), queryKeys.requestsRoot);
    },
  });
}

export function useCreateDelisting() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: DelistingInput) => api.delistings.create(input),
    onSuccess: () => invalidate(queryKeys.delistingsRoot),
  });
}

export function useUpdateDelisting(id: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (patch: DelistingPatch) => api.delistings.patch(id, patch),
    onSuccess: () => invalidate(queryKeys.delistingsRoot),
  });
}

export function useDeleteDelisting() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api.delistings.remove(id),
    onSuccess: () => invalidate(queryKeys.delistingsRoot),
  });
}

export function useNuisanceActions(profileId: string) {
  const invalidate = useInvalidate();
  const refresh = () => invalidate(queryKeys.nuisance(profileId));
  return {
    create: useMutation({ mutationFn: (input: NuisanceReportInput) => api.nuisance.create(input), onSuccess: refresh }),
    remove: useMutation({ mutationFn: (id: string) => api.nuisance.remove(id), onSuccess: refresh }),
    complaint: useMutation({ mutationFn: (input: NuisanceComplaintRequest) => api.nuisance.complaint(input) }),
  };
}

export function useCreateCustomRequest() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: CustomRequestInput) => api.requests.createCustom(input),
    onSuccess: () => invalidate(queryKeys.requestsRoot, queryKeys.profiles),
  });
}

export function useMarkNotificationsRead() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (ids?: string[]) => api.notifications.markRead(ids),
    onSuccess: () => invalidate(queryKeys.notificationsRoot),
  });
}

export function useGenerateReport() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (profileId: string) => api.reports.generate(profileId),
    onSuccess: () => invalidate(['reports']),
  });
}

export function useAdminPatchBroker() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: { id: string; patch: AdminBrokerPatch }) => api.admin.patchBroker(input.id, input.patch),
    onSuccess: () => invalidate(['admin', 'brokers'], ['brokers']),
  });
}

export function useAdminReseed() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: api.admin.reseed,
    onSuccess: () => invalidate(['admin', 'brokers'], ['brokers'], queryKeys.config),
  });
}

export function useAdminAutoVerify() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (crawlWebsites?: boolean) => api.admin.autoVerify(crawlWebsites ?? true),
    onSuccess: () => invalidate(['admin', 'brokers'], ['brokers'], queryKeys.config),
  });
}

export function useAssignInbound() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: { id: string; requestId: string }) => api.admin.assignInbound(input.id, input.requestId),
    onSuccess: () => invalidate(queryKeys.adminUnmatched, queryKeys.adminStats),
  });
}
