import { describe, expect, it } from 'vitest';
import type { RequestGroup, RequestStatus } from '@/api/types';
import { it as strings } from '@/i18n/it';
import { GROUP_OF_STATUS, REQUEST_GROUPS, groupOfStatus, isCancellable } from './requestStatus';

describe('request status to group mapping', () => {
  const expected: Record<RequestGroup, RequestStatus[]> = {
    in_progress: ['queued', 'sent', 'replied', 'overdue', 'escalated'],
    action_required: ['action_required'],
    completed: ['completed'],
    not_removable: ['refused', 'cancelled'],
  };

  it.each(Object.entries(expected))('maps %s statuses as in the contract', (group, statuses) => {
    for (const status of statuses) expect(groupOfStatus(status)).toBe(group);
  });

  it('covers every status exactly once', () => {
    const all = Object.values(expected).flat().sort();
    expect(Object.keys(GROUP_OF_STATUS).sort()).toEqual(all);
  });

  it('has an Italian label for every status and group', () => {
    for (const status of Object.keys(GROUP_OF_STATUS)) {
      expect(strings.status.request[status as RequestStatus]).toBeTruthy();
    }
    for (const group of REQUEST_GROUPS) expect(strings.status.group[group]).toBeTruthy();
  });

  it('only allows cancelling requests that are still open', () => {
    expect(isCancellable('sent')).toBe(true);
    expect(isCancellable('action_required')).toBe(true);
    expect(isCancellable('completed')).toBe(false);
    expect(isCancellable('refused')).toBe(false);
    expect(isCancellable('cancelled')).toBe(false);
  });
});
