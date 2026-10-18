/**
 * HTTP transport for the VoiceML REST API.
 *
 * - Auth: HTTP Basic with the `AccountSid` as username and your VoiceML API key as password —
 *   the same header positions Twilio SDKs use. The encoded header lives in an ES private field
 *   and never appears in `util.inspect`, `console.log` or `JSON.stringify` output.
 * - Wire format: requests are form-urlencoded by default; JSON-body endpoints pass `json`.
 *   Responses are JSON (binary downloads go through {@link Transport.fetchBytes}).
 * - Timeouts: `timeoutMs` bounds each attempt end to end — connect, headers and body.
 * - Retries (`maxRetries`, default 2), exponential backoff with full jitter (0.5 s base, 8 s cap):
 *   - GET / HEAD / PUT / DELETE retry on 429, 500, 502, 503, 504 and on network errors/timeouts.
 *   - POST / PATCH retry only on 429 and on connection failures where the request provably
 *     never left the client (DNS, connection refused, connect timeout, TLS handshake). They are
 *     never retried on 5xx, read timeouts or connection resets, so a create is never replayed.
 *   - `Retry-After` (delta-seconds or HTTP-date) is honoured up to 60 s. A longer value is not
 *     slept on: the error is raised immediately with `retryAfter` set.
 * - Redirects are followed manually (max 5): `Authorization` is dropped whenever the scheme or
 *   host changes, and an https→http downgrade is refused.
 */

import {
  ApiError,
  APIConnectionError,
  APITimeoutError,
  ConfigurationError,
  PaginationError,
  fromResponse,
} from './errors.js';
import { appendParams, base64 } from './encoding.js';
import { VERSION } from './version.js';

export const DEFAULT_BASE_URL = 'https://voiceml.voicetel.com';
export const DEFAULT_TIMEOUT_MS = 30_000;
export const DEFAULT_MAX_RETRIES = 2;
export const DEFAULT_USER_AGENT = `voiceml-node/${VERSION}`;
/** Longest `Retry-After` (seconds) the SDK sleeps on before retrying. */
export const MAX_RETRY_AFTER_SECONDS = 60;

const BACKOFF_BASE_MS = 500;
const BACKOFF_MAX_MS = 8_000;
const MAX_REDIRECTS = 5;
const IDEMPOTENT_METHODS: ReadonlySet<string> = new Set(['GET', 'HEAD', 'PUT', 'DELETE']);
const RETRYABLE_STATUSES: ReadonlySet<number> = new Set([429, 500, 502, 503, 504]);
const REDIRECT_STATUSES: ReadonlySet<number> = new Set([301, 302, 303, 307, 308]);
/**
 * Error codes (Node / undici / node-fetch) raised before any request byte is written:
 * name resolution, refused or timed-out connects, and TLS handshake failures.
 */
const CONNECT_PHASE_CODES: ReadonlySet<string> = new Set([
  'ENOTFOUND',
  'EAI_AGAIN',
  'EAI_FAIL',
  'EAI_NONAME',
  'ECONNREFUSED',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'EADDRNOTAVAIL',
  'ETIMEDOUT',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_CONNECT',
  'CERT_HAS_EXPIRED',
  'CERT_NOT_YET_VALID',
  'DEPTH_ZERO_SELF_SIGNED_CERT',
  'SELF_SIGNED_CERT_IN_CHAIN',
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
  'ERR_TLS_CERT_ALTNAME_INVALID',
  'ERR_TLS_HANDSHAKE_TIMEOUT',
  'EPROTO',
]);
const NETWORK_CODES: ReadonlySet<string> = new Set([
  ...CONNECT_PHASE_CODES,
  'ECONNRESET',
  'EPIPE',
  'ECONNABORTED',
  'UND_ERR_SOCKET',
  'UND_ERR_CLOSED',
  'UND_ERR_HEADERS_TIMEOUT',
  'UND_ERR_BODY_TIMEOUT',
  'UND_ERR_RES_CONTENT_LENGTH_MISMATCH',
]);

