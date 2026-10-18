import { ConfigurationError, PaginationError } from './errors.js';
import { resolveProductBaseUrls } from './hosts.js';
import { nextPageLink, paginate, type PageItem } from './pagination.js';
import {
  AccountsResource,
  ApplicationsResource,
  AssistantsV1Resource,
  BalanceResource,
  CallsResource,
  ConferencesResource,
  ConversationsV1Resource,
  DiagnosticsResource,
  ExportsResource,
  IncomingPhoneNumbersResource,
  MessagesResource,
  MessagingV1Resource,
  MonitorAlertsResource,
  NotificationsResource,
  OutgoingCallerIdsResource,
  PricingResource,
  QueuesResource,
  RecordingsResource,
  RoutesV2Resource,
  SipResource,
  TranscriptionsResource,
  UsageRecordsResource,
  VoiceV1Resource,
} from './resources/index.js';
import { DEFAULT_BASE_URL, Transport, type TransportOptions } from './transport.js';

/**
 * Constructor options for {@link Client}.
 *
 * Pass `accountSid` plus `apiKey` (or its alias `authToken`) to call the API. Passing both
 * `apiKey` and `authToken` throws a {@link ConfigurationError}. Omitting the credentials
 * entirely gives a diagnostics-only client: `client.diagnostics.*` works, every other call
 * rejects with `ConfigurationError` before any request is sent.
 */
export interface ClientOptions extends Omit<TransportOptions, 'fetch' | 'apiKey' | 'accountSid'> {
  /** Your AccountSid (`AC` + 32 hex). Sent as the HTTP Basic username. */
  accountSid?: string;
  /** Your VoiceML API key. Sent as the HTTP Basic password. */
  apiKey?: string;
  /** Alias for `apiKey`, matching the option name twilio-node uses. */
  authToken?: string;
  /**
   * Override the Messaging Service host. When omitted it is derived from
   * `baseUrl` (`voiceml.*.voicetel.com` → `messaging.*.voicetel.com`); a
   * non-`voicetel.com` `baseUrl` falls back to that single host. See `hosts.ts`.
   */
  messagingBaseUrl?: string;
  /**
   * Override the Conversations host. When omitted it is derived from `baseUrl`
   * (`voiceml.*.voicetel.com` → `conversations.*.voicetel.com`); a
   * non-`voicetel.com` `baseUrl` falls back to that single host. See `hosts.ts`.
   */
  conversationsBaseUrl?: string;
  /** Optional `fetch` override (tests, proxies, custom agents). Defaults to the global `fetch`. */
  fetch?: typeof fetch;
}

/**
 * VoiceML client. Construct once per `{accountSid, apiKey}` pair and reuse.
 *
 * VoiceML uses HTTP Basic auth: your `accountSid` (`AC` + 32 hex) is the username and your
 * VoiceML API key is the password — the same header positions Twilio SDKs use. The key is
 * held in a private field and never appears in `console.log`, `util.inspect` or
 * `JSON.stringify` output.
 *
 * ```ts
 * import { Client } from '@voicetel.com/voiceml';
 *
 * const c = new Client({ accountSid: 'AC…', apiKey: '…' });
 *
 * const call = await c.calls.create({
 *   To: '+14155550100',
 *   From: '+14155550101',
 *   Url: 'https://example.com/twiml',
 * });
 * ```
 */
export class Client {
  readonly accounts: AccountsResource;
  readonly balance: BalanceResource;
  readonly calls: CallsResource;
  readonly conferences: ConferencesResource;
  readonly queues: QueuesResource;
  readonly applications: ApplicationsResource;
  readonly recordings: RecordingsResource;
  readonly transcriptions: TranscriptionsResource;
  readonly incomingPhoneNumbers: IncomingPhoneNumbersResource;
  readonly outgoingCallerIds: OutgoingCallerIdsResource;
  readonly messages: MessagesResource;
  readonly messagingV1: MessagingV1Resource;
  readonly monitorAlerts: MonitorAlertsResource;
  readonly notifications: NotificationsResource;
  readonly usageRecords: UsageRecordsResource;
  readonly exports: ExportsResource;
  readonly pricing: PricingResource;
  readonly sip: SipResource;
  readonly routesV2: RoutesV2Resource;
  readonly voiceV1: VoiceV1Resource;
  readonly conversationsV1: ConversationsV1Resource;
  readonly assistantsV1: AssistantsV1Resource;
  readonly diagnostics: DiagnosticsResource;
  readonly #transport: Transport;
  readonly #messagingTransport: Transport;
  readonly #conversationsTransport: Transport;

