import type { PageEnvelope, TrackSelector } from './common.js';

export type SiprecStatus = 'in-progress' | 'stopped';

export interface SiprecSession {
  sid: string;
  account_sid: string;
  call_sid: string;
  name?: string;
  connector_name?: string;
  status: SiprecStatus;
  api_version: string;
  uri: string;
  date_created?: string;
  date_updated?: string;
}

export interface SiprecList extends PageEnvelope {
  siprec: SiprecSession[];
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
