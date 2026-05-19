import type {
  Conference,
  ConferenceList,
  EndConferenceRequest,
  Participant,
  ParticipantList,
  RecordingList,
  UpdateParticipantRequest,
} from '../models/index.js';
import { BaseResource } from './base.js';

export class ConferencesResource extends BaseResource {
  list(): Promise<ConferenceList> {
    return this.t.request<ConferenceList>({ method: 'GET', path: this.path('Conferences') });
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

  listParticipants(conferenceSid: string): Promise<ParticipantList> {
    return this.t.request<ParticipantList>({
      method: 'GET',
      path: this.path('Conferences', conferenceSid, 'Participants'),
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

  // --- Recordings ---

  listRecordings(conferenceSid: string): Promise<RecordingList> {
    return this.t.request<RecordingList>({
      method: 'GET',
      path: this.path('Conferences', conferenceSid, 'Recordings'),
    });
  }
}
