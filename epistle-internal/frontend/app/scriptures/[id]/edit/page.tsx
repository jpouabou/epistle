'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { VerseForm } from '@/components/VerseForm';
import { fetchVerse, updateVerse, type CreateVerseBody } from '@/lib/api';
import { IconArrowLeft } from '@/components/Icons';

export default function EditVersePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [initialValues, setInitialValues] = useState<{
    reference: string;
    author: string;
    tags: string;
    kjv_text: string;
    first_person_version: string;
    closing_text: string;
    character_id: string;
    character_avatar_id: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const v = await fetchVerse(id);
        if (cancelled || !v) return;
        setInitialValues({
          reference: v.reference,
          author: v.author,
          tags: v.tags?.join(', ') ?? '',
          kjv_text: v.kjv_text,
          first_person_version: v.first_person_version,
          closing_text: v.closing_text ?? '',
          character_id: v.character?.id ?? '',
          character_avatar_id: v.avatar?.id ?? '',
        });
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

  const handleSubmit = async (body: CreateVerseBody) => {
    await updateVerse(id, body);
    router.push(`/scriptures/${id}`);
    router.refresh();
  };

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
  if (!initialValues) {
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
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href={`/scriptures/${id}`}
        className="inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
      >
        <IconArrowLeft /> Back to verse
      </Link>
      <div className="rounded-xl border border-white/5 bg-surface-elevated p-6 sm:p-8">
        <h1 className="mb-6 text-xl font-semibold text-white">Edit verse</h1>
        <VerseForm
          initialValues={initialValues}
          onSubmit={handleSubmit}
          submitLabel="Save changes"
        />
      </div>
    </div>
  );
}
