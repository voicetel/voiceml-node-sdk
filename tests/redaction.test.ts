/** Secrets never appear in default inspect / string / JSON output (C11). */

import { inspect } from 'node:util';
import { describe, expect, it } from 'vitest';

import { Client, RequestValidator, Transport } from '../src/index.js';
import { ACCOUNT_SID, json, scriptedFetch } from './helpers.js';

const KEY = 'SUPERSECRETKEY-0123456789';
const ENCODED = Buffer.from(`${ACCOUNT_SID}:${KEY}`).toString('base64');

function leaks(text: string): boolean {
  return text.includes(KEY) || text.includes(ENCODED);
}

describe('credential redaction', () => {
  const client = new Client({ accountSid: ACCOUNT_SID, apiKey: KEY });

  it('util.inspect / console.log of the client never shows the key', () => {
    for (const depth of [0, 2, 8, Infinity]) {
      expect(leaks(inspect(client, { depth, showHidden: true }))).toBe(false);
    }
    expect(inspect(client)).toContain('[redacted]');
    expect(inspect(client)).toContain(ACCOUNT_SID);
  });

  it('JSON.stringify of the client, resources and nested graphs never shows the key', () => {
    expect(leaks(JSON.stringify(client))).toBe(false);
    expect(leaks(JSON.stringify({ service: { client } }))).toBe(false);
    expect(leaks(JSON.stringify(client.calls))).toBe(false);
    expect(leaks(JSON.stringify(client.conversationsV1))).toBe(false);
    expect(leaks(JSON.stringify(client.sip.domains.auth))).toBe(false);
    expect(JSON.parse(JSON.stringify(client))).toMatchObject({
      accountSid: ACCOUNT_SID,
      credentials: '[redacted]',
    });
  });

  it('resources, the transport and String() never show the key', () => {
    expect(leaks(inspect(client.calls, { depth: Infinity }))).toBe(false);
    expect(leaks(inspect(client.assistantsV1.assistants('aia_asst_1'), { depth: Infinity }))).toBe(false);
    expect(leaks(String(client))).toBe(false);
    const transport = new Transport({ accountSid: ACCOUNT_SID, apiKey: KEY });
    expect(leaks(inspect(transport, { depth: Infinity, showHidden: true }))).toBe(false);
    expect(leaks(JSON.stringify(transport))).toBe(false);
    expect(Object.keys(transport).some((k) => /key|auth/i.test(k))).toBe(false);
  });

  it('the authToken alias is redacted the same way', () => {
    const c = new Client({ accountSid: ACCOUNT_SID, authToken: KEY });
    expect(leaks(inspect(c, { depth: Infinity }))).toBe(false);
    expect(leaks(JSON.stringify(c))).toBe(false);
  });

  it('RequestValidator does not expose the key', () => {
    const v = new RequestValidator(KEY);
    expect(leaks(inspect(v, { depth: Infinity, showHidden: true }))).toBe(false);
    expect(leaks(JSON.stringify(v))).toBe(false);
  });

  it('the rotateKey response exposes api_key only through direct property access', async () => {
    const NEW_KEY = 'ROTATED-SECRET-9876543210';
    const { fetch } = scriptedFetch([
      json({ sid: ACCOUNT_SID, api_key: NEW_KEY, sip_username: 'ops' }),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: KEY, fetch, maxRetries: 0 });
    const account = await c.accounts.rotateKey();
    expect(account.api_key).toBe(NEW_KEY);
    expect(leaks(inspect(account, { depth: Infinity }))).toBe(false);
    expect(leaks(inspect(account, { depth: Infinity, showHidden: true }))).toBe(false);
    expect(leaks(inspect({ account }))).toBe(false);
    expect(leaks(JSON.stringify(account))).toBe(false);
    expect(leaks(JSON.stringify({ rotated: account }))).toBe(false);
    expect(leaks(String(account))).toBe(false);
    expect(Object.keys(account)).not.toContain('api_key');
  });
});
