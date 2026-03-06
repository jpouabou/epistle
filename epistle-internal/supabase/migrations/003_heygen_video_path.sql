-- Add HeyGen video storage path to verses
-- Stores the Supabase Storage path for the rendered HeyGen video, e.g.:
--   epistle-videos/paul/af273759c9xa47369e05418c69drq174.mp4

alter table public.epistle_verses
  add column if not exists heygen_video_path text;

