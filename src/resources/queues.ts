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
import { BaseResource } from './base.js';

export class QueuesResource extends BaseResource {
  create(body: CreateQueueRequest): Promise<Queue> {
    return this.t.request<Queue>({ method: 'POST', path: this.path('Queues'), form: body });
  }

  list(params: ListPageParams = {}): Promise<QueueList> {
    return this.t.request<QueueList>({
      method: 'GET',
      path: this.path('Queues'),
      params: { ...params },
    });
  }

  async *iterate(params: ListPageParams = {}): AsyncGenerator<Queue, void, void> {
    let page = params.Page ?? 0;
    while (true) {
      const chunk = await this.list({ ...params, Page: page });
      for (const item of chunk.queues) yield item;
      if (!chunk.next_page_uri || chunk.queues.length === 0) return;
      page += 1;
    }
  }

  get(queueSid: string): Promise<Queue> {
    return this.t.request<Queue>({ method: 'GET', path: this.path('Queues', queueSid) });
  }

  update(queueSid: string, body: UpdateQueueRequest): Promise<Queue> {
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

  listMembers(queueSid: string, params: ListQueueMembersParams = {}): Promise<QueueMemberList> {
    return this.t.request<QueueMemberList>({
      method: 'GET',
      path: this.path('Queues', queueSid, 'Members'),
      params: { ...params },
    });
  }

  peekFront(queueSid: string): Promise<QueueMember> {
    return this.t.request<QueueMember>({
      method: 'GET',
      path: this.path('Queues', queueSid, 'Members', 'Front'),
    });
  }

  dequeueFront(queueSid: string, body: DequeueRequest): Promise<QueueMember> {
    return this.t.request<QueueMember>({
      method: 'POST',
      path: this.path('Queues', queueSid, 'Members', 'Front'),
      form: body,
    });
  }

  getMember(queueSid: string, callSid: string): Promise<QueueMember> {
    return this.t.request<QueueMember>({
      method: 'GET',
      path: this.path('Queues', queueSid, 'Members', callSid),
    });
  }

  dequeueMember(
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
