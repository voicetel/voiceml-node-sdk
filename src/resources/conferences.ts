import { dateOnly } from '../encoding.js';
import type {
  Conference,
  ConferenceList,
  CreateParticipantRequest,
  EndConferenceRequest,
  ListCallRecordingsParams,
  ListConferencesParams,
  ListParticipantsParams,
  Participant,
  ParticipantList,
  Recording,
  RecordingList,
  StartConferenceRecordingRequest,
  UpdateConferenceRecordingRequest,
  UpdateParticipantRequest,
} from '../models/index.js';
import { paginate } from '../pagination.js';
import { BaseResource } from './base.js';
import { listCallRecordingsToQuery } from './calls.js';

export class ConferencesResource extends BaseResource {
  async list(params: ListConferencesParams = {}): Promise<ConferenceList> {
    return this.t.request<ConferenceList>({
      method: 'GET',
      path: this.path('Conferences'),
      params: listConferencesToQuery(params),
    });
  }

  /** Lazily walk every page of `/Conferences`, following `next_page_uri`. */
  async *iterate(params: ListConferencesParams = {}): AsyncGenerator<Conference, void, void> {
    yield* paginate(this.t, await this.list(params));
  }

  async get(conferenceSid: string): Promise<Conference> {
    return this.t.request<Conference>({
      method: 'GET',
      path: this.path('Conferences', conferenceSid),
    });
  }

  async end(
    conferenceSid: string,
    body: EndConferenceRequest = { Status: 'completed' },
  ): Promise<Conference> {
    return this.t.request<Conference>({
      method: 'POST',
      path: this.path('Conferences', conferenceSid),
      form: body,
    });
  }

  // --- Participants ---

  async listParticipants(
    conferenceSid: string,
    params: ListParticipantsParams = {},
  ): Promise<ParticipantList> {
    return this.t.request<ParticipantList>({
      method: 'GET',
      path: this.path('Conferences', conferenceSid, 'Participants'),
      params,
    });
  }

  async getParticipant(conferenceSid: string, callSid: string): Promise<Participant> {
    return this.t.request<Participant>({
      method: 'GET',
      path: this.path('Conferences', conferenceSid, 'Participants', callSid),
    });
  }

  async updateParticipant(
    conferenceSid: string,
    callSid: string,
    body: UpdateParticipantRequest,
  ): Promise<Participant> {
    return this.t.request<Participant>({
      method: 'POST',
      path: this.path('Conferences', conferenceSid, 'Participants', callSid),
      form: body,
    });
  }

  async kickParticipant(conferenceSid: string, callSid: string): Promise<void> {
    await this.t.request<void>({
      method: 'DELETE',
      path: this.path('Conferences', conferenceSid, 'Participants', callSid),
    });
  }

  async createParticipant(
    conferenceSid: string,
    body: CreateParticipantRequest,
  ): Promise<Participant> {
    return this.t.request<Participant>({
      method: 'POST',
      path: this.path('Conferences', conferenceSid, 'Participants'),
      form: body,
    });
  }

  // --- Recordings ---

  async listRecordings(
    conferenceSid: string,
    params: ListCallRecordingsParams = {},
  ): Promise<RecordingList> {
    return this.t.request<RecordingList>({
      method: 'GET',
      path: this.path('Conferences', conferenceSid, 'Recordings'),
      params: listCallRecordingsToQuery(params),
    });
  }

  /** Start recording a live conference. */
  async startRecording(
    conferenceSid: string,
    body: StartConferenceRecordingRequest = {},
  ): Promise<Recording> {
    return this.t.request<Recording>({
      method: 'POST',
      path: this.path('Conferences', conferenceSid, 'Recordings'),
      form: body,
    });
  }

  async getRecording(conferenceSid: string, recordingSid: string): Promise<Recording> {
    return this.t.request<Recording>({
      method: 'GET',
      path: this.path('Conferences', conferenceSid, 'Recordings', recordingSid),
    });
  }

  async updateRecording(
    conferenceSid: string,
    recordingSid: string,
    body: UpdateConferenceRecordingRequest,
  ): Promise<Recording> {
    return this.t.request<Recording>({
      method: 'POST',
      path: this.path('Conferences', conferenceSid, 'Recordings', recordingSid),
      form: body,
    });
  }

  async deleteRecording(conferenceSid: string, recordingSid: string): Promise<void> {
    await this.t.request<void>({
      method: 'DELETE',
      path: this.path('Conferences', conferenceSid, 'Recordings', recordingSid),
    });
  }
}

function listConferencesToQuery(p: ListConferencesParams): Record<string, unknown> {
  return {
    FriendlyName: p.FriendlyName,
    Status: p.Status,
    DateCreated: dateOnly(p.dateCreated),
    'DateCreated<': p.dateCreatedLt,
    'DateCreated>': p.dateCreatedGt,
    DateUpdated: dateOnly(p.dateUpdated),
    'DateUpdated<': p.dateUpdatedLt,
    'DateUpdated>': p.dateUpdatedGt,
    Page: p.Page,
    PageSize: p.PageSize,
    PageToken: p.PageToken,
  };
}
