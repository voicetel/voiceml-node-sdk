import type { ListNotificationsParams, NotificationsList } from '../models/index.js';
import { BaseResource } from './base.js';

/** Account-scoped `/Notifications` compat stubs (always empty list; get returns 404). */
export class NotificationsResource extends BaseResource {
  list(params: ListNotificationsParams = {}): Promise<NotificationsList> {
    return this.t.request<NotificationsList>({
      method: 'GET',
      path: this.path('Notifications'),
      params: listNotificationsToQuery(params),
    });
  }

  get(notificationSid: string): Promise<Record<string, unknown>> {
    return this.t.request<Record<string, unknown>>({
      method: 'GET',
      path: this.path('Notifications', notificationSid),
    });
  }
}

function listNotificationsToQuery(p: ListNotificationsParams): Record<string, unknown> {
  return {
    Page: p.Page,
    PageSize: p.PageSize,
    PageToken: p.PageToken,
    Log: p.Log,
    MessageDate: p.messageDate,
    'MessageDate<': p.messageDateLt,
    'MessageDate>': p.messageDateGt,
  };
}
