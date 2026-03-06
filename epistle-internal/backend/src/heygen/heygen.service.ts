import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import fetch from 'node-fetch';
import { SupabaseService } from '../supabase/supabase.service';

export interface HeyGenAvatar {
  id: string;
  default_voice_id: string | null;
}

interface HeyGenListAvatarsResponse {
  data: {
    avatars: HeyGenAvatar[];
  };
}

interface HeyGenAvatarDetailsResponse {
  data: HeyGenAvatar;
}

interface HeyGenCreateVideoResponse {
  data: {
    video_id: string;
  };
}

interface HeyGenVideoStatusResponse {
  data: {
    status: 'waiting' | 'pending' | 'processing' | 'completed' | 'failed';
    video_url?: string;
    error?: string;
  };
}

@Injectable()
export class HeygenService {
  private readonly logger = new Logger(HeygenService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.heygen.com';

  constructor(
    private readonly config: ConfigService,
    private readonly supabase: SupabaseService,
  ) {
    const key = this.config.get<string>('HEYGEN_API_KEY');
    if (!key) {
      throw new Error('HEYGEN_API_KEY must be set');
    }
    this.apiKey = key;
  }

  private get sup() {
    return this.supabase.getClient();
  }

  async listAvatars(): Promise<HeyGenAvatar[]> {
    const resp = await this.request<HeyGenListAvatarsResponse>('/v2/avatars', {
      method: 'GET',
    });
    return resp.data.avatars;
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const safeInit = init ?? {};
    const { body, ...rest } = safeInit as RequestInit & { body?: any | null };

    const res = await fetch(`${this.baseUrl}${path}`, {
      ...rest,
      body: body ?? undefined,
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': this.apiKey,
      },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HeyGen request failed: ${res.status} ${text}`);
    }
    return (await res.json()) as T;
  }

  async resolveDefaultVoiceId(heygenAvatarId: string): Promise<string> {
    const resp = await this.request<HeyGenAvatarDetailsResponse>(
      `/v2/avatar/${encodeURIComponent(heygenAvatarId)}/details`,
      {
        method: 'GET',
      },
    );
    const avatar = resp.data;
    if (!avatar) {
      throw new Error(`Avatar ${heygenAvatarId} not found in HeyGen`);
    }
    if (!avatar.default_voice_id) {
      throw new Error('Avatar has no default voice');
    }
    return avatar.default_voice_id;
  }

  async createVideoForVerse(params: {
    verseId: string;
    firstPersonVersion: string;
    heygenAvatarId: string;
    voiceId: string;
  }): Promise<string> {
    const body = {
      video_inputs: [
        {
          character: { type: 'avatar', avatar_id: params.heygenAvatarId },
          voice: {
            type: 'text',
            voice_id: params.voiceId,
            input_text: params.firstPersonVersion,
          },
          background: { type: 'color', value: '#FFFFFF' },
        },
      ],
      callback_id: params.verseId,
    };

    const resp = await this.request<HeyGenCreateVideoResponse>('/v2/video/generate', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return resp.data.video_id;
  }

  async getVideoStatus(videoId: string): Promise<HeyGenVideoStatusResponse['data']> {
    const resp = await this.request<HeyGenVideoStatusResponse>(
      `/v1/video_status.get?video_id=${encodeURIComponent(videoId)}`,
      { method: 'GET' },
    );
    return resp.data;
  }

  async pollUntilCompleted(verseId: string, videoId: string): Promise<void> {
    const pollIntervalMs = 60 * 1000; // 60 seconds
    const maxAttempts = 120; // ~2 hours max

    const tryPoll = async (attempt: number): Promise<void> => {
      if (attempt > maxAttempts) {
        this.logger.warn(`Stopping polling for verse ${verseId}, video ${videoId} after max attempts`);
        return;
      }

      try {
        const status = await this.getVideoStatus(videoId);
        if (status.status === 'completed' && status.video_url) {
          await this.handleCompletion({
            verseId,
            videoUrl: status.video_url,
          });
          return;
        }
        if (status.status === 'failed') {
          const errorDetails =
            typeof status.error === 'string'
              ? status.error
              : status.error
              ? JSON.stringify(status.error)
              : 'unknown error';
          this.logger.error(
            `HeyGen video ${videoId} for verse ${verseId} failed: ${errorDetails}. Raw status: ${JSON.stringify(
              status,
            )}`,
          );
          return;
        }
      } catch (e: any) {
        this.logger.error(
          `Error polling HeyGen status for video ${videoId} (attempt ${attempt}): ${e?.message ?? e}`,
        );
      }

      setTimeout(() => {
        void tryPoll(attempt + 1);
      }, pollIntervalMs);
    };

    void tryPoll(1);
  }

  async handleCompletion(params: {
    verseId: string;
    videoUrl: string;
    filename?: string;
  }): Promise<void> {
    const { verseId, videoUrl } = params;

    const { data: verse, error: verseError } = await this.sup
      .from('epistle_verses')
      .select('id, character_id, heygen_video_path')
      .eq('id', verseId)
      .single();
    if (verseError || !verse) {
      this.logger.error(`Verse ${verseId} not found or error: ${verseError?.message}`);
      return;
    }

    if (verse.heygen_video_path) {
      this.logger.log(`Verse ${verseId} already has heygen_video_path; skipping.`);
      return;
    }

    if (!verse.character_id) {
      this.logger.error(`Verse ${verseId} has no character_id; cannot determine folder.`);
      return;
    }

    const { data: character, error: charError } = await this.sup
      .from('characters')
      .select('id, key')
      .eq('id', verse.character_id)
      .single();
    if (charError || !character) {
      this.logger.error(
        `Character for verse ${verseId} not found or error: ${charError?.message}`,
      );
      return;
    }

    const characterKey: string = character.key;
    const filename = params.filename ?? `${verseId}.mp4`;
    const bucket = 'epistle-videos';
    const path = `${characterKey}/${filename}`;

    const res = await fetch(videoUrl);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to download HeyGen video: ${res.status} ${text}`);
    }
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await this.supabase.uploadFromBuffer(bucket, path, buffer, 'video/mp4');

    const { error: updateError } = await this.sup
      .from('epistle_verses')
      .update({ heygen_video_path: `${bucket}/${path}` })
      .eq('id', verseId);
    if (updateError) {
      throw new Error(updateError.message);
    }
  }
}

