import {
  BadRequestException,
  Controller,
  Post,
  Res,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { VideoToolsService } from './video-tools.service';

@Controller('video-tools')
export class VideoToolsController {
  constructor(private readonly videoToolsService: VideoToolsService) {}

  @Post('stitch')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'clips', maxCount: 3 }], {
      limits: { files: 3, fileSize: 200 * 1024 * 1024 },
    }),
  )
  async stitchVideos(
    @UploadedFiles() files: { clips?: Array<{ originalname: string; mimetype: string; buffer: Buffer }> },
    @Res() res: Response,
  ) {
    const clips = files?.clips ?? [];

    if (clips.length < 2) {
      throw new BadRequestException('Upload at least 2 MP4 clips.');
    }

    for (const clip of clips) {
      if (clip.mimetype !== 'video/mp4') {
        throw new BadRequestException('Only MP4 files are supported.');
      }
    }

    try {
      const merged = await this.videoToolsService.stitchMp4s(clips);
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="epistle-stitched.mp4"',
      );
      res.send(merged);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Could not stitch videos.',
      );
    }
  }
}
