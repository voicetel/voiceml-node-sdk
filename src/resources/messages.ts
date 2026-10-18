import { dateOnly } from '../encoding.js';
import { ConfigurationError } from '../errors.js';
import type {
  CreateMessageFeedbackRequest,
  CreateMessageRequest,
  ListMediaParams,
  ListMessagesParams,
  Media,
  MediaList,
  Message,
  MessageFeedback,
  MessageList,
  UpdateMessageRequest,
} from '../models/index.js';
import { paginate } from '../pagination.js';
import { BaseResource } from './base.js';

/** `/Messages` REST resource — VoiceTel's Twilio-compatible SMS / MMS surface. */
export class MessagesResource extends BaseResource {
  /**
   * Send an SMS or MMS. `To` is required, and at least one of `Body` or `MediaUrl` must be
   * supplied (checked client-side before any request is made).
   */
  async create(body: CreateMessageRequest): Promise<Message> {
    const hasBody = typeof body.Body === 'string';
    const hasMedia = Array.isArray(body.MediaUrl) && body.MediaUrl.length > 0;
    if (!hasBody && !hasMedia) {
      throw new ConfigurationError('messages.create requires `Body` or at least one `MediaUrl`');
    }
    return this.t.request<Message>({
      method: 'POST',
      path: this.path('Messages'),
      form: body,
    });
  }

  /** Fetch a previously-sent Message by sid. */
  async fetch(messageSid: string): Promise<Message> {
    return this.t.request<Message>({
      method: 'GET',
      path: this.path('Messages', messageSid),
    });
  }

  /** Page Messages (DateCreated DESC). */
  async list(params: ListMessagesParams = {}): Promise<MessageList> {
    return this.t.request<MessageList>({
      method: 'GET',
      path: this.path('Messages'),
      params: listMessagesToQuery(params),
    });
  }

  /** Mutate an existing Message — Twilio-compatible redaction (`Body=""`) or `Status=canceled`. */
  async update(messageSid: string, body: UpdateMessageRequest): Promise<Message> {
    return this.t.request<Message>({
      method: 'POST',
      path: this.path('Messages', messageSid),
      form: body,
    });
  }

  /**
   * Submit delivery feedback for a Message
   * (`POST …/Messages/{Sid}/Feedback.json`). An omitted `Outcome` is echoed back
   * as `unconfirmed`.
   */
  async createFeedback(
    messageSid: string,
    body: CreateMessageFeedbackRequest = {},
  ): Promise<MessageFeedback> {
    return this.t.request<MessageFeedback>({
      method: 'POST',
      path: this.path('Messages', messageSid, 'Feedback'),
      form: body,
    });
  }

  /** Remove a Message resource from the account's store. */
  async delete(messageSid: string): Promise<void> {
    await this.t.request<void>({
      method: 'DELETE',
      path: this.path('Messages', messageSid),
    });
  }

  /** Lazily walk every page of `/Messages`, following `next_page_uri`. */
  async *iterate(params: ListMessagesParams = {}): AsyncGenerator<Message, void, void> {
    yield* paginate(this.t, await this.list(params));
  }

  // --- Media (MMS attachments) ---

  async listMedia(messageSid: string, params: ListMediaParams = {}): Promise<MediaList> {
    return this.t.request<MediaList>({
      method: 'GET',
      path: this.path('Messages', messageSid, 'Media'),
      params: {
        DateCreated: dateOnly(params.dateCreated),
        'DateCreated<': params.dateCreatedLt,
        'DateCreated>': params.dateCreatedGt,
        Page: params.Page,
        PageSize: params.PageSize,
        PageToken: params.PageToken,
      },
    });
  }

  /** Fetch the Media resource (JSON metadata) for one attachment. */
  async getMedia(messageSid: string, mediaSid: string): Promise<Media> {
    return this.t.request<Media>({
      method: 'GET',
      path: this.path('Messages', messageSid, 'Media', mediaSid),
    });
  }

  async deleteMedia(messageSid: string, mediaSid: string): Promise<void> {
    await this.t.request<void>({
      method: 'DELETE',
      path: this.path('Messages', messageSid, 'Media', mediaSid),
    });
  }
}

function listMessagesToQuery(p: ListMessagesParams): Record<string, unknown> {
  return {
    To: p.To,
    From: p.From,
    DateSent: dateOnly(p.dateSent),
    'DateSent<': p.dateSentLt,
    'DateSent>': p.dateSentGt,
    Page: p.Page,
    PageSize: p.PageSize,
    PageToken: p.PageToken,
  };
}
