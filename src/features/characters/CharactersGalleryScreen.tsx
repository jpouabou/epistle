import React, { useRef, useCallback, useEffect, useState } from 'react';
import {
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Dimensions,
  ImageSourcePropType,
  Animated,
  Easing,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CharactersStackParamList } from '../../shared/types/navigation';
import type { MainTabParamList } from '../../shared/types/navigation';
import { characterService } from '../../shared/services/CharacterService';
import { BreathingImage } from './BreathingImage';
import { JesusWitnessImage } from './JesusWitnessImage';
import { theme } from '../../shared/utils/theme';

const { width } = Dimensions.get('window');
const COLS = 2;
const GAP = 28;
const PADDING_H = width * 0.1;
const ITEM_WIDTH = (width - PADDING_H * 2 - GAP) / COLS;
const PORTRAIT_SIZE = ITEM_WIDTH * 0.85;

type NavProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Characters'>,
  NativeStackNavigationProp<CharactersStackParamList>
>;

type Props = {
  navigation: NavProp;
};

type CharacterItem = {
  id: string;
  key: string;
  name: string;
  description: string;
  image: ImageSourcePropType;
  availability: 'available' | 'coming_soon';
};

function WitnessTile({
  item,
  onPress,
}: {
  item: CharacterItem;
  onPress: () => void;
}) {
  const isJesus = item.id === 'jesus';
   const scale = useRef(new Animated.Value(1)).current;
   const glowOpacity = useRef(new Animated.Value(0)).current;

   const handlePress = useCallback(() => {
    const up = Animated.parallel([
      Animated.timing(scale, {
        toValue: 1.08,
        duration: 150,
         easing: Easing.out(Easing.ease),
         useNativeDriver: true,
       }),
      Animated.timing(glowOpacity, {
        toValue: 0.9,
        duration: 150,
         easing: Easing.out(Easing.ease),
         useNativeDriver: true,
       }),
     ]);

     const down = Animated.parallel([
       Animated.timing(scale, {
         toValue: 1,
         duration: 110,
         easing: Easing.out(Easing.ease),
         useNativeDriver: true,
       }),
       Animated.timing(glowOpacity, {
         toValue: 0,
         duration: 110,
         easing: Easing.out(Easing.ease),
         useNativeDriver: true,
       }),
     ]);

     up.start(() => {
       down.start();
       onPress();
     });
   }, [onPress, scale, glowOpacity]);

  return (
    <Pressable
      style={styles.tile}
      onPress={item.availability === 'available' ? handlePress : undefined}
      accessibilityRole="button"
      accessibilityLabel={
        item.availability === 'available'
          ? `View ${item.name}`
          : `${item.name} coming soon`
      }
    >
      <Animated.View
        style={[
          styles.portraitWrapper,
          isJesus && styles.portraitWrapperJesus,
          item.availability === 'coming_soon' && styles.portraitWrapperSoon,
          { transform: [{ scale }] },
        ]}
      >
        <Animated.View
          pointerEvents="none"
          style={[styles.portraitGlow, { opacity: glowOpacity }]}
        />
        {isJesus ? (
          <JesusWitnessImage
            source={item.image as number}
            style={styles.portrait}
            blurRadius={item.availability === 'coming_soon' ? 12 : 0}
          />
        ) : (
          <BreathingImage
            source={item.image as number}
            style={styles.portrait}
            blurRadius={item.availability === 'coming_soon' ? 12 : 0}
          />
        )}
      </Animated.View>
      <Text style={styles.name}>{item.name}</Text>
      {item.availability === 'coming_soon' ? (
        <View style={styles.soonBadge}>
          <Text style={styles.soonBadgeText}>Coming Soon</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function CharactersGalleryScreen({ navigation }: Props) {
  const [characters, setCharacters] = useState<CharacterItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        characterService.clearCache();
        const result = await characterService.getAllCharacters();
        if (!cancelled) {
          setCharacters(result);
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
  }, []);

  const renderItem = ({ item }: { item: CharacterItem }) => (
    <WitnessTile
      item={item}
      onPress={() => navigation.navigate('CharacterDetail', { characterId: item.id })}
    />
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Text style={styles.title}>Witnesses</Text>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={theme.colors.textSecondary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Witnesses</Text>
      <FlatList
        data={characters}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={COLS}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 28,
    fontWeight: '500',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    paddingTop: 24,
    paddingBottom: 32,
  },
  list: {
    paddingHorizontal: PADDING_H,
    paddingBottom: 48,
  },
  row: {
    gap: GAP,
    marginBottom: GAP,
    justifyContent: 'space-between',
  },
  tile: {
    width: ITEM_WIDTH,
    alignItems: 'center',
  },
  portraitWrapper: {
    width: PORTRAIT_SIZE,
    height: PORTRAIT_SIZE,
    borderRadius: PORTRAIT_SIZE / 2,
    overflow: 'hidden',
    marginBottom: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portraitGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: PORTRAIT_SIZE / 2 + 4,
    backgroundColor: theme.colors.glow,
  },
  portraitWrapperJesus: {
    overflow: 'visible',
    width: PORTRAIT_SIZE,
    height: PORTRAIT_SIZE,
    borderRadius: PORTRAIT_SIZE / 2,
  },
  portraitWrapperSoon: {
    opacity: 0.42,
  },
  portrait: {
    width: PORTRAIT_SIZE,
    height: PORTRAIT_SIZE,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  soonBadge: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  soonBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
