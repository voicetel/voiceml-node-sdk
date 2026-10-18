/** Diagnostics (C7): routed through the transport, unauthenticated, usable without credentials. */

import { describe, expect, it } from 'vitest';

import { Client, ConfigurationError, ServerError, type HealthStatus } from '../src/index.js';
import { ACCOUNT_SID, API_KEY, BASE, json, scriptedFetch } from './helpers.js';

describe('diagnostics', () => {
  it('works on a client constructed without credentials, via the injected fetch', async () => {
    const { fetch, calls } = scriptedFetch([json({ ok: true })]);
    const c = new Client({ fetch, userAgent: 'diag-test/1' });
    const health: HealthStatus = await c.diagnostics.health();
    expect(health.ok).toBe(true);
    expect(health.warnings).toBeUndefined();
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe(`${BASE}/health`);
    expect(calls[0]!.headers.Authorization).toBeUndefined();
    expect(calls[0]!.headers['User-Agent']).toBe('diag-test/1');
  });

  it('never sends credentials, even on an authenticated client', async () => {
    const { fetch, calls } = scriptedFetch([json({ ok: true, warnings: [] }), json({ openapi: '3.1.0' })]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    await c.diagnostics.health();
    const spec = await c.diagnostics.openapiJson();
    expect(spec).toEqual({ openapi: '3.1.0' });
    expect(calls.map((x) => x.headers.Authorization)).toEqual([undefined, undefined]);
    expect(calls[1]!.url).toBe(`${BASE}/openapi.json`);
  });

  it('maps a failing probe (503) to ServerError with the failures on the body', async () => {
    const body = { ok: false, failures: [{ check: 'disk', detail: 'full' }], warnings: [] };
    const { fetch } = scriptedFetch([json(body, 503)]);
    const c = new Client({ fetch, maxRetries: 0 });
    const err = (await c.diagnostics.health().catch((e: unknown) => e)) as ServerError;
    expect(err).toBeInstanceOf(ServerError);
    expect(err.statusCode).toBe(503);
    expect(err.body).toEqual(body);
  });

  it('fetches the YAML documents as text', async () => {
    const yaml = 'openapi: 3.1.0\ninfo:\n  version: 0.9.2\n';
    const { fetch, calls } = scriptedFetch([
      new Response(yaml, { headers: { 'content-type': 'application/yaml' } }),
      new Response(yaml, { headers: { 'content-type': 'application/yaml' } }),
    ]);
    const c = new Client({ fetch });
    expect(await c.diagnostics.openapiYaml()).toBe(yaml);
    expect(await c.diagnostics.openapiYml()).toBe(yaml);
    expect(calls.map((x) => x.url)).toEqual([`${BASE}/openapi.yaml`, `${BASE}/openapi.yml`]);
    expect(calls.every((x) => x.headers.Authorization === undefined)).toBe(true);
  });

  it('a credential-less client rejects authenticated calls before sending anything', async () => {
    const { fetch, calls } = scriptedFetch([]);
    const c = new Client({ fetch });
    await expect(c.calls.list()).rejects.toBeInstanceOf(ConfigurationError);
    await expect(c.accounts.fetch()).rejects.toBeInstanceOf(ConfigurationError);
    await expect(c.conversationsV1.conversations.list()).rejects.toBeInstanceOf(ConfigurationError);
    expect(calls).toHaveLength(0);
    expect(c.accountSid).toBe('');
  });
});
