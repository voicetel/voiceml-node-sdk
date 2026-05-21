import type { PageEnvelope } from './common.js';

export type ConferenceStatus = 'init' | 'in-progress' | 'completed';
export type ParticipantStatus =
  | 'queued'
  | 'connecting'
  | 'ringing'
  | 'connected'
  | 'on-hold'
  | 'complete'
  | 'failed'
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
  coaching: boolean;
  /** Set when `coaching` is true — the participant this coach can speak to. */
  call_sid_to_coach?: string;
  /** Pre-join queue wait in seconds (Twilio string wire shape). */
  queue_time: string;
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

export interface ListConferencesParams {
  FriendlyName?: string;
  Status?: ConferenceStatus;
  Page?: number;
  PageSize?: number;
}

export interface ListParticipantsParams {
  Muted?: boolean;
  Hold?: boolean;
  Coaching?: boolean;
  Page?: number;
  PageSize?: number;
}
