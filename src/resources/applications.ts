import type {
  Application,
  ApplicationList,
  CreateApplicationRequest,
  UpdateApplicationRequest,
} from '../models/index.js';
import { BaseResource } from './base.js';

export class ApplicationsResource extends BaseResource {
  create(body: CreateApplicationRequest): Promise<Application> {
    return this.t.request<Application>({
      method: 'POST',
      path: this.path('Applications'),
      form: body,
    });
  }

  list(): Promise<ApplicationList> {
    return this.t.request<ApplicationList>({ method: 'GET', path: this.path('Applications') });
  }

  get(applicationSid: string): Promise<Application> {
    return this.t.request<Application>({
      method: 'GET',
      path: this.path('Applications', applicationSid),
    });
  }

  update(applicationSid: string, body: UpdateApplicationRequest): Promise<Application> {
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
