import type { HttpMethod, PageEnvelope } from './common.js';

export interface Queue {
  sid: string | null;
  account_sid: string | null;
  friendly_name: string | null;
  current_size: number;
  max_size: number;
  average_wait_time: number;
  date_created: string | null;
  date_updated: string | null;
  uri: string | null;
}

export interface QueueList extends PageEnvelope {
  queues: Queue[];
}

export interface QueueMember {
  call_sid: string | null;
  queue_sid: string | null;
  /** @deprecated Not part of the current API response; the server no longer emits it. */
  account_sid?: string;
  date_enqueued: string | null;
  wait_time: number;
  position: number;
  uri: string | null;
}

export interface QueueMemberList extends PageEnvelope {
  queue_members: QueueMember[];
  page: number;
  page_size: number;
  start?: number;
  end?: number;
  first_page_uri?: string;
  next_page_uri?: string | null;
  previous_page_uri?: string | null;
  uri: string;
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
