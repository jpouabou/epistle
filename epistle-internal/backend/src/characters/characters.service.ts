import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateCharacterAvatarDto } from './dto/create-character-avatar.dto';
import { UpdateCharacterAvatarDto } from './dto/update-character-avatar.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';

export interface CharacterDto {
  id: string;
  key: string;
  display_name: string;
  description: string | null;
  sort_order: number;
  app_status: 'available' | 'coming_soon';
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
  assigned_verse_count: number;
}

export interface AssignAvatarResult {
  updatedCount: number;
}

export interface RemoveAvatarResult {
  clearedVerseCount: number;
}

export interface AvatarLibraryItemDto {
  bucket: string;
  path: string;
  file_name: string;
  preview_url: string | null;
  inferred_character_key: string | null;
  inferred_label: string;
  existing_avatar: {
    id: string;
    character_id: string;
    label: string;
    heygen_avatar_id: string | null;
  } | null;
}

@Injectable()
export class CharactersService {
  constructor(private readonly supabase: SupabaseService) {}

  private get sup() {
    return this.supabase.getClient();
  }

  private async getAssignedVerseCounts(characterId: string): Promise<Map<string, number>> {
    const { data, error } = await this.sup
      .from('epistle_verses')
      .select('character_avatar_id')
      .eq('character_id', characterId)
      .not('character_avatar_id', 'is', null);

    if (error) throw new Error(error.message);

    const counts = new Map<string, number>();
    for (const row of data ?? []) {
      const avatarId = row.character_avatar_id as string | null;
      if (!avatarId) continue;
      counts.set(avatarId, (counts.get(avatarId) ?? 0) + 1);
    }
    return counts;
  }

  private async hydrateAvatarDto(
    row: {
      id: string;
      character_id: string;
      label: string;
      heygen_avatar_id: string | null;
      preview_bucket: string | null;
      preview_path: string | null;
      is_active: boolean;
      created_at: string;
    },
    assignedVerseCount: number,
  ): Promise<CharacterAvatarDto> {
    const preview_url =
      (await this.supabase.createAvatarPreviewUrl(
        row.preview_bucket,
        row.preview_path,
        3600,
      )) ?? null;

    return {
      id: row.id,
      character_id: row.character_id,
      label: row.label,
      heygen_avatar_id: row.heygen_avatar_id,
      preview_bucket: row.preview_bucket,
      preview_path: row.preview_path,
      preview_url,
      is_active: row.is_active,
      created_at: row.created_at,
      assigned_verse_count: assignedVerseCount,
    };
  }

  async findAll(): Promise<CharacterDto[]> {
    const { data, error } = await this.sup
      .from('characters')
      .select('id, key, display_name, description, sort_order, app_status, is_active, created_at')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as CharacterDto[];
  }

  async updateCharacter(
    characterId: string,
    dto: UpdateCharacterDto,
  ): Promise<CharacterDto> {
    const payload: Record<string, unknown> = {};
    if (dto.app_status !== undefined) payload.app_status = dto.app_status;

    const { data, error } = await this.sup
      .from('characters')
      .update(payload)
      .eq('id', characterId)
      .select('id, key, display_name, description, sort_order, app_status, is_active, created_at')
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to update character');
    }

