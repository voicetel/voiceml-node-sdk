/**
 * HTTP transport for the VoiceML REST API.
 *
 * - Auth: HTTP Basic with `AccountSid` as username and the per-tenant API key as password.
 *   The same pair the Twilio Node SDK validates in its constructor — drop-in compatible.
 * - Wire format: requests are form-urlencoded by default (Twilio convention). The server also
 *   accepts JSON; pass `json: true` to send JSON instead. Responses are always JSON.
 * - Retries: 429 + 5xx are retried up to `maxRetries` times with exponential backoff, honoring
 *   the `Retry-After` header when the server emits one.
 * - Binary fetch: `fetchBytes()` follows the 302→S3 redirect that `GET /Recordings/{sid}.wav`
 *   issues when audio has been archived. Callers usually only care about the final bytes.
 */

import { ApiError, ConfigurationError, fromResponse } from './errors.js';
import { VERSION } from './version.js';

export const DEFAULT_BASE_URL = 'https://voiceml.voicetel.com';
export const DEFAULT_TIMEOUT_MS = 30_000;
export const DEFAULT_MAX_RETRIES = 2;
export const DEFAULT_USER_AGENT = `voiceml-node/${VERSION}`;

const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

export interface TransportOptions {
  /** Twilio-format AccountSid: literal "AC" + 32 hex chars. */
  accountSid: string;
  /** Per-tenant API key. Sent as the Basic-auth password. */
  apiKey: string;
  /** Server base URL. Defaults to `https://voiceml.voicetel.com`. */
  baseUrl?: string;
  /** Per-request timeout in milliseconds. Defaults to 30 s. */
  timeoutMs?: number;
  /** Retry attempts for 429/5xx + transport errors. Defaults to 2. */
  maxRetries?: number;
  /** Override the User-Agent header. Mainly for tests. */
  userAgent?: string;
  /** Inject a custom `fetch` implementation. Defaults to global `fetch`. */
  fetch?: typeof fetch;
}

export interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  /** Query-string params. Values of `undefined`/`null` are dropped. */
  params?: Record<string, unknown> | null;
  /** Form body (default content-type). Values of `undefined`/`null` are dropped. */
  form?: Record<string, unknown> | object | null;
  /** JSON body. Pass either `form` or `json`, not both. */
  json?: unknown;
  /** When true and `json` is set, omit form-encoding even if `form` is present. */
}

