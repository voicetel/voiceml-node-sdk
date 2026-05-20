import type { HttpMethod, PageEnvelope } from './common.js';

/**
 * Twilio-shape capability matrix on an `IncomingPhoneNumber`. VoiceML is voice-only —
 * `voice` is always `true`, the rest emit `false`. Modeled as required-non-null fields
 * so consumer code (`number.capabilities.voice`) doesn't need optional-chaining.
 */
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
 * carries the E.164 form. They are distinct: lookups by E.164 hit
 * `GET /IncomingPhoneNumbers?PhoneNumber=+1…` and resolve via `sid`.
 *
 * Field shapes mirror twilio-node's `IncomingPhoneNumberInstance` so strict-binding
 * deserializers (Jackson, StringEnumConverter) parse without throwing. Fields VoiceML
 * doesn't track (regulatory, SMS, emergency, trunking) emit a Twilio-compat default —
 * empty string, `null`, or the documented enum default.
 */
export interface IncomingPhoneNumber {
  sid: string;
  account_sid: string;
  phone_number: string;
  friendly_name: string | null;
  api_version: string;
  uri: string;
  voice_url: string | null;
  voice_method: HttpMethod | null;
  voice_fallback_url: string | null;
  voice_fallback_method: HttpMethod | null;
  capabilities: IncomingPhoneNumberCapabilities;
  date_created: string;
  date_updated: string;
  // --- Twilio-compat fields VoiceML doesn't track. ---
  origin?: 'twilio' | 'hosted' | '';
  beta?: boolean;
  voice_application_sid?: string;
  voice_caller_id_lookup?: boolean;
  voice_receive_mode?: 'voice' | 'fax';
  sms_url?: string;
  sms_method?: HttpMethod | '';
  sms_fallback_url?: string;
  sms_fallback_method?: HttpMethod | '';
  sms_application_sid?: string;
  status_callback?: string;
  status_callback_method?: HttpMethod | '';
  trunk_sid?: string;
  address_sid?: string;
  address_requirements?: 'none' | 'any' | 'local' | 'foreign' | '';
  identity_sid?: string;
  bundle_sid?: string;
  emergency_status?: 'Active' | 'Inactive' | '';
  emergency_address_sid?: string;
  emergency_address_status?:
    | 'registered'
    | 'unregistered'
    | 'pending-registration'
    | 'registration-failure'
    | '';
  status?: string;
}

/**
 * Page of incoming phone numbers — Twilio-shape envelope.
 *
 * `incoming_phone_numbers` is always present (may be empty). The standard pagination
 * fields (`page`, `page_size`, `total`, `*_page_uri`) match the rest of the SDK and
 * support the existing offset-pagination flow.
 */
export interface IncomingPhoneNumberList extends PageEnvelope {
  incoming_phone_numbers: IncomingPhoneNumber[];
}

export interface ListIncomingPhoneNumbersParams {
  /** Exact-match E.164 filter. Returns a 0-or-1-row envelope. */
  PhoneNumber?: string;
  Page?: number;
  PageSize?: number;
}

/**
 * Body for `POST /IncomingPhoneNumbers`. Idempotent on the same tenant: re-POSTing the
 * same `PhoneNumber` rebinds voice routing (matches Twilio update semantics) and
 * returns the existing row.
 */
export interface CreateIncomingPhoneNumberRequest {
  PhoneNumber: string;
  VoiceUrl?: string;
  VoiceMethod?: HttpMethod;
  VoiceFallbackUrl?: string;
  VoiceFallbackMethod?: HttpMethod;
}

/** Body for `POST /IncomingPhoneNumbers/{Sid}`. Only-set-fields-touched semantics. */
export interface UpdateIncomingPhoneNumberRequest {
  VoiceUrl?: string;
  VoiceMethod?: HttpMethod;
  VoiceFallbackUrl?: string;
  VoiceFallbackMethod?: HttpMethod;
}
