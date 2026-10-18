/**
 * Tolerant decoding (C9): spec-nullable fields may be `null`, unknown enum values and extra
 * fields pass through untouched, and the types say so (checked by `tsc --noEmit`).
 */

import { describe, expect, expectTypeOf, it } from 'vitest';

import { Client, type Call, type IncomingPhoneNumber, type Recording } from '../src/index.js';
import { ACCOUNT_SID, API_KEY, json, scriptedFetch } from './helpers.js';

describe('decoding', () => {
  it('passes nulls, unknown enum values and extra fields through', async () => {
    const payload = {
      sid: 'CA' + '0'.repeat(32),
      account_sid: ACCOUNT_SID,
      api_version: null,
      status: 'teleporting',
      direction: null,
      answered_by: 'robot',
      price: null,
      date_created: null,
      date_updated: null,
      uri: null,
      brand_new_field: { nested: true },
    };
    const { fetch } = scriptedFetch([json(payload)]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    const call = await c.calls.get('CA' + '0'.repeat(32));
    expect(call).toEqual(payload);
    expect(call.status).toBe('teleporting');
  });

  it('types: nullable fields admit null and response enums are open', () => {
    expectTypeOf<null>().toExtend<Call['direction']>();
    expectTypeOf<null>().toExtend<Call['price']>();
    expectTypeOf<'teleporting'>().toExtend<Call['status']>();
    expectTypeOf<'queued'>().toExtend<Call['status']>();
    expectTypeOf<null>().toExtend<IncomingPhoneNumber['capabilities']>();
    expectTypeOf<'pending-unregistration'>().toExtend<
      NonNullable<IncomingPhoneNumber['emergency_address_status']>
    >();
    expectTypeOf<Recording>().toHaveProperty('track');
  });

  it('a `false` boolean round-trips', async () => {
    const { fetch } = scriptedFetch([
      json({ call_sid: 'CA1', conference_sid: 'CF1', muted: false, hold: false, coaching: false }),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    const p = await c.conferences.getParticipant('CF1', 'CA1');
    expect(p.muted).toBe(false);
    expect(p.hold).toBe(false);
  });
});
