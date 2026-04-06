import { createClient } from '@supabase/supabase-js';
import { loadBackendEnv } from './load-backend-env.mjs';

loadBackendEnv();

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const backendBaseUrl =
  (process.env.EPISTLE_INTERNAL_API_URL || process.env.BACKEND_API_URL || 'http://localhost:4000').replace(
    /\/$/,
    '',
  );

if (!url || !serviceRoleKey) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false },
});

function parseArgs(argv) {
  const options = {
    references: [],
    characters: [],
    limit: null,
    dryRun: false,
    includeCompleted: false,
  };

  for (const arg of argv) {
    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }
    if (arg === '--include-completed') {
      options.includeCompleted = true;
      continue;
    }
    if (arg.startsWith('--limit=')) {
      const raw = arg.slice('--limit='.length);
      const parsed = Number.parseInt(raw, 10);
      if (!Number.isNaN(parsed) && parsed > 0) {
        options.limit = parsed;
      }
      continue;
    }
    if (arg.startsWith('--reference=')) {
      options.references.push(arg.slice('--reference='.length).trim());
      continue;
    }
    if (arg.startsWith('--character=')) {
      options.characters.push(arg.slice('--character='.length).trim().toLowerCase());
    }
  }

  return options;
}

function singleRelation(row) {
  if (!row) return null;
  return Array.isArray(row) ? row[0] ?? null : row;
}

async function loadCandidateVerses(options) {
  let query = supabase
    .from('epistle_verses')
    .select(
      `
        id,
        reference,
        author,
        first_person_version,
        heygen_video_path,
        character_id,
        character_avatar_id,
        characters(key, display_name),
        character_avatars(id, label, heygen_avatar_id)
      `,
    )
    .order('created_at', { ascending: true });

  if (!options.includeCompleted) {
    query = query.is('heygen_video_path', null);
  }

  if (options.references.length > 0) {
    query = query.in('reference', options.references);
  }

  if (options.limit != null) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to load verses: ${error.message}`);
  }

  const characterIds = Array.from(
    new Set((data ?? []).map((row) => row.character_id).filter(Boolean)),
  );

  const fallbackAvatarsByCharacterId = new Map();
  if (characterIds.length > 0) {
    const { data: avatarRows, error: avatarError } = await supabase
      .from('character_avatars')
      .select('id, character_id, label, heygen_avatar_id, created_at')
      .eq('is_active', true)
      .in('character_id', characterIds)
      .order('created_at', { ascending: true });

    if (avatarError) {
      throw new Error(`Failed to load fallback avatars: ${avatarError.message}`);
    }

    for (const avatar of avatarRows ?? []) {
      if (!fallbackAvatarsByCharacterId.has(avatar.character_id)) {
        fallbackAvatarsByCharacterId.set(avatar.character_id, []);
      }
      fallbackAvatarsByCharacterId.get(avatar.character_id).push(avatar);
    }
  }

  return (data ?? [])
    .map((row) => {
    const selectedAvatar = singleRelation(row.character_avatars);
    const character = singleRelation(row.characters);
    const fallbackAvatars = fallbackAvatarsByCharacterId.get(row.character_id) ?? [];
    const fallbackAvatarWithHeyGen = fallbackAvatars.find((avatar) => avatar.heygen_avatar_id);
    const resolvedAvatar = selectedAvatar?.heygen_avatar_id
      ? selectedAvatar
      : fallbackAvatarWithHeyGen ?? selectedAvatar;

    return {
      id: row.id,
      reference: row.reference,
      author: row.author,
      firstPersonVersion: row.first_person_version,
      heygenVideoPath: row.heygen_video_path,
      characterAvatarId: row.character_avatar_id,
      characterKey: character?.key ?? null,
      characterName: character?.display_name ?? null,
      selectedAvatarLabel: selectedAvatar?.label ?? null,
      avatarLabel: resolvedAvatar?.label ?? null,
      heygenAvatarId: resolvedAvatar?.heygen_avatar_id ?? null,
      usedFallbackAvatar:
        Boolean(resolvedAvatar?.id) &&
        (!selectedAvatar?.id || resolvedAvatar.id !== selectedAvatar.id),
    };
    })
    .filter((row) =>
      options.characters.length > 0
        ? options.characters.some((needle) => {
            const candidates = [
              row.characterKey,
              row.characterName,
              row.author,
            ]
              .filter(Boolean)
              .map((value) => String(value).toLowerCase());

            return candidates.some(
              (candidate) => candidate === needle || candidate.includes(needle),
            );
          })
        : true,
    );
}

function validateCandidate(verse) {
  if (!verse.firstPersonVersion || !verse.firstPersonVersion.trim()) {
    return 'missing first_person_version';
  }
  if (!verse.heygenAvatarId) {
    return 'missing HeyGen avatar on selected or fallback character avatar';
  }
  return null;
}

async function triggerVideo(verse) {
  const response = await fetch(`${backendBaseUrl}/heygen/verses/${verse.id}/video`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ heygen_avatar_id: verse.heygenAvatarId }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const verses = await loadCandidateVerses(options);

  if (verses.length === 0) {
    console.log('No matching verses found.');
    return;
  }

  let triggered = 0;
  let skipped = 0;

  for (const verse of verses) {
    const issue = validateCandidate(verse);
    if (issue) {
      skipped += 1;
      console.log(`SKIP  ${verse.reference} (${issue})`);
      continue;
    }

    if (options.dryRun) {
      triggered += 1;
      console.log(
        `DRY   ${verse.reference} -> ${verse.characterName ?? verse.characterKey} / ${verse.avatarLabel ?? 'default avatar'}${verse.usedFallbackAvatar ? ' (fallback)' : ''}`,
      );
      continue;
    }

    try {
      const result = await triggerVideo(verse);
      triggered += 1;
      console.log(
        `START ${verse.reference} -> video_id=${result.video_id} avatar=${verse.avatarLabel ?? verse.heygenAvatarId}${verse.usedFallbackAvatar ? ' (fallback)' : ''}`,
      );
    } catch (error) {
      skipped += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.log(`FAIL  ${verse.reference} (${message})`);
    }
  }

  console.log(`Finished. Triggered ${triggered}, skipped/failed ${skipped}.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
