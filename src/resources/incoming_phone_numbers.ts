import type {
  CreateIncomingPhoneNumberRequest,
  IncomingPhoneNumber,
  IncomingPhoneNumberList,
  ListIncomingPhoneNumbersParams,
  ListTypedIncomingPhoneNumbersParams,
  UpdateIncomingPhoneNumberRequest,
} from '../models/index.js';
import { BaseResource } from './base.js';

/**
 * `IncomingPhoneNumbers` — tenant-self-serve DID management (v0.5.0+).
 *
 * Tenant-scoped: only the authenticated account's rows are visible. The path SID may be
 * either the canonical `PN…` form or an E.164 number on input (server normalizes); the
 * response always emits the `PN…` form on `sid`. `phone_number` carries E.164.
 */
export class IncomingPhoneNumbersResource extends BaseResource {
  list(params: ListIncomingPhoneNumbersParams = {}): Promise<IncomingPhoneNumberList> {
    return this.t.request<IncomingPhoneNumberList>({
      method: 'GET',
      path: this.path('IncomingPhoneNumbers'),
      params: { ...params },
    });
  }

  create(body: CreateIncomingPhoneNumberRequest): Promise<IncomingPhoneNumber> {
    return this.t.request<IncomingPhoneNumber>({
      method: 'POST',
      path: this.path('IncomingPhoneNumbers'),
      form: body,
    });
  }

  /**
   * `sid` may be a canonical `PN…` identifier or an E.164 number — the server accepts
   * both during the v0.5.x soft-transition window. Responses always return `PN…`.
   */
  get(sid: string): Promise<IncomingPhoneNumber> {
    return this.t.request<IncomingPhoneNumber>({
      method: 'GET',
      path: this.path('IncomingPhoneNumbers', sid),
    });
  }

  update(sid: string, body: UpdateIncomingPhoneNumberRequest): Promise<IncomingPhoneNumber> {
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

  listLocal(params: ListTypedIncomingPhoneNumbersParams = {}): Promise<IncomingPhoneNumberList> {
    return this.t.request<IncomingPhoneNumberList>({
      method: 'GET',
      path: this.path('IncomingPhoneNumbers', 'Local'),
      params: { ...params },
    });
  }

  createLocal(body: CreateIncomingPhoneNumberRequest): Promise<IncomingPhoneNumber> {
    return this.t.request<IncomingPhoneNumber>({
      method: 'POST',
      path: this.path('IncomingPhoneNumbers', 'Local'),
      form: body,
    });
  }

  listMobile(params: ListTypedIncomingPhoneNumbersParams = {}): Promise<IncomingPhoneNumberList> {
    return this.t.request<IncomingPhoneNumberList>({
      method: 'GET',
      path: this.path('IncomingPhoneNumbers', 'Mobile'),
      params: { ...params },
    });
  }

  createMobile(body: CreateIncomingPhoneNumberRequest): Promise<IncomingPhoneNumber> {
    return this.t.request<IncomingPhoneNumber>({
      method: 'POST',
      path: this.path('IncomingPhoneNumbers', 'Mobile'),
      form: body,
    });
  }

  listTollFree(params: ListTypedIncomingPhoneNumbersParams = {}): Promise<IncomingPhoneNumberList> {
    return this.t.request<IncomingPhoneNumberList>({
      method: 'GET',
      path: this.path('IncomingPhoneNumbers', 'TollFree'),
      params: { ...params },
    });
  }

  createTollFree(body: CreateIncomingPhoneNumberRequest): Promise<IncomingPhoneNumber> {
    return this.t.request<IncomingPhoneNumber>({
      method: 'POST',
      path: this.path('IncomingPhoneNumbers', 'TollFree'),
      form: body,
    });
  }
}
