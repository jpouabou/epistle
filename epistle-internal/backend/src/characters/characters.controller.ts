import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CharactersService } from './characters.service';
import { CreateCharacterAvatarDto } from './dto/create-character-avatar.dto';
import { UpdateCharacterAvatarDto } from './dto/update-character-avatar.dto';
import { AssignCharacterAvatarDto } from './dto/assign-character-avatar.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';

@Controller('characters')
export class CharactersController {
  constructor(private readonly charactersService: CharactersService) {}

  @Get()
  findAll() {
    return this.charactersService.findAll();
  }

  @Get('avatar-library')
  listAvatarLibrary() {
    return this.charactersService.listAvatarLibrary();
  }

  @Patch(':id')
  updateCharacter(
    @Param('id') id: string,
    @Body() dto: UpdateCharacterDto,
  ) {
    return this.charactersService.updateCharacter(id, dto);
  }

  @Get(':id/avatars')
  findAvatars(@Param('id') id: string) {
    return this.charactersService.findAvatarsByCharacterId(id);
  }

  @Post(':id/avatars')
  createAvatar(
    @Param('id') id: string,
    @Body() dto: CreateCharacterAvatarDto,
  ) {
    return this.charactersService.createAvatar(id, dto);
  }

  @Patch(':id/avatars/:avatarId')
  updateAvatar(
    @Param('id') id: string,
    @Param('avatarId') avatarId: string,
    @Body() dto: UpdateCharacterAvatarDto,
  ) {
    return this.charactersService.updateAvatar(id, avatarId, dto);
  }

  @Delete(':id/avatars/:avatarId')
  removeAvatar(
    @Param('id') id: string,
    @Param('avatarId') avatarId: string,
  ) {
    return this.charactersService.removeAvatar(id, avatarId);
  }

  @Post(':id/assign-avatar')
  assignAvatar(
    @Param('id') id: string,
    @Body() dto: AssignCharacterAvatarDto,
  ) {
    return this.charactersService.assignAvatarToVerses(
      id,
      dto.character_avatar_id,
      dto.mode ?? 'missing',
    );
  }
}
