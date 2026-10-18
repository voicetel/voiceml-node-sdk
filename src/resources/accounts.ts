import { dateOnly, route } from '../encoding.js';
import { ConfigurationError } from '../errors.js';
import type {
  Account,
  AccountWithKey,
  Balance,
  CreateOutgoingCallerIdRequest,
  ExportList,
  ListOutgoingCallerIdsParams,
  ListUsageRecordsParams,
  OutgoingCallerId,
  OutgoingCallerIdList,
  ExportArchive,
  UpdateAccountRequest,
  UpdateOutgoingCallerIdRequest,
  UsageRecord,
  UsageRecordList,
  ValidationRequest,
} from '../models/index.js';
import { paginate } from '../pagination.js';
import type { Transport } from '../transport.js';
import { accountPath, BaseResource } from './base.js';

/** The authenticated account itself (`/2010-04-01/Accounts/{AccountSid}.json`). */
export class AccountsResource {
  readonly #t: Transport;

  constructor(transport: Transport) {
    this.#t = transport;
  }

  #selfPath(): string {
    if (!this.#t.hasCredentials) {
      throw new ConfigurationError(
        'this client has no credentials — pass accountSid and apiKey to call account endpoints',
      );
    }
    return route`/2010-04-01/Accounts/${this.#t.accountSid}.json`;
  }

  /** Fetch the authenticated account. */
  async fetch(): Promise<Account> {
    return this.#t.request<Account>({ method: 'GET', path: this.#selfPath() });
  }

  /**
   * Update the authenticated account's settings. A concurrent modification is rejected with
   * HTTP 409 (code 20409), raised as `ConflictError` — re-fetch and retry.
   */
  async update(body: UpdateAccountRequest): Promise<Account> {
    return this.#t.request<Account>({ method: 'POST', path: this.#selfPath(), form: body });
  }

  /**
   * Rotate the authenticated account's API key
   * (`POST /2010-04-01/Accounts/{AccountSid}/RotateKey.json`). The previous key
   * stops working immediately; no read endpoint exposes the new one, so store
   * `account.api_key` right away. The returned `api_key` is readable but kept
   * out of `console.log`, `util.inspect` and `JSON.stringify` output. A 409
   * surfaces as `ConflictError`.
   */
  async rotateKey(): Promise<AccountWithKey> {
    const raw = await this.#t.request<Record<string, unknown>>({
      method: 'POST',
      path: accountPath(this.#t, ['RotateKey'], '.json'),
    });
    return shieldApiKey(raw);
  }
}

/**
 * Return the RotateKey response with `api_key` readable but non-enumerable, so
 * the secret never shows up in default inspect / string / JSON output (C11).
 */
function shieldApiKey(raw: Record<string, unknown>): AccountWithKey {
  const { api_key, ...rest } = raw as unknown as AccountWithKey;
  return Object.defineProperty(rest, 'api_key', {
    enumerable: false,
    get: () => api_key,
  }) as AccountWithKey;
}

/** `/Balance.json` — the account balance (VoiceML reports a static zero). */
export class BalanceResource extends BaseResource {
  async fetch(): Promise<Balance> {
    return this.t.request<Balance>({ method: 'GET', path: this.path('Balance') });
  }
}

/** `/OutgoingCallerIds` — verified caller IDs usable as `From` / `CallerId`. */
export class OutgoingCallerIdsResource extends BaseResource {
  async list(params: ListOutgoingCallerIdsParams = {}): Promise<OutgoingCallerIdList> {
    return this.t.request<OutgoingCallerIdList>({
      method: 'GET',
      path: this.path('OutgoingCallerIds'),
      params,
    });
  }

  /** Lazily walk every page of `/OutgoingCallerIds`, following `next_page_uri`. */
  async *iterate(
    params: ListOutgoingCallerIdsParams = {},
  ): AsyncGenerator<OutgoingCallerId, void, void> {
    yield* paginate(this.t, await this.list(params));
  }

  /** Start verifying a caller ID. Returns the validation request (with its `validation_code`). */
  async create(body: CreateOutgoingCallerIdRequest): Promise<ValidationRequest> {
    return this.t.request<ValidationRequest>({
      method: 'POST',
      path: this.path('OutgoingCallerIds'),
      form: body,
    });
  }

