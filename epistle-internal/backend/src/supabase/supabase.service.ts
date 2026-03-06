import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private client: SupabaseClient;

  constructor() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
    }
    this.client = createClient(url, key, { auth: { persistSession: false } });
  }

  getClient(): SupabaseClient {
    return this.client;
  }

  async uploadFromBuffer(
    bucket: string,
    path: string,
    buffer: Buffer,
    contentType = 'video/mp4',
  ): Promise<void> {
    const { error } = await this.client.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType,
        upsert: true,
      });
    if (error) {
      throw new Error(error.message);
    }
  }

  async createSignedUrl(bucket: string, path: string, expiresIn = 3600): Promise<string | null> {
    const { data, error } = await this.client.storage.from(bucket).createSignedUrl(path, expiresIn);
    if (error) {
      return null;
    }
    if (!data?.signedUrl) {
      return null;
    }
    return data.signedUrl;
  }

  /**
   * Avatar previews live in bucket "epistle-assets" under path "avatars/...".
   * Normalizes bucket (default epistle-assets) and path (avatar/ -> avatars/, or prepend avatars/).
   * Returns only a signed URL (/object/sign/...); never uses getPublicUrl, so private buckets
   * are correct. If signing fails (e.g. policy or path issue), returns null (UI shows placeholder).
   */
  async createAvatarPreviewUrl(
    previewBucket: string | null | undefined,
    previewPath: string | null | undefined,
    expiresIn = 3600,
  ): Promise<string | null> {
    const bucket = (previewBucket?.trim() || 'epistle-assets').trim();
    let path = previewPath?.trim();
    if (!path) return null;
    if (path.startsWith('avatar/') && !path.startsWith('avatars/')) {
      path = 'avatars/' + path.slice(7);
    } else if (!path.startsWith('avatars/')) {
      path = 'avatars/' + path;
    }
    return this.createSignedUrl(bucket, path, expiresIn);
  }
}
