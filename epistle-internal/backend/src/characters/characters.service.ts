import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface CharacterDto {
  id: string;
  key: string;
  display_name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface CharacterAvatarDto {
  id: string;
  character_id: string;
  label: string;
  heygen_avatar_id: string | null;
  preview_bucket: string | null;
  preview_path: string | null;
  preview_url: string | null;
  is_active: boolean;
  created_at: string;
}

@Injectable()
export class CharactersService {
  constructor(private readonly supabase: SupabaseService) {}

  private get sup() {
    return this.supabase.getClient();
  }

  async findAll(): Promise<CharacterDto[]> {
    const { data, error } = await this.sup
      .from('characters')
      .select('id, key, display_name, description, sort_order, is_active, created_at')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as CharacterDto[];
  }

  async findAvatarsByCharacterId(characterId: string): Promise<CharacterAvatarDto[]> {
    const { data, error } = await this.sup
      .from('character_avatars')
      .select('id, character_id, label, heygen_avatar_id, preview_bucket, preview_path, is_active, created_at')
      .eq('character_id', characterId)
      .eq('is_active', true)
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as Array<{
      id: string;
      character_id: string;
      label: string;
      heygen_avatar_id: string | null;
      preview_bucket: string | null;
      preview_path: string | null;
      is_active: boolean;
      created_at: string;
    }>;
    const results: CharacterAvatarDto[] = [];
    for (const row of rows) {
      const preview_url =
        (await this.supabase.createAvatarPreviewUrl(
          row.preview_bucket,
          row.preview_path,
          3600,
        )) ?? null;

      results.push({
        id: row.id,
        character_id: row.character_id,
        label: row.label,
        heygen_avatar_id: row.heygen_avatar_id,
        preview_bucket: row.preview_bucket,
        preview_path: row.preview_path,
        preview_url,
        is_active: row.is_active,
        created_at: row.created_at,
      });
    }
    return results;
  }
}
