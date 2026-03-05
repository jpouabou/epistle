import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Dimensions,
  ImageSourcePropType,
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
  name: string;
  description: string;
  image: ImageSourcePropType;
};

function WitnessTile({
  item,
  onPress,
}: {
  item: CharacterItem;
  onPress: () => void;
}) {
  const isJesus = item.id === 'jesus';
  return (
    <Pressable
      style={styles.tile}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`View ${item.name}`}
    >
      <View style={[styles.portraitWrapper, isJesus && styles.portraitWrapperJesus]}>
        {isJesus ? (
          <JesusWitnessImage
            source={item.image as number}
            style={styles.portrait}
          />
        ) : (
          <BreathingImage
            source={item.image as number}
            style={styles.portrait}
          />
        )}
      </View>
      <Text style={styles.name}>{item.name}</Text>
    </Pressable>
  );
}

export function CharactersGalleryScreen({ navigation }: Props) {
  const characters = characterService.getAllCharacters();

  const renderItem = ({ item }: { item: CharacterItem }) => (
    <WitnessTile
      item={item}
      onPress={() => navigation.navigate('CharacterDetail', { characterId: item.id })}
    />
  );

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
    backgroundColor: '#000',
  },
  title: {
    fontSize: 28,
    fontWeight: '500',
    color: '#fff',
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
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
  },
});
