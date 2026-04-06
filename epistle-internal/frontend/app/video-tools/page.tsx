'use client';

import { useMemo, useState } from 'react';
import { IconScissors } from '@/components/Icons';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type StitchState = 'idle' | 'uploading' | 'done' | 'error';

export default function VideoToolsPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [state, setState] = useState<StitchState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const totalDurationHint = useMemo(
    () =>
      files.length > 0
        ? `${files.length} clip${files.length === 1 ? '' : 's'} ready`
        : 'Upload 2 or 3 MP4 clips in the order you want them stitched.',
    [files],
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFiles = Array.from(event.target.files ?? []).slice(0, 3);
    setFiles(nextFiles);
    setError(null);
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }
    setState('idle');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (files.length < 2) {
      setError('Choose at least 2 MP4 files.');
      return;
    }

    const formData = new FormData();
    files.forEach((file) => formData.append('clips', file));

    setState('uploading');
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/video-tools/stitch`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Could not stitch videos.');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
      setDownloadUrl(url);
      setState('done');
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Could not stitch videos.');
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <IconScissors />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-white">Video Stitcher</h1>
          <p className="text-sm text-zinc-500">
            Combine up to 3 Midjourney MP4 clips into one clean 30-second source video for HeyGen.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-surface-elevated p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="rounded-xl border border-dashed border-white/10 bg-black/20 p-5">
            <label className="mb-3 block text-sm font-medium text-white">
              Upload clips
            </label>
            <input
              type="file"
              accept="video/mp4"
              multiple
              onChange={handleFileChange}
              className="block w-full text-sm text-zinc-300 file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-black hover:file:bg-primary-hover"
            />
            <p className="mt-3 text-sm text-zinc-500">{totalDurationHint}</p>
          </div>

          {files.length > 0 ? (
            <div className="rounded-xl border border-white/5 bg-black/20 p-4">
              <div className="mb-3 text-xs uppercase tracking-wider text-zinc-500">
                Stitch order
              </div>
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between rounded-lg border border-white/5 px-3 py-2"
                  >
                    <span className="text-sm text-white">
                      {index + 1}. {file.name}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {(file.size / (1024 * 1024)).toFixed(1)} MB
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={state === 'uploading' || files.length < 2}
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-black transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {state === 'uploading' ? 'Stitching…' : 'Stitch videos'}
            </button>
            {downloadUrl ? (
              <a
                href={downloadUrl}
                download="epistle-stitched.mp4"
                className="rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/5"
              >
                Download merged MP4
              </a>
            ) : null}
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-white/5 bg-black/20 p-5">
        <div className="text-sm font-medium text-white">Notes</div>
        <ul className="mt-3 space-y-2 text-sm text-zinc-400">
          <li>Upload 2 or 3 MP4 clips only.</li>
          <li>Clips are stitched in the exact order shown.</li>
          <li>The merged output is re-encoded to a standard H.264 MP4 for compatibility.</li>
          <li>If you see an ffmpeg error, install ffmpeg locally or set `FFMPEG_PATH` in `backend/.env`.</li>
        </ul>
      </div>
    </div>
  );
}
