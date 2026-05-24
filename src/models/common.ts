/** Twilio-compatible pagination envelope. Subclasses bind the concrete resource-list field. */
export interface PageEnvelope {
  page: number;
  page_size: number;
  num_pages?: number;
  total?: number;
  start?: number;
  end?: number;
  first_page_uri?: string;
  next_page_uri?: string | null;
  previous_page_uri?: string | null;
  uri?: string;
}

/** Twilio-compatible error body, surfaced on `error.body` for non-2xx responses. */
export interface ErrorBody {
  code?: number;
  message?: string;
  more_info?: string;
  status?: number;
}

/** One tripped check from the `/health` deep probe. */
export interface HealthFailure {
  check: string;
  detail: string;
}

export type HttpMethod = 'GET' | 'POST';
export type TrackSelector = 'inbound_track' | 'outbound_track' | 'both_tracks';
