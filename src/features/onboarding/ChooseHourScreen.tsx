import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../shared/types/navigation';
import { useOnboarding } from '../../shared/providers/OnboardingProvider';
import { theme } from '../../shared/utils/theme';

function formatTime(date: Date): string {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'ChooseHour'>;
};

export function ChooseHourScreen({ navigation }: Props) {
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setHours(8, 0, 0, 0);
    return d;
  });
  const { saveTimeWithoutCompleting, setOnboardingStep } = useOnboarding();

  const handleChange = (_: unknown, selectedDate?: Date) => {
    if (selectedDate) setDate(selectedDate);
  };

  const handleSetHour = async () => {
    const time = formatTime(date);
    await saveTimeWithoutCompleting(time);
    setOnboardingStep('notification');
    navigation.replace('NotificationPermission');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.headline}>Choose the appointed time</Text>
        <DateTimePicker
          value={date}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
          style={styles.picker}
          themeVariant="light"
          textColor={theme.colors.textPrimary}
        />
        <Text style={styles.helper}>It will be given once each day.</Text>
      </View>
      <Pressable onPress={handleSetHour} style={styles.button}>
        <Text style={styles.buttonText}>Confirm</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headline: {
    fontSize: 24,
    fontWeight: '500',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 24,
  },
  picker: {
    marginBottom: 16,
  },
  helper: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 999,
    backgroundColor: theme.colors.accent,
    borderWidth: 1,
    borderColor: theme.colors.accentStrong,
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 15,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.accentText,
  },
});
