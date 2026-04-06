import { supabase } from '../utils/supabase';
import type { EpistleVerseRow, Video } from '../types/database';

type VerseVideoRow = Pick<
  EpistleVerseRow,
  'id' | 'reference' | 'author' | 'kjv_text' | 'closing_text' | 'heygen_video_path'
>;

function mapVerseToVideo(row: VerseVideoRow, videoUrl: string): Video {
  return {
    id: row.id,
    character: row.author,
    scene: null,
    reference: row.reference,
    script: null,
    kjv_text: row.kjv_text,
    closing_text: row.closing_text,
    video_url: videoUrl,
    active: true,
    is_sample: false,
  };
}

async function resolveVideoUrl(pathOrUrl: string | null): Promise<string | null> {
  if (!pathOrUrl) return null;
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }

  const firstSlash = pathOrUrl.indexOf('/');
  if (firstSlash <= 0 || firstSlash >= pathOrUrl.length - 1) {
    return null;
  }

  const bucket = pathOrUrl.slice(0, firstSlash);
  const objectPath = pathOrUrl.slice(firstSlash + 1);

  const { data: signedData } = await supabase.storage
    .from(bucket)
    .createSignedUrl(objectPath, 60 * 60);

  if (signedData?.signedUrl) {
    return signedData.signedUrl;
  }

  const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(objectPath);
  return publicData.publicUrl || null;
}

export class VideoRepository {
  private readonly verseSelect =
    'id, reference, author, kjv_text, closing_text, heygen_video_path';

  async getActiveNonSampleVideos(): Promise<Video[]> {
    const { data, error } = await supabase
      .from('epistle_verses')
      .select(this.verseSelect)
      .not('heygen_video_path', 'is', null)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const rows = (data ?? []) as VerseVideoRow[];
    const resolved = await Promise.all(
      rows.map(async (row) => {
        const videoUrl = await resolveVideoUrl(row.heygen_video_path);
        return videoUrl ? mapVerseToVideo(row, videoUrl) : null;
      })
    );

    return resolved.filter((row): row is Video => row !== null);
  }

  async getVideoById(id: string): Promise<Video | null> {
    const { data, error } = await supabase
      .from('epistle_verses')
      .select(this.verseSelect)
      .eq('id', id)
      .single();

    if (error || !data) return null;

    const row = data as VerseVideoRow;
    const videoUrl = await resolveVideoUrl(row.heygen_video_path);
    if (!videoUrl) return null;

    return mapVerseToVideo(row, videoUrl);
  }

  async getVideosByIds(ids: string[]): Promise<Map<string, Video>> {
    if (ids.length === 0) return new Map();

    const { data, error } = await supabase
      .from('epistle_verses')
      .select(this.verseSelect)
      .in('id', ids);

    if (error) throw error;

    const rows = (data ?? []) as VerseVideoRow[];
    const resolved = await Promise.all(
      rows.map(async (row) => {
        const videoUrl = await resolveVideoUrl(row.heygen_video_path);
        return videoUrl ? [row.id, mapVerseToVideo(row, videoUrl)] : null;
      })
    );

    return new Map(
      resolved.filter((entry): entry is [string, Video] => entry !== null)
    );
  }
}

export const videoRepository = new VideoRepository();
