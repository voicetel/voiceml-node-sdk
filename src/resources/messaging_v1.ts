import type {
  CreateMessagingServiceRequest,
  ListMessagingServicePageParams,
  MessagingService,
  MessagingServiceList,
  UpdateMessagingServiceRequest,
} from '../models/index.js';
import type { Transport } from '../transport.js';

/**
 * `client.messagingV1.*` — Twilio `messaging.twilio.com/v1` REST surface.
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
 * (`POST /v1/Services/{sid}`) is unique to Messaging Service.
 */
export class MessagingV1ServicesResource {
  private readonly t: Transport;

  constructor(transport: Transport) {
    this.t = transport;
  }

  create(body: CreateMessagingServiceRequest): Promise<MessagingService> {
    return this.t.request<MessagingService>({
      method: 'POST',
      path: '/v1/Services',
      form: body,
    });
  }

  list(params: ListMessagingServicePageParams = {}): Promise<MessagingServiceList> {
    return this.t.request<MessagingServiceList>({
      method: 'GET',
      path: '/v1/Services',
      params,
    });
  }

  fetch(sid: string): Promise<MessagingService> {
    return this.t.request<MessagingService>({
      method: 'GET',
      path: `/v1/Services/${sid}`,
    });
  }

  update(
    sid: string,
    body: UpdateMessagingServiceRequest,
  ): Promise<MessagingService> {
    return this.t.request<MessagingService>({
      method: 'POST',
      path: `/v1/Services/${sid}`,
      form: body,
    });
  }

  async delete(sid: string): Promise<void> {
    await this.t.request<void>({
      method: 'DELETE',
      path: `/v1/Services/${sid}`,
    });
  }
}
