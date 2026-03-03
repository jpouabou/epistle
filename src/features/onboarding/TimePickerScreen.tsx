import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useOnboarding } from '../../shared/providers/OnboardingProvider';
import { useNotification } from '../../shared/providers/NotificationProvider';

function formatTime(date: Date): string {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

export function TimePickerScreen() {
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setHours(9, 0, 0, 0);
    return d;
  });
  const { completeOnboarding } = useOnboarding();
  const { scheduleDaily } = useNotification();

  const handleChange = (_: unknown, selectedDate?: Date) => {
    if (selectedDate) setDate(selectedDate);
  };

  const handleConfirm = async () => {
    const time = formatTime(date);
    await completeOnboarding(time);
    await scheduleDaily(date.getHours(), date.getMinutes());
    // Parent RootNavigator will re-render and show Main when onboarding.completed becomes true
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Daily Delivery Time</Text>
      <Text style={styles.subtitle}>
        When would you like your daily message?
      </Text>
      <DateTimePicker
        value={date}
        mode="time"
        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
        onChange={handleChange}
        style={styles.picker}
      />
      <Text style={styles.confirmButton} onPress={handleConfirm}>
        Start
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#eee',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 32,
    textAlign: 'center',
  },
  picker: {
    marginBottom: 48,
  },
  confirmButton: {
    fontSize: 18,
    fontWeight: '600',
    color: '#eee',
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
});