/** Connection failures known to have happened before the request was sent. */
const connectPhaseFailures = new WeakSet<APIConnectionError>();

export type HttpVerb = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface TransportOptions {
  /** Twilio-format AccountSid: literal "AC" + 32 hex chars. */
  accountSid?: string;
  /** VoiceML API key. Sent as the HTTP Basic password. */
  apiKey?: string;
  /** Server base URL. Defaults to `https://voiceml.voicetel.com`. */
  baseUrl?: string;
  /** Per-attempt timeout in milliseconds, covering headers and body. Defaults to 30 s. */
  timeoutMs?: number;
  /** Retry attempts after the first try (see the module docs for the policy). Defaults to 2. */
  maxRetries?: number;
  /** Override the User-Agent header. Mainly for tests. */
  userAgent?: string;
  /** Inject a custom `fetch` implementation. Defaults to global `fetch`. */
  fetch?: typeof fetch;
}

export interface RequestOptions {
  method: HttpVerb;
  /** Path relative to the transport's base URL, e.g. `/2010-04-01/Accounts/AC…/Calls.json`. */
  path: string;
  /** Query-string params. `undefined`/`null` values are dropped; arrays repeat the key. */
  params?: object | null;
  /** Form body (default content-type). `undefined`/`null` values are dropped. */
  form?: object | null;
  /** JSON body. Pass either `form` or `json`, not both. */
  json?: unknown;
  /** Send HTTP Basic credentials. Defaults to `true`; the diagnostics endpoints pass `false`. */
  auth?: boolean;
}

export interface BinaryRequestOptions {
  /** Path relative to the transport's base URL. */
  path: string;
  /** `Accept` header. Defaults to `*\/*`. */
  accept?: string;
  /** Send HTTP Basic credentials to the API host. Defaults to `true`. */
  auth?: boolean;
}

export interface BinaryResponse {
  status: number;
  body: Uint8Array;
  headers: Headers;
  /** Final URL the bytes were read from (after redirects). */
  url: string;
  /** `true` when the bytes came from a redirect target (e.g. a presigned storage URL). */
  redirected: boolean;
}

type Attempt<R> = { done: true; value: R } | { done: false; delayMs: number };

const TIMEOUT = Symbol('voiceml.timeout');

export class Transport {
  /** Account the credentials belong to (empty string for a credential-less transport). */
  readonly accountSid: string;
  /** Base URL without a trailing slash. */
  readonly baseUrl: string;
  readonly timeoutMs: number;
  readonly maxRetries: number;
  readonly userAgent: string;
  readonly #authorization: string | null;
  readonly #fetch: typeof fetch;
  readonly #origin: string;