  constructor(options: ClientOptions = {}) {
    if (options.apiKey !== undefined && options.authToken !== undefined) {
      throw new ConfigurationError(
        'pass either `apiKey` or `authToken`, not both — they are aliases',
      );
    }
    const {
      authToken,
      apiKey = authToken,
      baseUrl,
      messagingBaseUrl,
      conversationsBaseUrl,
      ...rest
    } = options;

    // Conversations and Messaging Service ride their own product hosts (they share the
    // /v1/Services path shape — the host is what disambiguates them). Each group gets a
    // transport pinned to its resolved host.
    const urls = resolveProductBaseUrls(
      baseUrl ?? DEFAULT_BASE_URL,
      messagingBaseUrl,
      conversationsBaseUrl,
    );
    this.#transport = new Transport({ ...rest, apiKey, baseUrl: urls.default });
    this.#messagingTransport = new Transport({ ...rest, apiKey, baseUrl: urls.messaging });
    this.#conversationsTransport = new Transport({
      ...rest,
      apiKey,
      baseUrl: urls.conversations,
    });

    const t = this.#transport;
    this.accounts = new AccountsResource(t);
    this.balance = new BalanceResource(t);
    this.calls = new CallsResource(t);
    this.conferences = new ConferencesResource(t);
    this.queues = new QueuesResource(t);
    this.applications = new ApplicationsResource(t);
    this.recordings = new RecordingsResource(t);
    this.transcriptions = new TranscriptionsResource(t);
    this.incomingPhoneNumbers = new IncomingPhoneNumbersResource(t);
    this.outgoingCallerIds = new OutgoingCallerIdsResource(t);
    this.messages = new MessagesResource(t);
    this.messagingV1 = new MessagingV1Resource(this.#messagingTransport);
    this.monitorAlerts = new MonitorAlertsResource(t);
    this.notifications = new NotificationsResource(t);
    this.usageRecords = new UsageRecordsResource(t);
    this.exports = new ExportsResource(t);
    this.pricing = new PricingResource(t);
    this.sip = new SipResource(t);
    this.routesV2 = new RoutesV2Resource(t);
    this.voiceV1 = new VoiceV1Resource(t);
    this.conversationsV1 = new ConversationsV1Resource(this.#conversationsTransport);
    this.assistantsV1 = new AssistantsV1Resource(t);
    this.diagnostics = new DiagnosticsResource(t);
  }

  close(): void {
    this.#transport.close();
    this.#messagingTransport.close();
    this.#conversationsTransport.close();
  }

  /** The configured AccountSid (empty string on a diagnostics-only client). */
  get accountSid(): string {
    return this.#transport.accountSid;
  }

  /** Default product host base URL. */
  get baseUrl(): string {
    return this.#transport.baseUrl;
  }

  /**
   * Fetch the page after `page` — follows `next_page_uri` (2010 lists) or
   * `meta.next_page_url` (v1/v2 lists) verbatim. Resolves to `null` on the last page. A link
   * to a host other than the configured product hosts raises {@link PaginationError}.
   */
  async nextPage<L extends object>(page: L): Promise<L | null> {
    const link = nextPageLink(page);
    if (link === null) return null;
    return this.#transportFor(link).getPage<L>(link);
  }

  /**
   * Lazily yield every item of `page` and of each page after it:
   *
   * ```ts
   * for await (const call of client.paginate(await client.calls.list({ PageSize: 100 }))) { … }
   * ```
   */
  async *paginate<L extends object>(page: L): AsyncGenerator<PageItem<L>, void, void> {
    const link = nextPageLink(page);
    yield* paginate(link === null ? this.#transport : this.#transportFor(link), page);
  }

  toJSON(): Record<string, unknown> {
    return {
      accountSid: this.accountSid,
      baseUrl: this.baseUrl,
      messagingBaseUrl: this.#messagingTransport.baseUrl,
      conversationsBaseUrl: this.#conversationsTransport.baseUrl,
      credentials: this.#transport.hasCredentials ? '[redacted]' : null,
    };
  }

  #transportFor(link: string): Transport {
    let absolute: URL;
    try {
      absolute = new URL(link);
    } catch {
      // Relative `next_page_uri`: served by the default product host.
      return this.#transport;
    }
    for (const t of [this.#transport, this.#messagingTransport, this.#conversationsTransport]) {
      if (t.origin === absolute.origin) return t;
    }
    throw new PaginationError(
      `refusing to follow next-page link to ${absolute.origin}: not a configured product host`,
    );
  }
}

Object.defineProperty(Client.prototype, Symbol.for('nodejs.util.inspect.custom'), {
  value: function inspectClient(this: Client): string {
    return `Client ${JSON.stringify(this.toJSON())}`;
  },
});
