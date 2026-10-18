import type {
  CreateIncomingPhoneNumberRequest,
  CreateTypedIncomingPhoneNumberRequest,
  IncomingPhoneNumber,
  IncomingPhoneNumberList,
  ListIncomingPhoneNumbersParams,
  ListTypedIncomingPhoneNumbersParams,
  UpdateIncomingPhoneNumberRequest,
} from '../models/index.js';
import { paginate } from '../pagination.js';
import { BaseResource } from './base.js';

/**
 * `IncomingPhoneNumbers` — tenant-self-serve DID management.
 *
 * Tenant-scoped: only the authenticated account's rows are visible. The path SID may be
 * either the canonical `PN…` form or an E.164 number on input (server normalizes; the SDK
 * percent-encodes the `+`); the response always emits the `PN…` form on `sid`.
 */
export class IncomingPhoneNumbersResource extends BaseResource {
  async list(params: ListIncomingPhoneNumbersParams = {}): Promise<IncomingPhoneNumberList> {
    return this.t.request<IncomingPhoneNumberList>({
      method: 'GET',
      path: this.path('IncomingPhoneNumbers'),
      params,
    });
  }

  /** Lazily walk every page of `/IncomingPhoneNumbers`, following `next_page_uri`. */
  async *iterate(
    params: ListIncomingPhoneNumbersParams = {},
  ): AsyncGenerator<IncomingPhoneNumber, void, void> {
    yield* paginate(this.t, await this.list(params));
  }

  async create(body: CreateIncomingPhoneNumberRequest): Promise<IncomingPhoneNumber> {
    return this.t.request<IncomingPhoneNumber>({
      method: 'POST',
      path: this.path('IncomingPhoneNumbers'),
      form: body,
    });
  }

  /** `sid` may be a canonical `PN…` identifier or an E.164 number. Responses always return `PN…`. */
  async get(sid: string): Promise<IncomingPhoneNumber> {
    return this.t.request<IncomingPhoneNumber>({
      method: 'GET',
      path: this.path('IncomingPhoneNumbers', sid),
    });
  }

  async update(sid: string, body: UpdateIncomingPhoneNumberRequest): Promise<IncomingPhoneNumber> {
    return this.t.request<IncomingPhoneNumber>({
      method: 'POST',
      path: this.path('IncomingPhoneNumbers', sid),
      form: body,
    });
  }

  async delete(sid: string): Promise<void> {
    await this.t.request<void>({
      method: 'DELETE',
      path: this.path('IncomingPhoneNumbers', sid),
    });
  }

  async listLocal(
    params: ListTypedIncomingPhoneNumbersParams = {},
  ): Promise<IncomingPhoneNumberList> {
    return this.t.request<IncomingPhoneNumberList>({
      method: 'GET',
      path: this.path('IncomingPhoneNumbers', 'Local'),
      params,
    });
  }

  async createLocal(body: CreateTypedIncomingPhoneNumberRequest): Promise<IncomingPhoneNumber> {
    return this.t.request<IncomingPhoneNumber>({
      method: 'POST',
      path: this.path('IncomingPhoneNumbers', 'Local'),
      form: body,
    });
  }

  async listMobile(
    params: ListTypedIncomingPhoneNumbersParams = {},
  ): Promise<IncomingPhoneNumberList> {
    return this.t.request<IncomingPhoneNumberList>({
      method: 'GET',
      path: this.path('IncomingPhoneNumbers', 'Mobile'),
      params,
    });
  }

  async createMobile(body: CreateTypedIncomingPhoneNumberRequest): Promise<IncomingPhoneNumber> {
    return this.t.request<IncomingPhoneNumber>({
      method: 'POST',
      path: this.path('IncomingPhoneNumbers', 'Mobile'),
      form: body,
    });
  }

  async listTollFree(
    params: ListTypedIncomingPhoneNumbersParams = {},
  ): Promise<IncomingPhoneNumberList> {
    return this.t.request<IncomingPhoneNumberList>({
      method: 'GET',
      path: this.path('IncomingPhoneNumbers', 'TollFree'),
      params,
    });
  }

  async createTollFree(
    body: CreateTypedIncomingPhoneNumberRequest,
  ): Promise<IncomingPhoneNumber> {
    return this.t.request<IncomingPhoneNumber>({
      method: 'POST',
      path: this.path('IncomingPhoneNumbers', 'TollFree'),
      form: body,
    });
  }
}
