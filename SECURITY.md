# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 0.9.x   | ✅        |
| < 0.9   | ❌        |

## Reporting a Vulnerability

Please **do not** open a public issue for security vulnerabilities.

Use GitHub's private vulnerability reporting for this repository:
**Security → Report a vulnerability** (or
<https://github.com/voicetel/voiceml-node-sdk/security/advisories/new>).

Include, where possible:

- A description of the issue and its impact
- Steps to reproduce or a proof of concept
- Affected version(s) and configuration

You can expect an acknowledgement within a few business days. Please
allow reasonable time for a fix before any public disclosure.

## Scope Notes

This SDK constructs authenticated HTTP requests to the VoiceML REST
API. What the SDK does, and what remains the consumer's responsibility:

- **Credentials.** The AccountSid + API key pair is sent as HTTP Basic
  auth. The SDK keeps the encoded header in a private field: logging,
  `util.inspect`-ing or `JSON.stringify`-ing a `Client`, its resources or
  its transport prints `[redacted]` instead of the key. Do not log the
  `apiKey` / `authToken` values or an `Authorization` header yourself,
  and keep them out of source control (load them from a secret manager or
  the environment).
- **Retries never duplicate side effects.** `GET`, `PUT` and `DELETE`
  retry on 429 / 500 / 502 / 503 / 504 and on network errors. `POST` and
  `PATCH` (placing calls, sending messages, …) retry only on 429 and on
  connection failures where the request provably never left the client
  (DNS failure, connection refused, connect timeout, TLS handshake
  failure) — never after a 5xx, a read timeout or a dropped connection.
  `Retry-After` is honoured up to 60 s; a longer value raises immediately.
- **Redirects.** Binary downloads (recording audio, exports) follow the
  redirect to storage manually: the `Authorization` header is dropped as
  soon as the scheme, host or port changes, and `https` → `http`
  downgrades are refused. Pagination links are only followed on the
  configured product host.
- **Webhooks.** Use `validateRequest` / `RequestValidator` to verify the
  `X-Twilio-Signature` header on every webhook before acting on it; the
  comparison is constant-time.
- **Transport security.** The SDK uses the runtime's `fetch` and its TLS
  posture (TLS 1.2+ on Node 20+). If you supply a custom `fetch`, you are
  responsible for matching that posture and for supporting
  `redirect: 'manual'`.

Out of scope: vulnerabilities in the published `@voicetel.com/voiceml`
npm package caused by a forked / vendored copy that has been modified,
or runtime-injected globals (`fetch` shims, transitive polyfills).
