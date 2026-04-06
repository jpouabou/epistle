import { createClient } from '@supabase/supabase-js';
import { devotionalSeedData } from './devotional-seed-data.mjs';
import { loadBackendEnv } from './load-backend-env.mjs';

loadBackendEnv();

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false },
});

async function loadCharactersByKey() {
  const { data, error } = await supabase
    .from('characters')
    .select('id, key, display_name')
    .eq('is_active', true);

  if (error) {
    throw new Error(`Failed to load characters: ${error.message}`);
  }

  return new Map((data ?? []).map((row) => [row.key, row]));
}

async function loadAvatarsByCharacterId() {
  const { data, error } = await supabase
    .from('character_avatars')
    .select('id, character_id, label, is_active')
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to load avatars: ${error.message}`);
  }

  const avatarsByCharacterId = new Map();
  for (const row of data ?? []) {
    const list = avatarsByCharacterId.get(row.character_id) ?? [];
    list.push(row);
    avatarsByCharacterId.set(row.character_id, list);
  }
  return avatarsByCharacterId;
}

function normalizeText(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function resolveAvatarId(entry, characterId, avatarsByCharacterId) {
  const avatars = avatarsByCharacterId.get(characterId) ?? [];
  if (!entry.avatar_label) {
    return entry.character_avatar_id ?? null;
  }

  const match = avatars.find(
    (avatar) => avatar.label.toLowerCase() === entry.avatar_label.toLowerCase(),
  );
  if (!match) {
    throw new Error(
      `Avatar "${entry.avatar_label}" not found for character "${entry.character_key}".`,
    );
  }
  return match.id;
}

async function findExistingVerse(reference) {
  const { data, error } = await supabase
    .from('epistle_verses')
    .select('id, reference')
    .eq('reference', reference)
    .limit(1);

  if (error) {
    throw new Error(`Failed to query existing verse "${reference}": ${error.message}`);
  }

  return data?.[0] ?? null;
}

async function upsertVerse(entry, character, avatarsByCharacterId) {
  const characterAvatarId = resolveAvatarId(entry, character.id, avatarsByCharacterId);
  const payload = {
    reference: entry.reference,
    author: entry.author || character.display_name,
    tags: entry.tags,
    kjv_text: normalizeText(entry.kjv_text),
    first_person_version: normalizeText(entry.first_person_version),
    closing_text: entry.closing_text ? normalizeText(entry.closing_text) : null,
    character_id: character.id,
    character_avatar_id: characterAvatarId,
  };

  const existing = await findExistingVerse(entry.reference);
  if (existing) {
    const { error } = await supabase
      .from('epistle_verses')
      .update(payload)
      .eq('id', existing.id);
    if (error) {
      throw new Error(`Failed to update "${entry.reference}": ${error.message}`);
    }
    return { action: 'updated', reference: entry.reference };
  }

  const { error } = await supabase.from('epistle_verses').insert(payload);
  if (error) {
    throw new Error(`Failed to insert "${entry.reference}": ${error.message}`);
  }
  return { action: 'inserted', reference: entry.reference };
}

async function main() {
  const charactersByKey = await loadCharactersByKey();
  const avatarsByCharacterId = await loadAvatarsByCharacterId();
  const results = [];

  for (const entry of devotionalSeedData) {
    const character = charactersByKey.get(entry.character_key);
    if (!character) {
      throw new Error(`Character key "${entry.character_key}" not found in Supabase.`);
    }

    const result = await upsertVerse(entry, character, avatarsByCharacterId);
    results.push(result);
  }

  const inserted = results.filter((r) => r.action === 'inserted').length;
  const updated = results.filter((r) => r.action === 'updated').length;
  console.log(`Done. Inserted ${inserted}, updated ${updated}.`);
  for (const result of results) {
    console.log(`${result.action.toUpperCase()}: ${result.reference}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
