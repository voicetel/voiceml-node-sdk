import type {
  Call,
  CallList,
  CallPayment,
  CallTranscription,
  CreateCallRequest,
  CreatePaymentParams,
  EventsList,
  ListCallNotificationsParams,
  ListCallsParams,
  ListPageParams,
  NotificationsList,
  Recording,
  RecordingList,
  ListCallRecordingsParams,
  SiprecList,
  SiprecSession,
  StartRecordingRequest,
  StartSiprecRequest,
  StartStreamRequest,
  StartTranscriptionRequest,
  StopSiprecRequest,
  StopStreamRequest,
  StopTranscriptionRequest,
  Stream,
  StreamList,
  TranscriptionList,
  UpdateCallRequest,
  UpdatePaymentParams,
  UpdateRecordingRequest,
} from '../models/index.js';
import { BaseResource } from './base.js';

export class CallsResource extends BaseResource {
  list(params: ListCallsParams = {}): Promise<CallList> {
    return this.t.request<CallList>({
      method: 'GET',
      path: this.path('Calls'),
      params: listCallsToQuery(params),
    });
  }

  create(body: CreateCallRequest): Promise<Call> {
    return this.t.request<Call>({ method: 'POST', path: this.path('Calls'), form: body });
  }

  get(callSid: string): Promise<Call> {
    return this.t.request<Call>({ method: 'GET', path: this.path('Calls', callSid) });
  }

