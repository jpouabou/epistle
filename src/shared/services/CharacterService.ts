import type { ImageSourcePropType } from 'react-native';
import { BIBLE_CHARACTERS } from '../utils/constants';

export interface Character {
  id: string;
  name: string;
  description: string;
  image: ImageSourcePropType;
}

export class CharacterService {
  getAllCharacters(): Character[] {
    return BIBLE_CHARACTERS.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      image: c.image,
    }));
  }

  getCharacterById(id: string): Character | null {
    const found = BIBLE_CHARACTERS.find((c) => c.id === id);
    return found
      ? {
          id: found.id,
          name: found.name,
          description: found.description,
          image: found.image,
        }
      : null;
  }
}

export const characterService = new CharacterService();
