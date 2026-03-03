import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CharactersStackParamList } from '../../shared/types/navigation';
import { characterService } from '../../shared/services/CharacterService';

type Props = NativeStackScreenProps<
  CharactersStackParamList,
  'CharacterDetail'
>;

export function CharacterDetailScreen({ route }: Props) {
  const character = characterService.getCharacterById(route.params.characterId);

  if (!character) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Character not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.portraitPlaceholder} />
      <Text style={styles.name}>{character.name}</Text>
      <Text style={styles.description}>{character.description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    padding: 24,
    alignItems: 'center',
  },
  center: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  portraitPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#0f3460',
    marginBottom: 24,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#eee',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 24,
  },
  error: {
    fontSize: 16,
    color: '#aaa',
  },
});
