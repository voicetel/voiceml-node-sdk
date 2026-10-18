import type { HttpMethod, Open, PageEnvelope } from './common.js';

/** Twilio-compatible capability matrix on an `IncomingPhoneNumber` (`null` when unknown). */
export interface IncomingPhoneNumberCapabilities {
  voice: boolean;
  sms: boolean;
  mms: boolean;
  fax: boolean;
}

/**
 * One DID assigned to the authenticated tenant.
 *
 * `sid` is the canonical `PN`-prefixed opaque identifier (34 chars); `phone_number`
 * carries the E.164 form. Lookups by E.164 use
 * `GET /IncomingPhoneNumbers?PhoneNumber=+1…` and resolve via `sid`.
 *
 * Fields VoiceML doesn't track (regulatory, emergency, trunking) carry a Twilio-compatible
 * default — empty string, `null`, or the documented enum default.
 */
export interface IncomingPhoneNumber {
  sid: string | null;
  account_sid: string | null;
  phone_number: string | null;
  friendly_name?: string | null;
  api_version: string | null;
  uri: string | null;
  voice_url?: string | null;
  voice_method?: Open<HttpMethod> | null;
  voice_fallback_url?: string | null;
  voice_fallback_method?: Open<HttpMethod> | null;
  capabilities: IncomingPhoneNumberCapabilities | null;
  date_created?: string | null;
  date_updated?: string | null;
  // --- Twilio-compatible fields VoiceML doesn't track. ---
  origin?: Open<'twilio' | 'hosted' | ''> | null;
  beta?: boolean | null;
  voice_application_sid?: string | null;
  voice_caller_id_lookup?: boolean | null;
  voice_receive_mode?: Open<'voice' | 'fax'>;
  sms_url?: string | null;
  sms_method?: Open<HttpMethod | ''> | null;
  sms_fallback_url?: string | null;
  sms_fallback_method?: Open<HttpMethod | ''> | null;
  sms_application_sid?: string | null;
  status_callback?: string | null;
  status_callback_method?: Open<HttpMethod | ''> | null;
  trunk_sid?: string | null;
  address_sid?: string | null;
  address_requirements?: Open<'none' | 'any' | 'local' | 'foreign' | ''>;
  identity_sid?: string | null;
  bundle_sid?: string | null;
  emergency_status?: Open<'Active' | 'Inactive' | ''>;
  emergency_address_sid?: string | null;
  emergency_address_status?: Open<
    | 'registered'
    | 'unregistered'
    | 'pending-registration'
    | 'registration-failure'
    | 'pending-unregistration'
    | 'unregistration-failure'
    | ''
  >;
  status?: string | null;
  /** Number type (`local` / `mobile` / `toll-free`); empty when the DID is unclassified. */
  type?: Open<'local' | 'mobile' | 'toll-free' | ''> | null;
  /** Sub-resource URIs (`assigned_add_ons`). */
  subresource_uris?: Record<string, unknown> | null;
}

/** Page of incoming phone numbers — Twilio-compatible envelope. */
export interface IncomingPhoneNumberList extends PageEnvelope {
  incoming_phone_numbers: IncomingPhoneNumber[];
}

/** Query params for `GET /IncomingPhoneNumbers` and the `Local` / `Mobile` / `TollFree` lists. */
export interface ListIncomingPhoneNumbersParams {
  /** Exact-match E.164 filter. Returns a 0-or-1-row envelope. */
  PhoneNumber?: string;
  FriendlyName?: string;
  Beta?: boolean;
  Origin?: 'twilio' | 'hosted';
  Page?: number;
  PageSize?: number;
  PageToken?: string;
}

/** Query params for the type-specific lists (`Local`, `Mobile`, `TollFree`). */
export type ListTypedIncomingPhoneNumbersParams = ListIncomingPhoneNumbersParams;

/** SMS webhook settings shared by create and update. */
interface IncomingPhoneNumberSmsFields {
  SmsUrl?: string;
  SmsMethod?: HttpMethod;
  SmsFallbackUrl?: string;
  SmsFallbackMethod?: HttpMethod;
  /** Bind inbound messages to an Application (`AP` + 32 hex); it wins over the `Sms*` URLs. */
  SmsApplicationSid?: string;
}

/**
 * Body for `POST /IncomingPhoneNumbers`. Idempotent on the same tenant: re-POSTing the
 * same `PhoneNumber` rebinds routing and returns the existing row.
 */
export interface CreateIncomingPhoneNumberRequest extends IncomingPhoneNumberSmsFields {
  PhoneNumber: string;
  VoiceUrl?: string;
  VoiceMethod?: HttpMethod;
  VoiceFallbackUrl?: string;
  VoiceFallbackMethod?: HttpMethod;
}

/** Body for `POST /IncomingPhoneNumbers/{Local,Mobile,TollFree}` — the typed creates. */
export interface CreateTypedIncomingPhoneNumberRequest {
  PhoneNumber: string;
  VoiceUrl?: string;
  VoiceMethod?: HttpMethod;
}

/** Body for `POST /IncomingPhoneNumbers/{Sid}`. Only the fields you set are changed. */
export interface UpdateIncomingPhoneNumberRequest extends IncomingPhoneNumberSmsFields {
  VoiceUrl?: string;
  VoiceMethod?: HttpMethod;
  VoiceFallbackUrl?: string;
  VoiceFallbackMethod?: HttpMethod;
}
