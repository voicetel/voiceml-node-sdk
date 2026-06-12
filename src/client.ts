import { ConfigurationError } from './errors.js';
import {
  ApplicationsResource,
  CallsResource,
  ConferencesResource,
  DiagnosticsResource,
  IncomingPhoneNumbersResource,
  MessagesResource,
  NotificationsResource,
  QueuesResource,
  RecordingsResource,
} from './resources/index.js';
import { Transport, type TransportOptions } from './transport.js';

/**
 * Constructor options for {@link Client}. Either `apiKey` or `authToken` must be supplied
 * (they're aliases — Twilio-compatible SDKs typically expose `authToken`). Passing both throws
 * a {@link ConfigurationError}.
 */
export interface ClientOptions extends Omit<TransportOptions, 'fetch' | 'apiKey'> {
  /** Per-tenant API key. Sent as the HTTP Basic password. */
  apiKey?: string;
  /** Alias for `apiKey` — accepted for drop-in compatibility with twilio-node. */
  authToken?: string;
  /** Optional `fetch` override (tests, custom agent). Defaults to the global `fetch`. */
  fetch?: typeof fetch;
}

/**
 * VoiceML client. Construct once per `{accountSid, apiKey}` pair and reuse.
 *
 * VoiceML uses HTTP Basic auth: `accountSid` (Twilio-format `AC` + 32 hex) is the username
 * and `apiKey` is the password. The `authToken` alias mirrors twilio-node's constructor
 * shape so existing Twilio code ports verbatim.
 *
 * ```ts
 * import { Client } from '@voicetel.com/voiceml';
 *
 * const c = new Client({ accountSid: 'AC…', apiKey: '…' });
 * // or, Twilio-style:
 * const c2 = new Client({ accountSid: 'AC…', authToken: '…' });
 *
 * const call = await c.calls.create({
 *   To: '+18005551234',
 *   From: '+18005550000',
 *   Url: 'https://example.com/twiml',
 * });
 * ```
 */
export class Client {
  readonly calls: CallsResource;
  readonly conferences: ConferencesResource;
  readonly queues: QueuesResource;
  readonly applications: ApplicationsResource;
  readonly recordings: RecordingsResource;
  readonly incomingPhoneNumbers: IncomingPhoneNumbersResource;
  readonly messages: MessagesResource;
  readonly notifications: NotificationsResource;
  readonly diagnostics: DiagnosticsResource;
  private readonly transport: Transport;

  constructor(options: ClientOptions) {
    if (options.apiKey && options.authToken) {
      throw new ConfigurationError(
        'pass either `apiKey` or `authToken`, not both — they are aliases',
      );
    }
    const apiKey = options.apiKey ?? options.authToken;
    if (!apiKey) {
      throw new ConfigurationError('apiKey (or authToken alias) is required');
    }
    // Drop the aliases before forwarding so Transport doesn't see unknown fields.
    const { authToken: _authToken, apiKey: _apiKey, ...rest } = options;
    void _authToken;
    void _apiKey;
    this.transport = new Transport({ ...rest, apiKey });
    this.calls = new CallsResource(this.transport);
    this.conferences = new ConferencesResource(this.transport);
    this.queues = new QueuesResource(this.transport);
    this.applications = new ApplicationsResource(this.transport);
    this.recordings = new RecordingsResource(this.transport);
    this.incomingPhoneNumbers = new IncomingPhoneNumbersResource(this.transport);
    this.messages = new MessagesResource(this.transport);
    this.notifications = new NotificationsResource(this.transport);
    this.diagnostics = new DiagnosticsResource(this.transport);
  }

  close(): void {
    this.transport.close();
  }

  get accountSid(): string {
    return this.transport.accountSid;
  }

  get baseUrl(): string {
    return this.transport.baseUrl;
  }
}
