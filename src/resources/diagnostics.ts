import type { HealthStatus } from '../models/index.js';
import type { Transport } from '../transport.js';

/**
 * Diagnostic surfaces — `/health` and the OpenAPI documents. These sit at the server root
 * (not under `/2010-04-01/Accounts/{AccountSid}/`) and are unauthenticated: the SDK sends no
 * credentials, so they also work on a client constructed without any (`new Client()`).
 * They go through the normal transport, so the client's `fetch`, timeout, retries and
 * User-Agent apply.
 */
export class DiagnosticsResource {
  private readonly t: Transport;

  constructor(transport: Transport) {
    this.t = transport;
  }

  /**
   * Deep liveness probe. `200` returns the status (with any soft-check `warnings`); a `503`
   * (a hard check failed) raises `ServerError` with the failing checks on `error.body`.
   */
  async health(): Promise<HealthStatus> {
    return this.t.request<HealthStatus>({ method: 'GET', path: '/health', auth: false });
  }

  /** The OpenAPI document, parsed from `/openapi.json`. */
  async openapiJson(): Promise<unknown> {
    return this.t.request<unknown>({ method: 'GET', path: '/openapi.json', auth: false });
  }

  /** The OpenAPI document as YAML text, from `/openapi.yaml`. */
  async openapiYaml(): Promise<string> {
    return this.#text('/openapi.yaml');
  }

  /** The OpenAPI document as YAML text, from `/openapi.yml`. */
  async openapiYml(): Promise<string> {
    return this.#text('/openapi.yml');
  }

  async #text(path: string): Promise<string> {
    const res = await this.t.fetchBytes({
      path,
      auth: false,
      accept: 'application/yaml, text/yaml, */*',
    });
    return new TextDecoder().decode(res.body);
  }
}
