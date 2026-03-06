-- Epistle Internal: characters, character_avatars, epistle_verses
-- Run these in Supabase SQL editor or via Supabase CLI if you use it.

-- Characters
CREATE TABLE IF NOT EXISTS public.characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  display_name text NOT NULL,
  description text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Character avatars (preview images in storage)
CREATE TABLE IF NOT EXISTS public.character_avatars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  label text NOT NULL,
  heygen_avatar_id text,
  preview_bucket text,
  preview_path text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_character_avatars_character_id ON public.character_avatars(character_id);

-- Verses
CREATE TABLE IF NOT EXISTS public.epistle_verses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL,
  author text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  kjv_text text NOT NULL,
  first_person_version text NOT NULL,
  closing_text text,
  character_id uuid REFERENCES public.characters(id) ON DELETE SET NULL,
  character_avatar_id uuid REFERENCES public.character_avatars(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_epistle_verses_character_id ON public.epistle_verses(character_id);
CREATE INDEX IF NOT EXISTS idx_epistle_verses_character_avatar_id ON public.epistle_verses(character_avatar_id);

-- Enable RLS (optional; backend uses service role which bypasses RLS)
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_avatars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.epistle_verses ENABLE ROW LEVEL SECURITY;

-- Policy: allow service role (and anon if you add later) via service role key; no policies needed for backend-only access.
