import { supabase } from '../utils/supabase';
import type { Video } from '../types/database';

export class VideoRepository {
  async getActiveNonSampleVideos(): Promise<Video[]> {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('active', true)
      .eq('is_sample', false);

    if (error) throw error;
    return (data ?? []) as Video[];
  }

  async getVideoById(id: string): Promise<Video | null> {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data as Video;
  }
}

export const videoRepository = new VideoRepository();
