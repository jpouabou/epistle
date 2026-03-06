'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  fetchVerses,
  fetchCharacters,
  type VerseListResponse,
  type CharacterDto,
} from '@/lib/api';
import { IconView, IconEdit, IconTrash, IconPlus } from '@/components/Icons';

const PAGE_SIZE = 10;

export default function ScripturesPage() {
  const [verses, setVerses] = useState<VerseListResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [characters, setCharacters] = useState<CharacterDto[]>([]);
  const [search, setSearch] = useState('');
  const [characterFilter, setCharacterFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async (pageIndex: number) => {
    setLoading(true);
    setError(null);
    try {
      const [versesRes, c] = await Promise.all([
        fetchVerses({
          search: search || undefined,
          character_id: characterFilter || undefined,
          limit: PAGE_SIZE,
          offset: pageIndex * PAGE_SIZE,
        }),
        fetchCharacters(),
      ]);
      setVerses(versesRes.data);
      setTotal(versesRes.total);
      setCharacters(c);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(page);
  }, [page, characterFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    load(0);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const start = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const end = Math.min((page + 1) * PAGE_SIZE, total);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-white">Scriptures</h1>
        <Link
          href="/scriptures/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-black transition hover:bg-primary-hover"
        >
          <IconPlus className="shrink-0" />
          New verse
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Search reference, author, tags…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 rounded-lg border border-white/10 bg-surface-elevated px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-white/30 focus:ring-1 focus:ring-white/20"
          />
          <button
            type="submit"
            className="rounded-lg bg-surface-muted px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Search
          </button>
        </form>
        <select
          value={characterFilter}
          onChange={(e) => {
            setCharacterFilter(e.target.value);
            setPage(0);
          }}
          className="rounded-lg border border-white/10 bg-surface-elevated px-3 py-2 text-sm text-white outline-none transition focus:border-white/30 focus:ring-1 focus:ring-white/20"
        >
          <option value="">All characters</option>
          {characters.map((c) => (
            <option key={c.id} value={c.id}>
              {c.display_name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center rounded-xl border border-white/5 bg-surface-elevated py-16">
          <p className="text-zinc-500">Loading…</p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-white/5 bg-surface-elevated">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-zinc-400">
                    <th className="w-14 px-4 py-3 font-medium">Avatar</th>
                    <th className="px-4 py-3 font-medium">Reference</th>
                    <th className="px-4 py-3 font-medium">Author</th>
                    <th className="max-w-[200px] px-4 py-3 font-medium">KJV text</th>
                    <th className="max-w-[200px] px-4 py-3 font-medium">First person</th>
                    <th className="px-4 py-3 font-medium">Tags</th>
                    <th className="px-4 py-3 font-medium">Character</th>
                    <th className="w-28 px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {verses.map((v) => (
                    <tr
                      key={v.id}
                      className="border-b border-white/5 transition hover:bg-white/[0.02] last:border-0"
                    >
                      <td className="px-4 py-3">
                        {v.avatar?.previewUrl ? (
                          <img
                            src={v.avatar.previewUrl}
                            alt={v.avatar.label ?? 'Avatar'}
                            className="h-10 w-10 rounded-full object-cover bg-surface-muted"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-muted text-xs text-zinc-500">
                            —
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-white">{v.reference}</td>
                      <td className="px-4 py-3 text-zinc-300">{v.author}</td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-zinc-400">
                        {v.kjv_text}
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-zinc-400">
                        {v.first_person_version}
                      </td>
                      <td className="px-4 py-3 text-zinc-500">
                        {v.tags?.length ? v.tags.join(', ') : '—'}
                      </td>
                      <td className="px-4 py-3 text-zinc-300">
                        {v.character?.display_name ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/scriptures/${v.id}`}
                            className="rounded-md p-2 text-zinc-400 transition hover:bg-primary-muted hover:text-white"
                            title="View"
                            aria-label="View verse"
                          >
                            <IconView />
                          </Link>
                          <Link
                            href={`/scriptures/${v.id}/edit`}
                            className="rounded-md p-2 text-zinc-400 transition hover:bg-primary-muted hover:text-white"
                            title="Edit"
                            aria-label="Edit verse"
                          >
                            <IconEdit />
                          </Link>
                          <Link
                            href={`/scriptures/${v.id}/delete`}
                            className="rounded-md p-2 text-zinc-400 transition hover:bg-red-500/15 hover:text-red-400"
                            title="Delete"
                            aria-label="Delete verse"
                          >
                            <IconTrash />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {verses.length === 0 && (
              <div className="py-16 text-center text-zinc-500">
                No verses found. Try adjusting search or filters.
              </div>
            )}
          </div>

          {total > 0 && (
            <div className="flex flex-col items-center justify-between gap-3 sm:flex-row sm:gap-4">
              <p className="text-sm text-zinc-500">
                Showing {start}–{end} of {total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="rounded-lg border border-white/10 bg-surface-muted px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:pointer-events-none disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-2 text-sm text-zinc-500">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="rounded-lg border border-white/10 bg-surface-muted px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:pointer-events-none disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
