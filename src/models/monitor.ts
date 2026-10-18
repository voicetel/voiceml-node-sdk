/**
 * Twilio-compatible Monitor v1 resource models.
 *
 * The `/v1/` namespace sits outside the `/2010-04-01/Accounts/.../` prefix —
 * the account is resolved from HTTP Basic auth, and list responses carry the
 * {@link VoiceV1Meta} envelope (a `meta:` sub-object, like the other /v1
 * collections).
 */

import type { Open } from './common.js';
import type { VoiceV1Meta } from './voice_v1.js';

/**
 * A Monitor v1 Alert: a failure event (call-scoped error or messaging delivery
 * failure). The list omits the request/response detail; `fetch()` includes it
 * when the row carries any.
 */
export interface MonitorV1Alert {
  sid: string;
  account_sid: string;
  /** Human-readable description of the failure. */
  alert_text: string;
  /** Numeric error code, as a string (e.g. `11200`). */
  error_code: string;
  log_level: Open<'error' | 'warning'>;
  /** Error-dictionary URL for `error_code`. */
  more_info: string;
  request_method: string;
  request_url: string;
  url: string;
  date_created: string;
  date_generated: string;
  date_updated: string;
  /** Always `null`. */
  api_version?: string | null;
  /**
   * The affected resource: the message sid for messaging failures, the call sid
   * for call-scoped ones; `null` when neither exists.
   */
  resource_sid?: string | null;
  /** Set only for message-linked rows; `null` otherwise. */
  service_sid?: string | null;
  /** Fetch only: raw request headers when stored. */
  request_headers?: string | null;
  /** Fetch only: request variables when stored. */
  request_variables?: string | null;
  /** Fetch only: response body when stored. */
  response_body?: string | null;
  /** Fetch only: response headers when stored. */
  response_headers?: string | null;
}

/** `GET /v1/Alerts` — one page of alerts in the standard `meta` envelope. */
export interface MonitorV1AlertList {
  alerts: MonitorV1Alert[];
  meta: VoiceV1Meta;
}

/** Query parameters for `GET /v1/Alerts`. */
export interface ListMonitorAlertsParams {
  /** Only alerts at this severity. */
  LogLevel?: 'error' | 'warning';
  /** Only alerts generated at or after this date (`YYYY-MM-DD` or full ISO-8601). */
  StartDate?: string | Date;
  /** Only alerts generated on or before this day, inclusive. */
  EndDate?: string | Date;
  /** Page size (default 50, capped at 1000 — the alerts page has no continuation). */
  PageSize?: number;
}
