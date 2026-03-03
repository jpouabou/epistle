import { BIBLE_CHARACTERS } from '../utils/constants';

export interface Character {
  id: string;
  name: string;
  description: string;
}

export class CharacterService {
  getAllCharacters(): Character[] {
    return BIBLE_CHARACTERS.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
    }));
  }

  getCharacterById(id: string): Character | null {
    return BIBLE_CHARACTERS.find((c) => c.id === id) ?? null;
  }
}

export const characterService = new CharacterService();
