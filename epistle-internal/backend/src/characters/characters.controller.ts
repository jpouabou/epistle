import { Controller, Get, Param } from '@nestjs/common';
import { CharactersService } from './characters.service';

@Controller('characters')
export class CharactersController {
  constructor(private readonly charactersService: CharactersService) {}

  @Get()
  findAll() {
    return this.charactersService.findAll();
  }

  @Get(':id/avatars')
  findAvatars(@Param('id') id: string) {
    return this.charactersService.findAvatarsByCharacterId(id);
  }
}
