import { supabase } from '../utils/supabase';
import type { DailySelection } from '../types/database';

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

  async listSelections(userId: string): Promise<DailySelection[]> {
    const { data, error } = await supabase
      .from('daily_selections')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) throw error;
    return (data ?? []) as DailySelection[];
  }
}

export const dailySelectionRepository = new DailySelectionRepository();