  constructor(options: TransportOptions = {}) {
    const { accountSid, apiKey } = options;
    if (accountSid === undefined && apiKey === undefined) {
      this.#authorization = null;
    } else if (!accountSid) {
      throw new ConfigurationError('accountSid is required when an API key is supplied');
    } else if (!apiKey) {
      throw new ConfigurationError('apiKey is required when an accountSid is supplied');
    } else {
      this.#authorization = `Basic ${base64(`${accountSid}:${apiKey}`)}`;
    }
    this.accountSid = accountSid ?? '';

    const base = stripTrailingSlashes(options.baseUrl ?? DEFAULT_BASE_URL);
    let parsed: URL;
    try {
      parsed = new URL(base);
    } catch (err) {
      throw new ConfigurationError(`baseUrl is not a valid URL: ${base}`, { cause: err });
    }
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      throw new ConfigurationError(`baseUrl must use http or https: ${base}`);
    }
    if (parsed.search || parsed.hash) {
      throw new ConfigurationError(`baseUrl must not carry a query or fragment: ${base}`);
    }
    this.baseUrl = base;
    this.#origin = parsed.origin;

    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    if (!Number.isFinite(this.timeoutMs) || this.timeoutMs <= 0) {
      throw new ConfigurationError('timeoutMs must be a positive number');
    }
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
    if (!Number.isInteger(this.maxRetries) || this.maxRetries < 0) {
      throw new ConfigurationError('maxRetries must be an integer >= 0');
    }
    this.userAgent = options.userAgent ?? DEFAULT_USER_AGENT;
    const impl = options.fetch ?? globalThis.fetch;
    if (typeof impl !== 'function') {
      throw new ConfigurationError(
        'global `fetch` is not available — pass `fetch` in options (Node 20+ ships it)',
      );
    }
    this.#fetch = impl;
  }

  /** `true` when the transport was constructed with an AccountSid + API key. */
  get hasCredentials(): boolean {
    return this.#authorization !== null;
  }

  /** Scheme + host (+ port) of the base URL, e.g. `https://voiceml.voicetel.com`. */
  get origin(): string {
    return this.#origin;
  }

  /** Issue a JSON request and decode the response body. */
  async request<T = unknown>(options: RequestOptions): Promise<T> {
    return this.#requestUrl<T>(this.#resolve(options.path), options);
  }

  /**
   * GET a pagination link — a relative `next_page_uri` (path + query) or an absolute
   * `meta.next_page_url`. The link is resolved against this transport's scheme and host and
   * must stay on it; anything else raises {@link PaginationError} without sending a request.
   */
  async getPage<T>(link: string): Promise<T> {
    let target: URL;
    try {
      target = new URL(link, this.#origin);
    } catch (err) {
      throw new PaginationError(`invalid next-page link: ${link}`, { cause: err });
    }
    if (target.origin !== this.#origin) {
      throw new PaginationError(
        `refusing to follow next-page link to ${target.origin}; expected ${this.#origin}`,
      );
    }
    return this.#requestUrl<T>(target, { method: 'GET', path: target.pathname });
  }

  /**
   * Binary download (recording audio, export archives). Authenticated GET to the API host;
   * redirects (e.g. the 302 to a presigned storage URL) are followed with `Authorization`
   * stripped as soon as the scheme or host changes, and https→http downgrades are refused.
   * Non-2xx responses raise the matching `ApiError` subclass.
   */
  async fetchBytes(options: BinaryRequestOptions): Promise<BinaryResponse> {
    const url = this.#resolve(options.path);
    const auth = options.auth ?? true;
    const headers = this.#headers(auth, options.accept ?? '*/*');
    return this.#execute('GET', url, { method: 'GET', headers }, async (response, signal, final) => {
      if (!response.ok) {
        const text = await readText(response, signal);
        throw errorFromResponse(response, text);
      }
      const body = new Uint8Array(await readBytes(response, signal));
      return {
        status: response.status,
        body,
        headers: response.headers,
        url: final.toString(),
        redirected: final.toString() !== url.toString(),
      };
    });
  }

  close(): void {
    // No-op — fetch has no connection lifecycle. Provided so callers can use the same
    // cleanup pattern as the other VoiceML SDKs.
  }

  toJSON(): Record<string, unknown> {
    return {
      baseUrl: this.baseUrl,
      accountSid: this.accountSid,
      credentials: this.hasCredentials ? '[redacted]' : null,
    };
  }

  async #requestUrl<T>(url: URL, options: RequestOptions): Promise<T> {
    if (options.params) appendParams(url.searchParams, options.params);
    const auth = options.auth ?? true;
    const sendingJson = options.json !== undefined;
    const headers = this.#headers(auth, 'application/json');
    let body: string | URLSearchParams | undefined;
    if (sendingJson) {
      if (options.form) throw new ConfigurationError('pass either `form` or `json`, not both');
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(options.json);
    } else if (options.form) {
      body = new URLSearchParams();
      appendParams(body, options.form);
    }
    return this.#execute(options.method, url, { method: options.method, headers, body }, (r, s) =>
      parseJsonResponse<T>(r, s),
    );
  }

  #resolve(path: string): URL {
    if (!path.startsWith('/')) {
      throw new ConfigurationError(`request path must start with '/': ${path}`);
    }
    return new URL(this.baseUrl + path);
  }

  #headers(auth: boolean, accept: string): Record<string, string> {
    const h: Record<string, string> = { Accept: accept, 'User-Agent': this.userAgent };
    if (auth) {
      if (this.#authorization === null) {
        throw new ConfigurationError(
          'this client has no credentials — pass accountSid and apiKey to call authenticated endpoints',
        );
      }
      h.Authorization = this.#authorization;
    }
    return h;
  }

  async #execute<R>(
    method: HttpVerb,
    url: URL,
    init: RequestInit & { headers: Record<string, string> },
    consume: (response: Response, signal: AbortSignal, finalUrl: URL) => Promise<R>,
  ): Promise<R> {
    for (let attempt = 0; ; attempt++) {
      const outcome = await this.#attempt(method, url, init, consume, attempt);
      if (outcome.done) return outcome.value;
      await sleep(outcome.delayMs);
    }
  }

  async #attempt<R>(
    method: HttpVerb,
    url: URL,
    init: RequestInit & { headers: Record<string, string> },
    consume: (response: Response, signal: AbortSignal, finalUrl: URL) => Promise<R>,
    attempt: number,
  ): Promise<Attempt<R>> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(TIMEOUT), this.timeoutMs);
    const canRetry = attempt < this.maxRetries;
    try {
      let response: Response;
      let finalUrl: URL;
      try {
        [response, finalUrl] = await this.#fetchFollowingRedirects(url, init, controller.signal);
      } catch (err) {
        const failure = this.#networkFailure(err, controller.signal, 0);
        if (canRetry && retryableFailure(method, failure)) {
          return { done: false, delayMs: backoffMs(attempt) };
        }
        throw failure;
      }

      if (canRetry && retryableStatus(method, response.status)) {
        const retryAfter = parseRetryAfter(response.headers.get('retry-after'));
        if (retryAfter === null || retryAfter <= MAX_RETRY_AFTER_SECONDS) {
          await discard(response);
          return {
            done: false,
            delayMs: retryAfter === null ? backoffMs(attempt) : retryAfter * 1000,
          };
        }
        // Longer than we are willing to block: surface the error now with `retryAfter` set.
      }

      try {
        return { done: true, value: await consume(response, controller.signal, finalUrl) };
      } catch (err) {
        if (err instanceof ApiError) throw err;
        const failure = this.#networkFailure(err, controller.signal, response.status);
        if (canRetry && retryableFailure(method, failure)) {
          return { done: false, delayMs: backoffMs(attempt) };
        }
        throw failure;
      }
    } finally {
      clearTimeout(timer);
    }
  }

  async #fetchFollowingRedirects(
    start: URL,
    init: RequestInit & { headers: Record<string, string> },
    signal: AbortSignal,
  ): Promise<[Response, URL]> {
    let url = start;
    let current: RequestInit & { headers: Record<string, string> } = init;
    for (let hop = 0; ; hop++) {
      const response = await raceAbort(
        this.#fetch(url.toString(), { ...current, redirect: 'manual', signal }),
        signal,
      );
      if (response.type === 'opaqueredirect') {
        throw new ConfigurationError(
          'the configured fetch hides redirect responses (redirect: "manual"); use a runtime or fetch that exposes them',
        );
      }
      const location = response.headers.get('location');
      if (!REDIRECT_STATUSES.has(response.status) || !location) return [response, url];
      // Redirect-policy refusals are final: they are plain `ApiError`s, never retried.
      if (hop >= MAX_REDIRECTS) {
        await discard(response);
        throw new ApiError(`too many redirects (> ${MAX_REDIRECTS})`, {
          statusCode: response.status,
        });
      }
      const next = new URL(location, url);
      if (url.protocol === 'https:' && next.protocol !== 'https:') {
        await discard(response);
        throw new ApiError(`refusing to follow an https→${next.protocol} redirect`, {
          statusCode: response.status,
        });
      }
      await discard(response);
      const headers = { ...current.headers };
      if (next.origin !== url.origin) delete headers.Authorization;
      const toGet =
        response.status === 303 ||
        ((response.status === 301 || response.status === 302) && current.method === 'POST');
      if (toGet) delete headers['Content-Type'];
      current = toGet ? { method: 'GET', headers } : { ...current, headers };
      url = next;
    }
  }

  #networkFailure(err: unknown, signal: AbortSignal, statusCode: number): ApiError {
    if (signal.aborted && signal.reason === TIMEOUT) {
      return new APITimeoutError(`request timed out after ${this.timeoutMs} ms`, {
        statusCode,
        cause: err === TIMEOUT ? undefined : err,
      });
    }
    if (err instanceof ApiError) return err;
    if (!isNetworkError(err)) throw err;
    const message = err instanceof Error ? err.message : String(err);
    const failure = new APIConnectionError(`connection error: ${describeCause(err) ?? message}`, {
      statusCode,
      cause: err,
    });
    if (statusCode === 0 && isConnectPhase(err)) connectPhaseFailures.add(failure);
    return failure;
  }
}

