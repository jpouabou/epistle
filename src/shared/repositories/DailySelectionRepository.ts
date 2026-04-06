import { supabase } from '../utils/supabase';
import type { DailySelection } from '../types/database';

export class DailySelectionRepository {
  async getSelection(userId: string, date: string): Promise<DailySelection | null> {
    const { data, error } = await supabase
      .from('daily_selections')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single();

    if (error || !data) return null;
    return data as DailySelection;
  }

  async setSelection(
    userId: string,
    date: string,
    videoId: string,
    unlockTime: string | null,
  ): Promise<void> {
    const { error } = await supabase
      .from('daily_selections')
      .upsert(
        {
          user_id: userId,
          date,
          video_id: videoId,
          unlock_time: unlockTime,
        } as Record<string, unknown>,
        { onConflict: 'user_id,date' }
      );

    if (error) throw error;
  }

  async setUnlockTime(
    userId: string,
    date: string,
    unlockTime: string | null,
  ): Promise<void> {
    const { error } = await supabase
      .from('daily_selections')
      .update({ unlock_time: unlockTime } as Record<string, unknown>)
      .eq('user_id', userId)
      .eq('date', date);

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
