'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { fetchVerse, deleteVerse } from '@/lib/api';
import { IconArrowLeft } from '@/components/Icons';

export default function DeleteVersePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [reference, setReference] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const v = await fetchVerse(id);
        if (!cancelled) setReference(v?.reference ?? null);
      } catch {
        if (!cancelled) setReference(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleDelete = async () => {
    setError(null);
    setDeleting(true);
    try {
      await deleteVerse(id);
      router.push('/scriptures');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-zinc-500">Loading…</p>
      </div>
    );
  }

  if (reference === null) {
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

  return (
    <div className="mx-auto max-w-md space-y-6">
      <Link
        href={`/scriptures/${id}`}
        className="inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
      >
        <IconArrowLeft /> Back to verse
      </Link>
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
        <h1 className="mb-2 text-lg font-semibold text-white">Delete verse</h1>
        <p className="mb-4 text-sm text-zinc-400">
          Are you sure you want to delete{' '}
          <strong className="text-white">{reference}</strong>? This cannot be
          undone.
        </p>
        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}
        <div className="flex gap-3">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
          <Link
            href={`/scriptures/${id}`}
            className="rounded-lg border border-white/10 bg-surface-muted px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
