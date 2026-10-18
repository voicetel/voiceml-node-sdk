/**
 * Transport behaviour: retry policy (idempotent vs non-idempotent), Retry-After handling,
 * timeouts that cover the body, error types with preserved causes, and response decoding.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ApiError,
  APIConnectionError,
  APITimeoutError,
  Client,
  ConfigurationError,
  ConflictError,
  MethodNotAllowedError,
  parseRetryAfter,
  RateLimitError,
  ServerError,
} from '../src/index.js';
import { ACCOUNT_SID, API_KEY, callPayload, json, networkError, scriptedFetch, type Step } from './helpers.js';

const CALL = { To: '+14155550100', From: '+14155550101', Url: 'https://example.com/twiml' };
const SID = 'CA' + '1'.repeat(32);

function client(steps: Step[], opts: { maxRetries?: number; timeoutMs?: number } = {}) {
  const { fetch, calls } = scriptedFetch(steps);
  const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch, ...opts });
  return { c, calls };
}

/** A 200 response whose body never finishes arriving. */
function stalledBody(): Response {
  return new Response(new ReadableStream({ start() {} }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('retry policy — non-idempotent POST', () => {
  it.each([500, 502, 503, 504])('does not retry POST on %i (exactly one request)', async (status) => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const { c, calls } = client([json({ code: 20500, message: 'boom', status }, status), json(callPayload())]);
    await expect(c.calls.create(CALL)).rejects.toBeInstanceOf(ServerError);
    expect(calls).toHaveLength(1);
  });

  it('does not retry POST on a read timeout', async () => {
    const { c, calls } = client([stalledBody(), json(callPayload())], { timeoutMs: 40 });
    const err = await c.calls.create(CALL).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(APITimeoutError);
    expect(calls).toHaveLength(1);
  });

  it('does not retry POST on a connection reset, and keeps the cause', async () => {
    const reset = networkError('ECONNRESET', 'read ECONNRESET');
    const { c, calls } = client([reset, json(callPayload())]);
    const err = (await c.messages.create({ To: '+14155550100', Body: 'hi' }).catch((e: unknown) => e)) as ApiError;
    expect(err).toBeInstanceOf(APIConnectionError);
    expect(err).not.toBeInstanceOf(APITimeoutError);
    expect(err.statusCode).toBe(0);
    expect(err.cause).toBe(reset);
    expect(err.message).toContain('read ECONNRESET');
    expect(calls).toHaveLength(1);
  });

  it('does not retry POST when the failure phase is unknown (bare "fetch failed")', async () => {
    const { c, calls } = client([new TypeError('fetch failed'), json(callPayload())]);
    await expect(c.calls.create(CALL)).rejects.toBeInstanceOf(APIConnectionError);
    expect(calls).toHaveLength(1);
  });

  it('retries POST on 429', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const { c, calls } = client([json({ code: 20429, message: 'slow down', status: 429 }, 429), json(callPayload(), 201)]);
    const call = await c.calls.create(CALL);
    expect(call.sid).toBe('CA' + '0'.repeat(32));
    expect(calls).toHaveLength(2);
    expect(calls[1]!.body).toBe(calls[0]!.body);
  });

  it.each(['ECONNREFUSED', 'ENOTFOUND', 'UND_ERR_CONNECT_TIMEOUT', 'CERT_HAS_EXPIRED'])(
    'retries POST when the request provably never left the client (%s)',
    async (code) => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      const { c, calls } = client([networkError(code), json(callPayload(), 201)]);
      await c.calls.create(CALL);
      expect(calls).toHaveLength(2);
    },
  );
});