  update(callSid: string, body: UpdateCallRequest): Promise<Call> {
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

  listRecordings(callSid: string, params: ListCallRecordingsParams = {}): Promise<RecordingList> {
    return this.t.request<RecordingList>({
      method: 'GET',
      path: this.path('Calls', callSid, 'Recordings'),
      params: listCallRecordingsToQuery(params),
    });
  }

  startRecording(callSid: string, body: StartRecordingRequest = {}): Promise<Recording> {
    return this.t.request<Recording>({
      method: 'POST',
      path: this.path('Calls', callSid, 'Recordings'),
      form: body,
    });
  }

  getRecording(callSid: string, recordingSid: string): Promise<Recording> {
    return this.t.request<Recording>({
      method: 'GET',
      path: this.path('Calls', callSid, 'Recordings', recordingSid),
    });
  }

  updateRecording(
    callSid: string,
    recordingSid: string,
    body: UpdateRecordingRequest,
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

  // --- Streams ---

  listStreams(callSid: string): Promise<StreamList> {
    return this.t.request<StreamList>({
      method: 'GET',
      path: this.path('Calls', callSid, 'Streams'),
    });
  }

  startStream(callSid: string, body: StartStreamRequest): Promise<Stream> {
    return this.t.request<Stream>({
      method: 'POST',
      path: this.path('Calls', callSid, 'Streams'),
      form: body,
    });
  }

  getStream(callSid: string, streamSid: string): Promise<Stream> {
    return this.t.request<Stream>({
      method: 'GET',
      path: this.path('Calls', callSid, 'Streams', streamSid),
    });
  }

  stopStream(
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

  // --- SIPREC ---

  listSiprec(callSid: string): Promise<SiprecList> {
    return this.t.request<SiprecList>({
      method: 'GET',
      path: this.path('Calls', callSid, 'Siprec'),
    });
  }

  startSiprec(callSid: string, body: StartSiprecRequest = {}): Promise<SiprecSession> {
    return this.t.request<SiprecSession>({
      method: 'POST',
      path: this.path('Calls', callSid, 'Siprec'),
      form: body,
    });
  }

  getSiprec(callSid: string, siprecSid: string): Promise<SiprecSession> {
    return this.t.request<SiprecSession>({
      method: 'GET',
      path: this.path('Calls', callSid, 'Siprec', siprecSid),
    });
  }

  stopSiprec(
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

  // --- Transcriptions ---

  listTranscriptions(callSid: string): Promise<TranscriptionList> {
    return this.t.request<TranscriptionList>({
      method: 'GET',
      path: this.path('Calls', callSid, 'Transcriptions'),
    });
  }

  startTranscription(
    callSid: string,
    body: StartTranscriptionRequest = {},
  ): Promise<CallTranscription> {
    return this.t.request<CallTranscription>({
      method: 'POST',
      path: this.path('Calls', callSid, 'Transcriptions'),
      form: body,
    });
  }

  getTranscription(callSid: string, transcriptionSid: string): Promise<CallTranscription> {
    return this.t.request<CallTranscription>({
      method: 'GET',
      path: this.path('Calls', callSid, 'Transcriptions', transcriptionSid),
    });
  }

  stopTranscription(
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
  startPayment(callSid: string, params: CreatePaymentParams = {}): Promise<CallPayment> {
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
  updatePayment(
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

  // --- Notifications / Events (compat stubs) ---

  listNotifications(
    callSid: string,
    params: ListCallNotificationsParams = {},
  ): Promise<NotificationsList> {
    return this.t.request<NotificationsList>({
      method: 'GET',
      path: this.path('Calls', callSid, 'Notifications'),
      params: listNotificationsToQuery(params),
    });
  }

  getNotification(
    callSid: string,
    notificationSid: string,
  ): Promise<Record<string, unknown>> {
    return this.t.request<Record<string, unknown>>({
      method: 'GET',
      path: this.path('Calls', callSid, 'Notifications', notificationSid),
    });
  }

  listEvents(callSid: string, params: ListPageParams = {}): Promise<EventsList> {
    return this.t.request<EventsList>({
      method: 'GET',
      path: this.path('Calls', callSid, 'Events'),
      params: { ...params },
    });
  }

  /**
   * `POST /Calls/{sid}/UserDefinedMessages` — server returns 501 (`NotImplementedAPIError`).
   * Mounted for API completeness so consumers get a clean exception rather than discovering
   * the gap at runtime.
   */
  async sendUserDefinedMessage(callSid: string, payload?: Record<string, unknown>): Promise<void> {
    await this.t.request<void>({
      method: 'POST',
      path: this.path('Calls', callSid, 'UserDefinedMessages'),
      form: payload ?? null,
    });
  }

  /**
   * Walk every page of `/Calls` and yield individual `Call` records. Use for medium pulls;
   * for very large result sets, page manually via `list()` + `next_page_uri`.
   */
  async *iterate(params: ListCallsParams = {}): AsyncGenerator<Call, void, void> {
    let page = params.Page ?? 0;
    while (true) {
      const chunk = await this.list({ ...params, Page: page });
      for (const call of chunk.calls) yield call;
      if (!chunk.next_page_uri || chunk.calls.length === 0) return;
      page += 1;
    }
  }
}

function listCallRecordingsToQuery(p: ListCallRecordingsParams): Record<string, unknown> {
  return {
    DateCreated: p.dateCreated,
    'DateCreated<': p.dateCreatedLt,
    'DateCreated>': p.dateCreatedGt,
    Page: p.Page,
    PageSize: p.PageSize,
    PageToken: p.PageToken,
  };
}

function listNotificationsToQuery(p: ListCallNotificationsParams): Record<string, unknown> {
  return {
    Page: p.Page,
    PageSize: p.PageSize,
    PageToken: p.PageToken,
    Log: p.Log,
    MessageDate: p.messageDate,
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
    StartTime: p.startTime,
    'StartTime<': p.startTimeLt,
    'StartTime>': p.startTimeGt,
    EndTime: p.endTime,
    'EndTime<': p.endTimeLt,
    'EndTime>': p.endTimeGt,
    // Legacy inclusive bounds — still accepted by the server.
    'StartTime>=': p.startTimeGte,
    'StartTime<=': p.startTimeLte,
    Page: p.Page,
    PageSize: p.PageSize,
    PageToken: p.PageToken,
  };
}
