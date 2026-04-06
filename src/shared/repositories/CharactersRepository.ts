import { supabase } from '../utils/supabase';

export interface RemoteCharacterRow {
  id: string;
  key: string;
  display_name: string;
  description: string | null;
  sort_order: number;
  app_status: 'available' | 'coming_soon';
  is_active: boolean;
}

class CharactersRepository {
  async getActiveCharacters(): Promise<RemoteCharacterRow[]> {
    const { data, error } = await supabase
      .from('characters')
      .select('id, key, display_name, description, sort_order, app_status, is_active')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as RemoteCharacterRow[];
  }
}

export const charactersRepository = new CharactersRepository();
