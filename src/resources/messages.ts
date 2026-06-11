import type {
  CreateMessageRequest,
  ListMessagesParams,
  Message,
  MessageList,
  UpdateMessageRequest,
} from '../models/index.js';
import { BaseResource } from './base.js';

/**
 * `/Messages` REST resource — VoiceTel's Twilio-compatible SMS surface, backed by the
 * SDK 2.2 gateway. Outbound-only today (no MMS, no inbound webhook delivery).
 */
export class MessagesResource extends BaseResource {
  /** Dispatch an outbound SMS. */
  create(body: CreateMessageRequest): Promise<Message> {
    return this.t.request<Message>({
      method: 'POST',
      path: this.path('Messages'),
      form: body,
    });
  }

  /** Fetch a previously-sent Message by sid. */
  fetch(messageSid: string): Promise<Message> {
    return this.t.request<Message>({
      method: 'GET',
      path: this.path('Messages', messageSid),
    });
  }

  /** Page Messages (DateCreated DESC). */
  list(params: ListMessagesParams = {}): Promise<MessageList> {
    return this.t.request<MessageList>({
      method: 'GET',
      path: this.path('Messages'),
      params: listMessagesToQuery(params),
    });
  }

  /**
   * Mutate an existing Message — Twilio redaction (`Body=""`) or attempt cancel. `Status`
   * returns 21610 today since the SMS gateway is fire-and-forget.
   */
  update(messageSid: string, body: UpdateMessageRequest): Promise<Message> {
    return this.t.request<Message>({
      method: 'POST',
      path: this.path('Messages', messageSid),
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

  /**
   * Walk every page of `/Messages` and yield individual `Message` records. Use for medium
   * pulls; for very large result sets, page manually via `list()` + `next_page_uri`.
   */
  async *iterate(params: ListMessagesParams = {}): AsyncGenerator<Message, void, void> {
    let page = params.Page ?? 0;
    while (true) {
      const chunk = await this.list({ ...params, Page: page });
      for (const item of chunk.messages) yield item;
      if (!chunk.next_page_uri || chunk.messages.length === 0) return;
      page += 1;
    }
  }
}

function listMessagesToQuery(p: ListMessagesParams): Record<string, unknown> {
  return {
    To: p.To,
    From: p.From,
    DateSent: p.dateSent,
    'DateSent<': p.dateSentLt,
    'DateSent>': p.dateSentGt,
    Page: p.Page,
    PageSize: p.PageSize,
    PageToken: p.PageToken,
  };
}
