import { Module } from '@nestjs/common';
import { VersesController } from './verses.controller';
import { VersesService } from './verses.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [VersesController],
  providers: [VersesService],
})
export class VersesModule {}
