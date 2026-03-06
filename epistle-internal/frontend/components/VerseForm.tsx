'use client';

import { useEffect, useState } from 'react';
import {
  fetchCharacters,
  fetchCharacterAvatars,
  type CharacterDto,
  type CharacterAvatarDto,
  type CreateVerseBody,
} from '@/lib/api';

export interface VerseFormValues {
  reference: string;
  author: string;
  tags: string;
  kjv_text: string;
  first_person_version: string;
  closing_text: string;
  character_id: string;
  character_avatar_id: string;
}

const defaultValues: VerseFormValues = {
  reference: '',
  author: '',
  tags: '',
  kjv_text: '',
  first_person_version: '',
  closing_text: '',
  character_id: '',
  character_avatar_id: '',
};

const inputClass =
  'w-full rounded-lg border border-white/10 bg-surface-elevated px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-white/30 focus:ring-1 focus:ring-white/20';

interface VerseFormProps {
  initialValues?: Partial<VerseFormValues>;
  onSubmit: (body: CreateVerseBody) => Promise<void>;
  submitLabel: string;
}

export function VerseForm({
  initialValues,
  onSubmit,
  submitLabel,
}: VerseFormProps) {
  const [values, setValues] = useState<VerseFormValues>({
    ...defaultValues,
    ...initialValues,
  });
  const [characters, setCharacters] = useState<CharacterDto[]>([]);
  const [avatars, setAvatars] = useState<CharacterAvatarDto[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCharacters().then(setCharacters);
  }, []);

  useEffect(() => {
    if (!values.character_id) {
      setAvatars([]);
      setValues((prev) => ({ ...prev, character_avatar_id: '' }));
      return;
    }
    fetchCharacterAvatars(values.character_id).then((list) => {
      setAvatars(list);
      setValues((prev) => ({
        ...prev,
        character_avatar_id: list.some((a) => a.id === prev.character_avatar_id)
          ? prev.character_avatar_id
          : '',
      }));
    });
  }, [values.character_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const tags = values.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      await onSubmit({
        reference: values.reference,
        author: values.author,
        tags,
        kjv_text: values.kjv_text,
        first_person_version: values.first_person_version,
        closing_text: values.closing_text || undefined,
        character_id: values.character_id,
        character_avatar_id: values.character_avatar_id || undefined,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-zinc-400">
          Reference
        </label>
        <input
          type="text"
          value={values.reference}
          onChange={(e) => setValues((v) => ({ ...v, reference: e.target.value }))}
          required
          className={inputClass}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-zinc-400">
          Author (legacy)
        </label>
        <input
          type="text"
          value={values.author}
          onChange={(e) => setValues((v) => ({ ...v, author: e.target.value }))}
          required
          className={inputClass}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-zinc-400">
          Tags (comma-separated)
        </label>
        <input
          type="text"
          value={values.tags}
          onChange={(e) => setValues((v) => ({ ...v, tags: e.target.value }))}
          placeholder="e.g. confession, cleansing, assurance"
          className={inputClass}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-zinc-400">
          KJV text
        </label>
        <textarea
          value={values.kjv_text}
          onChange={(e) => setValues((v) => ({ ...v, kjv_text: e.target.value }))}
          required
          rows={4}
          className={inputClass}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-zinc-400">
          First person version
        </label>
        <textarea
          value={values.first_person_version}
          onChange={(e) =>
            setValues((v) => ({ ...v, first_person_version: e.target.value }))
          }
          required
          rows={4}
          className={inputClass}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-zinc-400">
          Closing text (optional)
        </label>
        <textarea
          value={values.closing_text}
          onChange={(e) => setValues((v) => ({ ...v, closing_text: e.target.value }))}
          rows={2}
          className={inputClass}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-zinc-400">
          Character
        </label>
        <select
          value={values.character_id}
          onChange={(e) =>
            setValues((v) => ({ ...v, character_id: e.target.value }))
          }
          required
          className={inputClass}
        >
          <option value="">Select character</option>
          {characters.map((c) => (
            <option key={c.id} value={c.id}>
              {c.display_name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-zinc-400">
          Character avatar (optional)
        </label>
        <select
          value={values.character_avatar_id}
          onChange={(e) =>
            setValues((v) => ({ ...v, character_avatar_id: e.target.value }))
          }
          className={inputClass}
        >
          <option value="">None</option>
          {avatars.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </select>
      </div>
      <div className="pt-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-black transition hover:bg-primary-hover disabled:opacity-50"
        >
          {saving ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
