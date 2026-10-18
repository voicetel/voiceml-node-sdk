import type { HealthFailure } from './common.js';

/**
 * `GET /health` — composite probe. Hard-check failures flip `ok` to false (the server answers
 * 503, which the SDK raises as `ServerError` with this body on `error.body`). Soft-check
 * warnings surface in `warnings` only and don't take the host out of rotation.
 */
export interface HealthStatus {
  ok: boolean;
  warnings?: HealthFailure[];
  /** Present on the 503 body only. */
  failures?: HealthFailure[];
}
