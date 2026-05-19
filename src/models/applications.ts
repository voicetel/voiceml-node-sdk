import type { HttpMethod, PageEnvelope } from './common.js';

export interface Application {
  sid: string;
  account_sid: string;
  friendly_name: string;
  api_version: string;
  voice_url: string;
  voice_method?: HttpMethod;
  voice_fallback_url?: string;
  voice_fallback_method?: HttpMethod;
  voice_caller_id_lookup: boolean;
  status_callback?: string;
  status_callback_method?: HttpMethod;
  status_callback_event?: string;
  date_created: string;
  date_updated: string;
  uri: string;
}

export interface ApplicationList extends PageEnvelope {
  applications: Application[];
}

/** Shared form fields for create + update. All optional per spec. */
export interface ApplicationBody {
  FriendlyName?: string;
  VoiceUrl?: string;
  VoiceMethod?: HttpMethod;
  VoiceFallbackUrl?: string;
  VoiceFallbackMethod?: HttpMethod;
  VoiceCallerIdLookup?: boolean;
  StatusCallback?: string;
  StatusCallbackMethod?: HttpMethod;
  StatusCallbackEvent?: string;
}

export type CreateApplicationRequest = ApplicationBody;
export type UpdateApplicationRequest = ApplicationBody;
