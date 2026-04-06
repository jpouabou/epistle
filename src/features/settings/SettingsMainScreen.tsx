import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useOnboarding } from '../../shared/providers/OnboardingProvider';
import { useNotification } from '../../shared/providers/NotificationProvider';
import type { SettingsStackParamList } from '../../shared/types/navigation';
import { theme } from '../../shared/utils/theme';

type Props = {
  navigation: NativeStackNavigationProp<SettingsStackParamList, 'SettingsMain'>;
};

function parseTime(time: string): Date {
  const [h, m] = time.split(':').map(Number);
  const d = new Date();
  d.setHours(h ?? 9, m ?? 0, 0, 0);
  return d;
}

function formatTime(date: Date): string {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

function formatTimeForDisplay(time: string | null): string {
  if (!time) return 'Not set';
  const [h, m] = time.split(':').map(Number);
  const hour = h ?? 8;
  const minute = m ?? 0;
  const period = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${minute.toString().padStart(2, '0')} ${period}`;
}

export function SettingsScreen(_props: Props) {
  const { dailyDeliveryTime, setDailyDeliveryTime } = useOnboarding();
  const { scheduleDaily } = useNotification();
  const [date, setDate] = useState(() =>
    dailyDeliveryTime ? parseTime(dailyDeliveryTime) : new Date()
  );
  const [draftDate, setDraftDate] = useState(() =>
    dailyDeliveryTime ? parseTime(dailyDeliveryTime) : new Date()
  );
  const [showPicker, setShowPicker] = useState(false);

  const handleTimeChange = (_event: unknown, selectedDate?: Date) => {
    if (!selectedDate) return;

    if (Platform.OS === 'ios') {
      setDraftDate(selectedDate);
      return;
    }

    setDate(selectedDate);
    setDraftDate(selectedDate);
    setShowPicker(false);
    const time = formatTime(selectedDate);
    setDailyDeliveryTime(time);
    scheduleDaily(selectedDate.getHours(), selectedDate.getMinutes());
  };

  const handleOpenPicker = () => {
    const current = dailyDeliveryTime ? parseTime(dailyDeliveryTime) : date;
    setDraftDate(current);
    setShowPicker(true);
  };

  const handleCancelPicker = () => {
    setDraftDate(date);
    setShowPicker(false);
  };

  const handleSavePicker = () => {
    setDate(draftDate);
    setShowPicker(false);
    const time = formatTime(draftDate);
    setDailyDeliveryTime(time);
    scheduleDaily(draftDate.getHours(), draftDate.getMinutes());
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>Settings</Text>
          <Text style={styles.heroTitle}>Keep the rhythm</Text>
          <Text style={styles.heroSubtitle}>
            Adjust the hour of your daily visitation and keep the experience
            aligned with your day.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Daily delivery</Text>
          <Text style={styles.cardBody}>
            Your appointed hour is currently {formatTimeForDisplay(dailyDeliveryTime)}.
          </Text>
          <Pressable style={styles.rowButton} onPress={handleOpenPicker}>
            <View>
              <Text style={styles.rowLabel}>Delivery time</Text>
              <Text style={styles.rowValue}>
                {formatTimeForDisplay(dailyDeliveryTime)}
              </Text>
            </View>
            <Text style={styles.rowAction}>Change</Text>
          </Pressable>
          {showPicker ? (
            <View style={styles.pickerCard}>
              <DateTimePicker
                value={draftDate}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleTimeChange}
              />
              {Platform.OS === 'ios' ? (
                <View style={styles.pickerActions}>
                  <Pressable
                    style={[styles.pickerButton, styles.pickerButtonSecondary]}
                    onPress={handleCancelPicker}
                  >
                    <Text
                      style={[
                        styles.pickerButtonText,
                        styles.pickerButtonTextSecondary,
                      ]}
                    >
                      Cancel
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.pickerButton, styles.pickerButtonPrimary]}
                    onPress={handleSavePicker}
                  >
                    <Text style={styles.pickerButtonText}>Save</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 36,
    gap: 16,
  },
  heroCard: {
    paddingVertical: 24,
    paddingHorizontal: 22,
    borderRadius: 28,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: theme.colors.textMuted,
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '500',
    color: theme.colors.textPrimary,
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.textSecondary,
  },
  card: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 10,
  },
  cardBody: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.textSecondary,
    marginBottom: 16,
  },
  rowButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  rowLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: theme.colors.textMuted,
    marginBottom: 4,
  },
  rowValue: {
    fontSize: 18,
    color: theme.colors.textPrimary,
  },
  rowAction: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.accent,
  },
  pickerCard: {
    marginTop: 14,
    paddingTop: 8,
  },
  pickerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  pickerButton: {
    minWidth: 88,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  pickerButtonPrimary: {
    backgroundColor: theme.colors.accent,
  },
  pickerButtonSecondary: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pickerButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.accentText,
  },
  pickerButtonTextSecondary: {
    color: theme.colors.textPrimary,
  },
});
