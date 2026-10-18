import { dateOnly } from '../encoding.js';
import type {
  Call,
  CallEventList,
  CallList,
  CallPayment,
  CallTranscription,
  CreateCallRequest,
  CreatePaymentParams,
  ListCallNotificationsParams,
  ListCallRecordingsParams,
  ListCallsParams,
  ListPageParams,
  Notification,
  NotificationList,
  Recording,
  RecordingList,
  SiprecSession,
  StartRecordingRequest,
  StartSiprecRequest,
  StartStreamRequest,
  StartTranscriptionRequest,
  StopSiprecRequest,
  StopStreamRequest,
  StopTranscriptionRequest,
  Stream,
  UpdateCallRecordingRequest,
  UpdateCallRequest,
  UpdatePaymentParams,
} from '../models/index.js';
import { paginate } from '../pagination.js';
import { BaseResource } from './base.js';

export class CallsResource extends BaseResource {
  async list(params: ListCallsParams = {}): Promise<CallList> {
    return this.t.request<CallList>({
      method: 'GET',
      path: this.path('Calls'),
      params: listCallsToQuery(params),
    });
  }

  async create(body: CreateCallRequest): Promise<Call> {
    return this.t.request<Call>({ method: 'POST', path: this.path('Calls'), form: body });
  }

  async get(callSid: string): Promise<Call> {
    return this.t.request<Call>({ method: 'GET', path: this.path('Calls', callSid) });
  }

  async update(callSid: string, body: UpdateCallRequest): Promise<Call> {
    return this.t.request<Call>({
      method: 'POST',
      path: this.path('Calls', callSid),
      form: body,
    });
  }

  async delete(callSid: string): Promise<void> {
    await this.t.request<void>({ method: 'DELETE', path: this.path('Calls', callSid) });
  }

  // --- Recordings (call-scoped) ---

  async listRecordings(
    callSid: string,
    params: ListCallRecordingsParams = {},
  ): Promise<RecordingList> {
    return this.t.request<RecordingList>({
      method: 'GET',
      path: this.path('Calls', callSid, 'Recordings'),
      params: listCallRecordingsToQuery(params),
    });
  }

  async startRecording(callSid: string, body: StartRecordingRequest = {}): Promise<Recording> {
    return this.t.request<Recording>({
      method: 'POST',
      path: this.path('Calls', callSid, 'Recordings'),
      form: body,
    });
  }

  async getRecording(callSid: string, recordingSid: string): Promise<Recording> {
    return this.t.request<Recording>({
      method: 'GET',
      path: this.path('Calls', callSid, 'Recordings', recordingSid),
    });
  }

  /**
   * Pause, resume or stop a call recording. `recordingSid` may be `Twilio.CURRENT` to target
   * the call's active recording.
   */
  async updateRecording(
    callSid: string,
    recordingSid: string,
    body: UpdateCallRecordingRequest,
  ): Promise<Recording> {
    return this.t.request<Recording>({
      method: 'POST',
      path: this.path('Calls', callSid, 'Recordings', recordingSid),
      form: body,
    });
  }

  async deleteRecording(callSid: string, recordingSid: string): Promise<void> {
    await this.t.request<void>({
      method: 'DELETE',
      path: this.path('Calls', callSid, 'Recordings', recordingSid),
    });
  }

  // --- Media Streams (start / stop) ---

  async startStream(callSid: string, body: StartStreamRequest): Promise<Stream> {
    return this.t.request<Stream>({
      method: 'POST',
      path: this.path('Calls', callSid, 'Streams'),
      form: body,
    });
  }

  async stopStream(
    callSid: string,
    streamSid: string,
    body: StopStreamRequest = { Status: 'stopped' },
  ): Promise<Stream> {
    return this.t.request<Stream>({
      method: 'POST',
      path: this.path('Calls', callSid, 'Streams', streamSid),
      form: body,
    });
  }

  // --- SIPREC (start / stop) ---

  async startSiprec(callSid: string, body: StartSiprecRequest = {}): Promise<SiprecSession> {
    return this.t.request<SiprecSession>({
      method: 'POST',
      path: this.path('Calls', callSid, 'Siprec'),
      form: body,
    });
  }

  async stopSiprec(
    callSid: string,
    siprecSid: string,
    body: StopSiprecRequest = { Status: 'stopped' },
  ): Promise<SiprecSession> {
    return this.t.request<SiprecSession>({
      method: 'POST',
      path: this.path('Calls', callSid, 'Siprec', siprecSid),
      form: body,
    });
  }

  // --- Real-time transcriptions (start / stop) ---

