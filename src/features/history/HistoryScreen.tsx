import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  ImageSourcePropType,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BIBLE_CHARACTERS } from '../../shared/utils/constants';
import type { HistoryEncounter } from '../../shared/types/database';
import { useHistoryEncounters } from './useHistoryEncounters';
import { theme } from '../../shared/utils/theme';

function getAvatarForAuthor(author: string): ImageSourcePropType | null {
  const character = BIBLE_CHARACTERS.find(
    (c) =>
      c.name === author ||
      (author === 'The Son of God' && c.id === 'jesus')
  );
  return character?.image ?? null;
}

function getDayLabel(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (dayStart.getTime() === startOfToday.getTime()) return 'Today';
  if (dayStart.getTime() === startOfYesterday.getTime()) return 'Yesterday';
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

type GroupedItem =
  | { type: 'header'; label: string }
  | { type: 'row'; encounter: HistoryEncounter };

/** One visitation per day: keep only the most recent encounter per day. */
function groupByDay(encounters: HistoryEncounter[]): GroupedItem[] {
  const sorted = [...encounters].sort(
    (a, b) => b.encounteredAt - a.encounteredAt
  );
  const items: GroupedItem[] = [];
  let lastLabel: string | null = null;
  for (const encounter of sorted) {
    const label = getDayLabel(encounter.encounteredAt);
    if (label !== lastLabel) {
      items.push({ type: 'header', label });
      items.push({ type: 'row', encounter });
      lastLabel = label;
    }
  }
  return items;
}

const CONTENT_PADDING = 24;
const ROW_PADDING_V = 26;

function getTemporalOpacity(dayLabel: string): number {
  if (dayLabel === 'Today') return 1;
  if (dayLabel === 'Yesterday') return 0.85;
  return 0.7;
}

export function HistoryScreen() {
  const { encounters, loading } = useHistoryEncounters();

  const grouped = useMemo(() => groupByDay(encounters), [encounters]);
  const count = encounters.length;

  const renderItem = useCallback(
    ({ item }: { item: GroupedItem }) => {
      if (item.type === 'header') {
        return (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{item.label}</Text>
          </View>
        );
      }
      const { encounter } = item;
      const dayLabel = getDayLabel(encounter.encounteredAt);
      const temporalOpacity = getTemporalOpacity(dayLabel);
      const avatarSource = getAvatarForAuthor(encounter.author);
      return (
        <View
          style={[styles.row, { opacity: temporalOpacity }]}
          accessibilityRole="text"
        >
          <View style={styles.avatarWrap}>
            {avatarSource ? (
              <Image
                source={avatarSource}
                style={styles.avatar}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]} />
            )}
          </View>
          <Text style={styles.reference}>{encounter.reference}</Text>
        </View>
      );
    },
    []
  );

  const keyExtractor = useCallback((item: GroupedItem, index: number) => {
    if (item.type === 'header') return `h-${item.label}-${index}`;
    return `r-${item.encounter.verseId}-${item.encounter.encounteredAt}`;
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (encounters.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No visitations yet.</Text>
          <Text style={styles.emptySubtitle}>
            Your delivered references will appear here over time.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Visitations</Text>
        <Text style={styles.counter}>
          {count} {count === 1 ? 'visitation' : 'visitations'} received.
        </Text>
      </View>

      <FlatList
        data={grouped}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: CONTENT_PADDING,
    paddingTop: 20,
    paddingBottom: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: '500',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  counter: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  listContent: {
    paddingHorizontal: CONTENT_PADDING,
    paddingBottom: 48,
  },
  sectionHeader: {
    paddingTop: 32,
    paddingBottom: 12,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: ROW_PADDING_V,
    paddingRight: 8,
    gap: 12,
  },
  avatarWrap: {
    opacity: 0.9,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  avatarPlaceholder: {
    backgroundColor: theme.colors.cardMuted,
  },
  reference: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
    color: theme.colors.textPrimary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: CONTENT_PADDING,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: theme.colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
