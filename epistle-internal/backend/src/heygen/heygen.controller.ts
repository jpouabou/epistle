import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import * as crypto from 'crypto';
import { HeygenService } from './heygen.service';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';

@Controller('heygen')
export class HeygenController {
  constructor(
    private readonly heygen: HeygenService,
    private readonly config: ConfigService,
    private readonly supabase: SupabaseService,
  ) {}

  @Post('verses/:id/video')
  async createVideo(
    @Param('id') verseId: string,
    @Body() body: { heygen_avatar_id: string },
  ) {
    const sup = this.supabase.getClient();
    const { data: verse, error } = await sup
      .from('epistle_verses')
      .select(
        'id, first_person_version, character_id, character_avatar_id, character_avatars(heygen_avatar_id)',
      )
      .eq('id', verseId)
      .single();
    if (error || !verse) {
      throw new Error(error?.message ?? 'Verse not found');
    }

    let heygenAvatarId: string | null = body.heygen_avatar_id ?? null;
    if (!heygenAvatarId && verse.character_avatar_id) {
      const avatars = verse.character_avatars;
      const avatar = Array.isArray(avatars) ? avatars[0] : avatars;
      heygenAvatarId = avatar?.heygen_avatar_id ?? null;
    }

    if (!heygenAvatarId) {
      throw new Error('Verse has no associated HeyGen avatar');
    }

    const voiceId = await this.heygen.resolveDefaultVoiceId(heygenAvatarId);
    const videoId = await this.heygen.createVideoForVerse({
      verseId,
      firstPersonVersion: verse.first_person_version,
      heygenAvatarId,
      voiceId,
    });

    // Start background polling; webhook can also complete the job.
    void this.heygen.pollUntilCompleted(verseId, videoId);

    return { video_id: videoId, status: 'generating' as const };
  }

  @Get('avatars')
  async listAvatars() {
    const avatars = await this.heygen.listAvatars();
    return { count: avatars.length, avatars };
  }

  @Get('verses/:id/video/status')
  async getStatus(@Param('id') verseId: string) {
    const sup = this.supabase.getClient();
    const { data: verse, error } = await sup
      .from('epistle_verses')
      .select('id, heygen_video_path')
      .eq('id', verseId)
      .single();
    if (error || !verse) {
      throw new Error(error.message);
    }
    return {
      status: verse.heygen_video_path ? 'completed' : 'generating',
      heygen_video_path: verse.heygen_video_path ?? null,
    };
  }

  @Post('webhook')
  async webhook(
    @Req() req: Request,
    @Headers('signature') signature: string | undefined,
  ) {
    const secret = this.config.get<string>('HEYGEN_WEBHOOK_SECRET');
    if (!secret) {
      return { received: false };
    }

    const rawBody =
      (req as any).rawBody ??
      (req as any).bodyRaw ??
      JSON.stringify(req.body ?? {});

    if (!signature) {
      return { received: false };
    }

    const computed = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    if (computed !== signature) {
      return { received: false };
    }

    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const eventType = payload?.event_type;
    const data = payload?.event_data;

    if (eventType === 'avatar_video.success' && data?.callback_id && data?.url) {
      await this.heygen.handleCompletion({
        verseId: String(data.callback_id),
        videoUrl: data.url,
      });
    }

    return { received: true };
  }
}

