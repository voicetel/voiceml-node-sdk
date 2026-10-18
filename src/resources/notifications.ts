import type {
  ListNotificationsParams,
  Notification,
  NotificationList,
} from '../models/index.js';
import { paginate } from '../pagination.js';
import { BaseResource } from './base.js';
import { listNotificationsToQuery } from './calls.js';

/** Account-scoped `/Notifications` — error and warning log entries raised while handling calls. */
export class NotificationsResource extends BaseResource {
  async list(params: ListNotificationsParams = {}): Promise<NotificationList> {
    return this.t.request<NotificationList>({
      method: 'GET',
      path: this.path('Notifications'),
      params: listNotificationsToQuery(params),
    });
  }

  /** Lazily walk every page of `/Notifications`, following `next_page_uri`. */
  async *iterate(
    params: ListNotificationsParams = {},
  ): AsyncGenerator<Notification, void, void> {
    yield* paginate(this.t, await this.list(params));
  }

  async get(notificationSid: string): Promise<Notification> {
    return this.t.request<Notification>({
      method: 'GET',
      path: this.path('Notifications', notificationSid),
    });
  }
}
