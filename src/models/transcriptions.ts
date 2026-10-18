import type { Open, PageEnvelope, TrackSelector } from './common.js';

export type TranscriptionStatus = 'in-progress' | 'stopped';
export type TranscriptionEngine = 'deepgram' | 'google' | 'aws' | 'azure';

/** A real-time transcription session on a live call (`POST /Calls/{sid}/Transcriptions`). */
export interface CallTranscription {
  sid: string | null;
  account_sid: string | null;
  call_sid: string | null;
  name?: string | null;
  status: Open<TranscriptionStatus>;
  uri: string | null;
  date_updated?: string | null;
  /** @deprecated Not part of the current API response; the server no longer emits it. */
  language_code?: string;
  /** @deprecated Not part of the current API response; the server no longer emits it. */
  transcription_engine?: TranscriptionEngine;
  /** @deprecated Not part of the current API response; the server no longer emits it. */
  api_version?: string;
  /** @deprecated Not part of the current API response; the server no longer emits it. */
  date_created?: string;
}

export interface StartTranscriptionRequest {
  Name?: string;
  Track?: TrackSelector;
  LanguageCode?: string;
  TranscriptionEngine?: TranscriptionEngine;
  ProfanityFilter?: boolean;
  PartialResults?: boolean;
  Hints?: string;
  StatusCallback?: string;
  StatusCallbackMethod?: string;
  StatusCallbackEvents?: string;
}

export interface StopTranscriptionRequest {
  Status: 'stopped';
}

/**
 * A recording transcription (`TR…`), created by `<Record transcribe="true">`. Read and
 * delete only; `transcription_text` is `null` until `status` reaches `completed`.
 */
export interface Transcription {
  sid: string;
  account_sid: string;
  status: Open<'in-progress' | 'completed' | 'failed'>;
  recording_sid: string;
  /** Recording duration in whole seconds (string-typed on the wire). */
  duration?: string;
  transcription_text?: string | null;
  type: Open<'fast'>;
  price?: string;
  price_unit?: string;
  api_version: string;
  uri: string;
  date_created?: string;
  date_updated?: string;
}

/** `GET /Transcriptions.json` and `GET /Recordings/{sid}/Transcriptions.json`. */
export interface TranscriptionList extends PageEnvelope {
  transcriptions: Transcription[];
}

/** Filters for the transcription lists. */
export interface ListTranscriptionsParams {
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