export class Transport {
  readonly accountSid: string;
  readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly userAgent: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: TransportOptions) {
    if (!options.accountSid) throw new ConfigurationError('accountSid is required');
    if (!options.apiKey) throw new ConfigurationError('apiKey is required');
    if ((options.maxRetries ?? 0) < 0) {
      throw new ConfigurationError('maxRetries must be >= 0');
    }
    this.accountSid = options.accountSid;
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.userAgent = options.userAgent ?? DEFAULT_USER_AGENT;
    this.fetchImpl = options.fetch ?? globalThis.fetch;
    if (!this.fetchImpl) {
      throw new ConfigurationError(
        'global `fetch` is not available — pass `fetch` in options (Node 18.17+ or undici)',
      );
    }
  }

  async request<T = unknown>(options: RequestOptions): Promise<T> {
    const url = this.buildUrl(options.path, options.params);
    const init = this.buildInit(options);

    let lastError: unknown;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      let response: Response;
      try {
        response = await this.fetchWithTimeout(url, init);
      } catch (err) {
        lastError = err;
        if (attempt >= this.maxRetries) {
          throw new ApiError(
            `transport error after ${attempt + 1} attempts: ${(err as Error).message}`,
            { statusCode: 0 },
          );
        }
        await sleep(backoffMs(attempt));
        continue;
      }

      if (RETRYABLE_STATUSES.has(response.status) && attempt < this.maxRetries) {
        await sleep(backoffMs(attempt, response));
        continue;
      }

      return parseResponse<T>(response);
    }
    /* c8 ignore next */
    throw lastError ?? new ApiError('unreachable retry exhaustion', { statusCode: 0 });
  }

  /**
   * Binary fetch for recording audio. Follows redirects (the 302→S3 presigned URL).
   * Throws `ApiError` for non-2xx; returns `{ status, body, headers }` on success.
   */
  async fetchBytes(
    path: string,
  ): Promise<{ status: number; body: Uint8Array; headers: Headers }> {
    const url = this.buildUrl(path, null);
    const response = await this.fetchWithTimeout(url, {
      method: 'GET',
      headers: this.headers(false),
      redirect: 'follow',
    });
    if (!(response.status >= 200 && response.status < 300)) {
      await parseResponse(response);
    }
    const body = new Uint8Array(await response.arrayBuffer());
    return { status: response.status, body, headers: response.headers };
  }

  private buildUrl(path: string, params: Record<string, unknown> | null | undefined): string {
    const u = new URL(path.startsWith('http') ? path : this.baseUrl + path);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v === undefined || v === null) continue;
        if (Array.isArray(v)) {
          for (const entry of v) u.searchParams.append(k, String(entry));
        } else {
          u.searchParams.append(k, String(v));
        }
      }
    }
    return u.toString();
  }

  private buildInit(options: RequestOptions): RequestInit {
    const sendingJson = options.json !== undefined;
    const headers = this.headers(true, sendingJson);

    let body: BodyInit | undefined;
    if (sendingJson) {
      body = JSON.stringify(options.json);
    } else if (options.form) {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(options.form as Record<string, unknown>)) {
        if (v === undefined || v === null) continue;
        if (Array.isArray(v)) {
          for (const entry of v) params.append(k, encodeFormValue(entry));
        } else {
          params.append(k, encodeFormValue(v));
        }
      }
      body = params;
    }

    return { method: options.method, headers, body };
  }

  private headers(auth: boolean, sendingJson = false): Record<string, string> {
    const h: Record<string, string> = {
      Accept: 'application/json',
      'User-Agent': this.userAgent,
    };
    if (auth) {
      const credentials = base64(`${this.accountSid}:${this.apiKey}`);
      h.Authorization = `Basic ${credentials}`;
    }
    if (sendingJson) h['Content-Type'] = 'application/json';
    return h;
  }

  close(): void {
    // No-op — fetch has no connection lifecycle. Provided for API parity
    // with Python/Ruby/C# SDKs so callers can use a uniform cleanup pattern.
  }

  private async fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      return await this.fetchImpl(url, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }
}

function encodeFormValue(v: unknown): string {
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  return String(v);
}

function base64(input: string): string {
  // Node 18+ has Buffer; browsers have btoa.
  if (typeof Buffer !== 'undefined') return Buffer.from(input, 'utf8').toString('base64');
  /* c8 ignore next 4 */
  if (typeof btoa !== 'undefined') {
    return btoa(unescape(encodeURIComponent(input)));
  }
  throw new ConfigurationError('no base64 implementation available in this runtime');
}

function backoffMs(attempt: number, response?: Response): number {
  if (response) {
    const ra = response.headers.get('Retry-After');
    if (ra) {
      const seconds = Number(ra);
      if (!Number.isNaN(seconds)) return Math.max(0, seconds * 1000);
    }
  }
  return Math.min(8000, 500 * 2 ** attempt);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status >= 200 && response.status < 300) {
    const text = await response.text();
    if (!text) return undefined as T;
    try {
      return JSON.parse(text) as T;
    } catch (err) {
      throw new ApiError(`non-JSON success response: ${text.slice(0, 200)}`, {
        statusCode: response.status,
        body: text,
      });
    }
  }
  const text = await response.text();
  let body: unknown = text;
  try {
    body = JSON.parse(text);
  } catch {
    /* keep text body */
  }
  let code: number | string | null = null;
  let message = `HTTP ${response.status}`;
  let moreInfo: string | null = null;
  if (body && typeof body === 'object') {
    const b = body as Record<string, unknown>;
    if (typeof b.code === 'number' || typeof b.code === 'string') code = b.code;
    if (typeof b.message === 'string') message = b.message;
    if (typeof b.more_info === 'string') moreInfo = b.more_info;
  }
  throw fromResponse(response.status, code, body, message, moreInfo);
}
