import type { HttpMethod, Open, PageEnvelope } from './common.js';
import type { CallStatusCallbackEvent } from './calls.js';

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
  sid: string | null;
  account_sid: string | null;
  friendly_name: string | null;
  status: Open<ConferenceStatus>;
  region?: string | null;
  api_version: string | null;
  uri: string | null;
  date_created?: string | null;
  date_updated?: string | null;
  reason_conference_ended?: string;
  call_sid_ending_conference?: string | null;
  subresource_uris?: Record<string, string> | null;
  /** VoiceML extension — count of current participants. */
  member_count?: number;
}

export interface ConferenceList extends PageEnvelope {
  conferences: Conference[];
}

export interface Participant {
  call_sid: string | null;
  conference_sid: string | null;
  account_sid: string | null;
  muted: boolean | null;
  hold: boolean | null;
  coaching: boolean | null;
  /** Set when `coaching` is true — the participant this coach can speak to. */
  call_sid_to_coach?: string | null;
  /** Pre-join queue wait in seconds (Twilio string wire shape). */
  queue_time: string | null;
  start_conference_on_enter: boolean | null;
  end_conference_on_exit: boolean | null;
  status: Open<ParticipantStatus>;
  label?: string | null;
  /** @deprecated Not part of the current API response; the server no longer emits it. */
  api_version?: string;
  uri: string | null;
  date_created?: string | null;
  date_updated?: string | null;
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

/** Body for `POST /Conferences/{sid}/Participants`. `From` and `To` are required. */
export interface CreateParticipantRequest {
  From: string;
  To: string;
  Label?: string;
  Muted?: boolean;
  StartConferenceOnEnter?: boolean;
  EndConferenceOnExit?: boolean;
  Timeout?: number;
  StatusCallback?: string;
  StatusCallbackMethod?: HttpMethod;
  /** Lifecycle events to report. Repeatable: rendered as multiple form params. */
  StatusCallbackEvent?: CallStatusCallbackEvent[];
  /** Participant's conference lifecycle webhook. */
  ConferenceStatusCallback?: string;
  ConferenceStatusCallbackMethod?: HttpMethod;
  /** Space- or comma-separated conference event filter (default `start end`). */
  ConferenceStatusCallbackEvent?: string;
}

export interface ListConferencesParams {
  FriendlyName?: string;
  Status?: ConferenceStatus;
  /** Twilio wire name: `DateCreated` (full UTC day). */
  dateCreated?: string | Date;
  /** Twilio wire name: `DateCreated<`. */
  dateCreatedLt?: string | Date;
  /** Twilio wire name: `DateCreated>`. */
  dateCreatedGt?: string | Date;
  /** Twilio wire name: `DateUpdated` (full UTC day). */
  dateUpdated?: string | Date;
  /** Twilio wire name: `DateUpdated<`. */
  dateUpdatedLt?: string | Date;
  /** Twilio wire name: `DateUpdated>`. */
  dateUpdatedGt?: string | Date;
  Page?: number;
  PageSize?: number;
  PageToken?: string;
}

export interface ListParticipantsParams {
  Muted?: boolean;
  Hold?: boolean;
  Coaching?: boolean;
  Page?: number;
  PageSize?: number;
  PageToken?: string;
}
