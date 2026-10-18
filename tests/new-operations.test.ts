/**
 * The 40 operations added for full spec coverage (C6, wave 2): exact method, URL (host, path,
 * `.json` rules, query), auth and form bytes for each one.
 */

import { describe, expect, it } from 'vitest';

import { Client } from '../src/index.js';
import { ACCOUNT_SID, API_KEY, BASIC, json, scriptedFetch } from './helpers.js';

const V = 'https://voiceml.voicetel.com';
const M = 'https://messaging.voicetel.com';
const A = `${V}/2010-04-01/Accounts/${ACCOUNT_SID}`;

interface Case {
  name: string;
  call: (c: Client) => Promise<unknown>;
  method: string;
  url: string;
  body?: string;
  auth?: boolean;
  response?: () => Response;
}

const bytes = () => new Response(new Uint8Array([1]), { status: 200 });

const CASES: Case[] = [
  // Accounts / Balance
  { name: 'accounts.fetch', call: (c) => c.accounts.fetch(), method: 'GET', url: `${V}/2010-04-01/Accounts/${ACCOUNT_SID}.json` },
  {
    name: 'accounts.update',
    call: (c) => c.accounts.update({ FriendlyName: 'Ops', AllowCidr: ['10.0.0.0/8', '192.0.2.0/24'] }),
    method: 'POST',
    url: `${V}/2010-04-01/Accounts/${ACCOUNT_SID}.json`,
    body: 'FriendlyName=Ops&AllowCidr=10.0.0.0%2F8&AllowCidr=192.0.2.0%2F24',
  },
  { name: 'balance.fetch', call: (c) => c.balance.fetch(), method: 'GET', url: `${A}/Balance.json` },
  // OutgoingCallerIds
  {
    name: 'outgoing_caller_ids.list',
    call: (c) => c.outgoingCallerIds.list({ PhoneNumber: '+14155550100', PageSize: 20 }),
    method: 'GET',
    url: `${A}/OutgoingCallerIds.json?PhoneNumber=%2B14155550100&PageSize=20`,
  },
  {
    name: 'outgoing_caller_ids.create',
    call: (c) => c.outgoingCallerIds.create({ PhoneNumber: '+14155550100', FriendlyName: 'Desk' }),
    method: 'POST',
    url: `${A}/OutgoingCallerIds.json`,
    body: 'PhoneNumber=%2B14155550100&FriendlyName=Desk',
  },
  { name: 'outgoing_caller_ids.fetch', call: (c) => c.outgoingCallerIds.get('PN1'), method: 'GET', url: `${A}/OutgoingCallerIds/PN1.json` },
  {
    name: 'outgoing_caller_ids.update',
    call: (c) => c.outgoingCallerIds.update('PN1', { FriendlyName: 'Front desk' }),
    method: 'POST',
    url: `${A}/OutgoingCallerIds/PN1.json`,
    body: 'FriendlyName=Front+desk',
  },
  { name: 'outgoing_caller_ids.delete', call: (c) => c.outgoingCallerIds.delete('PN1'), method: 'DELETE', url: `${A}/OutgoingCallerIds/PN1.json` },
  // Message media
  {
    name: 'media.list',
    call: (c) => c.messages.listMedia('MM1', { PageSize: 5 }),
    method: 'GET',
    url: `${A}/Messages/MM1/Media.json?PageSize=5`,
  },
  { name: 'media.fetch', call: (c) => c.messages.getMedia('MM1', 'ME1'), method: 'GET', url: `${A}/Messages/MM1/Media/ME1.json` },
  { name: 'media.delete', call: (c) => c.messages.deleteMedia('MM1', 'ME1'), method: 'DELETE', url: `${A}/Messages/MM1/Media/ME1.json` },
  // Exports
  { name: 'exports.list', call: (c) => c.exports.list(), method: 'GET', url: `${A}/Exports.json` },
  {
    name: 'exports.download',
    call: (c) => c.exports.download('2026-09-30'),
    method: 'GET',
    url: `${A}/Exports/2026-09-30`,
    response: bytes,
  },
  // Transcriptions (account + recording scoped)
  {
    name: 'transcriptions.listAccount',
    call: (c) => c.transcriptions.list({ dateCreated: '2026-09-30', PageSize: 10 }),
    method: 'GET',
    url: `${A}/Transcriptions.json?DateCreated=2026-09-30&PageSize=10`,
  },
  { name: 'transcription.fetch', call: (c) => c.transcriptions.get('TR1'), method: 'GET', url: `${A}/Transcriptions/TR1.json` },
  { name: 'transcription.delete', call: (c) => c.transcriptions.delete('TR1'), method: 'DELETE', url: `${A}/Transcriptions/TR1.json` },
  {
    name: 'recording.transcriptions.list',
    call: (c) => c.recordings.listTranscriptions('RE1', { PageSize: 3 }),
    method: 'GET',
    url: `${A}/Recordings/RE1/Transcriptions.json?PageSize=3`,
  },
  { name: 'recording.transcription.fetch', call: (c) => c.recordings.getTranscription('RE1', 'TR1'), method: 'GET', url: `${A}/Recordings/RE1/Transcriptions/TR1.json` },
  { name: 'recording.transcription.delete', call: (c) => c.recordings.deleteTranscription('RE1', 'TR1'), method: 'DELETE', url: `${A}/Recordings/RE1/Transcriptions/TR1.json` },
  // Conference recording create
  {
    name: 'conferenceRecordings.create',
    call: (c) => c.conferences.startRecording('CF1', { RecordingStatusCallback: 'https://example.com/r', RecordingStatusCallbackMethod: 'POST' }),
    method: 'POST',
    url: `${A}/Conferences/CF1/Recordings.json`,
    body: 'RecordingStatusCallback=https%3A%2F%2Fexample.com%2Fr&RecordingStatusCallbackMethod=POST',
  },
  // Diagnostics
  { name: 'openapi.yaml', call: (c) => c.diagnostics.openapiYaml(), method: 'GET', url: `${V}/openapi.yaml`, auth: false, response: bytes },
  { name: 'openapi.yml', call: (c) => c.diagnostics.openapiYml(), method: 'GET', url: `${V}/openapi.yml`, auth: false, response: bytes },
  // Usage records
  {
    name: 'usageRecords.list',
    call: (c) => c.usageRecords.list({ Category: 'calls', StartDate: '2026-09-01', EndDate: '2026-09-30', IncludeSubaccounts: false }),
    method: 'GET',
    url: `${A}/Usage/Records.json?Category=calls&StartDate=2026-09-01&EndDate=2026-09-30&IncludeSubaccounts=false`,
  },
  ...(
    [
      ['AllTime', (c: Client) => c.usageRecords.listAllTime()],
      ['Daily', (c: Client) => c.usageRecords.listDaily()],
      ['LastMonth', (c: Client) => c.usageRecords.listLastMonth()],
      ['Monthly', (c: Client) => c.usageRecords.listMonthly()],
      ['ThisMonth', (c: Client) => c.usageRecords.listThisMonth()],
      ['Today', (c: Client) => c.usageRecords.listToday()],
      ['Yearly', (c: Client) => c.usageRecords.listYearly({ PageSize: 2 })],
      ['Yesterday', (c: Client) => c.usageRecords.listYesterday()],
    ] as const
  ).map(([w, call]): Case => ({
    name: `usageRecords.list${w}`,
    call,
    method: 'GET',
    url: `${A}/Usage/Records/${w}.json${w === 'Yearly' ? '?PageSize=2' : ''}`,
  })),
  // SIP registrations
  { name: 'sip_registrations.list', call: (c) => c.sip.registrations.list({ PageSize: 50 }), method: 'GET', url: `${A}/SIP/Registrations.json?PageSize=50` },
  // Messaging Service sender pool (messaging host)
  {
    name: 'messaging.v1.services.phoneNumbers.list',
    call: (c) => c.messagingV1.services.phoneNumbers('MG1').list({ PageSize: 20 }),
    method: 'GET',
    url: `${M}/v1/Services/MG1/PhoneNumbers?PageSize=20`,
  },
  {
    name: 'messaging.v1.services.phoneNumbers.create',
    call: (c) => c.messagingV1.services.phoneNumbers('MG1').create({ PhoneNumberSid: 'PN1' }),
    method: 'POST',
    url: `${M}/v1/Services/MG1/PhoneNumbers`,
    body: 'PhoneNumberSid=PN1',
  },
  { name: 'messaging.v1.services.phoneNumbers.fetch', call: (c) => c.messagingV1.services.phoneNumbers('MG1').fetch('PN1'), method: 'GET', url: `${M}/v1/Services/MG1/PhoneNumbers/PN1` },
  { name: 'messaging.v1.services.phoneNumbers.delete', call: (c) => c.messagingV1.services.phoneNumbers('MG1').delete('PN1'), method: 'DELETE', url: `${M}/v1/Services/MG1/PhoneNumbers/PN1` },
  // Monitor v1 alerts (base host, /v1 meta envelope)
  {
    name: 'monitor.v1.alerts.list',
    call: (c) => c.monitorAlerts.list({ LogLevel: 'warning', StartDate: '2026-09-01', EndDate: '2026-09-30T23:59:59Z', PageSize: 100 }),
    method: 'GET',
    url: `${V}/v1/Alerts?LogLevel=warning&StartDate=2026-09-01&EndDate=2026-09-30T23%3A59%3A59Z&PageSize=100`,
  },
  { name: 'monitor.v1.alerts.fetch', call: (c) => c.monitorAlerts.fetch('NO1'), method: 'GET', url: `${V}/v1/Alerts/NO1` },
  // Message delivery feedback
  {
    name: 'messages.feedback.create',
    call: (c) => c.messages.createFeedback('SM1', { Outcome: 'confirmed' }),
    method: 'POST',
    url: `${A}/Messages/SM1/Feedback.json`,
    body: 'Outcome=confirmed',
  },
  // Account key rotation
  {
    name: 'accounts.rotateKey',
    call: (c) => c.accounts.rotateKey(),
    method: 'POST',
    url: `${A}/RotateKey.json`,
  },
];

describe('new operations', () => {
  it('covers all 40 added operations', () => {
    expect(new Set(CASES.map((x) => x.name)).size).toBe(40);
  });

  it.each(CASES)('$name → $method $url', async (tc) => {
    const { fetch, calls } = scriptedFetch([tc.response ? tc.response() : json({})]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch, maxRetries: 0 });
    await tc.call(c);
    expect(calls).toHaveLength(1);
    expect(calls[0]!.init.method).toBe(tc.method);
    expect(calls[0]!.url).toBe(tc.url);
    expect(calls[0]!.headers.Authorization).toBe(tc.auth === false ? undefined : BASIC);
    expect(calls[0]!.body).toBe(tc.body ?? null);
  });
});
