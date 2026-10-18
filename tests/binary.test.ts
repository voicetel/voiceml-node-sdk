/** Recording audio / export downloads (C12): auth to the API host, safe redirects. */

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ApiError,
  APIConnectionError,
  APITimeoutError,
  Client,
  ConfigurationError,
  GoneError,
} from '../src/index.js';
import { ACCOUNT_SID, API_KEY, BASE, BASIC, json, scriptedFetch, type Step } from './helpers.js';

const RE = 'RE' + 'e'.repeat(32);
const WAV = `${BASE}/2010-04-01/Accounts/${ACCOUNT_SID}/Recordings/${RE}.wav`;
const S3 = 'https://bucket.s3.amazonaws.com/rec.wav?X-Amz-Signature=abc';

function redirect(location: string, status = 302): Response {
  return new Response(null, { status, headers: { location } });
}

function wav(bytes = [0x52, 0x49, 0x46, 0x46]): Response {
  return new Response(new Uint8Array(bytes), {
    status: 200,
    headers: { 'content-type': 'audio/wav' },
  });
}

function setup(steps: Step[], opts: { timeoutMs?: number; maxRetries?: number } = {}) {
  const { fetch, calls } = scriptedFetch(steps);
  return { c: new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch, ...opts }), calls };
}

afterEach(() => vi.restoreAllMocks());

describe('recordings.getAudio', () => {
  it('sends Basic auth and an audio Accept header to the API host', async () => {
    const { c, calls } = setup([wav()]);
    const audio = await c.recordings.getAudio(RE);
    expect(Array.from(audio.body)).toEqual([0x52, 0x49, 0x46, 0x46]);
    expect(calls[0]!.url).toBe(WAV);
    expect(calls[0]!.headers.Authorization).toBe(BASIC);
    expect(calls[0]!.headers.Accept).toBe('audio/*, */*');
    expect(calls[0]!.init.redirect).toBe('manual');
  });

  it('follows the 302 to storage without the Authorization header', async () => {
    const { c, calls } = setup([redirect(S3), wav([1, 2, 3])]);
    const audio = await c.recordings.getAudio(RE);
    expect(Array.from(audio.body)).toEqual([1, 2, 3]);
    expect(audio.redirected).toBe(true);
    expect(calls).toHaveLength(2);
    expect(calls[0]!.headers.Authorization).toBe(BASIC);
    expect(calls[1]!.url).toBe(S3);
    expect(calls[1]!.headers.Authorization).toBeUndefined();
    expect(calls[1]!.headers.Accept).toBe('audio/*, */*');
  });

  it('keeps Authorization on a same-origin redirect', async () => {
    const { c, calls } = setup([redirect(`/2010-04-01/Accounts/${ACCOUNT_SID}/Recordings/${RE}.wav?v=2`), wav()]);
    await c.recordings.getAudio(RE);
    expect(calls[1]!.url).toBe(`${WAV}?v=2`);
    expect(calls[1]!.headers.Authorization).toBe(BASIC);
  });

  it('drops Authorization when only the scheme or port changes', async () => {
    const { c, calls } = setup([redirect('https://voiceml.voicetel.com:8443/x.wav'), wav()]);
    await c.recordings.getAudio(RE);
    expect(calls[1]!.headers.Authorization).toBeUndefined();
  });

  it('refuses an https→http downgrade, without retrying', async () => {
    const { c, calls } = setup([redirect('http://bucket.s3.amazonaws.com/rec.wav')]);
    const err = await c.recordings.getAudio(RE).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).not.toBeInstanceOf(APIConnectionError);
    expect((err as Error).message).toContain('https→http');
    expect(calls).toHaveLength(1);
  });

  it('caps the redirect chain, without retrying', async () => {
    const loop = Array.from({ length: 7 }, () => redirect(S3));
    const { c, calls } = setup(loop);
    await expect(c.recordings.getAudio(RE)).rejects.toThrow(/too many redirects/);
    expect(calls).toHaveLength(6);
  });

  it('rejects a fetch that hides redirects (opaqueredirect) with ConfigurationError', async () => {
    const opaque = new Response(null, { status: 302, headers: { location: S3 } });
    Object.defineProperty(opaque, 'type', { value: 'opaqueredirect' });
    const { c } = setup([opaque]);
    await expect(c.recordings.getAudio(RE)).rejects.toBeInstanceOf(ConfigurationError);
  });

  it('raises GoneError on 410', async () => {
    const { c } = setup([json({ code: 20410, message: 'gone', status: 410 }, 410)]);
    await expect(c.recordings.getAudio(RE)).rejects.toBeInstanceOf(GoneError);
  });

  it('retries a 503 (GET is idempotent)', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const { c, calls } = setup([new Response('busy', { status: 503 }), wav()]);
    await c.recordings.getAudio(RE);
    expect(calls).toHaveLength(2);
  });

  it('applies timeoutMs to the audio body', async () => {
    const stalled = new Response(new ReadableStream({ start() {} }), { status: 200 });
    const { c } = setup([stalled], { timeoutMs: 40, maxRetries: 0 });
    await expect(c.recordings.getAudio(RE)).rejects.toBeInstanceOf(APITimeoutError);
  });
});

describe('exports', () => {
  it('download follows the presigned redirect without credentials', async () => {
    const archive = 'https://bucket.s3.amazonaws.com/2026-09-30.jsonl.gz?sig=1';
    const { c, calls } = setup([
      redirect(archive),
      new Response(new Uint8Array([0x1f, 0x8b]), { headers: { 'content-type': 'application/gzip' } }),
    ]);
    const out = await c.exports.download(new Date(Date.UTC(2026, 8, 30, 18)));
    expect(out.date).toBe('2026-09-30');
    expect(out.contentType).toBe('application/gzip');
    expect(calls[0]!.url).toBe(`${BASE}/2010-04-01/Accounts/${ACCOUNT_SID}/Exports/2026-09-30`);
    expect(calls[0]!.headers.Authorization).toBe(BASIC);
    expect(calls[1]!.headers.Authorization).toBeUndefined();
  });
});
