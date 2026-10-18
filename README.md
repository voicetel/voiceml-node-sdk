# 📞 VoiceML TypeScript SDK

The official TypeScript / Node client for the [VoiceML REST API](https://voicetel.com/docs/api/v0.9/voiceml/) — VoiceTel's Twilio-compatible voice, messaging and answering-machine-detection API, with end-to-end TypeScript types and dual ESM / CommonJS distribution.

![Version](https://img.shields.io/badge/version-0.9.2-blue)
![Node](https://img.shields.io/badge/node-%E2%89%A520-blue)
![License](https://img.shields.io/badge/license-MIT%20%2B%20Commons%20Clause-green)
![Typed](https://img.shields.io/badge/typed-strict-blue)

## 📚 Table of Contents

- [Features](#-features)
- [Installation](#-installation)
- [Quickstart](#-quickstart)
- [Authentication](#-authentication)
- [Resource Reference](#-resource-reference)
- [Error Handling](#-error-handling)
- [Pagination](#-pagination)
- [Webhook Signatures](#-webhook-signatures)
- [Retries, Timeouts and Rate Limits](#-retries-timeouts-and-rate-limits)
- [Diagnostics](#-diagnostics)
- [Migrating from twilio-node](#-migrating-from-twilio-node)
- [Development](#-development)
- [API Documentation](#-api-documentation)
- [Contributors](#-contributors)
- [Sponsors](#-sponsors)
- [License](#-license)

## ✨ Features

### 🛡️ Strongly Typed End-to-End
- **333 of 333 API operations** covered, with typed request parameters and response models. A spec-driven contract test checks every method against the published OpenAPI document (method, path, host, auth and parameter names).
- **Nullable where the API is nullable.** Response fields the spec marks nullable are typed `T | null`; fields the server may omit are optional. Response enums are open (`'queued' | 'ringing' | … | (string & {})`), so a value added server-side never breaks your code.
- **Twilio-compatible wire format** — `account_sid`, `from`, `to`, status callbacks and the paginated list envelopes use the field names Twilio's API documents.

### ⚡ Modern Runtime
- Built on the standard **global `fetch`**. No `node-fetch`, no `axios`, **zero runtime dependencies**.
- **Dual package** — ESM (`import`) and CommonJS (`require`), each with matching type declarations.
- Runs on **Node.js 20+** (CI tests 20, 22 and 24). The SDK uses only web-standard APIs (`fetch`, `URL`, `TextEncoder`, `AbortController`), so Deno and Bun can run it too, though CI does not cover them.

### 🔁 Production-Grade Transport
- **Safe automatic retries** — reads retry on 429 / 5xx / network errors; creates and updates are never replayed after the server may have acted on them ([details](#-retries-timeouts-and-rate-limits)).
- **`Retry-After`** honoured in seconds or as an HTTP date, capped at 60 s.
- **Per-attempt timeout** (`timeoutMs`) that covers the response body, not just the headers.
- **Credentials stay private** — the API key never appears in `console.log`, `util.inspect` or `JSON.stringify` output.
- **Structured errors** — `RateLimitError`, `AuthenticationError`, `NotFoundError`, … all subclass `ApiError`; network failures raise `APIConnectionError` / `APITimeoutError` with the underlying `cause`.

## 🚀 Installation

```bash
npm install @voicetel.com/voiceml
# or
pnpm add @voicetel.com/voiceml
# or
yarn add @voicetel.com/voiceml
```

Requires Node.js 20 or later. Both `import` and `require` work:

```js
const { Client } = require('@voicetel.com/voiceml');
```

## 🏁 Quickstart

```ts
import { Client } from '@voicetel.com/voiceml';

const client = new Client({
  accountSid: process.env.VOICEML_ACCOUNT_SID,
  apiKey: process.env.VOICEML_API_KEY,
});

const call = await client.calls.create({
  To: '+14155550100',
  From: '+14155550101',
  Url: 'https://example.com/twiml',
  MachineDetection: 'DetectMessageEnd',
});
console.log(call.sid, call.status);

// Send an MMS: Body and/or MediaUrl.
await client.messages.create({
  To: '+14155550100',
  From: '+14155550101',
  Body: 'Your order has shipped',
  MediaUrl: ['https://example.com/label.png'],
});

// Walk every completed call, page by page, lazily.
for await (const completed of client.calls.iterate({ Status: 'completed', PageSize: 200 })) {
  console.log(completed.sid, completed.duration);
}
```

## 🔑 Authentication

VoiceML authenticates with **HTTP Basic**: your **AccountSid** is the username and your **VoiceML API key** is the password — the same header positions Twilio's SDKs use. Credentials issued by Twilio do **not** work against VoiceML; use the AccountSid and API key from your VoiceML account.

```ts
import { Client } from '@voicetel.com/voiceml';

const client = new Client({ accountSid: 'ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', apiKey: 'your-api-key' });

// `authToken` is accepted as an alias for `apiKey`.
const sameClient = new Client({ accountSid: 'ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', authToken: 'your-api-key' });

const account = await client.accounts.fetch();
console.log(account.friendly_name, sameClient.accountSid);
```

The key is held in a private field: logging or serialising a client prints `[redacted]` in its place. The response of `accounts.rotateKey()` treats its new `api_key` the same way — readable through direct property access, skipped by `console.log` / `JSON.stringify`:

```ts
import { Client } from '@voicetel.com/voiceml';

const client = new Client({ accountSid: 'ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', apiKey: 'your-api-key' });

// Rotate the API key. The new key is returned exactly once — store it right
// away; the previous key stops working immediately.
const rotated = await client.accounts.rotateKey();
console.log(rotated.sid); // persist rotated.api_key now
```

> Don't have credentials yet? See **[voicetel.com/docs/api/v0.9/voiceml/](https://voicetel.com/docs/api/v0.9/voiceml/)** for issuance and rotation.

## 🗺️ Resource Reference

| Resource | Field on `Client` | Operations |
|---|---|---|
| Account | `accounts`, `balance` | fetch / update the account; rotate the API key (`rotateKey`); fetch the balance |
| Calls | `calls` | create, fetch, list / iterate, update, delete; per-call recordings (start, pause / resume / stop, fetch, delete), Media Streams (start / stop), SIPREC (start / stop), real-time transcriptions (start / stop), `<Pay>` sessions, notifications, events, user-defined messages |
| Conferences | `conferences` | list / iterate, fetch, end; participants (add, fetch, list, mute / hold, kick); recordings (start, list, fetch, update, delete) |
| Queues | `queues` | create, list / iterate, fetch, update, delete; members (list, peek, dequeue front or a specific call) |
| Applications | `applications` | create, list / iterate, fetch, update, delete |
| Recordings | `recordings` | list / iterate, fetch, delete, audio download (`getAudio`), transcriptions of a recording (list, fetch, delete) |
| Transcriptions | `transcriptions` | account-wide recording transcriptions: list / iterate, fetch, delete |
| Messages | `messages` | SMS / MMS create, fetch, list / iterate, update (redact / cancel), delete, delivery feedback (`createFeedback`); media (list, fetch, delete) |
| Messaging Services | `messagingV1.services` | create, list, fetch, update, delete; sender pool via `phoneNumbers(serviceSid)` (list, add, fetch, remove) |
| Phone numbers | `incomingPhoneNumbers` | list / iterate (with `FriendlyName` / `Beta` / `Origin` filters), create, fetch, update (voice + SMS webhooks), delete, and the `Local` / `Mobile` / `TollFree` variants |
| Caller IDs | `outgoingCallerIds` | verify (create), list / iterate, fetch, update, delete |
| Notifications | `notifications` | list / iterate, fetch |
| Monitor alerts | `monitorAlerts` | list / iterate (with `LogLevel` / `StartDate` / `EndDate` filters), fetch — failure events across calls and messaging |
| Usage | `usageRecords` | list / iterate, plus `listAllTime`, `listDaily`, `listLastMonth`, `listMonthly`, `listThisMonth`, `listToday`, `listYearly`, `listYesterday` |
| Exports | `exports` | list daily event-log archives; download one (`download('2026-09-30')`) |
| SIP | `sip` | domains, credential lists + credentials, IP access-control lists + addresses, domain mappings, live registrations |
| Voice v1 | `voiceV1` | IP records, source-IP mappings, BYOC trunks, connection policies + targets, dialing-permission settings |
| Routes v2 | `routesV2` | inbound processing region for SIP domains and phone numbers |
| Pricing | `pricing` | voice, messaging, phone-number and trunking prices (`v1`, `v2`) |
| Conversations | `conversationsV1` | conversations, messages, receipts, participants, webhooks, roles, users, credentials, configuration, address configuration, services (and everything scoped under a service) |
| Assistants | `assistantsV1` | assistants, tools, knowledge (+ status, chunks), sessions + messages, feedback, policies |
| Diagnostics | `diagnostics` | `/health`, OpenAPI document (`openapiJson`, `openapiYaml`, `openapiYml`) |

Every request and response shape is exported from the package:

```ts
import {
  Client,
  type CreateCallRequest,
  type CreatePaymentParams,
} from '@voicetel.com/voiceml';

const client = new Client({ accountSid: 'ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', apiKey: 'your-api-key' });

const callParams: CreateCallRequest = {
  To: '+14155550100',
  From: '+14155550101',
  Url: 'https://example.com/twiml',
};
const call = await client.calls.create(callParams);

// On a live call, open a <Pay> session:
const payment: CreatePaymentParams = {
  IdempotencyKey: 'order-482917',
  StatusCallback: 'https://example.com/pay-status',
};
if (call.sid) {
  const session = await client.calls.startPayment(call.sid, payment);
  console.log(session.sid, session.date_created);
}
```

### Product hosts

Most resources answer on the default host (`voiceml.voicetel.com`), but two products have their own:

| Product | Host | Client option |
|---|---|---|
| Conversations (`client.conversationsV1`) | `conversations.voicetel.com` | `conversationsBaseUrl` |
| Messaging Service (`client.messagingV1`) | `messaging.voicetel.com` | `messagingBaseUrl` |

The host is what distinguishes a Messaging Service (`MG…`) from a Conversation Service (`IS…`) — they share the `/v1/Services` path. Hosts are derived from `baseUrl`: a `voiceml.*.voicetel.com` base swaps the `voiceml` label per product, while any other base URL (a self-hosted instance) keeps every product on that single host. Override them explicitly when needed:

```ts
import { Client } from '@voicetel.com/voiceml';

const client = new Client({
  accountSid: 'ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  apiKey: 'your-api-key',
  baseUrl: 'https://pbx.example.com',
  messagingBaseUrl: 'https://msg.example.com',
});
console.log(client.baseUrl);
```

## 🚨 Error Handling

Every non-2xx response raises a subclass of `ApiError`, keyed off the HTTP status:

| Status | Error |
|--------|-------|
| 400 | `BadRequestError` |
| 401 | `AuthenticationError` |
| 403 | `PermissionDeniedError` |
| 404 | `NotFoundError` |
| 405 | `MethodNotAllowedError` |
| 409 | `ConflictError` |
| 410 | `GoneError` |
| 429 | `RateLimitError` |
| 501 | `NotImplementedAPIError` |
| other 5xx | `ServerError` |
| other | `ApiError` |
| no response | `APIConnectionError` (`APITimeoutError` when `timeoutMs` elapsed) |

The Twilio-compatible error body (`code`, `message`, `more_info`, `status`) is parsed into `error.code` (a number), `error.message` and `error.moreInfo`, with the raw payload on `error.body`. `error.retryAfter` carries the server's `Retry-After` in seconds, when it sent one. Invalid arguments and configuration raise `ConfigurationError` before any request is made.

```ts
import { Client, APIConnectionError, NotFoundError, RateLimitError } from '@voicetel.com/voiceml';

const client = new Client({ accountSid: 'ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', apiKey: 'your-api-key' });

try {
  const call = await client.calls.get('CA0123456789abcdef0123456789abcdef');
  console.log(call.status);
} catch (err) {
  if (err instanceof NotFoundError) {
    console.log("That call isn't on your account.");
  } else if (err instanceof RateLimitError) {
    console.log(`Slow down — retry in ${err.retryAfter ?? '?'}s`);
  } else if (err instanceof APIConnectionError) {
    console.log('Network problem:', err.cause);
  } else {
    throw err;
  }
}
```

## 📄 Pagination

`/2010-04-01` list operations return a Twilio-compatible envelope: the items plus `page`, `page_size`, `start`, `end`, `first_page_uri`, `previous_page_uri`, `next_page_uri` and `uri`. The next page is reached by following `next_page_uri` exactly as the server sent it — it carries the `PageToken` the server needs. It is `null` on the last page. The `/v1` and `/v2` lists carry the same information in a `meta` object (`meta.next_page_url`).

```ts
import { Client, type CallList } from '@voicetel.com/voiceml';

const client = new Client({ accountSid: 'ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', apiKey: 'your-api-key' });

// iterate(): lazily yields items across every page.
for await (const message of client.messages.iterate({ From: '+14155550101', PageSize: 200 })) {
  console.log(message.sid, message.status);
}

// paginate(): the same for any list method, including the /v1 lists.
const first = await client.conversationsV1.conversations.list({ PageSize: 50 });
for await (const conversation of client.paginate(first)) {
  console.log(conversation.sid);
}

// nextPage(): one page at a time; resolves to null on the last page.
let page: CallList | null = await client.calls.list({ PageSize: 100 });
while (page) {
  console.log(page.calls.length);
  page = await client.nextPage(page);
}
```

Iteration stops as soon as you `break`; no further pages are requested. A next-page link pointing anywhere other than the configured product host raises `PaginationError` and is never followed.

## 🔏 Webhook Signatures

VoiceML signs every webhook it sends with your account's API key, in the `X-Twilio-Signature` header: the full webhook URL (any `#fragment` removed), followed for POSTs by every form parameter as `key` + `value` in sorted key order, HMAC-SHA1'd with your API key and Base64-encoded. `validateRequest` checks it in constant time and also accepts the URL with the default port (`:443` / `:80`) added or removed:

```ts
import { RequestValidator, validateRequest } from '@voicetel.com/voiceml';

// In your webhook handler: the full URL VoiceML called, the form body, and the header value.
export function isFromVoiceML(url: string, form: URLSearchParams, signature: string): boolean {
  return validateRequest(process.env.VOICEML_API_KEY ?? '', signature, url, form);
}

// Or bind the key once:
const validator = new RequestValidator(process.env.VOICEML_API_KEY ?? '');
const ok = validator.validate(
  'https://example.com/voice/answer?CallSid=CA0123456789abcdef0123456789abcdef',
  undefined, // GET webhooks sign the URL only
  'signature-from-header',
);
console.log(ok);
```

Pass the form body as a `URLSearchParams` (or `[key, value]` pairs) so repeated keys keep the order they arrived in. `computeSignature(apiKey, url, params)` returns the expected header value.

## 🔁 Retries, Timeouts and Rate Limits

| Request | Retried on |
|---|---|
| `GET`, `PUT`, `DELETE` | 429, 500, 502, 503, 504, network errors and timeouts |
| `POST`, `PATCH` | 429, and connection failures where the request never left the client (DNS failure, connection refused, connect timeout, TLS handshake failure) |

A `POST` (placing a call, sending a message) is never retried after a 5xx, a read timeout or a dropped connection, because the server may already have acted on it. Retries back off exponentially with full jitter (0.5 s base, 8 s cap); a `Retry-After` header (seconds or HTTP date) is honoured up to 60 s — a longer wait raises the error immediately with `error.retryAfter` set. `timeoutMs` applies to each attempt and covers the whole response, body included.

```ts
import { Client } from '@voicetel.com/voiceml';

const client = new Client({
  accountSid: 'ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  apiKey: 'your-api-key',
  maxRetries: 4, // default 2
  timeoutMs: 60_000, // default 30 s
});
console.log(client.baseUrl);
```

Pass a custom `fetch` for tests or to route through a proxy. Recording audio and export downloads follow the redirect to storage themselves, dropping the `Authorization` header whenever the host or scheme changes and refusing `https` → `http` downgrades, so the custom `fetch` must support `redirect: 'manual'` (Node, Deno and Bun do):

```ts
import { Client } from '@voicetel.com/voiceml';

const myFetch: typeof fetch = (input, init) => fetch(input, init);
const client = new Client({ accountSid: 'ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', apiKey: 'your-api-key', fetch: myFetch });

const audio = await client.recordings.getAudio('RE0123456789abcdef0123456789abcdef');
console.log(audio.contentType, audio.body.byteLength);
```

## 🩺 Diagnostics

`/health` and the OpenAPI documents are unauthenticated. The SDK never sends credentials to them, and a client constructed without credentials can call them (every other method on such a client raises `ConfigurationError` without sending a request):

```ts
import { Client, ServerError } from '@voicetel.com/voiceml';

const probe = new Client({ timeoutMs: 5_000 });
try {
  const health = await probe.diagnostics.health();
  console.log('ok', health.warnings ?? []);
} catch (err) {
  if (err instanceof ServerError) console.log('unhealthy', err.body); // 503 with failing checks
}
const spec = await probe.diagnostics.openapiYaml();
console.log(spec.length);
```

## 🔁 Migrating from twilio-node

Swap the constructor and the credentials — VoiceML uses your VoiceML AccountSid and API key in the same HTTP Basic positions:

```diff
- import twilio from 'twilio';
- const client = twilio('AC…', '<twilio auth token>');
+ import { Client } from '@voicetel.com/voiceml';
+ const client = new Client({ accountSid: 'AC…', apiKey: '<VoiceML API key>' });
```

Method names follow the resource map above (`client.calls.create({…})`, `client.queues.list()`) rather than Twilio's nested `client.api.v2010.accounts(sid).calls.create({…})` chain; request parameter names (`To`, `From`, `StatusCallback`, …) and response field names are the ones the API documents.

## 🛠️ Development

```bash
git clone https://github.com/voicetel/voiceml-node-sdk
cd voiceml-node-sdk
npm ci

npm test               # unit + contract tests (no network)
npm run typecheck      # tsc --noEmit over src and tests
npm run lint           # eslint
npm run build          # ESM + CommonJS + .d.ts into dist/
npm run smoke          # pack, then require/import/type-check from scratch consumers
npm run check:package  # publint + are-the-types-wrong

# Optional response-shape conformance harness (needs a fixture corpus):
VOICEML_CONFORMANCE_FIXTURES=/path/to/fixtures npx vitest run tests/integration/conformance.test.ts
```

The contract tests load a copy of the public OpenAPI document from `tests/fixtures/` (test-only; it is not part of the published package).

## 📖 API Documentation

- **Reference docs:** [voicetel.com/docs/api/v0.9/voiceml/](https://voicetel.com/docs/api/v0.9/voiceml/)
- **Validator:** [voicetel.com/voiceml/validator/](https://voicetel.com/voiceml/validator/)
- **SDK catalogue:** [voicetel.com/docs/voiceml-sdks/](https://voicetel.com/docs/voiceml-sdks/)
- **Changelog:** [CHANGELOG.md](CHANGELOG.md)

## 🙌 Contributors

- [Michael Mavroudis](https://github.com/mavroudis) — Lead Developer

Contributions welcome. Open an issue describing the change you want to make, or send a pull request against `main`.

## 💖 Sponsors

| Sponsor | Contribution |
|---------|--------------|
| [VoiceTel Communications](https://voicetel.com) | Primary development and production hosting |

## 📄 License

MIT with the Commons Clause restriction. See [LICENSE](LICENSE) and [voicetel.com/legal/](https://voicetel.com/legal/).
