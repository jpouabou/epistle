const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

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

export interface CreateCharacterAvatarBody {
  label: string;
  heygen_avatar_id?: string;
  preview_bucket?: string;
  preview_path?: string;
  is_active?: boolean;
}

export interface CreateVerseBody {
  reference: string;
  author: string;
  tags: string[];
  kjv_text: string;
  first_person_version: string;
  closing_text?: string;
  character_id: string;
  character_avatar_id?: string;
}

const DEFAULT_PAGE_SIZE = 10;

export interface VersesPageResponse {
  data: VerseListResponse[];
  total: number;
}

export async function fetchVerses(params?: {
  search?: string;
  character_id?: string;
  has_video?: boolean;
  limit?: number;
  offset?: number;
}): Promise<VersesPageResponse> {
  const sp = new URLSearchParams();
  if (params?.search) sp.set('search', params.search);
  if (params?.character_id) sp.set('character_id', params.character_id);
  if (params?.has_video !== undefined) sp.set('has_video', String(params.has_video));
  sp.set('limit', String(params?.limit ?? DEFAULT_PAGE_SIZE));
  sp.set('offset', String(params?.offset ?? 0));
  const url = `${API_BASE}/verses?${sp}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchVerse(id: string): Promise<VerseListResponse | null> {
  const res = await fetch(`${API_BASE}/verses/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function startHeyGenVideo(
  verseId: string,
  heygenAvatarId: string
): Promise<{ video_id: string; status: string }> {
  const res = await fetch(`${API_BASE}/heygen/verses/${verseId}/video`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ heygen_avatar_id: heygenAvatarId }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getHeyGenVideoStatus(
  verseId: string
): Promise<{ status: string; heygen_video_path: string | null }> {
  const res = await fetch(`${API_BASE}/heygen/verses/${verseId}/video/status`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createVerse(body: CreateVerseBody): Promise<unknown> {
  const res = await fetch(`${API_BASE}/verses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateVerse(
  id: string,
  body: Partial<CreateVerseBody>
): Promise<unknown> {
  const res = await fetch(`${API_BASE}/verses/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteVerse(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/verses/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(await res.text());
}

export async function fetchCharacters(): Promise<CharacterDto[]> {
  const res = await fetch(`${API_BASE}/characters`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchAvatarLibrary(): Promise<AvatarLibraryItemDto[]> {
  const res = await fetch(`${API_BASE}/characters/avatar-library`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateCharacter(
  characterId: string,
  body: { app_status?: 'available' | 'coming_soon' }
): Promise<CharacterDto> {
  const res = await fetch(`${API_BASE}/characters/${characterId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchCharacterAvatars(
  characterId: string
): Promise<CharacterAvatarDto[]> {
  const res = await fetch(`${API_BASE}/characters/${characterId}/avatars`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createCharacterAvatar(
  characterId: string,
  body: CreateCharacterAvatarBody
): Promise<CharacterAvatarDto> {
  const res = await fetch(`${API_BASE}/characters/${characterId}/avatars`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateCharacterAvatar(
  characterId: string,
  avatarId: string,
  body: Partial<CreateCharacterAvatarBody>
): Promise<CharacterAvatarDto> {
  const res = await fetch(`${API_BASE}/characters/${characterId}/avatars/${avatarId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteCharacterAvatar(
  characterId: string,
  avatarId: string
): Promise<{ clearedVerseCount: number }> {
  const res = await fetch(`${API_BASE}/characters/${characterId}/avatars/${avatarId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function assignCharacterAvatar(
  characterId: string,
  characterAvatarId: string,
  mode: 'missing' | 'all' = 'missing'
): Promise<{ updatedCount: number }> {
  const res = await fetch(`${API_BASE}/characters/${characterId}/assign-avatar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      character_avatar_id: characterAvatarId,
      mode,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
