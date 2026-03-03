import { supabase } from '../utils/supabase';
import type { Profile } from '../types/database';

export class ProfileRepository {
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) return null;
    return data as Profile;
  }

  async upsertProfile(
    userId: string,
    updates: Partial<Pick<Profile, 'daily_delivery_time' | 'onboarding_completed'>>
  ): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .upsert(
        { user_id: userId, ...updates } as Record<string, unknown>,
        { onConflict: 'user_id' }
      );

    if (error) throw error;
  }
}

export const profileRepository = new ProfileRepository();
