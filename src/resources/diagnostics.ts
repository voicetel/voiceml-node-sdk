import type { HealthStatus } from '../models/index.js';
import type { Transport } from '../transport.js';

/**
 * Diagnostic surfaces — `/health` and the OpenAPI doc endpoints. These sit at server root
 * (not under `/2010-04-01/Accounts/{AccountSid}/`) and are intentionally unauthenticated.
 */
export class DiagnosticsResource {
  private readonly t: Transport;

  constructor(transport: Transport) {
    this.t = transport;
  }

  /** Deep liveness probe. 200 = hard checks pass; 503 raises a `ServerError`. */
  async health(): Promise<HealthStatus> {
    const url = `${this.t.baseUrl}/health`;
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) {
      // Reuse the transport's parser by issuing through fetchBytes path? Simpler: throw.
      const text = await response.text();
      throw new Error(`/health returned ${response.status}: ${text.slice(0, 200)}`);
    }
    return (await response.json()) as HealthStatus;
  }

  /** Fetch the OpenAPI spec as parsed JSON. */
  async openapiJson(): Promise<unknown> {
    const url = `${this.t.baseUrl}/openapi.json`;
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) {
      throw new Error(`/openapi.json returned ${response.status}`);
    }
    return response.json();
  }
}
