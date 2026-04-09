import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CharactersStackParamList } from '../../shared/types/navigation';
import { characterService } from '../../shared/services/CharacterService';
import { BreathingImage } from './BreathingImage';
import { JesusWitnessImage } from './JesusWitnessImage';
import { theme } from '../../shared/utils/theme';
import { COMING_SOON_PORTRAIT_BLUR } from '../../shared/utils/constants';

const { width } = Dimensions.get('window');
const PORTRAIT_SIZE = Math.min(width * 0.5, 200);

type Props = NativeStackScreenProps<
  CharactersStackParamList,
  'CharacterDetail'
>;

export function CharacterDetailScreen({ route, navigation }: Props) {
  const [character, setCharacter] = useState<Awaited<ReturnType<typeof characterService.getCharacterById>>>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await characterService.getCharacterById(route.params.characterId);
        if (!cancelled) {
          setCharacter(result);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [route.params.characterId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <ActivityIndicator size="large" color={theme.colors.textSecondary} />
      </SafeAreaView>
    );
  }

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
            blurRadius={
              character.availability === 'coming_soon'
                ? COMING_SOON_PORTRAIT_BLUR
                : 0
            }
          />
        ) : (
          <BreathingImage
            source={character.image as number}
            style={styles.portrait}
            slower
            blurRadius={
              character.availability === 'coming_soon'
                ? COMING_SOON_PORTRAIT_BLUR
                : 0
            }
          />
        )}
      </View>
      <Text style={styles.name}>{character.name}</Text>
      <Text style={styles.description}>{character.description}</Text>
      {character.availability === 'coming_soon' ? (
        <Text style={styles.comingSoon}>Coming soon to Epistle.</Text>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
    color: theme.colors.textSecondary,
  },
  center: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 17,
    lineHeight: 26,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  comingSoon: {
    marginTop: 18,
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.accentStrong,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  error: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
});
