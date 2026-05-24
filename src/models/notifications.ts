/** Query params for `GET /Notifications` and `GET /Calls/{sid}/Notifications`. */
export interface ListNotificationsParams {
  Page?: number;
  PageSize?: number;
  PageToken?: string;
  Log?: number;
  /** Twilio wire name: `MessageDate` (full UTC day). */
  messageDate?: string;
  /** Twilio wire name: `MessageDate<`. */
  messageDateLt?: string;
  /** Twilio wire name: `MessageDate>`. */
  messageDateGt?: string;
}

/** Alias for call-scoped notification list filters. */
export type ListCallNotificationsParams = ListNotificationsParams;

/** `GET /Notifications` and `GET /Calls/{sid}/Notifications` — compat stub (always empty). */
export interface NotificationsList {
  notifications: unknown[];
  page: number;
  page_size: number;
  total: number;
  uri?: string;
}
