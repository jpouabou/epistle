import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from '../supabase/supabase.module';
import { HeygenService } from './heygen.service';
import { HeygenController } from './heygen.controller';

@Module({
  imports: [ConfigModule, SupabaseModule],
  providers: [HeygenService],
  controllers: [HeygenController],
  exports: [HeygenService],
})
export class HeygenModule {}

