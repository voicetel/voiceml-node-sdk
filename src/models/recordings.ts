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
  sid: string;
  account_sid: string;
  call_sid: string;
  conference_sid?: string;
  status: RecordingStatus;
  source?: RecordingSource;
  channels?: number;
  duration?: string;
  api_version?: string;
  uri?: string;
  date_created?: string;
  date_updated?: string;
  start_time?: string;
  price?: string;
  price_unit?: string;
  encryption_details?: Record<string, unknown>;
  subresource_uris?: Record<string, unknown>;
  media_url?: string;
  /** Twilio error taxonomy for failed recordings; `null` when no error. */
  error_code?: number | null;
}

export interface ListRecordingsParams {
  /** Twilio wire name: `DateCreated` (full UTC day). */
  dateCreated?: string;
  /** Twilio wire name: `DateCreated<`. */
  dateCreatedLt?: string;
  /** Twilio wire name: `DateCreated>`. */
  dateCreatedGt?: string;
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

export interface ListCallRecordingsParams {
  dateCreated?: string;
  dateCreatedLt?: string;
  dateCreatedGt?: string;
  Page?: number;
  PageSize?: number;
  PageToken?: string;
}

/**
 * Recordings list response.
 *
 * The account-scoped endpoint (`GET /Recordings`) returns the full Twilio-compatible pagination fields
 * (`recordings/page/page_size/total`). Per-call (`GET /Calls/{sid}/Recordings`) and
 * per-conference (`GET /Conferences/{sid}/Recordings`) endpoints currently return only
 * `recordings` — the other pagination fields will be `undefined`.
 */
export interface RecordingList {
  recordings: Recording[];
  page?: number;
  page_size?: number;
  total?: number;
  num_pages?: number;
  first_page_uri?: string;
  next_page_uri?: string | null;
  previous_page_uri?: string | null;
  uri?: string;
}

export interface StartRecordingRequest {
  RecordingMaxDuration?: number;
  RecordingChannels?: 'mono' | 'dual';
  PlayBeep?: boolean;
  RecordingStatusCallback?: string;
  RecordingStatusCallbackMethod?: string;
  RecordingStatusCallbackEvent?: string;
}

export interface UpdateRecordingRequest {
  Status: RecordingUpdateStatus;
}

/**
 * Result of fetching `GET /Recordings/{sid}.wav`. `body` is the WAV bytes after following
 * any S3 redirect; `contentType` is whatever the server (or S3) declared.
 */
export interface RecordingAudio {
  sid: string;
  body: Uint8Array;
  contentType: string;
}
