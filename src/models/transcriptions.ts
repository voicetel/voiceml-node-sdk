import type { PageEnvelope, TrackSelector } from './common.js';

export type TranscriptionStatus = 'in-progress' | 'stopped';
export type TranscriptionEngine = 'deepgram' | 'google' | 'aws' | 'azure';

export interface CallTranscription {
  sid: string;
  account_sid: string;
  call_sid: string;
  name?: string;
  language_code?: string;
  transcription_engine?: TranscriptionEngine;
  status: TranscriptionStatus;
  api_version?: string;
  uri: string;
  date_created?: string;
  date_updated?: string;
}

export interface TranscriptionList extends PageEnvelope {
  transcriptions: CallTranscription[];
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
