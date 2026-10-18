import { isoDateTime, route } from '../encoding.js';
import type {
  ListMonitorAlertsParams,
  MonitorV1Alert,
  MonitorV1AlertList,
} from '../models/index.js';
import { paginate } from '../pagination.js';
import type { Transport } from '../transport.js';

/**
 * `client.monitorAlerts.*` — Twilio-compatible Monitor v1 alerts over failure
 * events (call-scoped errors and messaging delivery failures alike), served on
 * the default API host.
 *
 * The server serves a single page (`meta.next_page_url` is always `null`), so
 * `iterate()` walks exactly that page. `client.nextPage(page)` /
 * `client.paginate(page)` handle the envelope like every other /v1 list.
 */
export class MonitorAlertsResource {
  private readonly t: Transport;

  constructor(transport: Transport) {
    this.t = transport;
  }

  /**
   * List alerts (page 0 only; `PageSize` limits the rows, default 50, capped at
   * 1000). The list omits the request/response detail — `fetch()` includes it.
   */
  async list(params: ListMonitorAlertsParams = {}): Promise<MonitorV1AlertList> {
    return this.t.request<MonitorV1AlertList>({
      method: 'GET',
      path: '/v1/Alerts',
      params: {
        LogLevel: params.LogLevel,
        // Both filters accept `YYYY-MM-DD` or a full ISO-8601 timestamp; a `Date`
        // keeps its precision and is sent as ISO-8601 UTC.
        StartDate:
          params.StartDate instanceof Date ? isoDateTime(params.StartDate) : params.StartDate,
        EndDate: params.EndDate instanceof Date ? isoDateTime(params.EndDate) : params.EndDate,
        PageSize: params.PageSize,
      },
    });
  }

  /** Fetch one alert by sid, with the request/response detail when stored. */
  async fetch(sid: string): Promise<MonitorV1Alert> {
    return this.t.request<MonitorV1Alert>({
      method: 'GET',
      path: route`/v1/Alerts/${sid}`,
    });
  }

  /** Lazily walk the alerts page (single page on the server today). */
  async *iterate(
    params: ListMonitorAlertsParams = {},
  ): AsyncGenerator<MonitorV1Alert, void, void> {
    yield* paginate(this.t, await this.list(params));
  }
}
