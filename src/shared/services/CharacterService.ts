import type { ImageSourcePropType } from 'react-native';
import { BIBLE_CHARACTERS } from '../utils/constants';
import { charactersRepository } from '../repositories/CharactersRepository';

export interface Character {
  id: string;
  key: string;
  name: string;
  description: string;
  image: ImageSourcePropType;
  availability: 'available' | 'coming_soon';
}

export class CharacterService {
  private cache: Character[] | null = null;

  private getFallbackCharacters(): Character[] {
    const availableAtLaunch = new Set<string>(['paul', 'david', 'john']);
    return BIBLE_CHARACTERS.map((c) => ({
      id: c.id,
      key: c.id,
      name: c.name,
      description: c.description,
      image: c.image,
      availability: availableAtLaunch.has(c.id) ? 'available' : 'coming_soon',
    }));
  }

  async getAllCharacters(): Promise<Character[]> {
    if (this.cache) return this.cache;

    const localByKey = new Map<string, (typeof BIBLE_CHARACTERS)[number]>(
      BIBLE_CHARACTERS.map((character) => [character.id, character]),
    );

    try {
      const remote = await charactersRepository.getActiveCharacters();
      const merged = remote
        .map((row) => {
          const local = localByKey.get(row.key);
          if (!local) return null;
          return {
            id: row.id,
            key: row.key,
            name: row.display_name || local.name,
            description: row.description || local.description,
            image: local.image,
            availability: row.app_status ?? 'coming_soon',
          } as Character;
        })
        .filter((value): value is Character => value !== null);

      if (merged.length > 0) {
        this.cache = merged;
        return merged;
      }
    } catch {
      // Fall back to bundled metadata if remote catalog is unavailable.
    }

    const fallback = this.getFallbackCharacters();
    this.cache = fallback;
    return fallback;
  }

  async getCharacterById(id: string): Promise<Character | null> {
    const allCharacters = await this.getAllCharacters();
    return allCharacters.find((character) => character.id === id) ?? null;
  }

  clearCache() {
    this.cache = null;
  }
}

export const characterService = new CharacterService();
