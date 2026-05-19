import {
  ApplicationsResource,
  CallsResource,
  ConferencesResource,
  DiagnosticsResource,
  QueuesResource,
  RecordingsResource,
} from './resources/index.js';
import { Transport, type TransportOptions } from './transport.js';

export interface ClientOptions extends Omit<TransportOptions, 'fetch'> {
  /** Optional `fetch` override (tests, custom agent). Defaults to the global `fetch`. */
  fetch?: typeof fetch;
}

/**
 * VoiceML client. Construct once per `{accountSid, apiKey}` pair and reuse.
 *
 * VoiceML uses HTTP Basic auth: `accountSid` (Twilio-format `AC` + 32 hex) is the username
 * and `apiKey` is the password. Drop-in compatible with the Twilio Node SDK constructor.
 *
 * ```ts
 * import { Client } from 'voiceml';
 *
 * const c = new Client({ accountSid: 'AC…', apiKey: '…' });
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
  readonly diagnostics: DiagnosticsResource;
  private readonly transport: Transport;

  constructor(options: ClientOptions) {
    this.transport = new Transport(options);
    this.calls = new CallsResource(this.transport);
    this.conferences = new ConferencesResource(this.transport);
    this.queues = new QueuesResource(this.transport);
    this.applications = new ApplicationsResource(this.transport);
    this.recordings = new RecordingsResource(this.transport);
    this.diagnostics = new DiagnosticsResource(this.transport);
  }

  get accountSid(): string {
    return this.transport.accountSid;
  }

  get baseUrl(): string {
    return this.transport.baseUrl;
  }
}