    return data as CharacterDto;
  }

  async findAvatarsByCharacterId(characterId: string): Promise<CharacterAvatarDto[]> {
    const [avatarResult, assignedCounts] = await Promise.all([
      this.sup
      .from('character_avatars')
      .select('id, character_id, label, heygen_avatar_id, preview_bucket, preview_path, is_active, created_at')
      .eq('character_id', characterId)
      .eq('is_active', true)
      .order('created_at', { ascending: true }),
      this.getAssignedVerseCounts(characterId),
    ]);
    const { data, error } = avatarResult;
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
    return Promise.all(
      rows.map((row) =>
        this.hydrateAvatarDto(row, assignedCounts.get(row.id) ?? 0),
      ),
    );
  }

  async createAvatar(
    characterId: string,
    dto: CreateCharacterAvatarDto,
  ): Promise<CharacterAvatarDto> {
    const { data, error } = await this.sup
      .from('character_avatars')
      .insert({
        character_id: characterId,
        label: dto.label,
        heygen_avatar_id: dto.heygen_avatar_id?.trim() || null,
        preview_bucket: dto.preview_bucket?.trim() || null,
        preview_path: dto.preview_path?.trim() || null,
        is_active: dto.is_active ?? true,
      })
      .select(
        'id, character_id, label, heygen_avatar_id, preview_bucket, preview_path, is_active, created_at',
      )
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to create avatar');
    }

    return this.hydrateAvatarDto(data, 0);
  }

  async updateAvatar(
    characterId: string,
    avatarId: string,
    dto: UpdateCharacterAvatarDto,
  ): Promise<CharacterAvatarDto> {
    const payload: Record<string, unknown> = {};
    if (dto.label !== undefined) payload.label = dto.label;
    if (dto.heygen_avatar_id !== undefined) {
      payload.heygen_avatar_id = dto.heygen_avatar_id.trim() || null;
    }
    if (dto.preview_bucket !== undefined) {
      payload.preview_bucket = dto.preview_bucket.trim() || null;
    }
    if (dto.preview_path !== undefined) {
      payload.preview_path = dto.preview_path.trim() || null;
    }
    if (dto.is_active !== undefined) payload.is_active = dto.is_active;

    const { data, error } = await this.sup
      .from('character_avatars')
      .update(payload)
      .eq('id', avatarId)
      .eq('character_id', characterId)
      .select(
        'id, character_id, label, heygen_avatar_id, preview_bucket, preview_path, is_active, created_at',
      )
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to update avatar');
    }

    const assignedCounts = await this.getAssignedVerseCounts(characterId);
    return this.hydrateAvatarDto(data, assignedCounts.get(data.id) ?? 0);
  }

  async removeAvatar(
    characterId: string,
    avatarId: string,
  ): Promise<RemoveAvatarResult> {
    const { data: avatar, error: avatarError } = await this.sup
      .from('character_avatars')
      .select('id')
      .eq('id', avatarId)
      .eq('character_id', characterId)
      .eq('is_active', true)
      .maybeSingle();

    if (avatarError) throw new Error(avatarError.message);
    if (!avatar) throw new Error('Avatar not found');

    const { data: clearedVerses, error: clearError } = await this.sup
      .from('epistle_verses')
      .update({ character_avatar_id: null })
      .eq('character_id', characterId)
      .eq('character_avatar_id', avatarId)
      .select('id');

    if (clearError) throw new Error(clearError.message);

    const { error: deleteError } = await this.sup
      .from('character_avatars')
      .update({ is_active: false })
      .eq('id', avatarId)
      .eq('character_id', characterId);

    if (deleteError) throw new Error(deleteError.message);

    return { clearedVerseCount: (clearedVerses ?? []).length };
  }

  async assignAvatarToVerses(
    characterId: string,
    avatarId: string,
    mode: 'missing' | 'all' = 'missing',
  ): Promise<AssignAvatarResult> {
    let query = this.sup
      .from('epistle_verses')
      .update({ character_avatar_id: avatarId })
      .eq('character_id', characterId);

    if (mode === 'missing') {
      query = query.is('character_avatar_id', null);
    }

    const { data, error } = await query.select('id');
    if (error) {
      throw new Error(error.message);
    }

    return { updatedCount: (data ?? []).length };
  }

  private inferCharacterKeyFromFilename(fileName: string): string | null {
    const normalized = fileName.toLowerCase();
    const match = normalized.match(/^([a-z0-9]+)_v\d+/);
    return match?.[1] ?? null;
  }

  private inferLabelFromFilename(fileName: string): string {
    const base = fileName.replace(/\.[^.]+$/, '');
    const match = base.match(/^([a-z0-9]+)_v(\d+)$/i);
    if (!match) return base.replace(/[_-]+/g, ' ');

    const [, name, version] = match;
    const displayName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    return `${displayName} v${version}`;
  }

  async listAvatarLibrary(
    bucket = 'epistle-assets',
    prefix = 'avatars',
  ): Promise<AvatarLibraryItemDto[]> {
    const normalizedPrefix = prefix.replace(/^\/+|\/+$/g, '') || 'avatars';

    const [{ data: files, error: listError }, { data: existingRows, error: existingError }] =
      await Promise.all([
        this.sup.storage.from(bucket).list(normalizedPrefix, {
          limit: 500,
          sortBy: { column: 'name', order: 'asc' },
        }),
        this.sup
          .from('character_avatars')
          .select('id, character_id, label, heygen_avatar_id, preview_bucket, preview_path, is_active')
          .eq('is_active', true),
      ]);

    if (listError) throw new Error(listError.message);
    if (existingError) throw new Error(existingError.message);

    const existingByPath = new Map<
      string,
      { id: string; character_id: string; label: string; heygen_avatar_id: string | null }
    >();

    for (const row of existingRows ?? []) {
      const rowBucket = (row.preview_bucket || 'epistle-assets').trim();
      const rowPath = (row.preview_path || '').trim().replace(/^\/+/, '');
      if (!rowPath) continue;
      existingByPath.set(`${rowBucket}:${rowPath}`, {
        id: row.id as string,
        character_id: row.character_id as string,
        label: row.label as string,
        heygen_avatar_id: (row.heygen_avatar_id as string | null) ?? null,
      });
    }

    const imageFiles = (files ?? []).filter((file) => {
      const name = file.name?.toLowerCase?.() ?? '';
      return !file.id?.endsWith('/') && /\.(png|jpe?g|webp)$/i.test(name);
    });

    const items = await Promise.all(
      imageFiles.map(async (file) => {
        const path = `${normalizedPrefix}/${file.name}`;
        const previewUrl = await this.supabase.createSignedUrl(bucket, path, 3600);
        const inferredCharacterKey = this.inferCharacterKeyFromFilename(file.name);
        const inferredLabel = this.inferLabelFromFilename(file.name);
        const existingAvatar = existingByPath.get(`${bucket}:${path}`) ?? null;

        return {
          bucket,
          path,
          file_name: file.name,
          preview_url: previewUrl,
          inferred_character_key: inferredCharacterKey,
          inferred_label: inferredLabel,
          existing_avatar: existingAvatar,
        } satisfies AvatarLibraryItemDto;
      }),
    );

    return items;
  }
}
