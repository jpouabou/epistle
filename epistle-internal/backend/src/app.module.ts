import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './supabase/supabase.module';
import { VersesModule } from './verses/verses.module';
import { CharactersModule } from './characters/characters.module';
import { HeygenModule } from './heygen/heygen.module';
import { VideoToolsModule } from './video-tools/video-tools.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    VersesModule,
    CharactersModule,
    HeygenModule,
    VideoToolsModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
