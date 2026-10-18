/**
 * Twilio-compatible `/2010-04-01` pagination envelope. Each list model adds its item array.
 *
 * Follow `next_page_uri` (relative; it carries the server's `PageToken`) to reach the next
 * page — `client.nextPage(page)` and the `iterate()` helpers do this for you. It is `null`
 * (or absent) on the last page.
 */
export interface PageEnvelope {
  page: number;
  page_size: number;
  start?: number;
  end?: number;
  first_page_uri?: string;
  next_page_uri?: string | null;
  previous_page_uri?: string | null;
  uri?: string;
}

/** Twilio-compatible error body, surfaced on `error.body` for non-2xx responses. */
export interface ErrorBody {
  code: number;
  message: string;
  more_info?: string;
  status: number;
}

/** One tripped check from the `/health` deep probe. */
export interface HealthFailure {
  check: string;
  detail: string;
}

/**
 * A string enum the server may extend. Known values autocomplete; any other string still
 * type-checks, so a value added server-side never breaks consumer code.
 */
export type Open<T extends string> = T | (string & {});

export type HttpMethod = 'GET' | 'POST';
export type TrackSelector = 'inbound_track' | 'outbound_track' | 'both_tracks';
