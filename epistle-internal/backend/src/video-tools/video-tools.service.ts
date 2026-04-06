import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { spawn } from 'child_process';

@Injectable()
export class VideoToolsService {
  private getFfmpegPath() {
    return process.env.FFMPEG_PATH?.trim() || 'ffmpeg';
  }

  private runFfmpeg(args: string[]) {
    return new Promise<void>((resolve, reject) => {
      const child = spawn(this.getFfmpegPath(), args, {
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let stderr = '';
      child.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });

      child.on('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'ENOENT') {
          reject(
            new Error(
              'ffmpeg is not installed or FFMPEG_PATH is not set. Install ffmpeg or set FFMPEG_PATH in backend/.env.',
            ),
          );
          return;
        }
        reject(error);
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
          return;
        }
        reject(new Error(stderr || `ffmpeg exited with code ${code}`));
      });
    });
  }

  async stitchMp4s(files: Array<{ originalname: string; buffer: Buffer }>) {
    if (files.length < 2 || files.length > 3) {
      throw new Error('Upload 2 or 3 MP4 files.');
    }

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'epistle-stitch-'));
    const inputPaths: string[] = [];
    const outputPath = path.join(tempDir, 'stitched.mp4');

    try {
      for (let i = 0; i < files.length; i += 1) {
        const filepath = path.join(tempDir, `input-${i + 1}.mp4`);
        await fs.writeFile(filepath, files[i].buffer);
        inputPaths.push(filepath);
      }

      const filterParts = inputPaths.map((_, index) => `[${index}:v:0]`).join('');
      const args = [
        '-y',
        ...inputPaths.flatMap((filepath) => ['-i', filepath]),
        '-filter_complex',
        `${filterParts}concat=n=${inputPaths.length}:v=1:a=0[outv]`,
        '-map',
        '[outv]',
        '-c:v',
        'libx264',
        '-preset',
        'medium',
        '-crf',
        '18',
        '-pix_fmt',
        'yuv420p',
        '-movflags',
        '+faststart',
        outputPath,
      ];

      await this.runFfmpeg(args);
      return await fs.readFile(outputPath);
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  }
}