  async get(sid: string): Promise<OutgoingCallerId> {
    return this.t.request<OutgoingCallerId>({
      method: 'GET',
      path: this.path('OutgoingCallerIds', sid),
    });
  }

  async update(sid: string, body: UpdateOutgoingCallerIdRequest): Promise<OutgoingCallerId> {
    return this.t.request<OutgoingCallerId>({
      method: 'POST',
      path: this.path('OutgoingCallerIds', sid),
      form: body,
    });
  }

  async delete(sid: string): Promise<void> {
    await this.t.request<void>({
      method: 'DELETE',
      path: this.path('OutgoingCallerIds', sid),
    });
  }
}

/** `/Exports` — nightly event-log archives (VoiceML extension). */
export class ExportsResource extends BaseResource {
  /** List the account's available daily archives, newest first. */
  async list(): Promise<ExportList> {
    return this.t.request<ExportList>({ method: 'GET', path: this.path('Exports') });
  }

  /**
   * Download one day's archive (`GET …/Exports/{Date}`, no `.json` suffix). The server
   * redirects to a presigned URL; it is followed without the `Authorization` header.
   *
   * @param date Archive day as `YYYY-MM-DD` (a `Date` is converted to its UTC day).
   */
  async download(date: string | Date): Promise<ExportArchive> {
    const day = dateOnly(date) as string;
    const res = await this.t.fetchBytes({
      path: this.pathWithSuffix('', 'Exports', day),
      accept: '*/*',
    });
    return {
      date: day,
      body: res.body,
      contentType: res.headers.get('content-type') ?? 'application/octet-stream',
      redirected: res.redirected,
    };
  }
}

/** Usage-record windows exposed under `/Usage/Records/{Window}.json`. */
export type UsageRecordWindow =
  | 'AllTime'
  | 'Daily'
  | 'LastMonth'
  | 'Monthly'
  | 'ThisMonth'
  | 'Today'
  | 'Yearly'
  | 'Yesterday';

/** `/Usage/Records` — usage summarised per category over a window. */
export class UsageRecordsResource extends BaseResource {
  /** `GET /Usage/Records.json` — usage over the requested `StartDate`..`EndDate`. */
  async list(params: ListUsageRecordsParams = {}): Promise<UsageRecordList> {
    return this.#list(null, params);
  }

  /** Lazily walk every page of `/Usage/Records`, following `next_page_uri`. */
  async *iterate(params: ListUsageRecordsParams = {}): AsyncGenerator<UsageRecord, void, void> {
    yield* paginate(this.t, await this.list(params));
  }

  async listAllTime(params: ListUsageRecordsParams = {}): Promise<UsageRecordList> {
    return this.#list('AllTime', params);
  }

  async listDaily(params: ListUsageRecordsParams = {}): Promise<UsageRecordList> {
    return this.#list('Daily', params);
  }

  async listLastMonth(params: ListUsageRecordsParams = {}): Promise<UsageRecordList> {
    return this.#list('LastMonth', params);
  }

  async listMonthly(params: ListUsageRecordsParams = {}): Promise<UsageRecordList> {
    return this.#list('Monthly', params);
  }

  async listThisMonth(params: ListUsageRecordsParams = {}): Promise<UsageRecordList> {
    return this.#list('ThisMonth', params);
  }

  async listToday(params: ListUsageRecordsParams = {}): Promise<UsageRecordList> {
    return this.#list('Today', params);
  }

  async listYearly(params: ListUsageRecordsParams = {}): Promise<UsageRecordList> {
    return this.#list('Yearly', params);
  }

  async listYesterday(params: ListUsageRecordsParams = {}): Promise<UsageRecordList> {
    return this.#list('Yesterday', params);
  }

  async #list(
    window: UsageRecordWindow | null,
    p: ListUsageRecordsParams,
  ): Promise<UsageRecordList> {
    const segments = window === null ? ['Usage', 'Records'] : ['Usage', 'Records', window];
    return this.t.request<UsageRecordList>({
      method: 'GET',
      path: this.path(...segments),
      params: {
        Category: p.Category,
        StartDate: dateOnly(p.StartDate),
        EndDate: dateOnly(p.EndDate),
        IncludeSubaccounts: p.IncludeSubaccounts,
        Page: p.Page,
        PageSize: p.PageSize,
        PageToken: p.PageToken,
      },
    });
  }
}

