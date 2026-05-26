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
  UpdateParticipantRequest,
  UpdateRecordingRequest,
} from '../models/index.js';
import { BaseResource } from './base.js';

export class ConferencesResource extends BaseResource {
  list(params: ListConferencesParams = {}): Promise<ConferenceList> {
    return this.t.request<ConferenceList>({
      method: 'GET',
      path: this.path('Conferences'),
      params: listConferencesToQuery(params),
    });
  }

  async *iterate(params: ListConferencesParams = {}): AsyncGenerator<Conference, void, void> {
    let page = params.Page ?? 0;
    while (true) {
      const chunk = await this.list({ ...params, Page: page });
      for (const item of chunk.conferences) yield item;
      if (!chunk.next_page_uri || chunk.conferences.length === 0) return;
      page += 1;
    }
  }

  get(conferenceSid: string): Promise<Conference> {
    return this.t.request<Conference>({
      method: 'GET',
      path: this.path('Conferences', conferenceSid),
    });
  }

  end(
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

  listParticipants(
    conferenceSid: string,
    params: ListParticipantsParams = {},
  ): Promise<ParticipantList> {
    return this.t.request<ParticipantList>({
      method: 'GET',
      path: this.path('Conferences', conferenceSid, 'Participants'),
      params: { ...params },
    });
  }

  getParticipant(conferenceSid: string, callSid: string): Promise<Participant> {
    return this.t.request<Participant>({
      method: 'GET',
      path: this.path('Conferences', conferenceSid, 'Participants', callSid),
    });
  }

  updateParticipant(
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

  createParticipant(
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

  listRecordings(
    conferenceSid: string,
    params: ListCallRecordingsParams = {},
  ): Promise<RecordingList> {
    return this.t.request<RecordingList>({
      method: 'GET',
      path: this.path('Conferences', conferenceSid, 'Recordings'),
      params: listCallRecordingsToQuery(params),
    });
  }

  getRecording(conferenceSid: string, recordingSid: string): Promise<Recording> {
    return this.t.request<Recording>({
      method: 'GET',
      path: this.path('Conferences', conferenceSid, 'Recordings', recordingSid),
    });
  }

  updateRecording(
    conferenceSid: string,
    recordingSid: string,
    body: UpdateRecordingRequest,
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
    DateCreated: p.dateCreated,
    'DateCreated<': p.dateCreatedLt,
    'DateCreated>': p.dateCreatedGt,
    DateUpdated: p.dateUpdated,
    'DateUpdated<': p.dateUpdatedLt,
    'DateUpdated>': p.dateUpdatedGt,
    Page: p.Page,
    PageSize: p.PageSize,
    PageToken: p.PageToken,
  };
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
