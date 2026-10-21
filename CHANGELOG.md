# Changelog

All notable changes to `@voicetel.com/voiceml` are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.9.5] - 2026-10-21

### Added

- **Calls** — `CreateCallRequest` (`POST …/Calls.json`) accepts `TimeLimit`,
  the maximum call duration in seconds. An explicit `0` or a value above
  `14400` is rejected (error 13216); a negative value disables the limit.
  Omitted, the 4-hour default cap applies.
- **Conferences** — `CreateParticipantRequest`
  (`POST …/Conferences/{ConferenceSid}/Participants.json`) accepts
  `ConferenceStatusCallback`, `ConferenceStatusCallbackMethod` and
  `ConferenceStatusCallbackEvent`: the participant's conference lifecycle
  webhook, its HTTP method (`GET`/`POST`, default `POST`) and the event
  filter (default `start end`).
- **Conference recordings** — `UpdateConferenceRecordingRequest`
  (`POST …/Conferences/{ConferenceSid}/Recordings/{Sid}.json`) accepts
  `PauseBehavior`: with `Status=paused`, `skip` leaves the paused span out
  of the recording while `silence` (the default) keeps it as silence.
  Mirrors the call recording update.
- **Applications** — create and update (`POST …/Applications.json`,
  `POST …/Applications/{Sid}.json`) accept `SmsUrl` / `SmsMethod` and
  `SmsFallbackUrl` / `SmsFallbackMethod` (the inbound-SMS webhook and its
  fallback) plus `PublicApplicationConnectEnabled`.
- **Messages** — `CreateMessageRequest` (`POST …/Messages.json`) accepts
  `SendAt` (a `Date`, sent as ISO-8601 UTC) and `ScheduleType` (`'fixed'`
  is the only supported value) to schedule a message for future delivery.
  Both require `MessagingServiceSid` server-side.
