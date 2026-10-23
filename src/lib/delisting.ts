import type { DelistingStatus } from '@/api/types';

/** Statuses a user can move a delisting request to from `status`. Mirrors the backend state machine (contract, section 5). */
export type DelistingTarget = Exclude<DelistingStatus, 'to_submit'>;

const TRANSITIONS: Record<DelistingStatus, readonly DelistingTarget[]> = {
  to_submit: ['submitted', 'cancelled'],
  submitted: ['approved', 'partially_approved', 'denied', 'cancelled'],
  denied: ['appealed'],
  partially_approved: ['appealed'],
  appealed: ['approved', 'partially_approved', 'denied', 'cancelled'],
  approved: [],
  cancelled: [],
};

export function allowedDelistingTransitions(status: DelistingStatus): readonly DelistingTarget[] {
  return TRANSITIONS[status];
}

export function isDelistingClosed(status: DelistingStatus): boolean {
  return TRANSITIONS[status].length === 0;
}
