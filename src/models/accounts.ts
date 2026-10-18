import type { HttpMethod, Open, PageEnvelope } from './common.js';

/** `GET /2010-04-01/Accounts/{AccountSid}.json` — the authenticated account. */
export interface Account {
  sid?: string | null;
  friendly_name?: string | null;
  status?: Open<'active' | 'suspended' | 'closed'>;
  type?: Open<'Trial' | 'Full'>;
  owner_account_sid?: string | null;
  date_created?: string | null;
  date_updated?: string | null;
  uri?: string | null;
  subresource_uris?: Record<string, string> | null;
}

/**
 * Body for `POST /2010-04-01/Accounts/{AccountSid}.json`. Only the fields you set are
 * changed. The STT/TTS tokens and AWS secret are write-only.
 */
export interface UpdateAccountRequest {
  FriendlyName?: string;
  VoiceUrl?: string;
  VoiceMethod?: HttpMethod;
  VoiceFallbackUrl?: string;
  VoiceFallbackMethod?: HttpMethod;
  SttFsVendor?: string;
  SttHttpUrl?: string;
  SttHttpToken?: string;
  TtsHttpUrl?: string;
  TtsHttpToken?: string;
  TtsEngineName?: string;
  TtsDefaultVoice?: string;
  TtsDefaultLanguage?: string;
  AwsBucket?: string;
  AwsRegion?: string;
  AwsPrefix?: string;
  AwsAccessKeyId?: string;
  AwsSecretAccessKey?: string;
  AwsKmsKeyId?: string;
  /** Source CIDRs allowed to call the API with this account's key (repeated `AllowCidr`). */
  AllowCidr?: string[];
}

/**
 * The account configuration view plus a freshly generated `api_key` — the
 * response of `accounts.rotateKey()`. No read endpoint returns the key, so
 * store it right away; the previous key stops working immediately.
 *
 * On the object returned by `rotateKey()` the `api_key` property is
 * non-enumerable: `console.log`, `util.inspect` and `JSON.stringify` skip it.
 * Read it directly (`account.api_key`) instead of spreading the object.
 */
export interface AccountWithKey {
  sid: string;
  /** The new API key returned by rotation (see the interface docs). */
  api_key: string;
  sip_username: string;
  /** Source CIDRs allowed to call the API with this account's key. */
  allow_cidr: string[];
  disabled: boolean;
  stt_http_token_set: boolean;
  tts_http_token_set: boolean;
  stripe_secret_key_set: boolean;
  pay_enabled: boolean;
  sms_allowed_providers: string[];
  stt_allowed_providers: string[];
  aws_secret_access_key_set: boolean;
  created_at: string;
  updated_at: string;
  name?: string;
  phone_regions?: string[];
  stt_fs_vendor?: string;
  stt_http_url?: string;
  tts_http_url?: string;
  tts_engine_name?: string;
  tts_default_voice?: string;
  tts_default_language?: string;
  sms_provider?: string;
  stt_provider?: string;
  voice_url?: string;
  voice_method?: string;
  voice_fallback_url?: string;
  voice_fallback_method?: string;
  aws_bucket?: string;
  aws_region?: string;
  aws_prefix?: string;
  aws_access_key_id?: string;
  aws_kms_key_id?: string;
}

/** `GET …/Balance.json`. VoiceML is operator-billed and reports a static zero. */
export interface Balance {
  account_sid?: string | null;
  balance?: string | null;
  currency?: string | null;
}

/** A verified caller ID (`PN…`) that may be used as `From` / `CallerId`. */
export interface OutgoingCallerId {
  sid: string | null;
  account_sid: string | null;
  friendly_name: string | null;
  phone_number: string | null;
  date_created: string | null;
  date_updated: string | null;
  uri: string | null;
}

export interface OutgoingCallerIdList extends PageEnvelope {
  outgoing_caller_ids: OutgoingCallerId[];
}

/** Result of `POST …/OutgoingCallerIds.json`: the pending verification and its code. */
export interface ValidationRequest {
  account_sid: string | null;
  phone_number: string | null;
  friendly_name: string | null;
  validation_code: string | null;
  call_sid: string | null;
}

export interface ListOutgoingCallerIdsParams {
  PhoneNumber?: string;
  FriendlyName?: string;
  Page?: number;
  PageSize?: number;
  PageToken?: string;
}

export interface CreateOutgoingCallerIdRequest {
  /** E.164 number to verify. */
  PhoneNumber: string;
  FriendlyName?: string;
}

export interface UpdateOutgoingCallerIdRequest {
  FriendlyName?: string;
}

/** One nightly event-log archive available for download. */
export interface ExportEntry {
  /** Archive day (`YYYY-MM-DD`). */
  date: string;
  /** Archive size in bytes. */
  size: number;
  /** Download path for this archive. */
  uri: string;
}

/** `GET …/Exports.json` — the account's available archives, newest first. */
export interface ExportList {
  account_sid: string;
  uri: string;
  exports: ExportEntry[];
}

/** Bytes of one downloaded export archive (`exports.download`). */
export interface ExportArchive {
  /** Archive day (`YYYY-MM-DD`). */
  date: string;
  body: Uint8Array;
  contentType: string;
  /** `true` when the bytes came from the presigned redirect target. */
  redirected: boolean;
}

export type UsageCategory =
  | 'calls'
  | 'calls-inbound'
  | 'calls-outbound'
  | 'mms'
  | 'mms-inbound'
  | 'mms-outbound'
  | 'sms'
  | 'sms-inbound'
  | 'sms-inbound-longcode'
  | 'sms-outbound'
  | 'sms-outbound-longcode'
  | 'totalprice';

/** One usage category summarised over a window. */
export interface UsageRecord {
  account_sid: string | null;
  api_version: string | null;
  as_of: string | null;
  category: Open<UsageCategory> | null;
  count: string | null;
  count_unit: string | null;
  description: string | null;
  end_date: string | null;
  price: string | null;
  price_unit: string | null;
  start_date: string | null;
  subresource_uris: Record<string, unknown> | null;
  uri: string | null;
  usage: string | null;
  usage_unit: string | null;
}

export interface UsageRecordList extends PageEnvelope {
  usage_records: UsageRecord[];
}

/** Query params shared by `/Usage/Records` and its eight window variants. */
export interface ListUsageRecordsParams {
  Category?: UsageCategory;
  /** Window start (inclusive), `YYYY-MM-DD`. A `Date` is sent as its UTC day. */
  StartDate?: string | Date;
  /** Window end (inclusive), `YYYY-MM-DD`. A `Date` is sent as its UTC day. */
  EndDate?: string | Date;
  IncludeSubaccounts?: boolean;
  Page?: number;
  PageSize?: number;
  PageToken?: string;
}