- **Call transcriptions** — `StartTranscriptionRequest`
  (`POST …/Calls/{CallSid}/Transcriptions.json`) accepts `SpeechModel`
  (engine-specific model hint, e.g. Deepgram's `nova-3`),
  `EnableAutomaticPunctuation` and `IntelligenceService` (accepted for
  compatibility; a set value logs a 32655 Notification and the
  transcription proceeds).
- The vendored OpenAPI fixture behind the contract tests is refreshed to
  spec 0.9.4.

### Changed

- **Call transcriptions** — `StartTranscriptionRequest.StatusCallback` is
  renamed `StatusCallbackUrl`. The old wire name was never applied
  server-side; `StatusCallbackMethod` and `StatusCallbackEvents` are
  unchanged.

## [0.9.4] - 2026-10-21

### Added

- **Incoming phone numbers** — `CreateIncomingPhoneNumberRequest` and
  `UpdateIncomingPhoneNumberRequest` (create / update on
  `…/IncomingPhoneNumbers.json`) accept `VoiceApplicationSid` (binds inbound
  calls to an Application; it wins over the `Voice*` URLs), `StatusCallback`
  and `StatusCallbackMethod` (number-level lifecycle webhook for inbound
  calls).
- **Outgoing caller IDs** — `CreateOutgoingCallerIdRequest`
  (`POST …/OutgoingCallerIds.json` verification) accepts `CallDelay` (seconds
  to wait before placing the verification call, 0–60), `Extension` (digits to
  dial after the verification call connects), `StatusCallback` and
  `StatusCallbackMethod` (verification-call status updates).
- The vendored OpenAPI fixture behind the contract tests is refreshed to spec
  0.9.3.

## [0.9.3] - 2026-10-18

### Breaking changes

- **Removed six methods for endpoints the API no longer serves.** The server answers these with
  HTTP 405 / code 20004:
  - `calls.listStreams()` — `GET /2010-04-01/Accounts/{AccountSid}/Calls/{CallSid}/Streams.json`
  - `calls.getStream()` — `GET /2010-04-01/Accounts/{AccountSid}/Calls/{CallSid}/Streams/{Sid}.json`
  - `calls.listSiprec()` — `GET /2010-04-01/Accounts/{AccountSid}/Calls/{CallSid}/Siprec.json`
  - `calls.getSiprec()` — `GET /2010-04-01/Accounts/{AccountSid}/Calls/{CallSid}/Siprec/{Sid}.json`
  - `calls.listTranscriptions()` — `GET /2010-04-01/Accounts/{AccountSid}/Calls/{CallSid}/Transcriptions.json`
  - `calls.getTranscription()` — `GET /2010-04-01/Accounts/{AccountSid}/Calls/{CallSid}/Transcriptions/{Sid}.json`

  The start / stop methods (`startStream`, `stopStream`, `startSiprec`, `stopSiprec`,
  `startTranscription`, `stopTranscription`) are unchanged. The `StreamList` and `SiprecList`
  types are removed, and `TranscriptionList` now describes the recording-transcription lists
  (`GET …/Transcriptions.json`, `GET …/Recordings/{RecordingSid}/Transcriptions.json`).
- **`iterate()` follows `next_page_uri`.** It no longer increments `Page`; it requests the
  server's `next_page_uri` verbatim (which carries the `PageToken`) and stops when it is null,
  empty or absent. Iteration is lazy and stops requesting pages when the loop exits.
- **List envelopes no longer declare `total` or `num_pages`** (the API stopped sending them).
  They now declare `start`, `end`, `first_page_uri`, `previous_page_uri` and `next_page_uri`.
  `RecordingList` now requires `page` / `page_size` like the other envelopes.
- **`GET /2010-04-01/Accounts/{AccountSid}/Calls.json`:** `calls.list()` / `calls.iterate()` no
  longer accept `startTimeGte` / `startTimeLte` (sent as the non-spec `StartTime>=` /
  `StartTime<=`). Use `startTimeGt` / `startTimeLt` (`StartTime>` / `StartTime<`).
- **`POST …/IncomingPhoneNumbers/Local.json`, `…/Mobile.json`, `…/TollFree.json`:**
  `createLocal()` / `createMobile()` / `createTollFree()` take the new
  `CreateTypedIncomingPhoneNumberRequest` (`PhoneNumber`, `VoiceUrl`, `VoiceMethod`); they no
  longer accept `VoiceFallbackUrl` / `VoiceFallbackMethod`, which those endpoints do not define.
- **`POST …/Calls/{CallSid}/UserDefinedMessages.json`:** `calls.sendUserDefinedMessage(callSid)`
  no longer takes a payload argument (the endpoint defines no body).
- **`POST …/Calls/{CallSid}/Recordings/{Sid}.json`** takes `UpdateCallRecordingRequest`
  (`Status`, `PauseBehavior`); **`POST …/Conferences/{ConferenceSid}/Recordings/{Sid}.json`**
  takes `UpdateConferenceRecordingRequest` (`Status`). `UpdateRecordingRequest` remains as a
  deprecated alias of the latter.
- **`POST …/Calls/{CallSid}/Payments/{Sid}.json`:** `PaymentCapture` no longer includes the four
  `*-matcher` values the API does not accept.
- **`POST …/Messages.json`:** `CreateMessageRequest` requires `Body` or a non-empty `MediaUrl`
  (it is now a union type; `Body` alone remains valid).
- **Assistants v1 list parameters:** `GET /v1/Assistants/{id}/Tools`, `/v1/Assistants/{id}/Knowledge`,
  `/v1/Assistants/{id}/Feedbacks`, `/v1/Knowledge/{id}/Chunks`, `/v1/Sessions` and
  `/v1/Sessions/{id}/Messages` accept only `PageSize` (`ListAssistantsV1PageParams` lost `Page`
  and `PageToken`). `GET /v1/Assistants` takes the new `ListAssistantsV1AssistantsParams`.
- **Stricter request types.** List-parameter interfaces lost their `[key: string]: unknown` index
  signatures, so a misspelt key is a compile error. HTTP-method fields on SIP domain create /
  update (`VoiceMethod`, `VoiceFallbackMethod`, `VoiceStatusCallbackMethod`) and on
  `conferences.createParticipant` (`StatusCallbackMethod`) are typed `'GET' | 'POST'`.
  `RequestOptions.params` is typed `object`.
- **Event-mask request parameters are enum arrays.** The spec types them as list-valued form
  parameters, so `StatusCallbackEvent` (`CreateCallRequest`, `UpdateCallRequest`,
  `CreateParticipantRequest`, application create / update) is
  `('initiated' | 'ringing' | 'answered' | 'completed')[]` and `RecordingStatusCallbackEvent`
  (`CreateCallRequest`, recording starts) is `('in-progress' | 'completed' | 'absent')[]`,
  sent as repeated form keys.
- **Response models follow the spec's nullability.** Fields the spec marks nullable are typed
  `T | null` and fields the server may omit are optional (e.g. `Call.sid` is `string | null`,
  `IncomingPhoneNumber.capabilities` may be `null`). Response enums are open
  (`Open<'queued' | …>` accepts any string). `HealthStatus.warnings` is optional.
- **Typed notifications and call events.** `calls.getNotification()` and `notifications.get()`
  return `Notification` (was `Record<string, unknown>`); the lists are `NotificationList` and
  `CallEventList` (`NotificationsList` / `EventsList` remain as deprecated aliases).
- **Errors.** `ApiError.code` is `number | null` (was `number | string | null`). Network failures
  and timeouts raise `APIConnectionError` / `APITimeoutError` (both `ApiError` subclasses with
  `statusCode: 0` and the runtime error on `cause`) instead of a bare `ApiError`. HTTP 405 raises
  `MethodNotAllowedError`. A 2xx body that is not JSON raises an `ApiError` whose message starts
  "could not decode". `diagnostics.health()` raises `ServerError` on 503 (was a plain `Error`).
- **Retries.** `POST` / `PATCH` are no longer retried on 5xx, read timeouts or connection resets —
  only on 429 and on connection failures where the request never left the client.
- **`Transport.fetchBytes`** takes an options object (`{ path, accept, auth }`) and returns
  `{ status, body, headers, url, redirected }`.
- **Packaging.** `require` now resolves to `dist/cjs/index.js` (real CommonJS) with CommonJS
  declarations; ESM declarations live next to `dist/esm`. The `dist/types/` directory and the
  `dist/cjs/*.cjs` files are gone — deep imports of those paths must switch to the package root.
- **Node.js 20 or later is required** (`engines.node` was `>=18.17`). Node 18 reached end of
  life on 2025-04-30 and the toolchain can no longer test it; CI tests Node 20, 22 and 24.

### Fixed

- `require('@voicetel.com/voiceml')` threw `SyntaxError: Unexpected token 'export'` in every
  published version from 0.7.1 to 0.9.2: the CommonJS build was emitted as ESM. The build now
  produces real CommonJS, and TypeScript projects using `module: node16` with CommonJS resolve
  CommonJS-flavoured declarations.
- `recordings.getAudio()` sent no `Authorization` header, so it always failed with 401. It now
  authenticates to the API host, sends `Accept: audio/*, */*`, uses the client's `fetch`,
  timeout and retry policy, and follows the redirect to archived storage without credentials.
- Iteration could loop forever on Calls and Conferences and failed with 400 on page 2 of
  Messages and Recordings, because `Page` was incremented without the server's `PageToken`.
- `calls.create()`, `messages.create()` and every other `POST` could be replayed on a 5xx or a
  timeout, placing duplicate calls or sending duplicate messages.
- `timeoutMs` now covers reading the response body; a stalled body no longer hangs forever.
- `Retry-After` given as an HTTP date was ignored, and long values blocked for their full length.
  Both forms are parsed; waits over 60 s raise immediately with `error.retryAfter` set. Backoff
  uses full jitter. Discarded retry responses are drained.
- `client.diagnostics` used the global `fetch` with no timeout and ignored an injected `fetch`;
  it now goes through the client's transport (never with credentials).
- Caller-supplied path segments were interpolated raw: a `/`, `?` or `#` in an id could retarget
  the request. Every segment is now percent-encoded (RFC 3986 unreserved characters only), and
  empty / `.` / `..` segments are rejected.
- The `.json` suffix is derived from the route, so an id such as `Twilio.CURRENT` keeps it.
- `Date` values were serialised as local-time strings and plain objects as `[object Object]`.
  Dates are now ISO-8601 UTC (or the UTC day for date-only filters); objects are rejected, except
  the JSON-typed `Attributes`, `Parameter` and `Participant` fields, which are sent as compact
  JSON.
- Programming errors thrown by an injected `fetch` are no longer retried or re-wrapped.

### Added

- 40 operations, bringing coverage to all 333 operations in the published spec:
  - `accounts.fetch()` / `accounts.update()` (a concurrent update raises `ConflictError`),
    `balance.fetch()`
  - `outgoingCallerIds.list()` / `iterate()` / `create()` / `get()` / `update()` / `delete()`
  - `messages.listMedia()` / `getMedia()` / `deleteMedia()`
  - `exports.list()` / `exports.download(date)`
  - `transcriptions.list()` / `iterate()` / `get()` / `delete()`, and
    `recordings.listTranscriptions()` / `getTranscription()` / `deleteTranscription()`
  - `conferences.startRecording()`
  - `diagnostics.openapiYaml()` / `openapiYml()`
  - `usageRecords.list()` / `iterate()` and the `listAllTime`, `listDaily`, `listLastMonth`,
    `listMonthly`, `listThisMonth`, `listToday`, `listYearly`, `listYesterday` windows
  - `sip.registrations.list()` / `iterate()`
  - `messagingV1.services.phoneNumbers(serviceSid).list()` / `create()` / `fetch()` / `delete()`
    (on the Messaging host)
  - `monitorAlerts.list()` / `iterate()` / `fetch()` — `GET /v1/Alerts` and
    `GET /v1/Alerts/{Sid}` on the default host, with `LogLevel` / `StartDate` / `EndDate` /
    `PageSize` filters and the standard `meta` envelope
  - `messages.createFeedback(messageSid, { Outcome })` —
    `POST …/Messages/{Sid}/Feedback.json`
  - `accounts.rotateKey()` — `POST …/Accounts/{AccountSid}/RotateKey.json`; a 409 surfaces as
    `ConflictError`
- Webhook signature validation: `validateRequest()`, `RequestValidator` and `computeSignature()`.
- `client.nextPage(page)` and `client.paginate(page)` for every list (including `/v1` lists,
  whose `meta.next_page_url` is only followed on the configured product host), and `iterate()`
  on applications, incoming phone numbers, notifications and the new list resources.
- `messages.create()`: `MediaUrl` (MMS, sent as repeated keys), `ValidityPeriod`,
  `StatusCallbackMethod`.
- Incoming phone numbers: `SmsUrl`, `SmsMethod`, `SmsFallbackUrl`, `SmsFallbackMethod`,
  `SmsApplicationSid` on create / update, and `FriendlyName` / `Beta` / `Origin` list filters.
- Applications: `MessageStatusCallback`, `SmsStatusCallback`. Call recordings: `RecordingTrack`,
  `PauseBehavior`. SIP lists: `FriendlyName` filter. Conference recording list: `DateCreated`
  filters.
- Response fields: Application `sms_url` / `sms_method` / `sms_fallback_url` /
  `sms_fallback_method` / `message_status_callback` / `sms_status_callback`, IncomingPhoneNumber
  `subresource_uris` and the new `emergency_address_status` values, Recording `track`,
  MessagingService `advanced_opt_out`.
- `APIConnectionError`, `APITimeoutError`, `MethodNotAllowedError`, `PaginationError`, and
  `ApiError.retryAfter`.
- A client constructed without credentials can call `client.diagnostics.*`; any other call
  raises `ConfigurationError` before sending a request.
- Date filters accept `Date` objects. `RecordingAudio.redirected`.

### Security

- The API key no longer appears in `console.log`, `util.inspect` or `JSON.stringify` output of a
  `Client`, its resources or its `Transport`: credentials live in ES private fields and the
  objects print `[redacted]`.
- The `api_key` returned by `accounts.rotateKey()` is readable through direct property access
  but non-enumerable on the response object, so it never appears in default `console.log`,
  `util.inspect` or `JSON.stringify` output either.
- Binary downloads strip `Authorization` whenever the scheme, host or port changes and refuse
  `https` → `http` redirects; pagination links are only followed on the configured product host.
- Webhook signatures can be verified in constant time with `validateRequest()`.
- Development dependencies updated within their major versions; `npm audit` reports no
  advisories.

### Docs

- README rewritten: accurate operation count (333 of 333), field names (`from`, `to`),
  authentication (VoiceML AccountSid + API key; Twilio-issued credentials do not work), retry,
  `Retry-After`, timeout and pagination behaviour, webhook validation, diagnostics without
  credentials, key rotation, and a complete resource table. Every TypeScript example is
  type-checked by the test suite.
- `SECURITY.md` lists 0.9.x as supported and describes the retry and redirect policy.
- The npm `homepage` points at the API documentation.
- Example phone numbers use the reserved `+1 415 555 01xx` range.

### Build

- CI runs lint, type-check, the test suite on Node 20, 22 and 24, and a packed-tarball smoke test
  (CommonJS `require`, ESM `import`, TypeScript `node16` in both module modes) with publint and
  are-the-types-wrong. Publishing requires CI to pass and the tag to match the package version.
- A spec-driven contract test exercises every public method against a vendored copy of the
  public OpenAPI document (test-only; not published).
- `package.json` declares `"sideEffects": false`.