describe('retry policy — idempotent methods', () => {
  it('retries GET on 503 and drains the discarded body', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    let cancelled = false;
    const busy = new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('upstream busy'));
        },
        cancel() {
          cancelled = true;
        },
      }),
      { status: 503 },
    );
    const { c, calls } = client([busy, json(callPayload(SID))]);
    const call = await c.calls.get(SID);
    expect(call.sid).toBe(SID);
    expect(calls).toHaveLength(2);
    expect(cancelled).toBe(true);
  });

  it('retries GET on a connection reset and on a timeout', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const { c, calls } = client([networkError('ECONNRESET'), stalledBody(), json(callPayload(SID))], {
      timeoutMs: 40,
    });
    await c.calls.get(SID);
    expect(calls).toHaveLength(3);
  });

  it('retries DELETE on 502', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const { c, calls } = client([new Response('bad gateway', { status: 502 }), new Response(null, { status: 204 })]);
    await c.calls.delete(SID);
    expect(calls).toHaveLength(2);
    expect(calls.every((x) => x.init.method === 'DELETE')).toBe(true);
  });

  it('gives up after maxRetries + 1 attempts', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const { c, calls } = client([
      new Response('busy', { status: 503 }),
      new Response('busy', { status: 503 }),
      new Response('busy', { status: 503 }),
    ]);
    await expect(c.calls.get(SID)).rejects.toBeInstanceOf(ServerError);
    expect(calls).toHaveLength(3);
  });

  it('never retries programming errors thrown by an injected fetch', async () => {
    const bug = new RangeError('custom fetch bug');
    const { c, calls } = client([bug, json(callPayload(SID))]);
    await expect(c.calls.get(SID)).rejects.toBe(bug);
    expect(calls).toHaveLength(1);
  });
});

describe('Retry-After', () => {
  it('sleeps the delta-seconds value before retrying', async () => {
    vi.useFakeTimers();
    const { c, calls } = client([json({}, 429, { 'Retry-After': '2' }), json(callPayload(SID))]);
    const pending = c.calls.get(SID);
    await vi.advanceTimersByTimeAsync(1999);
    expect(calls).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1);
    await pending;
    expect(calls).toHaveLength(2);
  });

  it('sleeps until an HTTP-date before retrying', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-17T12:00:00Z'));
    const at = new Date('2026-10-17T12:00:03Z').toUTCString();
    const { c, calls } = client([json({}, 503, { 'Retry-After': at }), json(callPayload(SID))]);
    const pending = c.calls.get(SID);
    await vi.advanceTimersByTimeAsync(2999);
    expect(calls).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1);
    await pending;
    expect(calls).toHaveLength(2);
  });

  it('raises immediately, with retryAfter set, when the wait exceeds the 60 s cap', async () => {
    vi.useFakeTimers();
    const { c, calls } = client([json({ code: 20429, message: 'later', status: 429 }, 429, { 'Retry-After': '3600' })]);
    const err = (await c.calls.create(CALL).catch((e: unknown) => e)) as RateLimitError;
    expect(err).toBeInstanceOf(RateLimitError);
    expect(err.retryAfter).toBe(3600);
    expect(calls).toHaveLength(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('exposes retryAfter when retries are exhausted', async () => {
    const { c } = client([json({}, 429, { 'Retry-After': '1' })], { maxRetries: 0 });
    const err = (await c.calls.get(SID).catch((e: unknown) => e)) as RateLimitError;
    expect(err).toBeInstanceOf(RateLimitError);
    expect(err.retryAfter).toBe(1);
  });

  it('uses full-jitter exponential backoff without a Retry-After header', async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const { c, calls } = client([
      new Response('busy', { status: 503 }),
      new Response('busy', { status: 503 }),
      json(callPayload(SID)),
    ]);
    const pending = c.calls.get(SID);
    // attempt 0: 0.5 × min(8000, 500) = 250 ms
    await vi.advanceTimersByTimeAsync(249);
    expect(calls).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(calls).toHaveLength(2);
    // attempt 1: 0.5 × min(8000, 1000) = 500 ms
    await vi.advanceTimersByTimeAsync(499);
    expect(calls).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(1);
    await pending;
    expect(calls).toHaveLength(3);
  });

  it('parses delta-seconds and HTTP-dates', () => {
    const now = Date.parse('2026-10-17T12:00:00Z');
    expect(parseRetryAfter('0', now)).toBe(0);
    expect(parseRetryAfter(' 5 ', now)).toBe(5);
    expect(parseRetryAfter('Sat, 17 Oct 2026 12:00:10 GMT', now)).toBe(10);
    expect(parseRetryAfter('Sat, 17 Oct 2026 11:00:00 GMT', now)).toBe(0);
    expect(parseRetryAfter(null, now)).toBeNull();
    expect(parseRetryAfter('', now)).toBeNull();
    expect(parseRetryAfter('-1', now)).toBeNull();
    expect(parseRetryAfter('1.5', now)).toBeNull();
    expect(parseRetryAfter('soon', now)).toBeNull();
  });
});

