/**
 * Twilio Voice v1 (voice.twilio.com/v1) resource models.
 *
 * The `/v1/` namespace sits outside the `/2010-04-01/Accounts/.../` prefix —
 * the account is resolved from HTTP Basic auth, ISO-8601 dates, and list
 * responses carry the {@link VoiceV1Meta} envelope (a `meta:` sub-object,
 * unlike the flattened envelope used by the 2010 surface).
 */

/** Standard list-envelope `meta:` object shared by every Voice v1 list response. */
export interface VoiceV1Meta {
  first_page_url: string | null;
  next_page_url: string | null;
  previous_page_url: string | null;
  url: string | null;
  page: number | null;
  page_size: number | null;
  key: string | null;
}

// ---------------------------------------------------------------------------
// IpRecord — /v1/IpRecords
// ---------------------------------------------------------------------------

/** A standalone allowed source IP (`IL…`). */
export interface VoiceV1IpRecord {
  account_sid: string;
  sid: string;
  friendly_name: string | null;
  ip_address: string | null;
  cidr_prefix_length: number;
  date_created: string | null;
  date_updated: string | null;
  url: string | null;
}

export interface VoiceV1IpRecordList {
  ip_records: VoiceV1IpRecord[];
  meta: VoiceV1Meta;
}

export interface CreateVoiceV1IpRecordRequest {
  IpAddress: string;
  FriendlyName?: string;
  CidrPrefixLength?: number;
}

export interface UpdateVoiceV1IpRecordRequest {
  FriendlyName?: string;
}

// ---------------------------------------------------------------------------
// SourceIpMapping — /v1/SourceIpMappings
// ---------------------------------------------------------------------------

/** Maps an IpRecord to a SIP Domain (`IB…`). */
export interface VoiceV1SourceIpMapping {
  sid: string;
  ip_record_sid: string | null;
  sip_domain_sid: string | null;
  date_created: string | null;
  date_updated: string | null;
  url: string | null;
}

export interface VoiceV1SourceIpMappingList {
  source_ip_mappings: VoiceV1SourceIpMapping[];
  meta: VoiceV1Meta;
}

export interface CreateVoiceV1SourceIpMappingRequest {
  IpRecordSid: string;
  SipDomainSid: string;
}

export interface UpdateVoiceV1SourceIpMappingRequest {
  SipDomainSid: string;
}

// ---------------------------------------------------------------------------
// ByocTrunk — /v1/ByocTrunks
// ---------------------------------------------------------------------------

/** Bring-your-own-carrier trunk (`BY…`). */
export interface VoiceV1ByocTrunk {
  account_sid: string;
  sid: string;
  friendly_name: string | null;
  voice_url: string | null;
  voice_method: 'GET' | 'POST' | null;
  voice_fallback_url: string | null;
  voice_fallback_method: 'GET' | 'POST' | null;
  status_callback_url: string | null;
  status_callback_method: 'GET' | 'POST' | null;
  cnam_lookup_enabled: boolean | null;
  connection_policy_sid: string | null;
  from_domain_sid: string | null;
  date_created: string | null;
  date_updated: string | null;
  url: string | null;
}

export interface VoiceV1ByocTrunkList {
  byoc_trunks: VoiceV1ByocTrunk[];
  meta: VoiceV1Meta;
}

export interface CreateVoiceV1ByocTrunkRequest {
  FriendlyName?: string;
  VoiceUrl?: string;
  VoiceMethod?: 'GET' | 'POST';
  VoiceFallbackUrl?: string;
  VoiceFallbackMethod?: 'GET' | 'POST';
  StatusCallbackUrl?: string;
  StatusCallbackMethod?: 'GET' | 'POST';
  CnamLookupEnabled?: boolean;
  ConnectionPolicySid?: string;
  FromDomainSid?: string;
}

export type UpdateVoiceV1ByocTrunkRequest = CreateVoiceV1ByocTrunkRequest;

// ---------------------------------------------------------------------------
// ConnectionPolicy — /v1/ConnectionPolicies
// ---------------------------------------------------------------------------

/** A Voice ConnectionPolicy (`NY…`). */
export interface VoiceV1ConnectionPolicy {
  account_sid: string;
  sid: string;
  friendly_name: string | null;
  date_created: string | null;
  date_updated: string | null;
  url: string | null;
  links: Record<string, string> | null;
}

export interface VoiceV1ConnectionPolicyList {
  connection_policies: VoiceV1ConnectionPolicy[];
  meta: VoiceV1Meta;
}

export interface CreateVoiceV1ConnectionPolicyRequest {
  FriendlyName?: string;
}

export interface UpdateVoiceV1ConnectionPolicyRequest {
  FriendlyName?: string;
}

// ---------------------------------------------------------------------------
// ConnectionPolicyTarget — /v1/ConnectionPolicies/{Sid}/Targets
// ---------------------------------------------------------------------------

/** A ConnectionPolicy Target (`NE…`). */
export interface VoiceV1ConnectionPolicyTarget {
  account_sid: string;
  connection_policy_sid: string;
  sid: string;
  friendly_name: string | null;
  target: string | null;
  priority: number;
  weight: number;
  enabled: boolean | null;
  date_created: string | null;
  date_updated: string | null;
  url: string | null;
}

export interface VoiceV1ConnectionPolicyTargetList {
  targets: VoiceV1ConnectionPolicyTarget[];
  meta: VoiceV1Meta;
}

export interface CreateVoiceV1ConnectionPolicyTargetRequest {
  Target: string;
  FriendlyName?: string;
  Priority?: number;
  Weight?: number;
  Enabled?: boolean;
}

export interface UpdateVoiceV1ConnectionPolicyTargetRequest {
  FriendlyName?: string;
  Target?: string;
  Priority?: number;
  Weight?: number;
  Enabled?: boolean;
}

// ---------------------------------------------------------------------------
// DialingPermissions Settings — /v1/Settings
// ---------------------------------------------------------------------------

export interface VoiceV1DialingPermissionsSettings {
  dialing_permissions_inheritance: boolean | null;
  url: string | null;
}

export interface UpdateVoiceV1DialingPermissionsSettingsRequest {
  DialingPermissionsInheritance?: boolean;
}

// ---------------------------------------------------------------------------
// List-page query params (paginated GETs)
// ---------------------------------------------------------------------------

/** Query params common to every Voice v1 list endpoint. */
export interface ListVoiceV1PageParams {
  PageSize?: number;
  // Index signature so the interface satisfies the transport's
  // `params: Record<string, unknown>` constraint without a cast.
  [key: string]: unknown;
}
