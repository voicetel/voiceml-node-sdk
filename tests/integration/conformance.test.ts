// Twilio response-shape conformance tests (#330, mirrors #256 Phase B).
//
// SKIPPED unless VOICEML_CONFORMANCE_FIXTURES points at a fixture corpus
// emitted by callBroadcast's cmd/twilio-conformance-fixtures. The harness
// loads each canonical Twilio response example from the corpus, structurally
// validates it against the matching TS resource shape, and asserts the
// key fields (sid, account_sid, api_version) that the SDK and downstream
// consumers rely on. If validation fails, the SDK's interface has drifted
// from Twilio's documented shape — fix the SDK, not the fixture.
//
// TypeScript interfaces don't exist at runtime, so this harness checks
// structurally: required fields present + correct primitive types + enum
// values within the SDK's declared union. The Go SDK passes 132/132 via
// json.Unmarshal type-strictness; the Python SDK uses Pydantic; this
// harness's hand-rolled checks give us equivalent enforcement here.
//
// Run:
//
//   VOICEML_CONFORMANCE_FIXTURES=/path/to/callBroadcast/cmd/twilio-conformance-fixtures/fixtures \
//     npx vitest run tests/integration/conformance.test.ts

import { describe, test, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

interface ConformanceEntry {
  resource: string;
  method: string;
  status: string;
  operation_id: string;
  example_name: string;
  path: string;
  file: string;
}

const FIXTURES_ENV = 'VOICEML_CONFORMANCE_FIXTURES';

function loadEntries(): { root: string; entries: ConformanceEntry[] } | null {
  const root = process.env[FIXTURES_ENV];
  if (!root) return null;
  const idx = join(root, 'index.json');
  if (!existsSync(idx)) return null;
  const entries = JSON.parse(readFileSync(idx, 'utf-8')) as ConformanceEntry[];
  return { root, entries };
}

// Resource shape descriptors. Each describes the required scalar fields
// on the SDK's interface — keys missing in the fixture, or values whose
// types disagree, fail the test. Optional fields aren't asserted here;
// they may legitimately be null in some Twilio responses.
type FieldType = 'string' | 'number' | 'boolean' | 'object';
interface ResourceShape {
  required: Array<{ field: string; type: FieldType }>;
  // Enum-typed fields whose value must lie within the SDK's union.
  enums?: Array<{ field: string; allowed: readonly string[] }>;
}

const CALL_STATUS = [
  'queued', 'ringing', 'in-progress', 'completed', 'busy',
  'no-answer', 'canceled', 'failed',
] as const;
const CALL_DIRECTION = ['inbound', 'outbound-api', 'outbound-dial'] as const;
const ANSWERED_BY = [
  'human', 'machine_start', 'machine_end_beep', 'machine_end_silence',
  'machine_end_other', 'fax', 'unknown', '',
] as const;
const CONFERENCE_STATUS = ['init', 'in-progress', 'completed'] as const;

const SHAPES: Record<string, ResourceShape> = {
  Call: {
    required: [
      { field: 'sid', type: 'string' },
      { field: 'account_sid', type: 'string' },
      { field: 'api_version', type: 'string' },
      { field: 'status', type: 'string' },
      { field: 'direction', type: 'string' },
      { field: 'date_created', type: 'string' },
      { field: 'date_updated', type: 'string' },
      { field: 'uri', type: 'string' },
    ],
    enums: [
      { field: 'status', allowed: CALL_STATUS },
      { field: 'direction', allowed: CALL_DIRECTION },
      { field: 'answered_by', allowed: ANSWERED_BY },
    ],
  },
  Conference: {
    required: [
      { field: 'sid', type: 'string' },
      { field: 'account_sid', type: 'string' },
      { field: 'friendly_name', type: 'string' },
      { field: 'status', type: 'string' },
      { field: 'date_created', type: 'string' },
      { field: 'date_updated', type: 'string' },
      { field: 'api_version', type: 'string' },
      { field: 'uri', type: 'string' },
    ],
    enums: [{ field: 'status', allowed: CONFERENCE_STATUS }],
  },
  Participant: {
    required: [
      { field: 'account_sid', type: 'string' },
      { field: 'call_sid', type: 'string' },
      { field: 'conference_sid', type: 'string' },
      { field: 'date_created', type: 'string' },
      { field: 'date_updated', type: 'string' },
      { field: 'uri', type: 'string' },
    ],
  },
  Queue: {
    required: [
      { field: 'sid', type: 'string' },
      { field: 'account_sid', type: 'string' },
      { field: 'friendly_name', type: 'string' },
      { field: 'current_size', type: 'number' },
      { field: 'max_size', type: 'number' },
      { field: 'average_wait_time', type: 'number' },
      { field: 'date_created', type: 'string' },
      { field: 'date_updated', type: 'string' },
      { field: 'uri', type: 'string' },
    ],
  },
  QueueMember: {
    required: [
      { field: 'call_sid', type: 'string' },
      { field: 'date_enqueued', type: 'string' },
      { field: 'wait_time', type: 'number' },
      { field: 'position', type: 'number' },
      { field: 'uri', type: 'string' },
    ],
  },
  Application: {
    required: [
      { field: 'sid', type: 'string' },
      { field: 'account_sid', type: 'string' },
      { field: 'friendly_name', type: 'string' },
      { field: 'date_created', type: 'string' },
      { field: 'date_updated', type: 'string' },
      { field: 'api_version', type: 'string' },
      { field: 'uri', type: 'string' },
    ],
  },
  Recording: {
    required: [
      { field: 'sid', type: 'string' },
      { field: 'account_sid', type: 'string' },
      { field: 'call_sid', type: 'string' },
      { field: 'date_created', type: 'string' },
      { field: 'date_updated', type: 'string' },
      { field: 'api_version', type: 'string' },
      { field: 'uri', type: 'string' },
    ],
  },
  IncomingPhoneNumber: {
    required: [
      { field: 'sid', type: 'string' },
      { field: 'account_sid', type: 'string' },
      { field: 'phone_number', type: 'string' },
      { field: 'friendly_name', type: 'string' },
      { field: 'date_created', type: 'string' },
      { field: 'date_updated', type: 'string' },
      { field: 'api_version', type: 'string' },
      { field: 'uri', type: 'string' },
    ],
  },
  // Stream / SiprecSession / CallTranscription don't get api_version
  // populated on Create/Update responses in Twilio's documented examples
  // (only on the LIST envelope items, which we don't fixture here).
  // The TS SDK marks api_version optional to match — same call as the
  // Python SDK's Optional[str] fix-forward.
  Stream: {
    required: [
      { field: 'sid', type: 'string' },
      { field: 'account_sid', type: 'string' },
      { field: 'call_sid', type: 'string' },
      { field: 'date_updated', type: 'string' },
      { field: 'uri', type: 'string' },
    ],
  },
  SiprecSession: {
    required: [
      { field: 'sid', type: 'string' },
      { field: 'account_sid', type: 'string' },
      { field: 'call_sid', type: 'string' },
      { field: 'date_updated', type: 'string' },
      { field: 'uri', type: 'string' },
    ],
  },
  CallTranscription: {
    required: [
      { field: 'sid', type: 'string' },
      { field: 'account_sid', type: 'string' },
      { field: 'call_sid', type: 'string' },
      { field: 'date_updated', type: 'string' },
      { field: 'uri', type: 'string' },
    ],
  },
  // List envelopes share the Twilio paginated shape. Only the envelope is
  // checked — inner items may be empty in *Empty fixtures.
  ListEnvelope: {
    required: [
      { field: 'uri', type: 'string' },
      { field: 'page', type: 'number' },
      { field: 'page_size', type: 'number' },
      { field: 'first_page_uri', type: 'string' },
    ],
  },
};

// Map operation IDs to resource shape. Returns null for unmodelled or
// out-of-scope operations (Messages SDK gap, notification/event compat
// stubs, UserDefinedMessage).
function pickShape(opId: string): { shape: ResourceShape; name: string } | null {
  const calls: Record<string, string> = {
    CreateCall: 'Call', FetchCall: 'Call', UpdateCall: 'Call',
    FetchConference: 'Conference', UpdateConference: 'Conference',
    CreateParticipant: 'Participant', FetchParticipant: 'Participant', UpdateParticipant: 'Participant',
    CreateQueue: 'Queue', FetchQueue: 'Queue', UpdateQueue: 'Queue',
    FetchMember: 'QueueMember', UpdateMember: 'QueueMember',
    CreateApplication: 'Application', FetchApplication: 'Application', UpdateApplication: 'Application',
    CreateCallRecording: 'Recording', FetchCallRecording: 'Recording', UpdateCallRecording: 'Recording',
    FetchRecording: 'Recording', FetchConferenceRecording: 'Recording', UpdateConferenceRecording: 'Recording',
    CreateIncomingPhoneNumber: 'IncomingPhoneNumber',
    CreateIncomingPhoneNumberLocal: 'IncomingPhoneNumber',
    CreateIncomingPhoneNumberMobile: 'IncomingPhoneNumber',
    CreateIncomingPhoneNumberTollFree: 'IncomingPhoneNumber',
    FetchIncomingPhoneNumber: 'IncomingPhoneNumber',
    UpdateIncomingPhoneNumber: 'IncomingPhoneNumber',
    CreateStream: 'Stream', UpdateStream: 'Stream',
    CreateSiprec: 'SiprecSession', UpdateSiprec: 'SiprecSession',
    CreateRealtimeTranscription: 'CallTranscription',
    UpdateRealtimeTranscription: 'CallTranscription',
  };
  const lists = new Set([
    'ListCall', 'ListConference', 'ListParticipant', 'ListQueue', 'ListMember',
    'ListApplication', 'ListCallRecording', 'ListRecording', 'ListConferenceRecording',
    'ListIncomingPhoneNumber', 'ListIncomingPhoneNumberLocal',
    'ListIncomingPhoneNumberMobile', 'ListIncomingPhoneNumberTollFree',
  ]);
  if (lists.has(opId)) return { shape: SHAPES.ListEnvelope, name: 'ListEnvelope' };
  const resource = calls[opId];
  if (!resource) return null;
  return { shape: SHAPES[resource], name: resource };
}

function validateShape(body: unknown, shape: ResourceShape, where: string): void {
  expect(body, `${where}: response is not an object`).toBeTypeOf('object');
  expect(body, `${where}: response is null`).not.toBeNull();
  const obj = body as Record<string, unknown>;
  for (const { field, type } of shape.required) {
    expect(obj, `${where}: missing required field '${field}'`).toHaveProperty(field);
    const v = obj[field];
    // Twilio occasionally emits null for fields the doc lists as required
    // when the call leg hasn't reached the state that populates them
    // (e.g. answered_by on a still-queued call). Treat null as "present
    // but unset" — only flag wrong-type non-null values.
    if (v !== null) {
      expect(typeof v, `${where}: '${field}' has wrong type (got ${typeof v}, want ${type})`).toBe(type);
    }
  }
  if (shape.enums) {
    for (const { field, allowed } of shape.enums) {
      const v = obj[field];
      if (typeof v === 'string') {
        expect(allowed, `${where}: '${field}' = ${JSON.stringify(v)} not in SDK enum union`).toContain(v);
      }
    }
  }
}

const loaded = loadEntries();

describe.skipIf(!loaded)('Twilio response-shape conformance', () => {
  if (!loaded) return;
  const { root, entries } = loaded;

  test.each(entries)(
    '$resource/$operation_id/$example_name',
    (entry) => {
      const picked = pickShape(entry.operation_id);
      if (!picked) {
        // Mirrors the Go harness's nil target — these operations have no
        // SDK model (compat stubs, Messages gap, UserDefinedMessage).
        return;
      }
      const body = readFileSync(join(root, entry.file), 'utf-8');
      let parsed: unknown;
      try {
        parsed = JSON.parse(body);
      } catch (err) {
        throw new Error(`${entry.operation_id}/${entry.example_name}: JSON parse failed: ${(err as Error).message}`);
      }
      validateShape(parsed, picked.shape, `${entry.operation_id}/${entry.example_name}`);
    },
  );
});
