'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  fetchVerse,
  fetchCharacterAvatars,
  startHeyGenVideo,
  getHeyGenVideoStatus,
  type VerseListResponse,
  type CharacterAvatarDto,
} from '@/lib/api';
import { IconArrowLeft, IconEdit, IconTrash, IconVideo } from '@/components/Icons';

export default function VerseViewPage() {
  const params = useParams();
  const id = params.id as string;
  const [verse, setVerse] = useState<VerseListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<CharacterAvatarDto | null>(null);
  const [videoStatus, setVideoStatus] = useState<'idle' | 'generating' | 'completed'>('idle');
  const [videoError, setVideoError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; message: string } | null>(
    null,
  );
  const [replaceVideoConfirmOpen, setReplaceVideoConfirmOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const v = await fetchVerse(id);
        if (!cancelled) setVerse(v ?? null);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-zinc-500">Loading…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="space-y-4">
        <p className="text-red-400">{error}</p>
        <Link
          href="/scriptures"
          className="inline-flex items-center gap-2 text-zinc-400 transition hover:text-white"
        >
          <IconArrowLeft /> Back to Scriptures
        </Link>
      </div>
    );
  }
  if (!verse) {
    return (
      <div className="space-y-4">
        <p className="text-zinc-400">Verse not found.</p>
        <Link
          href="/scriptures"
          className="inline-flex items-center gap-2 text-zinc-400 transition hover:text-white"
        >
          <IconArrowLeft /> Back to Scriptures
        </Link>
      </div>
    );
  }

  const handleAvatarSelected = (avatar: CharacterAvatarDto) => {
    setSelectedAvatar(avatar);
    setAvatarModalOpen(false);
  };

  const startVideoGeneration = async () => {
    if (!selectedAvatar?.heygen_avatar_id) return;
    setVideoError(null);
    try {
      setVideoStatus('generating');
      await startHeyGenVideo(verse.id, selectedAvatar.heygen_avatar_id);
      const check = async () => {
        try {
          const status = await getHeyGenVideoStatus(verse.id);
          if (status.heygen_video_path) {
            setVideoStatus('completed');
            const updated = await fetchVerse(verse.id);
            if (updated) setVerse(updated);
            setToast({ kind: 'success', message: 'HeyGen video is ready to watch.' });
            return;
          }
        } catch (e) {
          // Ignore transient errors during polling
        }
        setTimeout(check, 30000);
      };
      setTimeout(check, 30000);
    } catch (e) {
      setVideoStatus('idle');
      setVideoError(e instanceof Error ? e.message : 'Failed to start HeyGen video');
    }
  };

  const handleCreateHeyGenVideo = () => {
    if (!selectedAvatar?.heygen_avatar_id) {
      setVideoError('Select an avatar with a HeyGen ID first.');
      return;
    }
    if (verse.heygenVideoPath) {
      setReplaceVideoConfirmOpen(true);
      return;
    }
    startVideoGeneration();
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/scriptures"
        className="inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
      >
        <IconArrowLeft /> Back to Scriptures
      </Link>

      <article className="rounded-xl border border-white/5 bg-surface-elevated p-6 sm:p-8">
        <div className="flex items-start gap-4">
          {verse.avatar?.previewUrl ? (
            <img
              src={verse.avatar.previewUrl}
              alt={verse.avatar.label ?? 'Avatar'}
              className="h-16 w-16 shrink-0 rounded-full object-cover bg-surface-muted"
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-surface-muted text-zinc-500">
              —
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold text-white sm:text-2xl">
              {verse.reference}
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              {verse.character?.display_name ?? '—'} · {verse.author}
            </p>
            {verse.tags?.length ? (
              <p className="mt-1 text-sm text-zinc-500">{verse.tags.join(', ')}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-8 space-y-6 border-t border-white/5 pt-6">
          <section>
            <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
              KJV text
            </h2>
            <p className="whitespace-pre-wrap text-zinc-200">{verse.kjv_text}</p>
          </section>
          <section>
            <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
              First person version
            </h2>
            <p className="whitespace-pre-wrap text-zinc-200">
              {verse.first_person_version}
            </p>
          </section>
          {verse.closing_text && (
            <section>
              <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
                Closing text
              </h2>
              <p className="whitespace-pre-wrap text-zinc-200">
                {verse.closing_text}
              </p>
            </section>
          )}
        </div>

        <div className="mt-8 flex flex-wrap gap-2 border-t border-white/5 pt-6">
          <button
            type="button"
            onClick={() => setAvatarModalOpen(true)}
            disabled={!verse.character?.id}
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-surface-muted px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:pointer-events-none disabled:opacity-50"
            aria-label="Create HeyGen video"
          >
            <IconVideo /> Choose HeyGen Avatar
          </button>
          {selectedAvatar && (
            <button
              type="button"
              onClick={handleCreateHeyGenVideo}
              disabled={videoStatus === 'generating'}
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-surface-muted px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:pointer-events-none disabled:opacity-50"
            >
              {videoStatus === 'generating' ? 'Generating…' : 'Generate video'}
            </button>
          )}
          {selectedAvatar && (
            <div className="inline-flex flex-col rounded-lg border border-white/10 bg-surface-muted px-4 py-2 text-xs text-zinc-300">
              <span className="font-medium text-white">
                Selected avatar: {selectedAvatar.label}
              </span>
              <span className="font-mono text-[11px] text-zinc-400">
                HeyGen ID: {selectedAvatar.heygen_avatar_id ?? '—'}
              </span>
            </div>
          )}
          {videoError && (
            <span className="text-xs text-red-400">{videoError}</span>
          )}
          {videoStatus === 'generating' && !videoError && (
            <span className="inline-flex items-center gap-2 text-xs text-zinc-400">
              <span
                className="h-3 w-3 rounded-full border border-zinc-500 border-t-transparent animate-spin"
                aria-hidden="true"
              />
              <span>
                Video generation started. This can take several minutes; the page will update when
                ready.
              </span>
            </span>
          )}
          {verse.heygenVideoPath && (
            <a
              href={verse.heygenVideoPath}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-surface-muted px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            >
              <IconVideo /> Watch video
            </a>
          )}
          <Link
            href={`/scriptures/${verse.id}/edit`}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-black transition hover:bg-primary-hover"
            aria-label="Edit verse"
          >
            <IconEdit /> Edit
          </Link>
          <Link
            href={`/scriptures/${verse.id}/delete`}
            className="inline-flex items-center gap-2 rounded-lg border border-red-500/40 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/10"
            aria-label="Delete verse"
          >
            <IconTrash /> Delete
          </Link>
        </div>
      </article>

      {avatarModalOpen && verse?.character && (
        <AvatarModal
          characterId={verse.character.id}
          characterName={verse.character.display_name}
          onSelect={handleAvatarSelected}
          onClose={() => setAvatarModalOpen(false)}
        />
      )}
      {replaceVideoConfirmOpen && (
        <ReplaceVideoConfirmModal
          onConfirm={() => {
            setReplaceVideoConfirmOpen(false);
            startVideoGeneration();
          }}
          onCancel={() => setReplaceVideoConfirmOpen(false)}
        />
      )}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50">
          <div
            className={`rounded-lg px-4 py-3 text-sm shadow-lg ${
              toast.kind === 'success'
                ? 'bg-emerald-500 text-black'
                : 'bg-red-500 text-white'
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}

function ReplaceVideoConfirmModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="replace-video-modal-title"
    >
      <div className="absolute inset-0 bg-black/80" onClick={onCancel} />
      <div
        className="relative w-full max-w-md rounded-xl border border-white/10 bg-surface-elevated p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="replace-video-modal-title" className="text-lg font-semibold text-white">
          Replace existing video?
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          Are you sure you want to generate a new video? The existing video will be replaced.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-white/20 bg-surface-muted px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-black transition hover:bg-primary-hover"
          >
            Generate new video
          </button>
        </div>
      </div>
    </div>
  );
}

function AvatarModal({
  characterId,
  characterName,
  onSelect,
  onClose,
}: {
  characterId: string;
  characterName: string;
  onSelect: (avatar: CharacterAvatarDto) => void;
  onClose: () => void;
}) {
  const [avatars, setAvatars] = useState<CharacterAvatarDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setFetchError(null);
    setLoading(true);
    fetchCharacterAvatars(characterId)
      .then((list) => {
        if (!cancelled) {
          setAvatars(list);
          setIndex(0);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setFetchError(e instanceof Error ? e.message : 'Failed to load avatars');
          setAvatars([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [characterId]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const hasAvatars = avatars.length > 0;
  const currentAvatar = hasAvatars ? avatars[index] : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="avatar-modal-title"
    >
      <div
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-lg rounded-xl border border-white/10 bg-surface-elevated p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="avatar-modal-title" className="text-lg font-semibold text-white">
            Choose avatar for HeyGen video
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-zinc-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <span className="text-xl leading-none">&times;</span>
          </button>
        </div>
        <p className="mb-4 text-sm text-zinc-500">
          Avatars for {characterName}
        </p>
        {fetchError && (
          <p className="mb-4 text-sm text-red-400">{fetchError}</p>
        )}
        {loading ? (
          <p className="py-8 text-center text-zinc-500">Loading avatars…</p>
        ) : !hasAvatars ? (
          <p className="py-8 text-center text-zinc-500">
            No avatars found for this character.
          </p>
        ) : (
          <div className="space-y-4">
            {currentAvatar && (
              <div className="flex flex-col items-center gap-4">
                {currentAvatar.preview_url ? (
                  <img
                    src={currentAvatar.preview_url}
                    alt={currentAvatar.label}
                    className="h-64 w-full object-contain bg-surface-muted"
                  />
                ) : (
                  <div className="flex h-64 w-full items-center justify-center bg-surface-muted text-zinc-500">
                    <IconVideo className="h-10 w-10 opacity-70" />
                  </div>
                )}
                <div className="text-center">
                  <p className="text-sm font-medium text-white">
                    {currentAvatar.label}
                  </p>
                  <p className="text-xs text-zinc-500">
                    Avatar {index + 1} of {avatars.length}
                  </p>
                  <p className="mt-1 text-[11px] text-zinc-500">
                    HeyGen avatar ID:{' '}
                    <span className="font-mono text-[11px] text-zinc-400">
                      {currentAvatar.heygen_avatar_id ?? '—'}
                    </span>
                  </p>
                </div>
              </div>
            )}
            <div className="mt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                disabled={index === 0}
                className="rounded-lg border border-white/10 bg-surface-muted px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:pointer-events-none disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setIndex((i) => Math.min(avatars.length - 1, i + 1))}
                disabled={index >= avatars.length - 1}
                className="rounded-lg border border-white/10 bg-surface-muted px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:pointer-events-none disabled:opacity-50"
              >
                Next
              </button>
            </div>
            {currentAvatar && (
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => onSelect(currentAvatar)}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-black transition hover:bg-primary-hover"
                >
                  Use this avatar
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
