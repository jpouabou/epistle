import { supabase } from '../utils/supabase';

export class DailySelectionRepository {
  async getSelection(userId: string, date: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('daily_selections')
      .select('video_id')
      .eq('user_id', userId)
      .eq('date', date)
      .single();

    if (error || !data) return null;
    return (data as { video_id: string }).video_id;
  }

  async setSelection(
    userId: string,
    date: string,
    videoId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('daily_selections')
      .upsert(
        { user_id: userId, date, video_id: videoId } as Record<string, unknown>,
        { onConflict: 'user_id,date' }
      );

    if (error) throw error;
  }
}

export const dailySelectionRepository = new DailySelectionRepository();
