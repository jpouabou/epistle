-- Allow the mobile app to read generated encounter content directly from Supabase.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'epistle_verses'
      AND policyname = 'Epistle verses are readable by all'
  ) THEN
    CREATE POLICY "Epistle verses are readable by all"
      ON public.epistle_verses
      FOR SELECT
      USING (true);
  END IF;
END $$;
