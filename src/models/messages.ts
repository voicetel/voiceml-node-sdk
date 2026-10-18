import type { HttpMethod, Open, PageEnvelope } from './common.js';

/** Wire status values for {@link Message}. */
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

/** Twilio-compatible status accepted by {@link UpdateMessageRequest.Status}. */
export type UpdateMessageStatus = 'canceled';

/**
 * A Twilio-compatible `Message` resource. `num_segments` and `num_media`
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
  status: Open<MessageStatus>;
  /** Per-message segment count; string-typed on the wire to match Twilio. */
  num_segments: string;
  /** Number of media attachments; string-typed on the wire to match Twilio. */
  num_media: string;
  direction: Open<MessageDirection>;
  price?: string | null;
  price_unit?: string | null;
  /** Twilio error taxonomy. 21609 = gateway not configured; 30001 = upstream failure. */
  error_code?: number | null;
  error_message?: string | null;
  messaging_service_sid?: string | null;
  date_created: string;
  date_updated: string;
  date_sent?: string | null;
  uri: string;
  subresource_uris?: Record<string, string>;
}

export interface MessageList extends PageEnvelope {
  messages: Message[];
}

interface CreateMessageFields {
  To: string;
  /** Sender; falls back to the tenant's configured default sender when omitted. */
  From?: string;
  Body?: string;
  /** Public URLs of media to attach (MMS). Sent as repeated `MediaUrl` keys. */
  MediaUrl?: string[];
  MessagingServiceSid?: string;
  /** Seconds the message may wait in the outbound queue before it is failed. */
  ValidityPeriod?: number;
  /** Delivery-status callback URL. */
  StatusCallback?: string;
  StatusCallbackMethod?: HttpMethod;
}

/**
 * Body for `POST /Messages`. `To` is required, plus at least one of `Body` (SMS) or
 * `MediaUrl` (MMS) — the SDK checks this before sending.
 */
export type CreateMessageRequest = CreateMessageFields &
  ({ Body: string } | { MediaUrl: [string, ...string[]] });

/**
 * Body for `POST /Messages/{Sid}`. `Body=""` redacts the message body; `Status=canceled`
 * attempts to cancel a queued message.
 */
export interface UpdateMessageRequest {
  /** Pass an empty string to redact. */
  Body?: string;
  Status?: UpdateMessageStatus;
}

/** Query parameters for `GET /Messages`. */
export interface ListMessagesParams {
  To?: string;
  From?: string;
  /** Wire name `DateSent` — a UTC day (`YYYY-MM-DD`; a `Date` is sent as its UTC day). */
  dateSent?: string | Date;
  /** Wire name `DateSent<` (a `Date` is sent as ISO-8601 UTC). */
  dateSentLt?: string | Date;
  /** Wire name `DateSent>` (a `Date` is sent as ISO-8601 UTC). */
  dateSentGt?: string | Date;
  Page?: number;
  PageSize?: number;
  PageToken?: string;
}

/** One MMS attachment (`ME…`). */
export interface Media {
  sid: string;
  account_sid: string;
  /** The Message (`SM…`/`MM…`) this media belongs to. */
  parent_sid: string;
  content_type?: string | null;
  date_created: string;
  date_updated: string;
  uri: string;
}

export interface MediaList extends PageEnvelope {
  media_list: Media[];
}

/** Query parameters for `GET /Messages/{MessageSid}/Media`. */
export interface ListMediaParams {
  /** Wire name `DateCreated` — a UTC day (`YYYY-MM-DD`; a `Date` is sent as its UTC day). */
  dateCreated?: string | Date;
  /** Wire name `DateCreated<` (a `Date` is sent as ISO-8601 UTC). */
  dateCreatedLt?: string | Date;
  /** Wire name `DateCreated>` (a `Date` is sent as ISO-8601 UTC). */
  dateCreatedGt?: string | Date;
  Page?: number;
  PageSize?: number;
  PageToken?: string;
}

/**
 * Delivery-quality feedback echoed back on a Message. VoiceML records the
 * outcome on the response only; there is no separate downstream analytics
 * surface.
 */
export interface MessageFeedback {
  account_sid: string;
  message_sid: string;
  outcome: Open<'confirmed' | 'unconfirmed'>;
  date_created: string;
  date_updated: string;
  uri: string;
}

/**
 * Body for `POST /Messages/{MessageSid}/Feedback.json`. An omitted `Outcome` is
 * echoed back as `unconfirmed`.
 */
export interface CreateMessageFeedbackRequest {
  Outcome?: 'confirmed' | 'unconfirmed';
}
