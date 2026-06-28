/**
 * SIP-domain Inbound Processing Region binding. Twilio's routes/v2 surface.
 * SID is `QQ…` (32 hex). Keyed by the registrable SIP domain name (not the
 * `SD…` SipDomain SID).
 */
export interface RoutesV2SipDomain {
  sid: string;
  sip_domain: string;
  account_sid: string;
  friendly_name: string | null;
  voice_region: string | null;
  url: string | null;
  date_created: string;
  date_updated: string;
}

/** Body for `POST /v2/SipDomains/{SipDomain}`. All fields optional. */
export interface UpdateRoutesV2SipDomainRequest {
  VoiceRegion?: string;
  FriendlyName?: string;
}

/**
 * Phone-number Inbound Processing Region binding. Twilio's routes/v2 surface.
 * SID is `QQ…` (32 hex). Keyed by the E.164 phone number (or its `PN…` sid).
 */
export interface RoutesV2PhoneNumber {
  sid: string;
  phone_number: string;
  account_sid: string;
  friendly_name: string | null;
  voice_region: string | null;
  url: string | null;
  date_created: string;
  date_updated: string;
}

/** Body for `POST /v2/PhoneNumbers/{PhoneNumber}`. All fields optional. */
export interface UpdateRoutesV2PhoneNumberRequest {
  VoiceRegion?: string;
  FriendlyName?: string;
}
