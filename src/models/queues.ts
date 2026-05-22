import type { HttpMethod, PageEnvelope } from './common.js';

export interface Queue {
  sid: string;
  account_sid: string;
  friendly_name: string;
  current_size: number;
  max_size: number;
  average_wait_time: number;
  date_created: string;
  date_updated: string;
  uri: string;
}

export interface QueueList extends PageEnvelope {
  queues: Queue[];
}

export interface QueueMember {
  call_sid: string;
  queue_sid: string;
  account_sid: string;
  date_enqueued: string;
  wait_time: number;
  position: number;
  uri: string;
}

export interface QueueMemberList extends PageEnvelope {
  queue_members: QueueMember[];
}

/** Body for `POST /Queues`. Idempotent on `FriendlyName`. `MaxSize` 0 = unlimited (Twilio default). */
export interface CreateQueueRequest {
  FriendlyName: string;
  MaxSize?: number;
}

export interface UpdateQueueRequest {
  FriendlyName?: string;
  MaxSize?: number;
}

/** Body for the two dequeue endpoints (`/Members/Front` + `/Members/{CallSid}`). */
export interface DequeueRequest {
  Url: string;
  Method?: HttpMethod;
}

export interface ListQueueMembersParams {
  Page?: number;
  PageSize?: number;
  PageToken?: string;
}
