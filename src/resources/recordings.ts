import type {
  Recording,
  RecordingAudio,
  RecordingList,
  GetRecordingParams,
  ListRecordingsParams,
} from '../models/index.js';
import { BaseResource } from './base.js';

export class RecordingsResource extends BaseResource {
  list(params: ListRecordingsParams = {}): Promise<RecordingList> {
    return this.t.request<RecordingList>({
      method: 'GET',
      path: this.path('Recordings'),
      params: listRecordingsToQuery(params),
    });
  }

  get(recordingSid: string, params: GetRecordingParams = {}): Promise<Recording> {
    return this.t.request<Recording>({
      method: 'GET',
      path: this.path('Recordings', recordingSid),
      params: getRecordingToQuery(params),
    });
  }

  /**
   * Fetch the WAV audio for a recording. Three server delivery shapes are flattened by
   * following any 302 redirect to S3:
   *   - 200 OK: local file present.
   *   - 302 Found: archived to S3; the transport follows the presigned URL.
   *   - 410 Gone: local file gone AND no S3 key. Raises `GoneError`.
   *
   * Audio is served at `…/Recordings/{Sid}.wav` — the canonical `.json` suffix used by
   * the JSON REST surface is intentionally NOT appended here.
   */
  async getAudio(recordingSid: string): Promise<RecordingAudio> {
    const wavPath =
      `/2010-04-01/Accounts/${this.t.accountSid}/Recordings/${recordingSid}.wav`;
    const { body, headers } = await this.t.fetchBytes(wavPath);
    return {
      sid: recordingSid,
      body,
      contentType: headers.get('content-type') ?? 'application/octet-stream',
    };
  }

  async delete(recordingSid: string): Promise<void> {
    await this.t.request<void>({
      method: 'DELETE',
      path: this.path('Recordings', recordingSid),
    });
  }
}

function listRecordingsToQuery(p: ListRecordingsParams): Record<string, unknown> {
  return {
    DateCreated: p.dateCreated,
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

function getRecordingToQuery(p: GetRecordingParams): Record<string, unknown> {
  return {
    IncludeSoftDeleted: p.IncludeSoftDeleted,
  };
}
