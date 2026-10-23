import type { RequestDetail } from '@/api/types';
import { isCancellable } from '@/lib/requestStatus';

export interface RequestActionFlags {
  markDone: boolean;
  provideId: boolean;
  remind: boolean;
  escalate: boolean;
  outcome: boolean;
  cancel: boolean;
  simulate: boolean;
  /** Complaint already prepared: only the PDF can be downloaded again. */
  complaintPdf: boolean;
}

type ActionInput = Pick<
  RequestDetail,
  'status' | 'actionReason' | 'canRemind' | 'canEscalate' | 'canProvideId' | 'canSimulateReply'
>;

/**
 * Which contextual actions to offer. Server flags (canRemind, canEscalate, canProvideId, canSimulateReply)
 * are authoritative; mark-done and outcome buttons depend on status and reason, as defined by the contract.
 */
export function getRequestActions(request: ActionInput): RequestActionFlags {
  const waitingForUser = request.status === 'action_required';
  return {
    markDone: waitingForUser && request.actionReason !== 'reply_review' && !request.canProvideId,
    provideId: request.canProvideId,
    remind: request.canRemind,
    escalate: request.canEscalate,
    outcome: request.status === 'replied' || (waitingForUser && request.actionReason === 'reply_review'),
    cancel: isCancellable(request.status),
    simulate: request.canSimulateReply,
    complaintPdf: request.status === 'escalated',
  };
}

export const MAX_ID_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_ID_TYPES: readonly string[] = ['application/pdf', 'image/jpeg', 'image/png'];

export type IdFileError = 'type' | 'size' | null;

export function validateIdFile(file: Pick<File, 'type' | 'size'>): IdFileError {
  if (!ALLOWED_ID_TYPES.includes(file.type)) return 'type';
  if (file.size > MAX_ID_FILE_BYTES) return 'size';
  return null;
}
