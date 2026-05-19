import type { Recording, RecordingAudio, RecordingList } from '../models/index.js';
import { BaseResource } from './base.js';

export class RecordingsResource extends BaseResource {
  list(params: { Page?: number; PageSize?: number } = {}): Promise<RecordingList> {
    return this.t.request<RecordingList>({
      method: 'GET',
      path: this.path('Recordings'),
      params,
    });
  }

  get(recordingSid: string): Promise<Recording> {
    return this.t.request<Recording>({
      method: 'GET',
      path: this.path('Recordings', recordingSid),
    });
  }

  /**
   * Fetch the WAV audio for a recording. Three server delivery shapes are flattened by
   * following any 302 redirect to S3:
   *   - 200 OK: local file present.
   *   - 302 Found: archived to S3; the transport follows the presigned URL.
   *   - 410 Gone: local file gone AND no S3 key. Raises `GoneError`.
   */
  async getAudio(recordingSid: string): Promise<RecordingAudio> {
    const { body, headers } = await this.t.fetchBytes(
      `${this.path('Recordings', recordingSid)}.wav`,
    );
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
