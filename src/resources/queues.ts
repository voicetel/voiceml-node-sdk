import type {
  CreateQueueRequest,
  DequeueRequest,
  ListPageParams,
  ListQueueMembersParams,
  Queue,
  QueueList,
  QueueMember,
  QueueMemberList,
  UpdateQueueRequest,
} from '../models/index.js';
import { paginate } from '../pagination.js';
import { BaseResource } from './base.js';

export class QueuesResource extends BaseResource {
  async create(body: CreateQueueRequest): Promise<Queue> {
    return this.t.request<Queue>({ method: 'POST', path: this.path('Queues'), form: body });
  }

  async list(params: ListPageParams = {}): Promise<QueueList> {
    return this.t.request<QueueList>({
      method: 'GET',
      path: this.path('Queues'),
      params,
    });
  }

  /** Lazily walk every page of `/Queues`, following `next_page_uri`. */
  async *iterate(params: ListPageParams = {}): AsyncGenerator<Queue, void, void> {
    yield* paginate(this.t, await this.list(params));
  }

  async get(queueSid: string): Promise<Queue> {
    return this.t.request<Queue>({ method: 'GET', path: this.path('Queues', queueSid) });
  }

  async update(queueSid: string, body: UpdateQueueRequest): Promise<Queue> {
    return this.t.request<Queue>({
      method: 'POST',
      path: this.path('Queues', queueSid),
      form: body,
    });
  }

  async delete(queueSid: string): Promise<void> {
    await this.t.request<void>({ method: 'DELETE', path: this.path('Queues', queueSid) });
  }

  // --- Members ---

  async listMembers(
    queueSid: string,
    params: ListQueueMembersParams = {},
  ): Promise<QueueMemberList> {
    return this.t.request<QueueMemberList>({
      method: 'GET',
      path: this.path('Queues', queueSid, 'Members'),
      params,
    });
  }

  async peekFront(queueSid: string): Promise<QueueMember> {
    return this.t.request<QueueMember>({
      method: 'GET',
      path: this.path('Queues', queueSid, 'Members', 'Front'),
    });
  }

  async dequeueFront(queueSid: string, body: DequeueRequest): Promise<QueueMember> {
    return this.t.request<QueueMember>({
      method: 'POST',
      path: this.path('Queues', queueSid, 'Members', 'Front'),
      form: body,
    });
  }

  async getMember(queueSid: string, callSid: string): Promise<QueueMember> {
    return this.t.request<QueueMember>({
      method: 'GET',
      path: this.path('Queues', queueSid, 'Members', callSid),
    });
  }

  async dequeueMember(
    queueSid: string,
    callSid: string,
    body: DequeueRequest,
  ): Promise<QueueMember> {
    return this.t.request<QueueMember>({
      method: 'POST',
      path: this.path('Queues', queueSid, 'Members', callSid),
      form: body,
    });
  }
}
