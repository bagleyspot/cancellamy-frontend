import type { BrokerObservationDto, ObservationOutcome } from '@/api/types';
import type { Tone } from '@/lib/requestStatus';

/** Badge tone of what a broker did when it was contacted. */
export const OBSERVATION_TONE: Record<ObservationOutcome, Tone> = {
  bounce_no_mailbox: 'danger',
  bounce_blocked: 'danger',
  no_reply: 'warning',
  no_data_held: 'success',
  out_of_office: 'neutral',
  acknowledged: 'info',
  acknowledged_will_delete: 'success',
  needs_portal: 'warning',
  needs_identifier: 'warning',
  needs_extra_info: 'warning',
  completed: 'success',
  refused: 'danger',
};

/** The API sends the observations newest first. */
export const latestObservation = (observed: readonly BrokerObservationDto[]): BrokerObservationDto | undefined => observed[0];
