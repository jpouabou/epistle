import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CharactersStackParamList } from '../../shared/types/navigation';
import type { MainTabParamList } from '../../shared/types/navigation';
import { characterService } from '../../shared/services/CharacterService';

const { width } = Dimensions.get('window');
const COLS = 2;
const GAP = 16;
const PADDING = 16;
const ITEM_WIDTH = (width - PADDING * 2 - GAP) / COLS;

type NavProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Characters'>,
  NativeStackNavigationProp<CharactersStackParamList>
>;

type Props = {
  navigation: NavProp;
};

export function CharactersGalleryScreen({ navigation }: Props) {
  const characters = characterService.getAllCharacters();

  const renderItem = ({ item }: { item: { id: string; name: string } }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => navigation.navigate('CharacterDetail', { characterId: item.id })}
      activeOpacity={0.7}
    >
      <View style={styles.portraitPlaceholder} />
      <Text style={styles.name}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={characters}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={COLS}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.row}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  list: {
    padding: PADDING,
    paddingBottom: 32,
  },
  row: {
    gap: GAP,
    marginBottom: GAP,
  },
  item: {
    width: ITEM_WIDTH,
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  portraitPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0f3460',
    marginBottom: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#eee',
  },
});
