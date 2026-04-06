import { Module } from '@nestjs/common';
import { VideoToolsController } from './video-tools.controller';
import { VideoToolsService } from './video-tools.service';

@Module({
  controllers: [VideoToolsController],
  providers: [VideoToolsService],
})
export class VideoToolsModule {}
