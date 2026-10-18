import type { HttpMethod, Open, PageEnvelope } from './common.js';
import type { RecordingStatusCallbackEvent, RecordingTrack } from './calls.js';

export type RecordingStatus =
  | 'in-progress'
  | 'paused'
  | 'stopped'
  | 'processing'
  | 'completed'
  | 'absent'
  | 'deleted';

export type RecordingSource =
  | 'OutboundAPI'
  | 'RecordVerb'
  | 'DialVerb'
  | 'Conference'
  | 'Trunking'
  | 'StartCallRecordingAPI'
  | 'StartConferenceRecordingAPI';

export type RecordingUpdateStatus = 'stopped' | 'paused' | 'in-progress';

export interface Recording {
  sid: string | null;
  account_sid: string | null;
  call_sid: string | null;
  conference_sid?: string | null;
  status: Open<RecordingStatus>;
  source?: Open<RecordingSource>;
  channels?: number | null;
  duration?: string | null;
  api_version?: string | null;
  uri?: string | null;
  date_created?: string | null;
  date_updated?: string | null;
  start_time?: string | null;
  price?: string | null;
  price_unit?: string | null;
  encryption_details?: Record<string, unknown> | null;
  subresource_uris?: Record<string, unknown> | null;
  media_url?: string | null;
  /** Twilio error taxonomy for failed recordings; `null` when no error. */
  error_code?: number | null;
  /** The recorded track (`both`). Present only in the response that starts a call recording. */
  track?: string | null;
}

export interface ListRecordingsParams {
  /** Wire name `DateCreated` — a UTC day (`YYYY-MM-DD`; a `Date` is sent as its UTC day). */
  dateCreated?: string | Date;
  /** Wire name `DateCreated<` (a `Date` is sent as ISO-8601 UTC). */
  dateCreatedLt?: string | Date;
  /** Wire name `DateCreated>` (a `Date` is sent as ISO-8601 UTC). */
  dateCreatedGt?: string | Date;
  CallSid?: string;
  ConferenceSid?: string;
  IncludeSoftDeleted?: boolean;
  Page?: number;
  PageSize?: number;
  PageToken?: string;
}

export interface GetRecordingParams {
  IncludeSoftDeleted?: boolean;
}

/** Filters for the call- and conference-scoped recording lists. */
export interface ListCallRecordingsParams {
  /** Wire name `DateCreated` — a UTC day (`YYYY-MM-DD`; a `Date` is sent as its UTC day). */
  dateCreated?: string | Date;
  /** Wire name `DateCreated<` (a `Date` is sent as ISO-8601 UTC). */
  dateCreatedLt?: string | Date;
  /** Wire name `DateCreated>` (a `Date` is sent as ISO-8601 UTC). */
  dateCreatedGt?: string | Date;
  Page?: number;
  PageSize?: number;
  PageToken?: string;
}

/** Alias for conference-scoped recording list filters. */
export type ListConferenceRecordingsParams = ListCallRecordingsParams;

/** Recordings list response (account-, call- and conference-scoped lists share it). */
export interface RecordingList extends PageEnvelope {
  recordings: Recording[];
}

/** Body for `POST /Calls/{CallSid}/Recordings` (start recording a live call). */
export interface StartRecordingRequest {
  /** Cap recording length in seconds. 0 = no limit. */
  RecordingMaxDuration?: number;
  RecordingChannels?: 'mono' | 'dual';
  /** `inbound`, `outbound` or `both` (default). */
  RecordingTrack?: RecordingTrack;
  PlayBeep?: boolean;
  RecordingStatusCallback?: string;
  RecordingStatusCallbackMethod?: HttpMethod;
  /** Recording lifecycle events to report. Repeatable: rendered as multiple form params. */
  RecordingStatusCallbackEvent?: RecordingStatusCallbackEvent[];
}

/** Body for `POST /Conferences/{ConferenceSid}/Recordings` (start recording a conference). */
export interface StartConferenceRecordingRequest {
  RecordingStatusCallback?: string;
  RecordingStatusCallbackMethod?: HttpMethod;
  /** Recording lifecycle events to report. Repeatable: rendered as multiple form params. */
  RecordingStatusCallbackEvent?: RecordingStatusCallbackEvent[];
}

/** Body for `POST /Calls/{CallSid}/Recordings/{Sid}` (pause / resume / stop). */
export interface UpdateCallRecordingRequest {
  Status: RecordingUpdateStatus;
  /** With `Status=paused`: `skip` omits the paused span; `silence` (default) keeps it as silence. */
  PauseBehavior?: 'skip' | 'silence';
}

/** Body for `POST /Conferences/{ConferenceSid}/Recordings/{Sid}`. */
export interface UpdateConferenceRecordingRequest {
  Status: RecordingUpdateStatus;
}

/** @deprecated Use {@link UpdateCallRecordingRequest} or {@link UpdateConferenceRecordingRequest}. */
export type UpdateRecordingRequest = UpdateConferenceRecordingRequest;

/**
 * Result of `GET /Recordings/{sid}.wav`. `body` is the WAV bytes (after following any
 * redirect to archived storage); `contentType` is whatever the serving host declared.
 */
export interface RecordingAudio {
  sid: string;
  body: Uint8Array;
  contentType: string;
  /** `true` when the bytes came from a redirect target (archived storage). */
  redirected: boolean;
}
