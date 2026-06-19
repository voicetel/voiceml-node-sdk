# 📞 VoiceML TypeScript SDK

The official TypeScript / Node client for the [VoiceML REST API](https://voicetel.com/docs/api/v0.8/voiceml/) — Twilio-compatible outbound voice and answering-machine-detection from VoiceTel, with end-to-end TypeScript types and dual ESM / CJS distribution.

![Version](https://img.shields.io/badge/version-0.8.1-blue)
![Node](https://img.shields.io/badge/node-%E2%89%A518.17-blue)
![License](https://img.shields.io/badge/license-MIT%20%2B%20Commons%20Clause-green)
![Tests](https://img.shields.io/badge/tests-65%20unit-brightgreen)
![Typed](https://img.shields.io/badge/typed-strict-blue)

## 📚 Table of Contents

- [Features](#-features)
- [Installation](#-installation)
- [Quickstart](#-quickstart)
- [Authentication](#-authentication)
- [Resource Reference](#-resource-reference)
- [Error Handling](#-error-handling)
- [Pagination](#-pagination)
- [Migration from twilio-node](#-migration-from-twilio-node)
- [Rate Limits](#-rate-limits)
- [Development](#-development)
- [API Documentation](#-api-documentation)
- [Contributors](#-contributors)
- [Sponsors](#-sponsors)
- [License](#-license)

## ✨ Features

### 🛡️ Strongly Typed End-to-End
- **TypeScript interfaces** for every one of the 81 API operations — request params, response payloads, and entity shapes.
- **Strict mode-friendly.** Authored against `strict` TypeScript; consumers get full inference and red squigglies on shape drift.
- **Autocomplete everywhere.** Your IDE knows the shape of every field — `Call.sid`, `Recording.duration`, `Queue.current_size` are all typed.
- **Twilio-compatible wire shapes** — `account_sid`, `from_number`, `to_number`, status callbacks, pagination envelopes — match what Twilio's Programmable Voice API documents.

### ⚡ Modern Runtime
- Built on the standard **global `fetch`** API. No `node-fetch`, no `axios`, no third-party HTTP dependency.
- **Dual package** — ships ESM (`import`) and CJS (`require`) with `.d.ts` declarations in one tarball.
- Runs on **Node.js 18.17+**; works in Deno, Bun, and modern runtimes that ship `fetch`.

### 🔁 Production-Grade Transport
- **Automatic retry** with exponential backoff on 429 / 5xx — honors `Retry-After` headers.
- **Configurable timeout** per client (`timeoutMs`) — backed by an internal `AbortController`.
- **HTTP Basic auth** with `AccountSid:ApiKey` — exactly what the Twilio SDK uses, so existing credentials work unchanged.
- **Pluggable `fetch`.** Swap in a mock for tests or a proxying `fetch` for outbound network policy.
- **Structured exception hierarchy** — `RateLimitError`, `AuthenticationError`, `NotFoundError`, etc. all subclasses of `ApiError` you can catch broadly or narrowly.

### 📞 Complete API Coverage
- **Calls** — originate, fetch, terminate, update + per-call recordings, streams, siprec, transcriptions, notifications, events, user-defined messages, and the `/Calls/{sid}/Payments` lifecycle (Pay TwiML companion).
- **Conferences** — list, fetch, end conferences, plus participants (mute / hold / kick) and conference-scoped recordings.
- **Queues** — create, list, update, delete, peek, dequeue (front or specific member).
- **Applications** — CRUD on stored TwiML + callback bundles.
- **Recordings** — account-wide list, metadata fetch, audio fetch (follows S3 redirect), delete.
- **Messages** — create, fetch, list (To/From/DateSent filters + pagination), update (Body redaction; Status=canceled), delete.
- **IncomingPhoneNumbers** — list, fetch, update.
- **Notifications** — fetch, list.
- **SIP** — SIP Trunking: Domains (CRUD), CredentialLists + Credentials (CRUD), IpAccessControlLists + IpAddresses (CRUD), Domain↔ACL/CredentialList mappings (historical, Auth/Calls, Auth/Registrations namespaces).
- **Routes V2** — Twilio Inbound Processing Region API: `client.routesV2.sipDomains.fetch(name)` / `update(name, { VoiceRegion, FriendlyName })`.
- **Diagnostics** — `/health` deep probe, OpenAPI spec.

### 🧪 Tested
- **84 unit tests** with a mocked transport (`vitest` + fetch stub) — request shapes, response parsing, error mapping, retry behavior, and pagination iterators all covered.
- **Structural conformance harness** in `tests/integration/conformance.test.ts` validates SDK interfaces against canonical Twilio response fixtures — opt-in via `VOICEML_CONFORMANCE_FIXTURES`, so CI stays fast.

### 📦 Clean Distribution
- Zero codegen footprint — every byte hand-written.
- Built with `tsc`; ships ESM + CJS + `.d.ts` declarations.
- **Zero runtime dependencies.**

## 🚀 Installation

```bash
npm install @voicetel.com/voiceml
# or
pnpm add @voicetel.com/voiceml
# or
yarn add @voicetel.com/voiceml
```

Requires Node.js 18.17 or later (for the global `fetch` API). Both ESM and CJS entrypoints ship in the package; TypeScript declarations are included.

## 🏁 Quickstart

```ts
import { Client } from '@voicetel.com/voiceml';

const c = new Client({ accountSid: 'AC…', apiKey: '…' });

const call = await c.calls.create({
  To: '+18005551234',
  From: '+18005550000',
  Url: 'https://example.com/twiml',
  MachineDetection: 'DetectMessageEnd',
});
console.log(call.sid, call.status);

// Stream every completed call across all pages
for await (const completed of c.calls.iterate({ Status: 'completed', PageSize: 200 })) {
  console.log(completed.sid, completed.duration);
}
```

## 🔑 Authentication

Every endpoint uses **HTTP Basic** with your `AccountSid` as the username and your per-tenant API key as the password — identical to Twilio's auth shape, so credentials issued for Twilio code work here unchanged.

```ts
import { Client } from '@voicetel.com/voiceml';

const c = new Client({ accountSid: 'AC…', apiKey: '…' });
const health = await c.diagnostics.health(); // uses your AccountSid + key on every call
```

> Don't have credentials yet? See **[voicetel.com/docs/api/v0.8/voiceml/](https://voicetel.com/docs/api/v0.8/voiceml/)** for issuance and rotation.

## 🗺️ Resource Reference

| Resource | Field on Client | Covers |
|---|---|---|
| Calls | `client.calls` | originate, fetch, list, terminate, update + per-call recordings, streams, siprec, transcriptions, notifications, events, user-defined messages, payments |
| Conferences | `client.conferences` | list, fetch, end, participants (mute / hold / kick), conference-scoped recordings |
| Queues | `client.queues` | create, list, update, delete, peek, dequeue (front or specific member) |
| Applications | `client.applications` | CRUD on TwiML + callback bundles |
| Recordings | `client.recordings` | account-wide list, metadata, audio fetch (follows S3 redirect), delete |
| Messages | `client.messages` | create, fetch, list, update, delete (To/From/DateSent filters; Body redaction; Status=canceled) |
| IncomingPhoneNumbers | `client.incomingPhoneNumbers` | list, fetch, update |
| Notifications | `client.notifications` | fetch, list |
| Diagnostics | `client.diagnostics` | `/health`, OpenAPI spec |

All request and response shapes are exported from the package — destructure what you need:

```ts
import {
  Client,
  type CreateCallParams,
  type CreatePaymentParams,
} from '@voicetel.com/voiceml';

const c = new Client({ accountSid: 'AC…', apiKey: '…' });

const callParams: CreateCallParams = {
  To: '+18005551234',
  From: '+18005550000',
  Url: 'https://example.com/twiml',
};
const call = await c.calls.create(callParams);

// On a live call, open a Pay session:
const payment: CreatePaymentParams = {
  IdempotencyKey: 'order-482917',
  StatusCallback: 'https://example.com/pay-status',
};
const session = await c.calls.startPayment(call.sid, payment);
console.log(session.sid, session.status);
```

## 🚨 Error Handling

Every non-2xx response raises a subclass of `ApiError`, keyed off HTTP status:

| Status | Exception |
|--------|-----------|
| 400 | `BadRequestError` |
| 401 | `AuthenticationError` |
| 403 | `PermissionDeniedError` |
| 404 | `NotFoundError` |
| 409 | `ConflictError` |
| 410 | `GoneError` |
| 429 | `RateLimitError` |
| 501 | `NotImplementedAPIError` |
| 5xx | `ServerError` |
| other | `ApiError` |

```ts
import { Client, NotFoundError, RateLimitError } from '@voicetel.com/voiceml';

const c = new Client({ accountSid: 'AC…', apiKey: '…' });

try {
  const call = await c.calls.get('CA0000000000000000000000000000aaaa');
} catch (err) {
  if (err instanceof NotFoundError) {
    console.log("That call isn't on your account.");
  } else if (err instanceof RateLimitError) {
    const retryAfter = (err.body as { retry_after?: number })?.retry_after ?? '?';
    console.log(`Slow down — retry in ${retryAfter}s`);
  } else {
    throw err;
  }
}
```

The Twilio-compatible error body (`code`, `message`, `more_info`, `status`) is parsed into `error.code` / `error.message` with the raw payload on `error.body`.

## 📄 Pagination

List operations return a `…List` interface with a Twilio-compatible pagination envelope (`page`, `page_size`, `total`, `next_page_uri`, `previous_page_uri`, …). For resources that support it, use the `iterate()` async generator to walk every page transparently:

```ts
for await (const call of c.calls.iterate({ Status: 'completed', PageSize: 200 })) {
  process(call);
}

for await (const msg of c.messages.iterate({ From: '+18005550000', PageSize: 200 })) {
  archive(msg);
}
```

`iterate()` is available on `calls`, `conferences`, `queues`, `recordings`, and `messages`. For other resources, page manually with `client.<resource>.list({ Page: n })`.

## 🔁 Migration from twilio-node

The `accountSid` + `apiKey` pair Twilio's Node SDK validates in its constructor works unchanged here:

```ts
// Before — Twilio
import twilio from 'twilio';
const client = twilio('AC…', '<auth_token>');

// After — VoiceML (Twilio-compatible)
import { Client } from '@voicetel.com/voiceml';
const client = new Client({ accountSid: 'AC…', apiKey: '<api_key>' });
```

Method names follow the resource map above (`client.calls.create({…})`, `client.queues.list()`) rather than Twilio's nested `client.api.v2010.accounts(sid).calls.create({…})` chain — flatter, fewer keystrokes, same wire format on the way out.

## ⏱️ Rate Limits

VoiceML applies per-tenant rate limits at the edge. The SDK automatically retries 429 responses with `Retry-After` honored, up to `maxRetries` (default `2`). To bump it:

```ts
new Client({
  accountSid: 'AC…',
  apiKey: '…',
  maxRetries: 4,
  timeoutMs: 60_000,
});
```

Pass a custom `fetch` for tests or to route through an HTTP proxy:

```ts
new Client({ accountSid: 'AC…', apiKey: '…', fetch: myFetch });
```

## 🛠️ Development

```bash
git clone https://github.com/voicetel/voiceml-node-sdk
cd voiceml-node-sdk
npm install

# Unit tests (fast, no network)
npm test

# Type check
npm run typecheck

# Lint
npm run lint

# Build ESM + CJS + .d.ts
npm run build

# Conformance harness (opt-in; needs callBroadcast fixture corpus)
VOICEML_CONFORMANCE_FIXTURES=/path/to/twilio-conformance-fixtures/fixtures \
  npx vitest run tests/integration/conformance.test.ts
```

## 📖 API Documentation

- **Reference docs:** [voicetel.com/docs/api/v0.8/voiceml/](https://voicetel.com/docs/api/v0.8/voiceml/)
- **Validator:** [voicetel.com/voiceml/validator/](https://voicetel.com/voiceml/validator/)
- **SDK catalogue:** [voicetel.com/docs/voiceml-sdks/](https://voicetel.com/docs/voiceml-sdks/)
- **Type definitions:** every wire shape is exported from `@voicetel.com/voiceml` — `import { type Call, type Message, type Queue } from '@voicetel.com/voiceml'`.

## 🙌 Contributors

- [Michael Mavroudis](https://github.com/mavroudis) — Lead Developer

Contributions welcome. Open an issue describing the change you want to make, or send a pull request against `main`.

## 💖 Sponsors

| Sponsor | Contribution |
|---------|--------------|
| [VoiceTel Communications](https://voicetel.com) | Primary development and production hosting |

## 📄 License

MIT with the Commons Clause restriction. See [LICENSE](LICENSE) and [voicetel.com/legal/](https://voicetel.com/legal/).
