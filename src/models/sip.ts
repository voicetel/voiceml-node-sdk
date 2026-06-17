import type { PageEnvelope } from './common.js';

/**
 * SipDomain mirrors Twilio's `Domain` resource (the SIP ingress endpoint, `SD…`).
 * CredentialList and IpAccessControlList bindings are attached via the mapping
 * sub-resources; this struct carries only the domain's own configuration.
 */
export interface SipDomain {
  sid: string;
  account_sid: string;
  api_version: string;
  domain_name: string;
  friendly_name: string | null;
  auth_type: string | null;
  voice_url: string | null;
  voice_method: string | null;
  voice_fallback_url: string | null;
  voice_fallback_method: string | null;
  voice_status_callback_url: string | null;
  voice_status_callback_method: string | null;
  sip_registration: boolean | null;
  emergency_calling_enabled: boolean | null;
  secure: boolean | null;
  byoc_trunk_sid: string | null;
  emergency_caller_sid: string | null;
  date_created: string;
  date_updated: string;
  uri: string;
  subresource_uris?: Record<string, string>;
}

export interface SipDomainList extends PageEnvelope {
  domains: SipDomain[];
}

/** A named bag of SIP-digest credentials — Twilio-compatible `CL…`. */
export interface SipCredentialList {
  sid: string;
  account_sid: string;
  friendly_name: string | null;
  date_created: string;
  date_updated: string;
  uri: string;
  subresource_uris?: Record<string, string>;
}

export interface SipCredentialListList extends PageEnvelope {
  credential_lists: SipCredentialList[];
}

/**
 * A single SIP-digest username + (write-only) password — `CR…`. `password` is
 * never round-tripped on response — use `update` with a new password to rotate.
 */
export interface SipCredential {
  sid: string;
  account_sid: string;
  credential_list_sid: string;
  username: string;
  date_created: string;
  date_updated: string;
  uri: string;
}

/**
 * List page for credentials within a CredentialList. Spec-named
 * `SipCredentialListPage` — note: it's a *page of credentials*, not of
 * credential-lists, mirroring Twilio's naming.
 */
export interface SipCredentialListPage extends PageEnvelope {
  credentials: SipCredential[];
}

/** A named bag of CIDR-bound IP addresses — Twilio-compatible `AL…`. */
export interface SipIpAccessControlList {
  sid: string;
  account_sid: string;
  friendly_name: string | null;
  date_created: string;
  date_updated: string;
  uri: string;
  subresource_uris?: Record<string, string>;
}

export interface SipIpAccessControlListList extends PageEnvelope {
  ip_access_control_lists: SipIpAccessControlList[];
}

/** A single CIDR-bound entry in an IpAccessControlList — `IP…`. */
export interface SipIpAddress {
  sid: string;
  account_sid: string;
  ip_access_control_list_sid: string;
  friendly_name: string;
  ip_address: string;
  cidr_prefix_length: number;
  date_created: string;
  date_updated: string;
  uri: string;
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
  sid: string;
  account_sid: string;
  friendly_name: string | null;
  domain_sid: string | null;
  date_created: string;
  date_updated: string;
  uri: string;
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
  VoiceMethod?: string;
  VoiceFallbackUrl?: string;
  VoiceFallbackMethod?: string;
  VoiceStatusCallbackUrl?: string;
  VoiceStatusCallbackMethod?: string;
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
  VoiceMethod?: string;
  VoiceFallbackUrl?: string;
  VoiceFallbackMethod?: string;
  VoiceStatusCallbackUrl?: string;
  VoiceStatusCallbackMethod?: string;
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

export interface ListSipPageParams {
  Page?: number;
  PageSize?: number;
  PageToken?: string;
}
