import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateVerseDto } from './dto/create-verse.dto';
import { UpdateVerseDto } from './dto/update-verse.dto';

export interface VerseRow {
  id: string;
  reference: string;
  author: string;
  tags: string[];
  kjv_text: string;
  first_person_version: string;
  closing_text: string | null;
  character_id: string | null;
  character_avatar_id: string | null;
  heygen_video_path: string | null;
  created_at: string;
}

export interface CharacterRow {
  id: string;
  display_name: string;
}

export interface AvatarRow {
  id: string;
  character_id: string;
  label: string;
  heygen_avatar_id: string | null;
  preview_bucket: string | null;
  preview_path: string | null;
  is_active: boolean;
}

export interface VerseListResponse {
  id: string;
  reference: string;
  author: string;
  tags: string[];
  kjv_text: string;
  first_person_version: string;
  closing_text: string | null;
  heygenVideoPath?: string | null;
  character: { id: string; display_name: string } | null;
  avatar: {
    id: string;
    heygenAvatarId: string | null;
    previewUrl: string | null;
    label?: string;
  } | null;
}

export interface VersesPage {
  data: VerseListResponse[];
  total: number;
}

const VERSE_SELECT = `
  id,
  reference,
  author,
  tags,
  kjv_text,
  first_person_version,
  closing_text,
  heygen_video_path,
  character_id,
  character_avatar_id,
  created_at,
  characters(id, display_name),
  character_avatars(id, label, heygen_avatar_id, preview_bucket, preview_path, is_active)
`;

@Injectable()
export class VersesService {
  constructor(private readonly supabase: SupabaseService) {}

  private get sup() {
    return this.supabase.getClient();
  }

  /**
   * Resolve avatar for a verse:
   * 1. If verse has character_avatar_id, use that row from character_avatars.
   * 2. Else use first active avatar for verse's character_id (order by created_at asc).
   * 3. If no avatar, return avatar: null.
   * Then generate signed preview URL from preview_bucket + preview_path.
   */
  private async mapRowToResponse(verse: any): Promise<VerseListResponse> {
    const characters = verse.characters;
    const char = Array.isArray(characters) ? characters[0] : characters;
    let avatarMeta: {
      id: string;
      label?: string;
      heygen_avatar_id: string | null;
      preview_bucket: string | null;
      preview_path: string | null;
    } | null = null;

    if (verse.character_avatar_id) {
      const avatarRow = verse.character_avatars;
      const resolved = Array.isArray(avatarRow) ? avatarRow[0] : avatarRow;
      if (resolved) avatarMeta = resolved;
    }

    if (!avatarMeta && verse.character_id) {
      const { data: avatars } = await this.sup
        .from('character_avatars')
        .select('id, label, heygen_avatar_id, preview_bucket, preview_path')
        .eq('character_id', verse.character_id)
        .eq('is_active', true)
        .order('created_at', { ascending: true })
        .limit(1);
      const first = (avatars as AvatarRow[])?.[0];
      if (first) avatarMeta = first;
    }

    let previewUrl: string | null = null;
    if (avatarMeta) {
      previewUrl =
        (await this.supabase.createAvatarPreviewUrl(
          avatarMeta.preview_bucket,
          avatarMeta.preview_path,
          3600,
        )) ?? null;
    }

    return {
      id: verse.id,
      reference: verse.reference,
      author: verse.author,
      tags: verse.tags ?? [],
      kjv_text: verse.kjv_text,
      first_person_version: verse.first_person_version,
      closing_text: verse.closing_text,
      heygenVideoPath: verse.heygen_video_path ?? null,
      character: char ? { id: char.id, display_name: char.display_name } : null,
      avatar: avatarMeta
        ? {
            id: avatarMeta.id,
            heygenAvatarId: avatarMeta.heygen_avatar_id ?? null,
            previewUrl,
            label: avatarMeta.label ?? 'Avatar',
          }
        : null,
    };
  }

  async findAll(query?: {
    search?: string;
    character_id?: string;
    limit?: number;
    offset?: number;
  }): Promise<VersesPage> {
    const limit = Math.min(Math.max(query?.limit ?? 10, 1), 100);
    const offset = Math.max(query?.offset ?? 0, 0);
    const searchTerm = query?.search?.trim()?.toLowerCase();

    let q = this.sup
      .from('epistle_verses')
      .select(VERSE_SELECT, searchTerm ? undefined : { count: 'exact' })
      .order('created_at', { ascending: false });

    if (query?.character_id) {
      q = q.eq('character_id', query.character_id);
    }

    if (!searchTerm) {
      const { data: rows, error, count } = await q.range(offset, offset + limit - 1);
      if (error) throw new Error(error.message);
      const results = await Promise.all((rows ?? []).map((row: any) => this.mapRowToResponse(row)));
      return { data: results, total: count ?? 0 };
    }

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    let filtered = (rows ?? []).filter((r: any) => {
      const ref = (r.reference ?? '').toLowerCase();
      const author = (r.author ?? '').toLowerCase();
      const tags = (r.tags ?? []) as string[];
      const tagMatch = tags.some((t: string) => t.toLowerCase().includes(searchTerm));
      return ref.includes(searchTerm) || author.includes(searchTerm) || tagMatch;
    });

    const total = filtered.length;
    const page = filtered.slice(offset, offset + limit);
    const data = await Promise.all(page.map((row: any) => this.mapRowToResponse(row)));
    return { data, total };
  }

  async findOne(id: string): Promise<VerseListResponse | null> {
    const { data: row, error } = await this.sup
      .from('epistle_verses')
      .select(VERSE_SELECT)
      .eq('id', id)
      .single();
    if (error || !row) return null;
    return this.mapRowToResponse(row as any);
  }

  async create(dto: CreateVerseDto): Promise<VerseRow> {
    const { data, error } = await this.sup.from('epistle_verses').insert({
      reference: dto.reference,
      author: dto.author,
      tags: dto.tags,
      kjv_text: dto.kjv_text,
      first_person_version: dto.first_person_version,
      closing_text: dto.closing_text ?? null,
      character_id: dto.character_id,
      character_avatar_id: dto.character_avatar_id ?? null,
    }).select().single();
    if (error) throw new Error(error.message);
    return data as VerseRow;
  }

  async update(id: string, dto: UpdateVerseDto): Promise<VerseRow> {
    const payload: Record<string, unknown> = {};
    if (dto.reference !== undefined) payload.reference = dto.reference;
    if (dto.author !== undefined) payload.author = dto.author;
    if (dto.tags !== undefined) payload.tags = dto.tags;
    if (dto.kjv_text !== undefined) payload.kjv_text = dto.kjv_text;
    if (dto.first_person_version !== undefined) payload.first_person_version = dto.first_person_version;
    if (dto.closing_text !== undefined) payload.closing_text = dto.closing_text;
    if (dto.character_id !== undefined) payload.character_id = dto.character_id;
    if (dto.character_avatar_id !== undefined) payload.character_avatar_id = dto.character_avatar_id;

    const { data, error } = await this.sup
      .from('epistle_verses')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as VerseRow;
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.sup.from('epistle_verses').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }
}
