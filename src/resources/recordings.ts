import { dateOnly } from '../encoding.js';
import type {
  GetRecordingParams,
  ListRecordingsParams,
  ListTranscriptionsParams,
  Recording,
  RecordingAudio,
  RecordingList,
  Transcription,
  TranscriptionList,
} from '../models/index.js';
import { paginate } from '../pagination.js';
import { BaseResource } from './base.js';

export class RecordingsResource extends BaseResource {
  async list(params: ListRecordingsParams = {}): Promise<RecordingList> {
    return this.t.request<RecordingList>({
      method: 'GET',
      path: this.path('Recordings'),
      params: listRecordingsToQuery(params),
    });
  }

  /** Lazily walk every page of `/Recordings`, following `next_page_uri`. */
  async *iterate(params: ListRecordingsParams = {}): AsyncGenerator<Recording, void, void> {
    yield* paginate(this.t, await this.list(params));
  }

  async get(recordingSid: string, params: GetRecordingParams = {}): Promise<Recording> {
    return this.t.request<Recording>({
      method: 'GET',
      path: this.path('Recordings', recordingSid),
      params: { IncludeSoftDeleted: params.IncludeSoftDeleted },
    });
  }

  /**
   * Download the WAV audio for a recording (`GET …/Recordings/{Sid}.wav`, authenticated).
   * The server answers in one of three ways:
   *   - 200 OK: the local file, returned directly.
   *   - 302 Found: archived to storage; the SDK follows the presigned `Location` **without**
   *     the `Authorization` header (it is dropped whenever the host or scheme changes, and an
   *     https→http downgrade is refused).
   *   - 410 Gone: no local file and no archive — raises `GoneError`.
   *
   * Uses the client's `fetch`, `timeoutMs` (covering the full body) and retry policy.
   */
  async getAudio(recordingSid: string): Promise<RecordingAudio> {
    const res = await this.t.fetchBytes({
      path: this.pathWithSuffix('.wav', 'Recordings', recordingSid),
      accept: 'audio/*, */*',
    });
    return {
      sid: recordingSid,
      body: res.body,
      contentType: res.headers.get('content-type') ?? 'application/octet-stream',
      redirected: res.redirected,
    };
  }

  async delete(recordingSid: string): Promise<void> {
    await this.t.request<void>({
      method: 'DELETE',
      path: this.path('Recordings', recordingSid),
    });
  }

  // --- Transcriptions of a recording ---

  async listTranscriptions(
    recordingSid: string,
    params: ListTranscriptionsParams = {},
  ): Promise<TranscriptionList> {
    return this.t.request<TranscriptionList>({
      method: 'GET',
      path: this.path('Recordings', recordingSid, 'Transcriptions'),
      params: listTranscriptionsToQuery(params),
    });
  }

  async getTranscription(recordingSid: string, transcriptionSid: string): Promise<Transcription> {
    return this.t.request<Transcription>({
      method: 'GET',
      path: this.path('Recordings', recordingSid, 'Transcriptions', transcriptionSid),
    });
  }

  async deleteTranscription(recordingSid: string, transcriptionSid: string): Promise<void> {
    await this.t.request<void>({
      method: 'DELETE',
      path: this.path('Recordings', recordingSid, 'Transcriptions', transcriptionSid),
    });
  }
}

/** Account-wide `/Transcriptions` (recording transcriptions across every recording). */
export class TranscriptionsResource extends BaseResource {
  async list(params: ListTranscriptionsParams = {}): Promise<TranscriptionList> {
    return this.t.request<TranscriptionList>({
      method: 'GET',
      path: this.path('Transcriptions'),
      params: listTranscriptionsToQuery(params),
    });
  }

  /** Lazily walk every page of `/Transcriptions`, following `next_page_uri`. */
  async *iterate(
    params: ListTranscriptionsParams = {},
  ): AsyncGenerator<Transcription, void, void> {
    yield* paginate(this.t, await this.list(params));
  }

  async get(transcriptionSid: string): Promise<Transcription> {
    return this.t.request<Transcription>({
      method: 'GET',
      path: this.path('Transcriptions', transcriptionSid),
    });
  }

  async delete(transcriptionSid: string): Promise<void> {
    await this.t.request<void>({
      method: 'DELETE',
      path: this.path('Transcriptions', transcriptionSid),
    });
  }
}

function listRecordingsToQuery(p: ListRecordingsParams): Record<string, unknown> {
  return {
    DateCreated: dateOnly(p.dateCreated),
    'DateCreated<': p.dateCreatedLt,
    'DateCreated>': p.dateCreatedGt,
    CallSid: p.CallSid,
    ConferenceSid: p.ConferenceSid,
    IncludeSoftDeleted: p.IncludeSoftDeleted,
    Page: p.Page,
    PageSize: p.PageSize,
    PageToken: p.PageToken,
  };
}

function listTranscriptionsToQuery(p: ListTranscriptionsParams): Record<string, unknown> {
  return {
    DateCreated: dateOnly(p.dateCreated),
    'DateCreated<': p.dateCreatedLt,
    'DateCreated>': p.dateCreatedGt,
    Page: p.Page,
    PageSize: p.PageSize,
    PageToken: p.PageToken,
  };
}
