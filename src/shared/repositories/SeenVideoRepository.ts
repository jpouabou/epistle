import { supabase } from '../utils/supabase';

export class SeenVideoRepository {
  async getSeenVideoIds(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('user_seen_videos')
      .select('video_id')
      .eq('user_id', userId);

    if (error) throw error;
    return (data ?? []).map((row) => (row as { video_id: string }).video_id);
  }

  async markSeen(userId: string, videoId: string): Promise<void> {
    const { error } = await supabase
      .from('user_seen_videos')
      .insert({
        user_id: userId,
        video_id: videoId,
      } as Record<string, unknown>);

    if (error) throw error;
  }
}

export const seenVideoRepository = new SeenVideoRepository();