Object.defineProperty(Transport.prototype, Symbol.for('nodejs.util.inspect.custom'), {
  value: function inspectTransport(this: Transport): string {
    return `Transport ${JSON.stringify(this.toJSON())}`;
  },
});

function stripTrailingSlashes(s: string): string {
  // Linear-time equivalent of `.replace(/\/+$/, '')` (avoids a polynomial-backtracking regex).
  let end = s.length;
  while (end > 0 && s.charCodeAt(end - 1) === 47 /* '/' */) end--;
  return end === s.length ? s : s.slice(0, end);
}

function retryableStatus(method: HttpVerb, status: number): boolean {
  if (status === 429) return true;
  return IDEMPOTENT_METHODS.has(method) && RETRYABLE_STATUSES.has(status);
}

function retryableFailure(method: HttpVerb, failure: ApiError): boolean {
  if (!(failure instanceof APIConnectionError)) return false;
  if (IDEMPOTENT_METHODS.has(method)) return true;
  return connectPhaseFailures.has(failure);
}

/** Full-jitter exponential backoff: uniform in [0, min(8 s, 0.5 s × 2^attempt)). */
function backoffMs(attempt: number): number {
  return Math.random() * Math.min(BACKOFF_MAX_MS, BACKOFF_BASE_MS * 2 ** attempt);
}

