import type { PageEnvelope, TrackSelector } from './common.js';

export type StreamStatus = 'in-progress' | 'stopped';

export interface Stream {
  sid: string;
  account_sid: string;
  call_sid: string;
  name?: string;
  status: StreamStatus;
  api_version: string;
  uri: string;
  date_created?: string;
  date_updated?: string;
}

export interface StreamList extends PageEnvelope {
  streams: Stream[];
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
