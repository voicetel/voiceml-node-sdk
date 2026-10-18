import type { HttpMethod, Open, PageEnvelope } from './common.js';

export type CallStatus =
  | 'queued'
  | 'ringing'
  | 'in-progress'
  | 'completed'
  | 'busy'
  | 'no-answer'
  | 'canceled'
  | 'failed';

export type CallDirection = 'inbound' | 'outbound-api' | 'outbound-dial';

export type AnsweredBy =
  | 'human'
  | 'machine_start'
  | 'machine_end_beep'
  | 'machine_end_silence'
  | 'machine_end_other'
  | 'fax'
  | 'unknown'
  | '';

export type MachineDetectionMode = 'Enable' | 'DetectMessageEnd';
export type RecordingChannelsLayout = 'mono' | 'dual';
export type RecordingTrack = 'inbound' | 'outbound' | 'both';
export type TrimMode = 'trim-silence' | 'do-not-trim';
export type CallStatusCallbackEvent = 'initiated' | 'ringing' | 'answered' | 'completed';
export type RecordingStatusCallbackEvent = 'in-progress' | 'completed' | 'absent';
export type UpdateCallStatus = 'completed' | 'canceled';

export interface Call {
  sid: string | null;
  account_sid: string | null;
  api_version: string | null;
  to?: string | null;
  to_formatted?: string | null;
  from?: string | null;
  from_formatted?: string | null;
  parent_call_sid?: string | null;
  caller_name?: string | null;
  forwarded_from?: string | null;
  status: Open<CallStatus>;
  direction: Open<CallDirection> | null;
  answered_by?: Open<AnsweredBy> | null;
  start_time?: string | null;
  end_time?: string | null;
  duration?: string | null;
  price?: string | null;
  price_unit?: string | null;
  phone_number_sid?: string | null;
  annotation?: string | null;
  group_sid?: string | null;
  queue_time?: string | null;
  trunk_sid?: string | null;
  date_created: string | null;
  date_updated: string | null;
  uri: string | null;
  subresource_uris?: Record<string, string> | null;
}

export interface CallList extends PageEnvelope {
  calls: Call[];
}

/**
 * Body for `POST /Calls`. Sent form-urlencoded by default (Twilio convention).
 *
 * Set at most one of `Url` / `Twiml` / `ApplicationSid`. If `Twiml` is set alongside
 * `Url`, Twiml wins (Twilio's documented precedence).
 */
export interface CreateCallRequest {
  To: string;
  From: string;
  Url?: string;
  Method?: HttpMethod;
  Twiml?: string;
  ApplicationSid?: string;
  FallbackUrl?: string;
  FallbackMethod?: HttpMethod;
  StatusCallback?: string;
  StatusCallbackMethod?: string;
  /** Repeatable: rendered as multiple form params. */
  StatusCallbackEvent?: CallStatusCallbackEvent[];
  MachineDetection?: MachineDetectionMode;
  MachineDetectionTimeout?: number;
  MachineDetectionSpeechThreshold?: number;
  MachineDetectionSpeechEndThreshold?: number;
  MachineDetectionSilenceTimeout?: number;
  AsyncAmdStatusCallback?: string;
  AsyncAmdStatusCallbackMethod?: string;
  Record?: boolean;
  RecordingStatusCallback?: string;
  RecordingStatusCallbackMethod?: HttpMethod;
  /** Recording lifecycle events to report. Repeatable: rendered as multiple form params. */
  RecordingStatusCallbackEvent?: RecordingStatusCallbackEvent[];
  RecordingChannels?: RecordingChannelsLayout;
  RecordingTrack?: RecordingTrack;
  Trim?: TrimMode;
  Timeout?: number;
  SendDigits?: string;
  CallerId?: string;
  CallReason?: string;
  SipAuthUsername?: string;
  SipAuthPassword?: string;
  Byoc?: string;
  AsyncAmd?: boolean;
  CallToken?: string;
}

/**
 * Body for `POST /Calls/{sid}`. Three flows on the same endpoint:
 *   - `Status=completed|canceled` — terminate. Wins over any TwiML source.
 *   - `Twiml=<inline>` — execute inline TwiML on the live call (wins over `Url`).
 *   - `Url=…` — fetch new TwiML and execute it on the live call.
 *
 * `StatusCallback*` updates apply independently — including on the terminate path.
 */
export interface UpdateCallRequest {
  Status?: UpdateCallStatus;
  Twiml?: string;
  Url?: string;
  Method?: HttpMethod;
  FallbackUrl?: string;
  FallbackMethod?: HttpMethod;
  StatusCallback?: string;
  StatusCallbackMethod?: string;
  StatusCallbackEvent?: CallStatusCallbackEvent[];
}

/**
 * Filters for `GET /Calls`. The camelCase date filters map to Twilio's wire names
 * (`startTime` → `StartTime`, `startTimeLt` → `StartTime<`, …). Equality filters take a UTC
 * day (`YYYY-MM-DD`; a `Date` is sent as its UTC day); the `<` / `>` bounds take a date or
 * date-time (a `Date` is sent as ISO-8601 UTC).
 */
export interface ListCallsParams {
  To?: string;
  From?: string;
  Status?: CallStatus;
  ParentCallSid?: string;
  /** Wire name `StartTime` (full UTC day). */
  startTime?: string | Date;
  /** Wire name `StartTime<`. */
  startTimeLt?: string | Date;
  /** Wire name `StartTime>`. */
  startTimeGt?: string | Date;
  /** Wire name `EndTime` (full UTC day). */
  endTime?: string | Date;
  /** Wire name `EndTime<`. */
  endTimeLt?: string | Date;
  /** Wire name `EndTime>`. */
  endTimeGt?: string | Date;
  Page?: number;
  PageSize?: number;
  PageToken?: string;
}

export interface ListPageParams {
  Page?: number;
  PageSize?: number;
  PageToken?: string;
}
