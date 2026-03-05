import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../../shared/providers/AuthProvider';
import { useOnboarding } from '../../shared/providers/OnboardingProvider';
import { useNotification } from '../../shared/providers/NotificationProvider';
import { onboardingService } from '../../shared/services/OnboardingService';
import type { SettingsStackParamList } from '../../shared/types/navigation';

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

export function SettingsScreen({ navigation }: Props) {
  const { user, isAnonymous, signOut, continueWithoutAccount } = useAuth();
  const { dailyDeliveryTime, setDailyDeliveryTime, refresh: refreshOnboarding } =
    useOnboarding();
  const { scheduleDaily } = useNotification();
  const [date, setDate] = useState(() =>
    dailyDeliveryTime ? parseTime(dailyDeliveryTime) : new Date()
  );
  const [showPicker, setShowPicker] = useState(false);

  const handleResetOnboarding = async () => {
    await onboardingService.clearOnboardingForDev();
    await refreshOnboarding();
  };

  const handleTimeChange = (_: unknown, selectedDate?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
      const time = formatTime(selectedDate);
      setDailyDeliveryTime(time);
      scheduleDaily(selectedDate.getHours(), selectedDate.getMinutes());
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Daily Delivery Time</Text>
        <TouchableOpacity
          style={styles.row}
          onPress={() => setShowPicker(true)}
        >
          <Text style={styles.value}>
            {dailyDeliveryTime ?? 'Not set'}
          </Text>
          <Text style={styles.change}>Change</Text>
        </TouchableOpacity>
        {showPicker && (
          <DateTimePicker
            value={date}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleTimeChange}
          />
        )}
      </View>

      {__DEV__ && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Development</Text>
          <TouchableOpacity
            style={styles.buttonSecondary}
            onPress={handleResetOnboarding}
          >
            <Text style={styles.buttonSecondaryText}>Reset onboarding</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        {user ? (
          <TouchableOpacity style={styles.button} onPress={signOut}>
            <Text style={styles.buttonText}>Sign Out</Text>
          </TouchableOpacity>
        ) : isAnonymous ? (
          <Text style={styles.hint}>Using app without account</Text>
        ) : (
          <>
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate('Auth')}
            >
              <Text style={styles.buttonText}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.buttonSecondary}
              onPress={continueWithoutAccount}
            >
              <Text style={styles.buttonSecondaryText}>
                Continue without account
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.15)',
  },
  value: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.95)',
  },
  change: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  hint: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    paddingVertical: 8,
  },
  button: {
    backgroundColor: '#e74c3c',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonSecondary: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonSecondaryText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
  },
});
