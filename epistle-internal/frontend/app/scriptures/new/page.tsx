'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { VerseForm } from '@/components/VerseForm';
import { createVerse } from '@/lib/api';
import { IconArrowLeft } from '@/components/Icons';

export default function NewVersePage() {
  const router = useRouter();

  const handleSubmit = async (body: Parameters<typeof createVerse>[0]) => {
    await createVerse(body);
    router.push('/scriptures');
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/scriptures"
        className="inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
      >
        <IconArrowLeft /> Back to Scriptures
      </Link>
      <div className="rounded-xl border border-white/5 bg-surface-elevated p-6 sm:p-8">
        <h1 className="mb-6 text-xl font-semibold text-white">New verse</h1>
        <VerseForm onSubmit={handleSubmit} submitLabel="Create verse" />
      </div>
    </div>
  );
}
