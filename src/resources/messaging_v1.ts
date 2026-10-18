import { route } from '../encoding.js';
import type {
  CreateMessagingServicePhoneNumberRequest,
  CreateMessagingServiceRequest,
  ListMessagingServicePageParams,
  ListMessagingServicePhoneNumbersParams,
  MessagingService,
  MessagingServiceList,
  MessagingServicePhoneNumber,
  MessagingServicePhoneNumberList,
  UpdateMessagingServiceRequest,
} from '../models/index.js';
import type { Transport } from '../transport.js';

/**
 * `client.messagingV1.*` — Twilio-compatible Messaging v1 API.
 *
 * The whole group is routed at the messaging host (`messaging.voicetel.com`)
 * by the client, which is what disambiguates a Messaging Service (`MG…`) from a
 * Conversation Service (`IS…`) — they share the `/v1/Services` path shape. See
 * `hosts.ts`.
 */
export class MessagingV1Resource {
  readonly services: MessagingV1ServicesResource;

  constructor(transport: Transport) {
    this.services = new MessagingV1ServicesResource(transport);
  }
}

/**
 * Operations on `/v1/Services` at the messaging host.
 *
 * `create` / `list` / `fetch` / `delete` reuse the shared path; `update`
 * (`POST /v1/Services/{sid}`) is unique to Messaging Service. The sender pool lives under
 * `phoneNumbers(serviceSid)`.
 */
export class MessagingV1ServicesResource {
  private readonly t: Transport;

  constructor(transport: Transport) {
    this.t = transport;
  }

  async create(body: CreateMessagingServiceRequest): Promise<MessagingService> {
    return this.t.request<MessagingService>({
      method: 'POST',
      path: '/v1/Services',
      form: body,
    });
  }

  async list(params: ListMessagingServicePageParams = {}): Promise<MessagingServiceList> {
    return this.t.request<MessagingServiceList>({
      method: 'GET',
      path: '/v1/Services',
      params,
    });
  }

  async fetch(sid: string): Promise<MessagingService> {
    return this.t.request<MessagingService>({
      method: 'GET',
      path: route`/v1/Services/${sid}`,
    });
  }

  async update(
    sid: string,
    body: UpdateMessagingServiceRequest,
  ): Promise<MessagingService> {
    return this.t.request<MessagingService>({
      method: 'POST',
      path: route`/v1/Services/${sid}`,
      form: body,
    });
  }

  async delete(sid: string): Promise<void> {
    await this.t.request<void>({
      method: 'DELETE',
      path: route`/v1/Services/${sid}`,
    });
  }

  /** The sender pool (`/v1/Services/{sid}/PhoneNumbers`) of one Messaging Service. */
  phoneNumbers(serviceSid: string): MessagingV1ServicePhoneNumbersResource {
    return new MessagingV1ServicePhoneNumbersResource(this.t, serviceSid);
  }
}

/** Sender pool of one Messaging Service: `/v1/Services/{sid}/PhoneNumbers` (messaging host). */
export class MessagingV1ServicePhoneNumbersResource {
  private readonly t: Transport;
  private readonly serviceSid: string;

  constructor(transport: Transport, serviceSid: string) {
    this.t = transport;
    this.serviceSid = serviceSid;
  }

  async list(
    params: ListMessagingServicePhoneNumbersParams = {},
  ): Promise<MessagingServicePhoneNumberList> {
    return this.t.request<MessagingServicePhoneNumberList>({
      method: 'GET',
      path: route`/v1/Services/${this.serviceSid}/PhoneNumbers`,
      params,
    });
  }

  /** Add an IncomingPhoneNumber (`PN…`) to the pool. */
  async create(
    body: CreateMessagingServicePhoneNumberRequest,
  ): Promise<MessagingServicePhoneNumber> {
    return this.t.request<MessagingServicePhoneNumber>({
      method: 'POST',
      path: route`/v1/Services/${this.serviceSid}/PhoneNumbers`,
      form: body,
    });
  }

  async fetch(phoneNumberSid: string): Promise<MessagingServicePhoneNumber> {
    return this.t.request<MessagingServicePhoneNumber>({
      method: 'GET',
      path: route`/v1/Services/${this.serviceSid}/PhoneNumbers/${phoneNumberSid}`,
    });
  }

  /** Remove a number from the pool (the IncomingPhoneNumber itself is kept). */
  async delete(phoneNumberSid: string): Promise<void> {
    await this.t.request<void>({
      method: 'DELETE',
      path: route`/v1/Services/${this.serviceSid}/PhoneNumbers/${phoneNumberSid}`,
    });
  }
}
