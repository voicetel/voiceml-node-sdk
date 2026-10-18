import type { Open, TrackSelector } from './common.js';

export type SiprecStatus = 'in-progress' | 'stopped';

export interface SiprecSession {
  sid: string | null;
  account_sid: string | null;
  call_sid: string | null;
  name?: string | null;
  /** @deprecated Not part of the current API response; the server no longer emits it. */
  connector_name?: string;
  status: Open<SiprecStatus>;
  /** @deprecated Not part of the current API response; the server no longer emits it. */
  api_version?: string;
  uri: string | null;
  /** @deprecated Not part of the current API response; the server no longer emits it. */
  date_created?: string;
  date_updated?: string | null;
}

export interface StartSiprecRequest {
  Name?: string;
  /** mod_siprec profile name. Empty falls back to SIPREC_DEFAULT_PROFILE then `default`. */
  ConnectorName?: string;
  Track?: TrackSelector;
  StatusCallback?: string;
  StatusCallbackMethod?: string;
}

/**
 * Body for `POST /Calls/{sid}/Siprec/{sid}`. Clears VoiceML's session tracking only — the
 * SRS recording itself continues until call hangup (documented mod_siprec limitation).
 */
export interface StopSiprecRequest {
  Status: 'stopped';
}
