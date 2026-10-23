import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { RequestStatus } from '@/api/types';
import { GroupBadge, StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  const labels: [RequestStatus, string][] = [
    ['queued', 'In coda'],
    ['sent', 'Inviata'],
    ['action_required', 'Azione richiesta'],
    ['overdue', 'In ritardo'],
    ['escalated', 'Reclamo al Garante'],
    ['completed', 'Completata'],
    ['refused', 'Rifiutata'],
    ['cancelled', 'Annullata'],
  ];

  it.each(labels)('renders the Italian label for %s', (status, label) => {
    render(<StatusBadge status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('renders group labels', () => {
    render(<GroupBadge group="not_removable" />);
    expect(screen.getByText('Non rimovibili')).toBeInTheDocument();
  });
});
