-- Allow the mobile app to access rendered encounter videos from storage.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Epistle videos are readable by all'
  ) THEN
    CREATE POLICY "Epistle videos are readable by all"
      ON storage.objects
      FOR SELECT
      USING (bucket_id = 'epistle-videos');
  END IF;
END $$;
