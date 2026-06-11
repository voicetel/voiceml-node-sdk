import type { PageEnvelope } from './common.js';

/**
 * Wire status values for {@link Message}. VoiceTel's SDK 2.2 gateway is fire-and-forget,
 * so the realised lifecycle today is `sent` (successful dispatch) or `failed`. The other
 * Twilio-compatible values are accepted on deserialisation for forward-compatibility when
 * delivery-receipt support is added.
 */
export type MessageStatus =
  | 'queued'
  | 'sending'
  | 'sent'
  | 'failed'
  | 'delivered'
  | 'undelivered'
  | 'receiving'
  | 'received'
  | 'accepted'
  | 'scheduled'
  | 'read'
  | 'canceled';

export type MessageDirection =
  | 'outbound-api'
  | 'outbound-call'
  | 'outbound-reply'
  | 'inbound';

/**
 * Twilio-compatible status enum accepted by {@link UpdateMessageRequest.Status}. The server
 * returns 21610 on `canceled` because outbound SMS is fire-and-forget — kept here so callers
 * can model the rejection without hand-rolled string literals.
 */
export type UpdateMessageStatus = 'canceled';

/**
 * Message mirrors Twilio's `Message` resource on the wire. `num_segments` and `num_media`
 * are string-typed on the wire (Twilio compat). `error_code` is `number | null`; the other
 * nullable fields (`price`, `price_unit`, `error_message`, `date_sent`,
 * `messaging_service_sid`) come back as `null` on a row that has no value yet.
 */
export interface Message {
  sid: string;
  account_sid: string;
  api_version: string;
  to: string;
  from: string;
  body: string;
  status: MessageStatus;
  /** Per-message segment count; string-typed on the wire to match Twilio. */
  num_segments: string;
  /** Always `"0"` today (no MMS support yet). */
  num_media: string;
  direction: MessageDirection;
  price: string | null;
  price_unit: string | null;
  /** Twilio error taxonomy. 21609 = gateway not configured; 30001 = upstream failure. */
  error_code: number | null;
  error_message: string | null;
  messaging_service_sid: string | null;
  date_created: string;
  date_updated: string;
  date_sent: string | null;
  uri: string;
  subresource_uris?: Record<string, string>;
}

export interface MessageList extends PageEnvelope {
  messages: Message[];
}

/**
 * Body for `POST /Messages`. `To` and `Body` are required; `From` falls back to the tenant's
 * configured default sender when omitted.
 */
export interface CreateMessageRequest {
  To: string;
  Body: string;
  From?: string;
  /** Accepted for compatibility; not yet routed against. */
  MessagingServiceSid?: string;
  /** Reserved — outbound SMS is fire-and-forget today. */
  StatusCallback?: string;
}

/**
 * Body for `POST /Messages/{Sid}`. Today only `Body=""` (redaction) is honoured —
 * `Status=canceled` returns 21610 because outbound SMS is fire-and-forget. Twilio's
 * documented redaction semantics: a non-empty `Body` is silently ignored by the server.
 */
export interface UpdateMessageRequest {
  /** Pass empty string to redact. Non-empty `Body` is ignored server-side. */
  Body?: string;
  Status?: UpdateMessageStatus;
}

/** Query parameters for `GET /Messages`. */
export interface ListMessagesParams {
  To?: string;
  From?: string;
  /** Twilio wire name: `DateSent` (full UTC day). */
  dateSent?: string;
  /** Twilio wire name: `DateSent<`. */
  dateSentLt?: string;
  /** Twilio wire name: `DateSent>`. */
  dateSentGt?: string;
  Page?: number;
  PageSize?: number;
  PageToken?: string;
}
