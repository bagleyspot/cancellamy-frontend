import { describe, expect, it } from 'vitest';
import { makeRequestDetail } from '@/test/fixtures';
import { getRequestActions, validateIdFile } from './permissions';

describe('getRequestActions', () => {
  it('offers nothing but cancel for a plain sent request', () => {
    const flags = getRequestActions(makeRequestDetail({ status: 'sent' }));
    expect(flags).toEqual({
      markDone: false,
      provideId: false,
      remind: false,
      escalate: false,
      outcome: false,
      cancel: true,
      simulate: false,
      complaintPdf: false,
    });
  });

  it('offers mark-done for a manual action', () => {
    const flags = getRequestActions(makeRequestDetail({ status: 'action_required', actionReason: 'manual_form' }));
    expect(flags.markDone).toBe(true);
    expect(flags.provideId).toBe(false);
  });

  it('offers provide-id (and not mark-done) when the broker asks for an ID', () => {
    const flags = getRequestActions(makeRequestDetail({ status: 'action_required', actionReason: 'id_required', canProvideId: true }));
    expect(flags.provideId).toBe(true);
    expect(flags.markDone).toBe(false);
  });

  it('offers outcome buttons after a reply that needs review', () => {
    expect(getRequestActions(makeRequestDetail({ status: 'replied' })).outcome).toBe(true);
    const review = getRequestActions(makeRequestDetail({ status: 'action_required', actionReason: 'reply_review' }));
    expect(review.outcome).toBe(true);
    expect(review.markDone).toBe(false);
  });

  it('follows the server flags for reminder, escalation and simulation', () => {
    const flags = getRequestActions(makeRequestDetail({ status: 'overdue', canRemind: true, canEscalate: true, canSimulateReply: true }));
    expect(flags).toMatchObject({ remind: true, escalate: true, simulate: true });
  });

  it('does not allow cancelling finished requests, and exposes the complaint PDF once escalated', () => {
    expect(getRequestActions(makeRequestDetail({ status: 'completed' })).cancel).toBe(false);
    expect(getRequestActions(makeRequestDetail({ status: 'cancelled' })).cancel).toBe(false);
    const escalated = getRequestActions(makeRequestDetail({ status: 'escalated' }));
    expect(escalated.complaintPdf).toBe(true);
    expect(escalated.escalate).toBe(false);
  });
});

describe('validateIdFile', () => {
  it('accepts PDF, JPG and PNG up to 5 MB', () => {
    expect(validateIdFile({ type: 'application/pdf', size: 1000 })).toBeNull();
    expect(validateIdFile({ type: 'image/jpeg', size: 5 * 1024 * 1024 })).toBeNull();
    expect(validateIdFile({ type: 'image/png', size: 10 })).toBeNull();
  });
  it('rejects other types and oversized files', () => {
    expect(validateIdFile({ type: 'image/gif', size: 10 })).toBe('type');
    expect(validateIdFile({ type: 'application/pdf', size: 5 * 1024 * 1024 + 1 })).toBe('size');
  });
});
