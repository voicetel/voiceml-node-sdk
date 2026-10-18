import type { HttpMethod, Open, PageEnvelope } from './common.js';

/**
 * A SIP Domain (`SD…`), the Twilio-compatible SIP ingress endpoint.
 * CredentialList and IpAccessControlList bindings are attached via the mapping
 * sub-resources; this struct carries only the domain's own configuration.
 */
export interface SipDomain {
  sid: string | null;
  account_sid: string | null;
  api_version: string | null;
  domain_name: string | null;
  friendly_name?: string | null;
  auth_type?: string | null;
  voice_url?: string | null;
  voice_method?: string | null;
  voice_fallback_url?: string | null;
  voice_fallback_method?: string | null;
  voice_status_callback_url?: string | null;
  voice_status_callback_method?: string | null;
  sip_registration?: boolean | null;
  emergency_calling_enabled?: boolean | null;
  secure?: boolean | null;
  byoc_trunk_sid?: string | null;
  emergency_caller_sid?: string | null;
  date_created: string | null;
  date_updated: string | null;
  uri: string | null;
  subresource_uris?: Record<string, string> | null;
}

export interface SipDomainList extends PageEnvelope {
  domains: SipDomain[];
}

/** A named bag of SIP-digest credentials — Twilio-compatible `CL…`. */
export interface SipCredentialList {
  sid: string | null;
  account_sid: string | null;
  friendly_name?: string | null;
  date_created: string | null;
  date_updated: string | null;
  uri: string | null;
  subresource_uris?: Record<string, string> | null;
}

export interface SipCredentialListList extends PageEnvelope {
  credential_lists: SipCredentialList[];
}

/**
 * A single SIP-digest username + (write-only) password — `CR…`. `password` is
 * never round-tripped on response — use `update` with a new password to rotate.
 */
export interface SipCredential {
  sid: string | null;
  account_sid: string | null;
  credential_list_sid: string | null;
  username: string | null;
  date_created: string | null;
  date_updated: string | null;
  uri: string | null;
}

/**
 * List page for credentials within a CredentialList. Spec-named
 * `SipCredentialListPage` — note: it's a *page of credentials*, not of
 * credential-lists, following the Twilio-compatible naming.
 */
export interface SipCredentialListPage extends PageEnvelope {
  credentials: SipCredential[];
}

/** A named bag of CIDR-bound IP addresses — Twilio-compatible `AL…`. */
export interface SipIpAccessControlList {
  sid: string | null;
  account_sid: string | null;
  friendly_name?: string | null;
  date_created: string | null;
  date_updated: string | null;
  uri: string | null;
  subresource_uris?: Record<string, string> | null;
}

export interface SipIpAccessControlListList extends PageEnvelope {
  ip_access_control_lists: SipIpAccessControlList[];
}

/** A single CIDR-bound entry in an IpAccessControlList — `IP…`. */
export interface SipIpAddress {
  sid: string | null;
  account_sid: string | null;
  ip_access_control_list_sid: string | null;
  friendly_name: string | null;
  ip_address: string | null;
  cidr_prefix_length: number;
  date_created: string | null;
  date_updated: string | null;
  uri: string | null;
}

export interface SipIpAddressList extends PageEnvelope {
  ip_addresses: SipIpAddress[];
}

/**
 * Round-trip shape for every domain mapping sub-resource (Calls / Registrations
 * × CredentialList / IpAccessControlList). The `sid` echoes the sid of the
 * bound resource (`CL…` for credential mappings, `AL…` for IP-ACL mappings);
 * `domain_sid` records which domain the binding is attached to.
 */
export interface SipDomainMapping {
  sid: string | null;
  account_sid: string | null;
  friendly_name?: string | null;
  domain_sid?: string | null;
  date_created: string | null;
  date_updated: string | null;
  uri: string | null;
}

export interface SipCredentialListMappingList extends PageEnvelope {
  credential_list_mappings: SipDomainMapping[];
}

export interface SipIpAccessControlListMappingList extends PageEnvelope {
  ip_access_control_list_mappings: SipDomainMapping[];
}

