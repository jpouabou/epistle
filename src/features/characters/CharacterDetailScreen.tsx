import React from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CharactersStackParamList } from '../../shared/types/navigation';
import { characterService } from '../../shared/services/CharacterService';
import { BreathingImage } from './BreathingImage';
import { JesusWitnessImage } from './JesusWitnessImage';

const { width } = Dimensions.get('window');
const PORTRAIT_SIZE = Math.min(width * 0.5, 200);

type Props = NativeStackScreenProps<
  CharactersStackParamList,
  'CharacterDetail'
>;

export function CharacterDetailScreen({ route, navigation }: Props) {
  const character = characterService.getCharacterById(route.params.characterId);

  if (!character) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <Text style={styles.error}>Witness not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Pressable
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        hitSlop={12}
      >
        <Text style={styles.backLabel}>←</Text>
      </Pressable>
      <View style={[styles.portraitWrapper, character.id === 'jesus' && styles.portraitWrapperJesus]}>
        {character.id === 'jesus' ? (
          <JesusWitnessImage
            source={character.image as number}
            style={styles.portrait}
            slower
          />
        ) : (
          <BreathingImage
            source={character.image as number}
            style={styles.portrait}
            slower
          />
        )}
      </View>
      <Text style={styles.name}>{character.name}</Text>
      <Text style={styles.description}>{character.description}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingHorizontal: 32,
    paddingTop: 16,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 24,
    zIndex: 1,
    padding: 8,
  },
  backLabel: {
    fontSize: 24,
    color: 'rgba(255,255,255,0.8)',
  },
  center: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  portraitWrapper: {
    width: PORTRAIT_SIZE,
    height: PORTRAIT_SIZE,
    borderRadius: PORTRAIT_SIZE / 2,
    overflow: 'hidden',
    marginBottom: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portraitWrapperJesus: {
    overflow: 'visible',
    width: PORTRAIT_SIZE,
    height: PORTRAIT_SIZE,
    borderRadius: PORTRAIT_SIZE / 2,
  },
  portrait: {
    width: PORTRAIT_SIZE,
    height: PORTRAIT_SIZE,
  },
  name: {
    fontSize: 28,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 17,
    lineHeight: 26,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
  },
  error: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
  },
});
