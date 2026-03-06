import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { VersesService } from './verses.service';
import { CreateVerseDto } from './dto/create-verse.dto';
import { UpdateVerseDto } from './dto/update-verse.dto';

@Controller('verses')
export class VersesController {
  constructor(private readonly versesService: VersesService) {}

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('character_id') characterId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const limitNum = limit != null ? parseInt(limit, 10) : 10;
    const offsetNum = offset != null ? parseInt(offset, 10) : 0;
    return this.versesService.findAll({
      search,
      character_id: characterId,
      limit: Number.isNaN(limitNum) ? 10 : limitNum,
      offset: Number.isNaN(offsetNum) ? 0 : offsetNum,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.versesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateVerseDto) {
    return this.versesService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateVerseDto) {
    return this.versesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.versesService.remove(id);
  }
}