  async startTranscription(
    callSid: string,
    body: StartTranscriptionRequest = {},
  ): Promise<CallTranscription> {
    return this.t.request<CallTranscription>({
      method: 'POST',
      path: this.path('Calls', callSid, 'Transcriptions'),
      form: body,
    });
  }

  async stopTranscription(
    callSid: string,
    transcriptionSid: string,
    body: StopTranscriptionRequest = { Status: 'stopped' },
  ): Promise<CallTranscription> {
    return this.t.request<CallTranscription>({
      method: 'POST',
      path: this.path('Calls', callSid, 'Transcriptions', transcriptionSid),
      form: body,
    });
  }

  // --- Payments (<Pay> REST companion) ---

  /**
   * Begin a `<Pay>` session on the live call. Returns 201 with the freshly-minted
   * `CallPayment`. Returns 403 when the tenant is not `pay_enabled` or has no
   * `stripe_secret_key` configured.
   */
  async startPayment(callSid: string, params: CreatePaymentParams = {}): Promise<CallPayment> {
    return this.t.request<CallPayment>({
      method: 'POST',
      path: this.path('Calls', callSid, 'Payments'),
      form: params,
    });
  }

  /**
   * Advance or terminate an existing Pay session. `Status=complete` captures the collected
   * fields; `Status=cancel` aborts the session. `Capture=...` tells the runtime which input
   * the user is about to type next.
   */
  async updatePayment(
    callSid: string,
    paymentSid: string,
    params: UpdatePaymentParams,
  ): Promise<CallPayment> {
    return this.t.request<CallPayment>({
      method: 'POST',
      path: this.path('Calls', callSid, 'Payments', paymentSid),
      form: params,
    });
  }

  // --- Notifications / Events ---

  async listNotifications(
    callSid: string,
    params: ListCallNotificationsParams = {},
  ): Promise<NotificationList> {
    return this.t.request<NotificationList>({
      method: 'GET',
      path: this.path('Calls', callSid, 'Notifications'),
      params: listNotificationsToQuery(params),
    });
  }

  async getNotification(callSid: string, notificationSid: string): Promise<Notification> {
    return this.t.request<Notification>({
      method: 'GET',
      path: this.path('Calls', callSid, 'Notifications', notificationSid),
    });
  }

  async listEvents(callSid: string, params: ListPageParams = {}): Promise<CallEventList> {
    return this.t.request<CallEventList>({
      method: 'GET',
      path: this.path('Calls', callSid, 'Events'),
      params,
    });
  }

  /**
   * `POST /Calls/{sid}/UserDefinedMessages` — the server answers 501
   * (`NotImplementedAPIError`). Mounted so callers get a typed error rather than a missing
   * method. The spec defines no body fields for this operation.
   */
  async sendUserDefinedMessage(callSid: string): Promise<void> {
    await this.t.request<void>({
      method: 'POST',
      path: this.path('Calls', callSid, 'UserDefinedMessages'),
    });
  }

  /**
   * Lazily walk every page of `/Calls`, following the server's `next_page_uri` (which carries
   * the `PageToken`), and yield individual `Call` records. Breaking out of the loop stops
   * further requests.
   */
  async *iterate(params: ListCallsParams = {}): AsyncGenerator<Call, void, void> {
    yield* paginate(this.t, await this.list(params));
  }
}

export function listCallRecordingsToQuery(p: ListCallRecordingsParams): Record<string, unknown> {
  return {
    DateCreated: dateOnly(p.dateCreated),
    'DateCreated<': p.dateCreatedLt,
    'DateCreated>': p.dateCreatedGt,
    Page: p.Page,
    PageSize: p.PageSize,
    PageToken: p.PageToken,
  };
}

export function listNotificationsToQuery(p: ListCallNotificationsParams): Record<string, unknown> {
  return {
    Page: p.Page,
    PageSize: p.PageSize,
    PageToken: p.PageToken,
    Log: p.Log,
    MessageDate: dateOnly(p.messageDate),
    'MessageDate<': p.messageDateLt,
    'MessageDate>': p.messageDateGt,
  };
}

function listCallsToQuery(p: ListCallsParams): Record<string, unknown> {
  return {
    To: p.To,
    From: p.From,
    Status: p.Status,
    ParentCallSid: p.ParentCallSid,
    StartTime: dateOnly(p.startTime),
    'StartTime<': p.startTimeLt,
    'StartTime>': p.startTimeGt,
    EndTime: dateOnly(p.endTime),
    'EndTime<': p.endTimeLt,
    'EndTime>': p.endTimeGt,
    Page: p.Page,
    PageSize: p.PageSize,
    PageToken: p.PageToken,
  };
}
