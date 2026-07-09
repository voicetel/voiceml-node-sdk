/**
 * Messaging v1 resource models — Twilio `messaging.twilio.com/v1` REST surface.
 *
 * A Messaging Service (`MG…`) shares the `/v1/Services` path shape with the
 * Conversations Service (`IS…`); the two are disambiguated on the wire by host
 * (`messaging.voicetel.com` vs `conversations.voicetel.com`). This SDK routes
 * `client.messagingV1.*` at the messaging host automatically — see `hosts.ts`.
 *
 * Only the Messaging Service has an `update` verb; Conversation Service does
 * not, so `POST /v1/Services/{sid}` has no path collision.
 */

import type { VoiceV1Meta } from './voice_v1.js';

/**
 * A Messaging Service — Twilio `MG…` resource.
 *
 * The various feature-toggle fields (`sticky_sender`, `mms_converter`, …) are
 * accept-and-echo on VoiceML; the service's operative role is gating scheduled
 * sends (a real `messaging_service_sid` is required on `POST /Messages` when
 * `send_at` / `schedule_type` is set).
 */
export interface MessagingService {
  sid: string | null;
  account_sid: string | null;
  friendly_name: string | null;
  date_created: string | null;
  date_updated: string | null;
  inbound_request_url: string | null;
  inbound_method: string | null;
  fallback_url: string | null;
  fallback_method: string | null;
  status_callback: string | null;
  sticky_sender: boolean | null;
  mms_converter: boolean | null;
  smart_encoding: boolean | null;
  scan_message_content: string | null;
  fallback_to_long_code: boolean | null;
  area_code_geomatch: boolean | null;
  synchronous_validation: boolean | null;
  validity_period: number | null;
  url: string | null;
  usecase: string | null;
  use_inbound_webhook_on_number: boolean | null;
}

/** List envelope for `GET /v1/Services` on the messaging host. */
export interface MessagingServiceList {
  services: MessagingService[];
  meta: VoiceV1Meta | null;
}

/** Body for `POST /v1/Services` (messaging host). `FriendlyName` is required. */
export interface CreateMessagingServiceRequest {
  FriendlyName: string;
  InboundRequestUrl?: string;
  InboundMethod?: 'GET' | 'POST';
  FallbackUrl?: string;
  FallbackMethod?: 'GET' | 'POST';
  StatusCallback?: string;
  StickySender?: boolean;
  MmsConverter?: boolean;
  SmartEncoding?: boolean;
  ScanMessageContent?: 'inherit' | 'enable' | 'disable';
  FallbackToLongCode?: boolean;
  AreaCodeGeomatch?: boolean;
  SynchronousValidation?: boolean;
  ValidityPeriod?: number;
  Usecase?: string;
  UseInboundWebhookOnNumber?: boolean;
}

/** Body for `POST /v1/Services/{sid}` (messaging host). All fields optional. */
export type UpdateMessagingServiceRequest = Partial<CreateMessagingServiceRequest>;

/** Query params for `GET /v1/Services` (messaging host). */
export interface ListMessagingServicePageParams {
  PageSize?: number;
  // Index signature so the interface satisfies the transport's
  // `params: Record<string, unknown>` constraint without a cast.
  [key: string]: unknown;
}