describe('timeouts and errors', () => {
  it('timeoutMs covers reading the response body', async () => {
    const { c, calls } = client([stalledBody()], { timeoutMs: 50, maxRetries: 0 });
    const started = Date.now();
    const err = await c.calls.list().catch((e: unknown) => e);
    expect(err).toBeInstanceOf(APITimeoutError);
    expect(err).toBeInstanceOf(APIConnectionError);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as Error).message).toContain('50 ms');
    expect(Date.now() - started).toBeLessThan(2000);
    expect(calls).toHaveLength(1);
  });

  it('times out even when the injected fetch ignores the abort signal', async () => {
    const never: Step = () => new Promise<Response>(() => {});
    const { c } = client([never], { timeoutMs: 30, maxRetries: 0 });
    await expect(c.calls.list()).rejects.toBeInstanceOf(APITimeoutError);
  });

  it('decodes a non-JSON 2xx as an ApiError that says "could not decode" and keeps the cause', async () => {
    const { c } = client([new Response('<Response/>', { status: 200, headers: { 'content-type': 'text/xml' } })]);
    const err = (await c.calls.get(SID).catch((e: unknown) => e)) as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.message).toContain('could not decode');
    expect(err.cause).toBeInstanceOf(SyntaxError);
    expect(err.body).toBe('<Response/>');
  });

  it('maps a non-JSON error body to the typed error and keeps the text', async () => {
    const { c } = client([new Response('<html>bad gateway</html>', { status: 502 })], { maxRetries: 0 });
    const err = (await c.calls.get(SID).catch((e: unknown) => e)) as ServerError;
    expect(err).toBeInstanceOf(ServerError);
    expect(err.statusCode).toBe(502);
    expect(err.body).toBe('<html>bad gateway</html>');
    expect(err.code).toBeNull();
  });

  it('parses the error envelope: integer code, message, more_info', async () => {
    const { c } = client([
      json({ code: '20004', message: 'Method not allowed', more_info: 'https://x/20004', status: 405 }, 405),
    ]);
    const err = (await c.calls.get(SID).catch((e: unknown) => e)) as MethodNotAllowedError;
    expect(err).toBeInstanceOf(MethodNotAllowedError);
    expect(err.code).toBe(20004);
    expect(err.message).toBe('Method not allowed');
    expect(err.moreInfo).toBe('https://x/20004');
  });

  it('maps the accounts.update optimistic-lock 409 to ConflictError', async () => {
    const { c } = client([json({ code: 20409, message: 'Account was modified', status: 409 }, 409)]);
    const err = (await c.accounts.update({ FriendlyName: 'x' }).catch((e: unknown) => e)) as ConflictError;
    expect(err).toBeInstanceOf(ConflictError);
    expect(err.code).toBe(20409);
  });
});

describe('configuration errors', () => {
  it.each([
    [{ baseUrl: 'not a url' }],
    [{ baseUrl: 'ftp://example.com' }],
    [{ baseUrl: 'https://example.com?x=1' }],
    [{ timeoutMs: 0 }],
    [{ maxRetries: -1 }],
    [{ maxRetries: 1.5 }],
  ])('rejects %j', (opts) => {
    expect(() => new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, ...opts })).toThrow(
      ConfigurationError,
    );
  });

  it('requires both halves of the credential pair', () => {
    expect(() => new Client({ accountSid: ACCOUNT_SID })).toThrow(ConfigurationError);
    expect(() => new Client({ apiKey: API_KEY })).toThrow(ConfigurationError);
    expect(() => new Client({ accountSid: '', apiKey: API_KEY })).toThrow(ConfigurationError);
  });
});
