/** Webhook signature validation (C10) against the fleet test vectors. */

import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import { computeSignature, RequestValidator, validateRequest } from '../src/index.js';

const KEY = 'test-api-key-0123456789';

const V1_URL = 'https://example.com/voice/answer?case=1';
const V1_URL_443 = 'https://example.com:443/voice/answer?case=1';
const V1_PARAMS = {
  CallSid: 'CA0123456789abcdef0123456789abcdef',
  From: '+14155550100',
  To: '+14155550101',
  Digits: '1234',
  AccountSid: 'ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
};
const V1_SIG = 'pk/0TPPT+p98NEZykeWQLqRXyGU=';
const V1_SIG_443 = '/Bw0s+u5vlGd6zLAOTz/eMg33pk=';

const V3_URL = 'https://example.com/hook';
const V3_FORM: Array<[string, string]> = [
  ['To', '+14155550101'],
  ['Event', 'answered'],
  ['Event', 'initiated'],
];
const V3_SIG = 'jCnpBgyg45aZYwUie5fmq4EYUic=';

const V4_URL =
  'https://example.com/voice/answer?CallSid=CA0123456789abcdef0123456789abcdef&From=%2B14155550100';
const V4_SIG = '9I4odWBHhF7TMIkIrNtPEPjD9fU=';

describe('computeSignature', () => {
  it('V1 (POST): sorted key+value pairs appended to the URL', () => {
    expect(computeSignature(KEY, V1_URL, V1_PARAMS)).toBe(V1_SIG);
    expect(computeSignature(KEY, V1_URL_443, V1_PARAMS)).toBe(V1_SIG_443);
  });

  it('V3 (repeated keys): each value in received order, for every params shape', () => {
    expect(computeSignature(KEY, V3_URL, new URLSearchParams(V3_FORM))).toBe(V3_SIG);
    expect(computeSignature(KEY, V3_URL, V3_FORM)).toBe(V3_SIG);
    expect(computeSignature(KEY, V3_URL, { To: '+14155550101', Event: ['answered', 'initiated'] })).toBe(
      V3_SIG,
    );
  });

  it('V4 (GET): the URL alone', () => {
    expect(computeSignature(KEY, V4_URL)).toBe(V4_SIG);
    expect(computeSignature(KEY, V4_URL, {})).toBe(V4_SIG);
  });

  it('ignores a #fragment', () => {
    expect(computeSignature(KEY, `${V1_URL}#frag`, V1_PARAMS)).toBe(V1_SIG);
  });

  it('matches HMAC-SHA1 from node:crypto for arbitrary input (incl. long keys and UTF-8)', () => {
    const cases: Array<[string, string]> = [
      ['', ''],
      ['k', 'https://example.com/'],
      ['k'.repeat(200), 'https://example.com/ünïcödé?x=☃'],
      [KEY, 'x'.repeat(1000)],
    ];
    for (const [key, url] of cases) {
      const expected = createHmac('sha1', key).update(url, 'utf8').digest('base64');
      expect(computeSignature(key, url)).toBe(expected);
    }
  });
});

describe('validateRequest', () => {
  it('accepts the V1-V4 vectors', () => {
    expect(validateRequest(KEY, V1_SIG, V1_URL, V1_PARAMS)).toBe(true);
    expect(validateRequest(KEY, V3_SIG, V3_URL, new URLSearchParams(V3_FORM))).toBe(true);
    expect(validateRequest(KEY, V4_SIG, V4_URL)).toBe(true);
  });

  it('normalises the default port in both directions', () => {
    expect(validateRequest(KEY, V1_SIG, V1_URL_443, V1_PARAMS)).toBe(true);
    expect(validateRequest(KEY, V1_SIG_443, V1_URL, V1_PARAMS)).toBe(true);
    expect(validateRequest(KEY, V1_SIG, 'https://example.com:8443/voice/answer?case=1', V1_PARAMS)).toBe(
      false,
    );
  });

  it('rejects a tampered value, a reordered repeated key, a wrong key, or a bad signature', () => {
    expect(validateRequest(KEY, V1_SIG, V1_URL, { ...V1_PARAMS, Digits: '9999' })).toBe(false);
    expect(
      validateRequest(KEY, V3_SIG, V3_URL, [
        ['To', '+14155550101'],
        ['Event', 'initiated'],
        ['Event', 'answered'],
      ]),
    ).toBe(false);
    expect(validateRequest('wrong-key', V1_SIG, V1_URL, V1_PARAMS)).toBe(false);
    expect(validateRequest(KEY, '', V1_URL, V1_PARAMS)).toBe(false);
    expect(validateRequest(KEY, V1_SIG.slice(0, -1), V1_URL, V1_PARAMS)).toBe(false);
    expect(validateRequest('', V1_SIG, V1_URL, V1_PARAMS)).toBe(false);
  });

  it('RequestValidator binds the key', () => {
    const v = new RequestValidator(KEY);
    expect(v.validate(V1_URL, V1_PARAMS, V1_SIG)).toBe(true);
    expect(v.validate(V4_URL, undefined, V4_SIG)).toBe(true);
    expect(v.computeSignature(V3_URL, V3_FORM)).toBe(V3_SIG);
    expect(v.validate(V1_URL, V1_PARAMS, V4_SIG)).toBe(false);
  });
});
