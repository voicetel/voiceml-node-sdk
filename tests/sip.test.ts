/**
 * Wire-shape tests for the SIP Trunking resources — `client.sip.*`.
 *
 * Uses a stub `fetch` to intercept calls; never hits the network.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import { Client } from '../src/index.js';

const ACCOUNT_SID = 'AC' + 'f'.repeat(32);
const API_KEY = 'secret-key-1234';
const BASE = 'https://voiceml.voicetel.com';
const DOMAIN_SID = 'SD' + '1'.repeat(32);
const CL_SID = 'CL' + '2'.repeat(32);
const CR_SID = 'CR' + '3'.repeat(32);
const ACL_SID = 'AL' + '4'.repeat(32);
const IP_SID = 'IP' + '5'.repeat(32);
const MAPPING_SID = 'CL' + '9'.repeat(32);

interface CapturedCall {
  url: string;
  init: RequestInit;
}

function fakeFetch(responses: Array<Response | (() => Response)>): {
  fetch: typeof fetch;
  calls: CapturedCall[];
} {
  const calls: CapturedCall[] = [];
  let i = 0;
  const fn = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    calls.push({ url, init });
    const next = responses[i++];
    if (!next) throw new Error(`fakeFetch: out of responses (${i - 1} consumed)`);
    return typeof next === 'function' ? next() : next;
  });
  return { fetch: fn as unknown as typeof fetch, calls };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function noContentResponse(): Response {
  return new Response(null, { status: 204 });
}

function domainPayload(sid: string = DOMAIN_SID) {
  return {
    sid,
    account_sid: ACCOUNT_SID,
    api_version: '2010-04-01',
    domain_name: 'ingress.example.com',
    friendly_name: 'ingress',
    voice_url: null,
    voice_method: null,
    voice_fallback_url: null,
    voice_fallback_method: null,
    voice_status_callback_url: null,
    voice_status_callback_method: null,
    sip_registration: false,
    emergency_calling_enabled: false,
    secure: true,
    byoc_trunk_sid: null,
    emergency_caller_sid: null,
    auth_type: null,
    date_created: 'Mon, 17 Jun 2026 12:00:00 +0000',
    date_updated: 'Mon, 17 Jun 2026 12:00:00 +0000',
    uri: `/2010-04-01/Accounts/${ACCOUNT_SID}/SIP/Domains/${sid}.json`,
  };
}

function credentialListPayload(sid: string = CL_SID) {
  return {
    sid,
    account_sid: ACCOUNT_SID,
    friendly_name: 'office-handsets',
    date_created: 'Mon, 17 Jun 2026 12:00:00 +0000',
    date_updated: 'Mon, 17 Jun 2026 12:00:00 +0000',
    uri: `/2010-04-01/Accounts/${ACCOUNT_SID}/SIP/CredentialLists/${sid}.json`,
  };
}

function credentialPayload(sid: string = CR_SID) {
  return {
    sid,
    account_sid: ACCOUNT_SID,
    credential_list_sid: CL_SID,
    username: 'alice',
    date_created: 'Mon, 17 Jun 2026 12:00:00 +0000',
    date_updated: 'Mon, 17 Jun 2026 12:00:00 +0000',
    uri: `/2010-04-01/Accounts/${ACCOUNT_SID}/SIP/CredentialLists/${CL_SID}/Credentials/${sid}.json`,
  };
}

function ipaclPayload(sid: string = ACL_SID) {
  return {
    sid,
    account_sid: ACCOUNT_SID,
    friendly_name: 'carrier-allowlist',
    date_created: 'Mon, 17 Jun 2026 12:00:00 +0000',
    date_updated: 'Mon, 17 Jun 2026 12:00:00 +0000',
    uri: `/2010-04-01/Accounts/${ACCOUNT_SID}/SIP/IpAccessControlLists/${sid}.json`,
  };
}

function ipAddressPayload(sid: string = IP_SID) {
  return {
    sid,
    account_sid: ACCOUNT_SID,
    ip_access_control_list_sid: ACL_SID,
    friendly_name: 'carrier-edge-1',
    ip_address: '203.0.113.10',
    cidr_prefix_length: 32,
    date_created: 'Mon, 17 Jun 2026 12:00:00 +0000',
    date_updated: 'Mon, 17 Jun 2026 12:00:00 +0000',
    uri: `/2010-04-01/Accounts/${ACCOUNT_SID}/SIP/IpAccessControlLists/${ACL_SID}/IpAddresses/${sid}.json`,
  };
}

function mappingPayload(sid: string = MAPPING_SID) {
  return {
    sid,
    account_sid: ACCOUNT_SID,
    friendly_name: null,
    domain_sid: DOMAIN_SID,
    date_created: 'Mon, 17 Jun 2026 12:00:00 +0000',
    date_updated: 'Mon, 17 Jun 2026 12:00:00 +0000',
    uri: `/2010-04-01/Accounts/${ACCOUNT_SID}/SIP/Domains/${DOMAIN_SID}/CredentialListMappings/${sid}.json`,
  };
}

function bodyOf(init: RequestInit): URLSearchParams {
  return init.body as URLSearchParams;
}

afterEach(() => vi.restoreAllMocks());

describe('SIP Domains', () => {
  it('list', async () => {
    const { fetch, calls } = fakeFetch([
      jsonResponse({ domains: [domainPayload()], page: 0, page_size: 50, total: 1, next_page_uri: null, uri: '' }),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    const out = await c.sip.domains.list();
    expect(out.domains).toHaveLength(1);
    expect(out.domains[0].domain_name).toBe('ingress.example.com');
    expect(calls[0].url).toBe(`${BASE}/2010-04-01/Accounts/${ACCOUNT_SID}/SIP/Domains.json`);
  });

  it('create sends form body', async () => {
    const { fetch, calls } = fakeFetch([jsonResponse(domainPayload())]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    await c.sip.domains.create({
      DomainName: 'ingress.example.com',
      FriendlyName: 'ingress',
      VoiceUrl: 'https://hooks.example.com/voice',
      VoiceMethod: 'POST',
      SipRegistration: false,
      Secure: true,
    });
    const body = bodyOf(calls[0].init);
    expect(body.get('DomainName')).toBe('ingress.example.com');
    expect(body.get('FriendlyName')).toBe('ingress');
    expect(body.get('VoiceUrl')).toBe('https://hooks.example.com/voice');
    expect(body.get('VoiceMethod')).toBe('POST');
    expect(body.get('SipRegistration')).toBe('false');
    expect(body.get('Secure')).toBe('true');
  });

  it('fetch', async () => {
    const { fetch, calls } = fakeFetch([jsonResponse(domainPayload())]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    const d = await c.sip.domains.fetch(DOMAIN_SID);
    expect(d.sid).toBe(DOMAIN_SID);
    expect(calls[0].url).toBe(`${BASE}/2010-04-01/Accounts/${ACCOUNT_SID}/SIP/Domains/${DOMAIN_SID}.json`);
  });

  it('update', async () => {
    const { fetch, calls } = fakeFetch([jsonResponse(domainPayload())]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    await c.sip.domains.update(DOMAIN_SID, { FriendlyName: 'renamed' });
    const body = bodyOf(calls[0].init);
    expect(body.get('FriendlyName')).toBe('renamed');
    expect(Array.from(body.keys())).toEqual(['FriendlyName']);
  });

  it('delete', async () => {
    const { fetch, calls } = fakeFetch([noContentResponse()]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    await c.sip.domains.delete(DOMAIN_SID);
    expect(calls[0].init.method).toBe('DELETE');
  });
});

describe('SIP CredentialLists', () => {
  it('create + fetch + update + delete', async () => {
    const { fetch, calls } = fakeFetch([
      jsonResponse(credentialListPayload()),
      jsonResponse(credentialListPayload()),
      jsonResponse(credentialListPayload()),
      noContentResponse(),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    await c.sip.credentialLists.create({ FriendlyName: 'office-handsets' });
    await c.sip.credentialLists.fetch(CL_SID);
    await c.sip.credentialLists.update(CL_SID, { FriendlyName: 'renamed' });
    await c.sip.credentialLists.delete(CL_SID);
    expect(bodyOf(calls[0].init).get('FriendlyName')).toBe('office-handsets');
    expect(calls[1].url).toBe(`${BASE}/2010-04-01/Accounts/${ACCOUNT_SID}/SIP/CredentialLists/${CL_SID}.json`);
    expect(bodyOf(calls[2].init).get('FriendlyName')).toBe('renamed');
    expect(calls[3].init.method).toBe('DELETE');
  });

  it('list', async () => {
    const { fetch } = fakeFetch([
      jsonResponse({
        credential_lists: [credentialListPayload()],
        page: 0, page_size: 50, total: 1, next_page_uri: null, uri: '',
      }),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    const out = await c.sip.credentialLists.list();
    expect(out.credential_lists[0].sid).toBe(CL_SID);
  });
});

describe('SIP Credentials (nested)', () => {
  it('list + create + fetch + update + delete', async () => {
    const { fetch, calls } = fakeFetch([
      jsonResponse({
        credentials: [credentialPayload()],
        page: 0, page_size: 50, total: 1, next_page_uri: null, uri: '',
      }),
      jsonResponse(credentialPayload()),
      jsonResponse(credentialPayload()),
      jsonResponse(credentialPayload()),
      noContentResponse(),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    await c.sip.credentialLists.credentials(CL_SID).list();
    await c.sip.credentialLists.credentials(CL_SID).create({ Username: 'alice', Password: 'hunter2' });
    await c.sip.credentialLists.credentials(CL_SID).fetch(CR_SID);
    await c.sip.credentialLists.credentials(CL_SID).update(CR_SID, { Password: 'newpwd' });
    await c.sip.credentialLists.credentials(CL_SID).delete(CR_SID);
    expect(calls[0].url).toBe(`${BASE}/2010-04-01/Accounts/${ACCOUNT_SID}/SIP/CredentialLists/${CL_SID}/Credentials.json`);
    expect(bodyOf(calls[1].init).get('Username')).toBe('alice');
    expect(bodyOf(calls[1].init).get('Password')).toBe('hunter2');
    expect(calls[2].url).toBe(`${BASE}/2010-04-01/Accounts/${ACCOUNT_SID}/SIP/CredentialLists/${CL_SID}/Credentials/${CR_SID}.json`);
    expect(bodyOf(calls[3].init).get('Password')).toBe('newpwd');
    expect(calls[4].init.method).toBe('DELETE');
  });
});

describe('SIP IpAccessControlLists', () => {
  it('list + create + fetch + update + delete', async () => {
    const { fetch, calls } = fakeFetch([
      jsonResponse({
        ip_access_control_lists: [ipaclPayload()],
        page: 0, page_size: 50, total: 1, next_page_uri: null, uri: '',
      }),
      jsonResponse(ipaclPayload()),
      jsonResponse(ipaclPayload()),
      jsonResponse(ipaclPayload()),
      noContentResponse(),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    await c.sip.ipAccessControlLists.list();
    await c.sip.ipAccessControlLists.create({ FriendlyName: 'carrier-allowlist' });
    await c.sip.ipAccessControlLists.fetch(ACL_SID);
    await c.sip.ipAccessControlLists.update(ACL_SID, { FriendlyName: 'renamed' });
    await c.sip.ipAccessControlLists.delete(ACL_SID);
    expect(bodyOf(calls[1].init).get('FriendlyName')).toBe('carrier-allowlist');
    expect(calls[2].url).toBe(`${BASE}/2010-04-01/Accounts/${ACCOUNT_SID}/SIP/IpAccessControlLists/${ACL_SID}.json`);
    expect(bodyOf(calls[3].init).get('FriendlyName')).toBe('renamed');
    expect(calls[4].init.method).toBe('DELETE');
  });
});

describe('SIP IpAddresses (nested)', () => {
  it('list + create + fetch + update + delete', async () => {
    const { fetch, calls } = fakeFetch([
      jsonResponse({
        ip_addresses: [ipAddressPayload()],
        page: 0, page_size: 50, total: 1, next_page_uri: null, uri: '',
      }),
      jsonResponse(ipAddressPayload()),
      jsonResponse(ipAddressPayload()),
      jsonResponse(ipAddressPayload()),
      noContentResponse(),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    await c.sip.ipAccessControlLists.ipAddresses(ACL_SID).list();
    await c.sip.ipAccessControlLists.ipAddresses(ACL_SID).create({
      FriendlyName: 'carrier-edge-1',
      IpAddress: '203.0.113.10',
      CidrPrefixLength: 32,
    });
    await c.sip.ipAccessControlLists.ipAddresses(ACL_SID).fetch(IP_SID);
    await c.sip.ipAccessControlLists.ipAddresses(ACL_SID).update(IP_SID, { IpAddress: '203.0.113.11' });
    await c.sip.ipAccessControlLists.ipAddresses(ACL_SID).delete(IP_SID);
    const body1 = bodyOf(calls[1].init);
    expect(body1.get('FriendlyName')).toBe('carrier-edge-1');
    expect(body1.get('IpAddress')).toBe('203.0.113.10');
    expect(body1.get('CidrPrefixLength')).toBe('32');
    expect(bodyOf(calls[3].init).get('IpAddress')).toBe('203.0.113.11');
    expect(calls[4].init.method).toBe('DELETE');
  });
});

describe('SIP Domain mappings (historical no-Auth namespace)', () => {
  it('credentialListMappings create/list/fetch/delete', async () => {
    const { fetch, calls } = fakeFetch([
      jsonResponse(mappingPayload()),
      jsonResponse({
        credential_list_mappings: [mappingPayload()],
        page: 0, page_size: 50, total: 1, next_page_uri: null, uri: '',
      }),
      jsonResponse(mappingPayload()),
      noContentResponse(),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    await c.sip.domains.credentialListMappings(DOMAIN_SID).create({ CredentialListSid: CL_SID });
    await c.sip.domains.credentialListMappings(DOMAIN_SID).list();
    await c.sip.domains.credentialListMappings(DOMAIN_SID).fetch(MAPPING_SID);
    await c.sip.domains.credentialListMappings(DOMAIN_SID).delete(MAPPING_SID);
    expect(bodyOf(calls[0].init).get('CredentialListSid')).toBe(CL_SID);
    expect(calls[1].url).toBe(`${BASE}/2010-04-01/Accounts/${ACCOUNT_SID}/SIP/Domains/${DOMAIN_SID}/CredentialListMappings.json`);
    expect(calls[2].url).toBe(`${BASE}/2010-04-01/Accounts/${ACCOUNT_SID}/SIP/Domains/${DOMAIN_SID}/CredentialListMappings/${MAPPING_SID}.json`);
    expect(calls[3].init.method).toBe('DELETE');
  });

  it('ipAccessControlListMappings create', async () => {
    const { fetch, calls } = fakeFetch([jsonResponse(mappingPayload())]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    await c.sip.domains.ipAccessControlListMappings(DOMAIN_SID).create({ IpAccessControlListSid: ACL_SID });
    expect(bodyOf(calls[0].init).get('IpAccessControlListSid')).toBe(ACL_SID);
    expect(calls[0].url).toBe(`${BASE}/2010-04-01/Accounts/${ACCOUNT_SID}/SIP/Domains/${DOMAIN_SID}/IpAccessControlListMappings.json`);
  });
});

describe('SIP Domain Auth namespaces', () => {
  it('auth.calls.credentialListMappings.create routes to /Auth/Calls/', async () => {
    const { fetch, calls } = fakeFetch([jsonResponse(mappingPayload())]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    await c.sip.domains.auth.calls.credentialListMappings(DOMAIN_SID).create({ CredentialListSid: CL_SID });
    expect(calls[0].url).toBe(
      `${BASE}/2010-04-01/Accounts/${ACCOUNT_SID}/SIP/Domains/${DOMAIN_SID}/Auth/Calls/CredentialListMappings.json`,
    );
  });

  it('auth.calls.ipAccessControlListMappings.create routes to /Auth/Calls/', async () => {
    const { fetch, calls } = fakeFetch([jsonResponse(mappingPayload())]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    await c.sip.domains.auth.calls.ipAccessControlListMappings(DOMAIN_SID).create({ IpAccessControlListSid: ACL_SID });
    expect(calls[0].url).toBe(
      `${BASE}/2010-04-01/Accounts/${ACCOUNT_SID}/SIP/Domains/${DOMAIN_SID}/Auth/Calls/IpAccessControlListMappings.json`,
    );
  });

  it('auth.registrations.credentialListMappings.create routes to /Auth/Registrations/', async () => {
    const { fetch, calls } = fakeFetch([jsonResponse(mappingPayload())]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    await c.sip.domains.auth.registrations.credentialListMappings(DOMAIN_SID).create({ CredentialListSid: CL_SID });
    expect(calls[0].url).toBe(
      `${BASE}/2010-04-01/Accounts/${ACCOUNT_SID}/SIP/Domains/${DOMAIN_SID}/Auth/Registrations/CredentialListMappings.json`,
    );
  });
});