/**
 * Parse a `Retry-After` header: delta-seconds or an HTTP-date. Returns seconds (never
 * negative), or `null` when absent or unparseable.
 */
export function parseRetryAfter(value: string | null, now: number = Date.now()): number | null {
  if (value === null) return null;
  const trimmed = value.trim();
  if (trimmed === '') return null;
  if (/^\d+$/.test(trimmed)) return Number(trimmed);
  // HTTP-date (IMF-fixdate, e.g. `Wed, 21 Oct 2026 07:28:00 GMT`); bare numbers such as
  // `1.5` are not dates, however leniently `Date.parse` would read them.
  if (!/[a-z]/i.test(trimmed)) return null;
  const at = Date.parse(trimmed);
  if (Number.isNaN(at)) return null;
  return Math.max(0, Math.ceil((at - now) / 1000));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function discard(response: Response): Promise<void> {
  try {
    await response.body?.cancel();
  } catch {
    // The body is being thrown away; a failure to cancel it changes nothing.
  }
}

function raceAbort<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) return Promise.reject(signal.reason);
  return new Promise<T>((resolve, reject) => {
    const onAbort = (): void => reject(signal.reason);
    signal.addEventListener('abort', onAbort, { once: true });
    promise.then(
      (v) => {
        signal.removeEventListener('abort', onAbort);
        resolve(v);
      },
      (e: unknown) => {
        signal.removeEventListener('abort', onAbort);
        reject(e);
      },
    );
  });
}

