import type {
  Application,
  ApplicationList,
  CreateApplicationRequest,
  ListApplicationsParams,
  UpdateApplicationRequest,
} from '../models/index.js';
import { paginate } from '../pagination.js';
import { BaseResource } from './base.js';

export class ApplicationsResource extends BaseResource {
  async create(body: CreateApplicationRequest): Promise<Application> {
    return this.t.request<Application>({
      method: 'POST',
      path: this.path('Applications'),
      form: body,
    });
  }

  async list(params: ListApplicationsParams = {}): Promise<ApplicationList> {
    return this.t.request<ApplicationList>({
      method: 'GET',
      path: this.path('Applications'),
      params,
    });
  }

  /** Lazily walk every page of `/Applications`, following `next_page_uri`. */
  async *iterate(params: ListApplicationsParams = {}): AsyncGenerator<Application, void, void> {
    yield* paginate(this.t, await this.list(params));
  }

  async get(applicationSid: string): Promise<Application> {
    return this.t.request<Application>({
      method: 'GET',
      path: this.path('Applications', applicationSid),
    });
  }

  async update(applicationSid: string, body: UpdateApplicationRequest): Promise<Application> {
    return this.t.request<Application>({
      method: 'POST',
      path: this.path('Applications', applicationSid),
      form: body,
    });
  }

  async delete(applicationSid: string): Promise<void> {
    await this.t.request<void>({
      method: 'DELETE',
      path: this.path('Applications', applicationSid),
    });
  }
}
