'use client';

import { useEffect, useState } from 'react';
import {
  assignCharacterAvatar,
  createCharacterAvatar,
  deleteCharacterAvatar,
  fetchAvatarLibrary,
  fetchCharacterAvatars,
  fetchCharacters,
  fetchVerses,
  updateCharacterAvatar,
  updateCharacter,
  type AvatarLibraryItemDto,
  type CharacterAvatarDto,
  type CharacterDto,
} from '@/lib/api';
import { IconPlus, IconUsers } from '@/components/Icons';

type CharacterCardState = {
  avatars: CharacterAvatarDto[];
  totalVerses: number;
  versesMissingAvatar: number;
  loading: boolean;
  error: string | null;
  saving: boolean;
  assigning: boolean;
  toast: string | null;
};

type AvatarDraft = {
  label: string;
  heygen_avatar_id: string;
  preview_bucket: string;
  preview_path: string;
};

type AvatarLibraryDraft = {
  characterId: string;
  label: string;
  heygenAvatarId: string;
};

const emptyDraft: AvatarDraft = {
  label: '',
  heygen_avatar_id: '',
  preview_bucket: 'epistle-assets',
  preview_path: 'avatars/',
};

function AvatarEditor({
  initialValue,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initialValue?: Partial<AvatarDraft>;
  submitLabel: string;
  onSubmit: (draft: AvatarDraft) => Promise<void>;
  onCancel?: () => void;
}) {
  const [draft, setDraft] = useState<AvatarDraft>({
    ...emptyDraft,
    ...initialValue,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSubmit(draft);
      setDraft(emptyDraft);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">Label</label>
          <input
            value={draft.label}
            onChange={(e) => setDraft((v) => ({ ...v, label: e.target.value }))}
            required
            className="w-full rounded-lg border border-white/10 bg-surface-elevated px-3 py-2 text-sm text-white outline-none transition focus:border-white/30"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">HeyGen avatar ID</label>
          <input
            value={draft.heygen_avatar_id}
            onChange={(e) =>
              setDraft((v) => ({ ...v, heygen_avatar_id: e.target.value }))
            }
            placeholder="optional for now"
            className="w-full rounded-lg border border-white/10 bg-surface-elevated px-3 py-2 text-sm text-white outline-none transition focus:border-white/30"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">Preview bucket</label>
          <input
            value={draft.preview_bucket}
            onChange={(e) =>
              setDraft((v) => ({ ...v, preview_bucket: e.target.value }))
            }
            placeholder="epistle-assets"
            className="w-full rounded-lg border border-white/10 bg-surface-elevated px-3 py-2 text-sm text-white outline-none transition focus:border-white/30"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">Preview path</label>
          <input
            value={draft.preview_path}
            onChange={(e) => setDraft((v) => ({ ...v, preview_path: e.target.value }))}
            placeholder="avatars/..."
            className="w-full rounded-lg border border-white/10 bg-surface-elevated px-3 py-2 text-sm text-white outline-none transition focus:border-white/30"
          />
        </div>
      </div>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-black transition hover:bg-primary-hover disabled:opacity-50"
        >
          {saving ? 'Saving…' : submitLabel}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/5"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}

export default function CharactersPage() {
  const [characters, setCharacters] = useState<CharacterDto[]>([]);
  const [avatarLibrary, setAvatarLibrary] = useState<AvatarLibraryItemDto[]>([]);
  const [avatarLibraryLoading, setAvatarLibraryLoading] = useState(true);
  const [avatarLibraryError, setAvatarLibraryError] = useState<string | null>(null);
  const [avatarLibraryOpen, setAvatarLibraryOpen] = useState(false);
  const [avatarLibraryQuery, setAvatarLibraryQuery] = useState('');
  const [avatarLibraryDrafts, setAvatarLibraryDrafts] = useState<
    Record<string, AvatarLibraryDraft>
  >({});
  const [avatarLibrarySaving, setAvatarLibrarySaving] = useState<Record<string, boolean>>({});
  const [states, setStates] = useState<Record<string, CharacterCardState>>({});
  const [addingFor, setAddingFor] = useState<string | null>(null);
  const [editingAvatarId, setEditingAvatarId] = useState<string | null>(null);
  const [previewingAvatar, setPreviewingAvatar] = useState<CharacterAvatarDto | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const chars = await fetchCharacters();
      if (cancelled) return;
      setCharacters(chars);
      const library = await fetchAvatarLibrary();
      if (cancelled) return;
      setAvatarLibrary(library);
      setAvatarLibraryLoading(false);
      for (const character of chars) {
        void loadCharacterData(character.id);
      }
    })().catch((error) => {
      console.error(error);
      if (!cancelled) {
        setAvatarLibraryError(error instanceof Error ? error.message : 'Failed to load avatar library');
        setAvatarLibraryLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadCharacterData = async (characterId: string) => {
    setStates((prev) => ({
      ...prev,
      [characterId]: {
        avatars: prev[characterId]?.avatars ?? [],
        totalVerses: prev[characterId]?.totalVerses ?? 0,
        versesMissingAvatar: prev[characterId]?.versesMissingAvatar ?? 0,
        loading: true,
        error: null,
        saving: false,
        assigning: false,
        toast: prev[characterId]?.toast ?? null,
      },
    }));

    try {
      const [avatars, allVerses, missingVerses] = await Promise.all([
        fetchCharacterAvatars(characterId),
        fetchVerses({ character_id: characterId, limit: 1000, offset: 0 }),
        fetchVerses({ character_id: characterId, limit: 1000, offset: 0 }),
      ]);

      const versesMissingAvatar = missingVerses.data.filter(
        (verse) => !verse.avatar?.id,
      ).length;

      setStates((prev) => ({
        ...prev,
        [characterId]: {
          avatars,
          totalVerses: allVerses.total,
          versesMissingAvatar,
          loading: false,
          error: null,
          saving: false,
          assigning: false,
          toast: prev[characterId]?.toast ?? null,
        },
      }));
    } catch (error) {
      setStates((prev) => ({
        ...prev,
        [characterId]: {
          avatars: prev[characterId]?.avatars ?? [],
          totalVerses: prev[characterId]?.totalVerses ?? 0,
          versesMissingAvatar: prev[characterId]?.versesMissingAvatar ?? 0,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load',
          saving: false,
          assigning: false,
          toast: null,
        },
      }));
    }
  };

  const handleCreateAvatar = async (characterId: string, draft: AvatarDraft) => {
    await createCharacterAvatar(characterId, {
      label: draft.label,
      heygen_avatar_id: draft.heygen_avatar_id || undefined,
      preview_bucket: draft.preview_bucket || undefined,
      preview_path: draft.preview_path || undefined,
    });
    setAddingFor(null);
    await loadCharacterData(characterId);
  };

  const handleUpdateAvatar = async (characterId: string, avatarId: string, draft: AvatarDraft) => {
    await updateCharacterAvatar(characterId, avatarId, {
      label: draft.label,
      heygen_avatar_id: draft.heygen_avatar_id,
      preview_bucket: draft.preview_bucket,
      preview_path: draft.preview_path,
    });
    setEditingAvatarId(null);
    await loadCharacterData(characterId);
  };

  const handleAssign = async (
    characterId: string,
    avatarId: string,
    mode: 'missing' | 'all',
  ) => {
    setStates((prev) => ({
      ...prev,
      [characterId]: { ...prev[characterId], assigning: true, error: null },
    }));
    try {
      const result = await assignCharacterAvatar(characterId, avatarId, mode);
      await loadCharacterData(characterId);
      setStates((prev) => ({
        ...prev,
        [characterId]: {
          ...prev[characterId],
          assigning: false,
          toast: `Assigned avatar to ${result.updatedCount} verse${result.updatedCount === 1 ? '' : 's'}.`,
        },
      }));
    } catch (error) {
      setStates((prev) => ({
        ...prev,
        [characterId]: {
          ...prev[characterId],
          assigning: false,
          error: error instanceof Error ? error.message : 'Assignment failed',
        },
      }));
    }
  };

  const handleDeleteAvatar = async (
    characterId: string,
    avatar: CharacterAvatarDto,
  ) => {
    const assignedCount = avatar.assigned_verse_count ?? 0;
    const shouldDelete = window.confirm(
      assignedCount > 0
        ? `Delete "${avatar.label}"?\n\nThis will remove it from ${assignedCount} verse${assignedCount === 1 ? '' : 's'} assigned to it.`
        : `Delete "${avatar.label}"?\n\nThis avatar is not currently assigned to any verses.`,
    );

    if (!shouldDelete) return;

    setStates((prev) => ({
      ...prev,
      [characterId]: { ...prev[characterId], assigning: true, error: null, toast: null },
    }));

    try {
      const result = await deleteCharacterAvatar(characterId, avatar.id);
      if (previewingAvatar?.id === avatar.id) {
        setPreviewingAvatar(null);
      }
      await loadCharacterData(characterId);
      setStates((prev) => ({
        ...prev,
        [characterId]: {
          ...prev[characterId],
          assigning: false,
          toast: `Deleted avatar and cleared it from ${result.clearedVerseCount} verse${result.clearedVerseCount === 1 ? '' : 's'}.`,
        },
      }));
    } catch (error) {
      setStates((prev) => ({
        ...prev,
        [characterId]: {
          ...prev[characterId],
          assigning: false,
          error: error instanceof Error ? error.message : 'Delete failed',
        },
      }));
    }
  };

  const getDraftForLibraryItem = (item: AvatarLibraryItemDto): AvatarLibraryDraft => {
    const existing = avatarLibraryDrafts[item.path];
    if (existing) return existing;

    const inferredCharacter = characters.find(
      (character) => character.key === item.inferred_character_key,
    );

    return {
      characterId: item.existing_avatar?.character_id ?? inferredCharacter?.id ?? '',
      label: item.existing_avatar?.label ?? item.inferred_label,
      heygenAvatarId: item.existing_avatar?.heygen_avatar_id ?? '',
    };
  };

  const setLibraryDraft = (
    path: string,
    updater: (draft: AvatarLibraryDraft) => AvatarLibraryDraft,
  ) => {
    setAvatarLibraryDrafts((prev) => {
      const item = avatarLibrary.find((entry) => entry.path === path);
      if (!item) return prev;
      const next = updater(prev[path] ?? getDraftForLibraryItem(item));
      return { ...prev, [path]: next };
    });
  };

  const refreshAvatarLibrary = async () => {
    try {
      setAvatarLibraryError(null);
      const library = await fetchAvatarLibrary();
      setAvatarLibrary(library);
    } catch (error) {
      setAvatarLibraryError(
        error instanceof Error ? error.message : 'Failed to refresh avatar library',
      );
    }
  };

  const filteredAvatarLibrary = avatarLibrary.filter((item) => {
    const query = avatarLibraryQuery.trim().toLowerCase();
    if (!query) return true;

    const draft = getDraftForLibraryItem(item);
    const characterName =
      characters.find((character) => character.id === draft.characterId)?.display_name ?? '';

    return [
      item.file_name,
      item.path,
      item.inferred_character_key ?? '',
      item.inferred_label,
      draft.label,
      draft.heygenAvatarId,
      characterName,
      item.existing_avatar?.label ?? '',
    ]
      .join(' ')
      .toLowerCase()
      .includes(query);
  });

  const handleSaveLibraryAvatar = async (item: AvatarLibraryItemDto) => {
    const draft = getDraftForLibraryItem(item);
    if (!draft.characterId) {
      setAvatarLibraryError('Select a witness before saving an avatar.');
      return;
    }
    if (!draft.heygenAvatarId.trim()) {
      setAvatarLibraryError('Enter a HeyGen avatar ID before saving.');
      return;
    }

    setAvatarLibrarySaving((prev) => ({ ...prev, [item.path]: true }));
    setAvatarLibraryError(null);

    try {
      if (item.existing_avatar) {
        await updateCharacterAvatar(item.existing_avatar.character_id, item.existing_avatar.id, {
          label: draft.label,
          heygen_avatar_id: draft.heygenAvatarId,
          preview_bucket: item.bucket,
          preview_path: item.path,
        });
        await loadCharacterData(item.existing_avatar.character_id);
      } else {
        await createCharacterAvatar(draft.characterId, {
          label: draft.label,
          heygen_avatar_id: draft.heygenAvatarId,
          preview_bucket: item.bucket,
          preview_path: item.path,
        });
        await loadCharacterData(draft.characterId);
      }

      await refreshAvatarLibrary();
    } catch (error) {
      setAvatarLibraryError(error instanceof Error ? error.message : 'Failed to save avatar');
    } finally {
      setAvatarLibrarySaving((prev) => ({ ...prev, [item.path]: false }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <IconUsers />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-white">Characters</h1>
          <p className="text-sm text-zinc-500">
            Manage HeyGen avatar IDs and bulk-assign them to verses without touching Supabase.
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-white/5 bg-surface-elevated p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Imported Avatar Library</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Pick from images already uploaded to Supabase storage, add the HeyGen ID, and save them into character avatars.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setAvatarLibraryOpen((open) => !open)}
              className="rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/5"
            >
              {avatarLibraryOpen ? 'Collapse' : 'Expand'}
            </button>
            <button
              type="button"
              onClick={() => void refreshAvatarLibrary()}
              className="rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/5"
            >
              Refresh
            </button>
          </div>
        </div>

        {avatarLibraryError ? (
          <p className="mt-4 text-sm text-red-400">{avatarLibraryError}</p>
        ) : null}

        {avatarLibraryOpen ? (
          <>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <input
                value={avatarLibraryQuery}
                onChange={(e) => setAvatarLibraryQuery(e.target.value)}
                placeholder="Search by file, witness, label, or HeyGen ID"
                className="w-full max-w-md rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none transition focus:border-white/30"
              />
              <div className="text-sm text-zinc-500">
                Showing {filteredAvatarLibrary.length} of {avatarLibrary.length}
              </div>
            </div>

            {avatarLibraryLoading ? (
          <div className="mt-4 rounded-xl border border-white/5 bg-black/20 p-4 text-sm text-zinc-500">
            Loading uploaded avatars…
          </div>
            ) : avatarLibrary.length === 0 ? (
          <div className="mt-4 rounded-xl border border-white/5 bg-black/20 p-4 text-sm text-zinc-500">
            No uploaded avatar images found in `epistle-assets/avatars`.
          </div>
            ) : filteredAvatarLibrary.length === 0 ? (
              <div className="mt-4 rounded-xl border border-white/5 bg-black/20 p-4 text-sm text-zinc-500">
                No avatar files match your search.
              </div>
            ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredAvatarLibrary.map((item) => {
              const draft = getDraftForLibraryItem(item);
              const saving = avatarLibrarySaving[item.path] === true;

              return (
                <div
                  key={item.path}
                  className="rounded-xl border border-white/5 bg-black/20 p-4"
                >
                  <div className="mb-3 overflow-hidden rounded-xl bg-surface-muted">
                    {item.preview_url ? (
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewingAvatar({
                            id: item.existing_avatar?.id ?? item.path,
                            character_id: draft.characterId,
                            label: draft.label || item.inferred_label,
                            heygen_avatar_id:
                              draft.heygenAvatarId || item.existing_avatar?.heygen_avatar_id || null,
                            preview_bucket: item.bucket,
                            preview_path: item.path,
                            preview_url: item.preview_url,
                            is_active: true,
                            created_at: '',
                            assigned_verse_count: 0,
                          })
                        }
                        className="block w-full transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/60"
                      >
                        <img
                          src={item.preview_url}
                          alt={item.file_name}
                          className="h-48 w-full object-cover"
                        />
                      </button>
                    ) : (
                      <div className="flex h-48 items-center justify-center text-sm text-zinc-500">
                        No preview
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="truncate text-sm font-medium text-white">{item.file_name}</div>
                    <div className="truncate text-xs text-zinc-500">{item.path}</div>
                    <div className="text-xs text-zinc-400">
                      Inferred: {item.inferred_character_key ?? 'Unknown'} · {item.inferred_label}
                    </div>
                    {item.existing_avatar ? (
                      <div className="text-xs text-emerald-400">
                        Linked to {item.existing_avatar.label}
                      </div>
                    ) : (
                      <div className="text-xs text-amber-300">Not yet linked</div>
                    )}
                  </div>

                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-zinc-400">Witness</label>
                      <select
                        value={draft.characterId}
                        onChange={(e) =>
                          setLibraryDraft(item.path, (current) => ({
                            ...current,
                            characterId: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-white/10 bg-surface-elevated px-3 py-2 text-sm text-white outline-none transition focus:border-white/30"
                      >
                        <option value="">Select witness</option>
                        {characters.map((character) => (
                          <option key={character.id} value={character.id}>
                            {character.display_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-zinc-400">Label</label>
                      <input
                        value={draft.label}
                        onChange={(e) =>
                          setLibraryDraft(item.path, (current) => ({
                            ...current,
                            label: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-white/10 bg-surface-elevated px-3 py-2 text-sm text-white outline-none transition focus:border-white/30"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-zinc-400">HeyGen avatar ID</label>
                      <input
                        value={draft.heygenAvatarId}
                        onChange={(e) =>
                          setLibraryDraft(item.path, (current) => ({
                            ...current,
                            heygenAvatarId: e.target.value,
                          }))
                        }
                        placeholder="paste HeyGen avatar ID"
                        className="w-full rounded-lg border border-white/10 bg-surface-elevated px-3 py-2 text-sm text-white outline-none transition focus:border-white/30"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => void handleSaveLibraryAvatar(item)}
                      disabled={saving}
                      className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-black transition hover:bg-primary-hover disabled:opacity-50"
                    >
                      {saving
                        ? 'Saving…'
                        : item.existing_avatar
                          ? 'Update avatar'
                          : 'Create avatar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
            )}
          </>
        ) : (
          <div className="mt-4 rounded-xl border border-white/5 bg-black/20 p-4 text-sm text-zinc-500">
            Hidden by default so the page stays manageable as your avatar library grows.
          </div>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        {characters.map((character) => {
          const state = states[character.id] ?? {
            avatars: [],
            totalVerses: 0,
            versesMissingAvatar: 0,
            loading: true,
            error: null,
            saving: false,
            assigning: false,
            toast: null,
          };

          return (
            <section
              key={character.id}
              className="rounded-2xl border border-white/5 bg-surface-elevated p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {character.display_name}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500">{character.key}</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setAddingFor((current) => (current === character.id ? null : character.id))
                  }
                  className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-200 transition hover:bg-white/5"
                >
                  <IconPlus />
                  Add avatar
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/5 bg-black/20 p-3">
                  <div className="text-xs uppercase tracking-wider text-zinc-500">Verses</div>
                  <div className="mt-1 text-xl font-semibold text-white">{state.totalVerses}</div>
                </div>
                <div className="rounded-xl border border-white/5 bg-black/20 p-3">
                  <div className="text-xs uppercase tracking-wider text-zinc-500">Missing avatar</div>
                  <div className="mt-1 text-xl font-semibold text-white">
                    {state.versesMissingAvatar}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-xl border border-white/5 bg-black/20 p-3">
                <div>
                  <div className="text-xs uppercase tracking-wider text-zinc-500">App status</div>
                  <div className="mt-1 text-sm font-medium text-white">
                    {character.app_status === 'available' ? 'Available at launch' : 'Coming soon'}
                  </div>
                </div>
                <select
                  value={character.app_status}
                  onChange={async (e) => {
                    const nextStatus = e.target.value as 'available' | 'coming_soon';
                    await updateCharacter(character.id, { app_status: nextStatus });
                    setCharacters((prev) =>
                      prev.map((item) =>
                        item.id === character.id ? { ...item, app_status: nextStatus } : item,
                      ),
                    );
                  }}
                  className="rounded-lg border border-white/10 bg-surface-elevated px-3 py-2 text-sm text-white outline-none transition focus:border-white/30"
                >
                  <option value="available">Available</option>
                  <option value="coming_soon">Coming soon</option>
                </select>
              </div>

              {addingFor === character.id ? (
                <div className="mt-4">
                  <AvatarEditor
                    submitLabel="Create avatar"
                    onSubmit={(draft) => handleCreateAvatar(character.id, draft)}
                    onCancel={() => setAddingFor(null)}
                  />
                </div>
              ) : null}

              {state.error ? (
                <p className="mt-4 text-sm text-red-400">{state.error}</p>
              ) : null}
              {state.toast ? (
                <p className="mt-4 text-sm text-emerald-400">{state.toast}</p>
              ) : null}

              <div className="mt-4 space-y-3">
                {state.loading ? (
                  <div className="rounded-xl border border-white/5 bg-black/20 p-4 text-sm text-zinc-500">
                    Loading avatars…
                  </div>
                ) : state.avatars.length === 0 ? (
                  <div className="rounded-xl border border-white/5 bg-black/20 p-4 text-sm text-zinc-500">
                    No avatars yet for this character.
                  </div>
                ) : (
                  state.avatars.map((avatar) => {
                    const isEditing = editingAvatarId === avatar.id;
                    return (
                      <div
                        key={avatar.id}
                        className="rounded-xl border border-white/5 bg-black/20 p-4"
                      >
                        {isEditing ? (
                          <AvatarEditor
                            initialValue={{
                              label: avatar.label,
                              heygen_avatar_id: avatar.heygen_avatar_id ?? '',
                              preview_bucket: avatar.preview_bucket ?? '',
                              preview_path: avatar.preview_path ?? '',
                            }}
                            submitLabel="Save avatar"
                            onSubmit={(draft) =>
                              handleUpdateAvatar(character.id, avatar.id, draft)
                            }
                            onCancel={() => setEditingAvatarId(null)}
                          />
                        ) : (
                          <>
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex min-w-0 items-start gap-3">
                                {avatar.preview_url ? (
                                  <button
                                    type="button"
                                    onClick={() => setPreviewingAvatar(avatar)}
                                    className="shrink-0 overflow-hidden rounded-xl transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/60"
                                  >
                                    <img
                                      src={avatar.preview_url}
                                      alt={avatar.label}
                                      className="h-14 w-14 object-cover bg-surface-muted"
                                    />
                                  </button>
                                ) : (
                                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-xs text-zinc-500">
                                    No image
                                  </div>
                                )}
                                <div className="min-w-0">
                                <div className="font-medium text-white">{avatar.label}</div>
                                <div className="mt-1 text-xs text-zinc-500">
                                  {avatar.preview_path || 'No preview path'}
                                </div>
                                <div className="mt-1 break-all font-mono text-xs text-zinc-400">
                                  {avatar.heygen_avatar_id || 'No HeyGen avatar ID yet'}
                                </div>
                              </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingAvatarId(avatar.id)}
                                  className="rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-300 transition hover:bg-white/5"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAvatar(character.id, avatar)}
                                  disabled={state.assigning}
                                  className="rounded-lg border border-red-500/30 px-3 py-2 text-xs text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>

                            <div className="mt-3 flex items-center justify-between gap-3 text-xs text-zinc-500">
                              <span>
                                Assigned to {avatar.assigned_verse_count} verse
                                {avatar.assigned_verse_count === 1 ? '' : 's'}
                              </span>
                              {avatar.preview_url ? (
                                <button
                                  type="button"
                                  onClick={() => setPreviewingAvatar(avatar)}
                                  className="text-zinc-300 transition hover:text-white"
                                >
                                  View full image
                                </button>
                              ) : null}
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => handleAssign(character.id, avatar.id, 'missing')}
                                disabled={state.assigning}
                                className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-black transition hover:bg-primary-hover disabled:opacity-50"
                              >
                                Assign to missing verses
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAssign(character.id, avatar.id, 'all')}
                                disabled={state.assigning}
                                className="rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-200 transition hover:bg-white/5 disabled:opacity-50"
                              >
                                Replace on all verses
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          );
        })}
      </div>

      {previewingAvatar ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6">
          <div className="relative w-full max-w-4xl rounded-2xl border border-white/10 bg-surface p-4 shadow-2xl">
            <button
              type="button"
              onClick={() => setPreviewingAvatar(null)}
              className="absolute right-4 top-4 rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/5"
            >
              Close
            </button>
            <div className="mb-4 pr-20">
              <div className="text-lg font-semibold text-white">
                {previewingAvatar.label}
              </div>
              <div className="mt-1 text-sm text-zinc-500">
                {previewingAvatar.preview_path || 'No preview path'}
              </div>
            </div>
            {previewingAvatar.preview_url ? (
              <img
                src={previewingAvatar.preview_url}
                alt={previewingAvatar.label}
                className="max-h-[80vh] w-full rounded-xl object-contain bg-black/30"
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
