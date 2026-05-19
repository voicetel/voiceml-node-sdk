import type { HttpMethod, PageEnvelope } from './common.js';

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
export type UpdateCallStatus = 'completed' | 'canceled';

export interface Call {
  sid: string;
  account_sid: string;
  api_version: string;
  to?: string;
  to_formatted?: string;
  from?: string;
  from_formatted?: string;
  parent_call_sid?: string;
  caller_name?: string;
  forwarded_from?: string;
  status: CallStatus;
  direction: CallDirection;
  answered_by?: AnsweredBy;
  start_time?: string;
  end_time?: string;
  duration?: string;
  price?: string;
  price_unit?: string;
  phone_number_sid?: string;
  annotation?: string;
  group_sid?: string;
  queue_time?: string;
  trunk_sid?: string;
  date_created: string;
  date_updated: string;
  uri: string;
  subresource_uris?: Record<string, string>;
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
  RecordingStatusCallbackMethod?: string;
  RecordingStatusCallbackEvent?: string;
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
 * Body for `POST /Calls/{sid}`. Three flows on the same endpoint (mirrors Twilio):
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

export interface ListCallsParams {
  To?: string;
  From?: string;
  Status?: CallStatus;
  ParentCallSid?: string;
  /** Twilio wire name: `StartTime>=`. */
  startTimeGte?: string;
  /** Twilio wire name: `StartTime<=`. */
  startTimeLte?: string;
  Page?: number;
  PageSize?: number;
}