// ---------------------------------------------------------------------------
// Request bodies (form-encoded)
// ---------------------------------------------------------------------------

/** Body for `POST /SIP/Domains.json`. `DomainName` is required. */
export interface CreateSipDomainRequest {
  DomainName: string;
  FriendlyName?: string;
  VoiceUrl?: string;
  VoiceMethod?: HttpMethod;
  VoiceFallbackUrl?: string;
  VoiceFallbackMethod?: HttpMethod;
  VoiceStatusCallbackUrl?: string;
  VoiceStatusCallbackMethod?: HttpMethod;
  SipRegistration?: boolean;
  Secure?: boolean;
  EmergencyCallingEnabled?: boolean;
  ByocTrunkSid?: string;
  EmergencyCallerSid?: string;
}

/** Body for `POST /SIP/Domains/{Sid}.json`. All fields optional. */
export interface UpdateSipDomainRequest {
  FriendlyName?: string;
  VoiceUrl?: string;
  VoiceMethod?: HttpMethod;
  VoiceFallbackUrl?: string;
  VoiceFallbackMethod?: HttpMethod;
  VoiceStatusCallbackUrl?: string;
  VoiceStatusCallbackMethod?: HttpMethod;
  SipRegistration?: boolean;
  Secure?: boolean;
  EmergencyCallingEnabled?: boolean;
  ByocTrunkSid?: string;
  EmergencyCallerSid?: string;
}

export interface CreateSipCredentialListRequest {
  FriendlyName: string;
}

export interface UpdateSipCredentialListRequest {
  FriendlyName?: string;
}

export interface CreateSipCredentialRequest {
  Username: string;
  Password: string;
}

/** Only the password is mutable; username is pinned at creation time. */
export interface UpdateSipCredentialRequest {
  Password: string;
}

export interface CreateSipIpAccessControlListRequest {
  FriendlyName: string;
}

export interface UpdateSipIpAccessControlListRequest {
  FriendlyName?: string;
}

/** `CidrPrefixLength` defaults to 32 (single host) when omitted on create. */
export interface CreateSipIpAddressRequest {
  FriendlyName: string;
  IpAddress: string;
  CidrPrefixLength?: number;
}

export interface UpdateSipIpAddressRequest {
  FriendlyName?: string;
  IpAddress?: string;
  CidrPrefixLength?: number;
}

/**
 * Body for any `…/CredentialListMappings.json` POST. Used for both the
 * historical (no-Auth) namespace and the modern Auth/Calls + Auth/Registrations
 * namespaces — all three round-trip the same shape.
 */
export interface CreateSipCredentialListMappingRequest {
  CredentialListSid: string;
}

/**
 * Body for any `…/IpAccessControlListMappings.json` POST. Used for both the
 * historical (no-Auth) and Auth/Calls namespaces. No registrations counterpart
 * — Twilio omits IP-ACL mappings on the registrations side.
 */
export interface CreateSipIpAccessControlListMappingRequest {
  IpAccessControlListSid: string;
}

/** Paging params for SIP lists without filters (credentials, mappings, registrations). */
export interface ListSipPageParams {
  Page?: number;
  PageSize?: number;
  PageToken?: string;
}

/** Paging + `FriendlyName` filter for the Domains, CredentialLists, IpAccessControlLists and IpAddresses lists. */
export interface ListSipFilteredPageParams extends ListSipPageParams {
  FriendlyName?: string;
}

/** One registered contact of a SIP registration. */
export interface SipRegistrationContact {
  contact: string;
  received?: string | null;
  socket?: string | null;
  user_agent?: string | null;
  expires_at?: string | null;
  registered: boolean;
}

/** A SIP endpoint currently registered against one of the account's domains. */
export interface SipRegistration {
  aor: string;
  username: string;
  domain: string;
  domain_sid: string;
  status: Open<'registered' | 'expired'>;
  caller_id?: string | null;
  user_agent?: string | null;
  last_registered?: string | null;
  contacts: SipRegistrationContact[];
  active_call?: Record<string, unknown> | null;
}

export interface SipRegistrationList extends PageEnvelope {
  registrations: SipRegistration[];
}