async function readText(response: Response, signal: AbortSignal): Promise<string> {
  return new TextDecoder().decode(await readBytes(response, signal));
}

async function readBytes(response: Response, signal: AbortSignal): Promise<ArrayBuffer> {
  const pending = response.arrayBuffer();
  try {
    return await raceAbort(pending, signal);
  } catch (err) {
    if (signal.aborted) {
      pending.catch(() => undefined);
      await discard(response);
    }
    throw err;
  }
}

function errorCode(v: unknown): number | null {
  if (typeof v === 'number' && Number.isInteger(v)) return v;
  if (typeof v === 'string' && /^\d+$/.test(v)) return Number(v);
  return null;
}

function errorFromResponse(response: Response, text: string): ApiError {
  let body: unknown = text;
  try {
    body = JSON.parse(text);
  } catch {
    // Non-JSON error body (proxy HTML, plain text): keep the text on `error.body`.
  }
  let code: number | null = null;
  let message = `HTTP ${response.status}`;
  let moreInfo: string | null = null;
  if (body && typeof body === 'object') {
    const b = body as Record<string, unknown>;
    code = errorCode(b.code);
    if (typeof b.message === 'string' && b.message) message = b.message;
    if (typeof b.more_info === 'string') moreInfo = b.more_info;
  } else if (text) {
    message = `HTTP ${response.status}: ${text.slice(0, 200)}`;
  }
  return fromResponse(response.status, message, {
    code,
    body,
    moreInfo,
    retryAfter: parseRetryAfter(response.headers.get('retry-after')),
  });
}

async function parseJsonResponse<T>(response: Response, signal: AbortSignal): Promise<T> {
  const text = await readText(response, signal);
  if (!response.ok) throw errorFromResponse(response, text);
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch (err) {
    throw new ApiError(
      `could not decode the ${response.status} response body as JSON: ${text.slice(0, 200)}`,
      { statusCode: response.status, body: text, cause: err },
    );
  }
}

function causeChain(err: unknown): unknown[] {
  const chain: unknown[] = [];
  let cur: unknown = err;
  while (cur && chain.length < 5 && !chain.includes(cur)) {
    chain.push(cur);
    cur = (cur as { cause?: unknown }).cause;
  }
  return chain;
}

function codesOf(err: unknown): string[] {
  const codes: string[] = [];
  for (const e of causeChain(err)) {
    const code = (e as { code?: unknown }).code;
    if (typeof code === 'string') codes.push(code);
    // AggregateError (happy-eyeballs connects) carries per-address failures.
    const errors = (e as { errors?: unknown }).errors;
    if (Array.isArray(errors)) {
      for (const inner of errors) {
        const c = (inner as { code?: unknown }).code;
        if (typeof c === 'string') codes.push(c);
      }
    }
  }
  return codes;
}

function isNetworkError(err: unknown): boolean {
  if (codesOf(err).some((c) => NETWORK_CODES.has(c) || c.startsWith('ERR_SSL_'))) return true;
  if (err instanceof TypeError && (err.message === 'fetch failed' || err.message === 'terminated')) {
    return true;
  }
  const type = (err as { type?: unknown }).type;
  return type === 'system';
}

function isConnectPhase(err: unknown): boolean {
  return codesOf(err).some((c) => CONNECT_PHASE_CODES.has(c) || c.startsWith('ERR_SSL_'));
}

function describeCause(err: unknown): string | null {
  const chain = causeChain(err);
  const last = chain[chain.length - 1];
  if (last && last !== err && last instanceof Error) return last.message;
  return null;
}
