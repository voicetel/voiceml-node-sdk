# voiceml

Official TypeScript/Node SDK for the [VoiceML](https://voicetel.com/docs/api/v0.6/voiceml/) REST API — VoiceTel's outbound voice + AMD service with a Twilio-compatible REST surface.

Wire format, auth model (HTTP Basic with `AccountSid` as username, per-tenant API key as password), error codes, and pagination envelope all match Twilio's documented Programmable Voice surface. If you've used `twilio-node`, the patterns here will feel familiar.

## Install

```bash
npm install voiceml
```

Requires Node 18.17+ (for global `fetch`). Both ESM and CJS are shipped; TypeScript types included.

## Quickstart

```ts
import { Client } from 'voiceml';

const c = new Client({ accountSid: 'AC…', apiKey: '…' });

const call = await c.calls.create({
  To: '+18005551234',
  From: '+18005550000',
  Url: 'https://example.com/twiml',
  MachineDetection: 'DetectMessageEnd',
});
console.log(call.sid, call.status);

for await (const c2 of c.calls.iterate({ Status: 'completed', PageSize: 200 })) {
  console.log(c2.sid, c2.duration);
}
```

## Resources

| Group | Path | Covers |
| --- | --- | --- |
| `client.calls` | `/Calls` | originate, fetch, terminate, update + per-call recordings, streams, siprec, transcriptions, notifications, events, user-defined messages |
| `client.conferences` | `/Conferences` | list/fetch/end conferences, participants (mute/hold/kick), conference-scoped recordings |
| `client.queues` | `/Queues` | create/list/update/delete queues, peek, dequeue (front or specific member) |
| `client.applications` | `/Applications` | CRUD on stored TwiML+callback bundles |
| `client.recordings` | `/Recordings` | account-wide list, metadata fetch, audio fetch (follows S3 redirect), delete |
| `client.diagnostics` | `/health`, `/openapi.json` | deep liveness probe; live spec fetch |

## Errors

Every non-2xx response raises a subclass of `ApiError`, keyed off HTTP status:

| Status | Exception |
| --- | --- |
| 400 | `BadRequestError` |
| 401 | `AuthenticationError` |
| 403 | `PermissionDeniedError` |
| 404 | `NotFoundError` |
| 409 | `ConflictError` |
| 410 | `GoneError` |
| 429 | `RateLimitError` |
| 501 | `NotImplementedAPIError` |
| 5xx | `ServerError` |

`ApiError` is the catch-all base. The Twilio-compatible body (`code`, `message`, `more_info`, `status`) is parsed into `error.code` / `error.message` with the raw payload on `error.body`.

## Twilio drop-in

The same `accountSid` + `apiKey` pair the Twilio Node SDK uses works here. Migration:

```ts
// Before
import twilio from 'twilio';
const client = twilio('AC…', '<auth_token>');

// After — point at VoiceML
import { Client } from 'voiceml';
const client = new Client({ accountSid: 'AC…', apiKey: '<api_key>' });
```

Method names follow the table above (`client.calls.create({…})`, `client.queues.list()`) rather than Twilio's nested `client.api.v2010.accounts(sid).calls.create({…})` chain.

## Pagination

List operations return a `…List` interface with a Twilio-compatible pagination envelope (`page`, `page_size`, `total`, `next_page_uri`, `previous_page_uri`, …). For `/Calls`, use `iterate()` for cursor-style streaming:

```ts
for await (const call of c.calls.iterate({ Status: 'completed' })) {
  process(call);
}
```

For other resources, page manually with `client.<resource>.list({ Page: n })`.

## Retries + timeouts

The transport retries 429/5xx and transport errors up to `maxRetries` times (default 2) with exponential backoff. `Retry-After` is honored. Override:

```ts
new Client({ accountSid: 'AC…', apiKey: '…', maxRetries: 5, timeoutMs: 10_000 });
```

Pass a custom `fetch` for tests or to route through an HTTP proxy:

```ts
new Client({ accountSid: 'AC…', apiKey: '…', fetch: myFetch });
```

## Development

```bash
npm install
npm test
npm run typecheck
npm run build
```

## 📖 API Documentation

- **Reference docs:** [voicetel.com/docs/api/v0.6/voiceml/](https://voicetel.com/docs/api/v0.6/voiceml/)
- **Validator:** [voicetel.com/voiceml/validator/](https://voicetel.com/voiceml/validator/)
- **SDK catalogue:** [voicetel.com/docs/voiceml-sdks/](https://voicetel.com/docs/voiceml-sdks/)

## License

MIT with the Commons Clause restriction. See [LICENSE](LICENSE) and [voicetel.com/legal/](https://voicetel.com/legal/).
