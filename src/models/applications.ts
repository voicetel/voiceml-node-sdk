import type { HttpMethod, Open, PageEnvelope } from './common.js';
import type { CallStatusCallbackEvent } from './calls.js';

export interface Application {
  sid: string | null;
  account_sid: string | null;
  friendly_name: string | null;
  api_version: string | null;
  voice_url: string | null;
  voice_method?: Open<HttpMethod> | null;
  voice_fallback_url?: string | null;
  voice_fallback_method?: Open<HttpMethod> | null;
  voice_caller_id_lookup: boolean | null;
  status_callback?: string | null;
  status_callback_method?: Open<HttpMethod> | null;
  /** @deprecated Not part of the current API response; the server no longer emits it. */
  status_callback_event?: string;
  date_created: string | null;
  date_updated: string | null;
  uri: string | null;
  /** Delivery-receipt URL for outbound messages sent via this Application without their own `StatusCallback`. */
  message_status_callback?: string | null;
  /** Legacy alias of `message_status_callback` (delivery-receipt URL for outbound SMS). */
  sms_status_callback?: string | null;
  /** Webhook for inbound messages to numbers whose `sms_application_sid` binds this Application. */
  sms_url?: string | null;
  /** HTTP method for sms_url; Twilio's default POST when unset. */
  sms_method?: Open<'GET' | 'POST'> | null;
  /** Twilio-compatible: tried once, with the original parameters, when the sms_url fetch fails. */
  sms_fallback_url?: string | null;
  /** HTTP method for sms_fallback_url; Twilio's default POST when unset. */
  sms_fallback_method?: Open<'GET' | 'POST'> | null;
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
  /** Application-level default event mask. Repeatable: rendered as multiple form params. */
  StatusCallbackEvent?: CallStatusCallbackEvent[];
  /** Delivery-receipt URL for outbound messages sent via this Application. */
  MessageStatusCallback?: string;
  /** Legacy alias of `MessageStatusCallback`. */
  SmsStatusCallback?: string;
  /** Inbound-SMS webhook URL for this Application. */
  SmsUrl?: string;
  SmsMethod?: HttpMethod;
  /** Called when requesting/executing the TwiML at `SmsUrl` fails. */
  SmsFallbackUrl?: string;
  SmsFallbackMethod?: HttpMethod;
  PublicApplicationConnectEnabled?: boolean;
}

export type CreateApplicationRequest = ApplicationBody;
export type UpdateApplicationRequest = ApplicationBody;

export interface ListApplicationsParams {
  FriendlyName?: string;
  Page?: number;
  PageSize?: number;
  PageToken?: string;
}
