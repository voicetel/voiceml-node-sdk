import type { Open, TrackSelector } from './common.js';

export type StreamStatus = 'in-progress' | 'stopped';

export interface Stream {
  sid: string | null;
  account_sid: string | null;
  call_sid: string | null;
  name?: string | null;
  status: Open<StreamStatus>;
  /** @deprecated Not part of the current API response; the server no longer emits it. */
  api_version?: string;
  uri: string | null;
  /** @deprecated Not part of the current API response; the server no longer emits it. */
  date_created?: string;
  date_updated?: string | null;
}

export interface StartStreamRequest {
  /** wss:// endpoint for the customer's WebSocket server. */
  Url: string;
  Track?: TrackSelector;
  Name?: string;
  StatusCallback?: string;
  StatusCallbackMethod?: string;
}

export interface StopStreamRequest {
  Status: 'stopped';
}
