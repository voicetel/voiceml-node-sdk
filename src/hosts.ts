/**
 * Per-product host resolution for the VoiceML API.
 *
 * Twilio splits its products across dedicated subdomains (`api.twilio.com`,
 * `conversations.twilio.com`, `messaging.twilio.com`, …). VoiceML mirrors that
 * shape on `voicetel.com`: the Conversations product answers on
 * `conversations.voicetel.com` and the Messaging Service product on
 * `messaging.voicetel.com`, while everything else stays on the default
 * `voiceml.voicetel.com` host. Conversation Service (`IS…`) and Messaging
 * Service (`MG…`) share the identical `/v1/Services` path shape, so the *host*
 * is what disambiguates them on the wire.
 *
 * Given the configured `baseUrl` this module derives the two product hosts by
 * swapping the leftmost `voiceml` label — but only for recognised
 * `*.voicetel.com` hosts. For any other base URL (a self-hosted callBroadcast
 * instance, a test stub, a regional override) the product hosts fall back to
 * the configured host unchanged, so a single-host deployment keeps working. A
 * caller who needs Messaging Service against a custom host points
 * `messagingBaseUrl` (or `conversationsBaseUrl`) at their own subdomain.
 */

/** Linear-time trailing-slash strip (avoids the polynomial-backtracking regex CodeQL flags). */
function stripTrailingSlashes(s: string): string {
  let end = s.length;
  while (end > 0 && s.charCodeAt(end - 1) === 47 /* '/' */) end--;
  return end === s.length ? s : s.slice(0, end);
}

/**
 * Swap the `voiceml` label of a `*.voicetel.com` host for `product`.
 *
 * Returns `baseUrl` unchanged when the host is not a `voiceml.*.voicetel.com`
 * style host (e.g. a self-hosted instance or an unparseable URL), so
 * single-host deployments keep working without special-casing.
 */
function deriveProductHost(baseUrl: string, product: string): string {
  let u: URL;
  try {
    u = new URL(baseUrl);
  } catch {
    return baseUrl;
  }
  const host = u.hostname;
  if (!host || !host.endsWith('.voicetel.com')) return baseUrl;
  const labels = host.split('.');
  const idx = labels.indexOf('voiceml');
  if (idx === -1) return baseUrl;
  labels[idx] = product;
  u.hostname = labels.join('.');
  // Match Python's urlunsplit: keep scheme/host/port/path, drop query + fragment.
  u.search = '';
  u.hash = '';
  return stripTrailingSlashes(u.toString());
}

/** The three product base URLs resolved from a client's configuration. */
export interface ProductBaseUrls {
  /** Default host — calls, voice_v1, routes_v2, assistants_v1, pricing, … */
  default: string;
  /** Messaging Service host (`messaging.voicetel.com`). */
  messaging: string;
  /** Conversations host (`conversations.voicetel.com`). */
  conversations: string;
}

/**
 * Resolve the `{ default, messaging, conversations }` base URLs from `baseUrl`.
 *
 * Explicit overrides win; otherwise each product host is derived from `baseUrl`
 * (see module docstring). All three are returned without a trailing slash.
 */
export function resolveProductBaseUrls(
  baseUrl: string,
  messagingBaseUrl?: string,
  conversationsBaseUrl?: string,
): ProductBaseUrls {
  const defaultUrl = stripTrailingSlashes(baseUrl);
  const messaging = stripTrailingSlashes(
    messagingBaseUrl ?? deriveProductHost(defaultUrl, 'messaging'),
  );
  const conversations = stripTrailingSlashes(
    conversationsBaseUrl ?? deriveProductHost(defaultUrl, 'conversations'),
  );
  return { default: defaultUrl, messaging, conversations };
}
