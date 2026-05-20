import type { PageEnvelope } from './common.js';

export type ConferenceStatus = 'init' | 'in-progress' | 'completed';
export type ParticipantStatus =
  | 'queued'
  | 'connecting'
  | 'ringing'
  | 'connected'
  | 'on-hold'
  | 'completed';

export interface Conference {
  sid: string;
  account_sid: string;
  friendly_name: string;
  status: ConferenceStatus;
  region?: string;
  api_version: string;
  uri: string;
  date_created?: string;
  date_updated?: string;
  reason_conference_ended?: string;
  call_sid_ending_conference?: string;
  subresource_uris?: Record<string, string>;
  /** VoiceML extension — count of current participants. */
  member_count?: number;
}

export interface ConferenceList extends PageEnvelope {
  conferences: Conference[];
}

export interface Participant {
  call_sid: string;
  conference_sid: string;
  account_sid: string;
  muted: boolean;
  hold: boolean;
  start_conference_on_enter: boolean;
  end_conference_on_exit: boolean;
  status: ParticipantStatus;
  label?: string;
  api_version: string;
  uri: string;
  date_created?: string;
  date_updated?: string;
}

export interface ParticipantList extends PageEnvelope {
  participants: Participant[];
}

/** v1 supports only `Status=completed`. */
export interface EndConferenceRequest {
  Status: 'completed';
}

/** At least one of `Muted` / `Hold` must be set. */
export interface UpdateParticipantRequest {
  Muted?: boolean;
  Hold?: boolean;
}
