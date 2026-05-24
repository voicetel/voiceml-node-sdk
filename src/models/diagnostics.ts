import type { HealthFailure } from './common.js';

/** `GET /Calls/{sid}/Events` — always an empty list (compat stub). */
export interface EventsList {
  events: unknown[];
  page: number;
  page_size: number;
  total: number;
  uri?: string;
}

/**
 * `GET /health` — composite probe. Hard-check failures flip `ok` to false (server returns
 * 503). Soft-check warnings surface in `warnings` only and don't take the host out of
 * rotation.
 */
export interface HealthStatus {
  ok: boolean;
  warnings: HealthFailure[];
  failures?: HealthFailure[];
}
