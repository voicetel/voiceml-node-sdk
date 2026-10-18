import type { PageEnvelope } from './common.js';

/** An error or warning logged while handling a call. */
export interface Notification {
  sid: string;
  account_sid: string;
  call_sid: string;
  api_version: string | null;
  error_code: string;
  /** `0` = error, `1` = warning. */
  log: string;
  message_date: string;
  message_text?: string | null;
  more_info: string;
  request_method?: string | null;
  request_url?: string | null;
  uri: string;
  date_created: string;
  date_updated: string;
}

/** `GET /Notifications.json` and `GET /Calls/{sid}/Notifications.json`. */
export interface NotificationList extends PageEnvelope {
  notifications: Notification[];
  uri: string;
}

/** @deprecated Renamed to {@link NotificationList}. */
export type NotificationsList = NotificationList;

/** The REST request half of a {@link CallEvent}. */
export interface CallEventRequest {
  method: string;
  parameters: Record<string, string>;
  url: string;
}

/** The response half of a {@link CallEvent}. */
export interface CallEventResponse {
  content_type: string;
  date_created: string;
  request_duration: number;
  response_body: string;
  response_code: number;
}

/** One REST request/response recorded against a call (create and each update). */
export interface CallEvent {
  request: CallEventRequest;
  response: CallEventResponse;
}

/** `GET /Calls/{sid}/Events.json`. */
export interface CallEventList extends PageEnvelope {
  events: CallEvent[];
  uri: string;
}

/** @deprecated Renamed to {@link CallEventList}. */
export type EventsList = CallEventList;

/** Query params for `GET /Notifications` and `GET /Calls/{sid}/Notifications`. */
export interface ListNotificationsParams {
  Page?: number;
  PageSize?: number;
  PageToken?: string;
  /** `0` = errors only, `1` = warnings only. */
  Log?: 0 | 1;
  /** Wire name `MessageDate` — a UTC day (`YYYY-MM-DD`; a `Date` is sent as its UTC day). */
  messageDate?: string | Date;
  /** Wire name `MessageDate<` (a `Date` is sent as ISO-8601 UTC). */
  messageDateLt?: string | Date;
  /** Wire name `MessageDate>` (a `Date` is sent as ISO-8601 UTC). */
  messageDateGt?: string | Date;
}

/** Alias for call-scoped notification list filters. */
export type ListCallNotificationsParams = ListNotificationsParams;
