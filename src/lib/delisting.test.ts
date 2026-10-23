import { describe, expect, it } from 'vitest';
import type { DelistingStatus } from '@/api/types';
import { allowedDelistingTransitions, isDelistingClosed } from './delisting';

describe('delisting transitions', () => {
  it.each<[DelistingStatus, string[]]>([
    ['to_submit', ['submitted', 'cancelled']],
    ['submitted', ['approved', 'partially_approved', 'denied', 'cancelled']],
    ['denied', ['appealed']],
    ['partially_approved', ['appealed']],
    ['appealed', ['approved', 'partially_approved', 'denied', 'cancelled']],
    ['approved', []],
    ['cancelled', []],
  ])('from %s only %j is allowed', (status, expected) => {
    expect([...allowedDelistingTransitions(status)]).toEqual(expected);
  });

  it('never offers a way back to to_submit and closes terminal states', () => {
    const all: DelistingStatus[] = ['to_submit', 'submitted', 'approved', 'partially_approved', 'denied', 'appealed', 'cancelled'];
    for (const status of all) expect(allowedDelistingTransitions(status)).not.toContain('to_submit');
    expect(isDelistingClosed('approved')).toBe(true);
    expect(isDelistingClosed('denied')).toBe(false);
  });
});
