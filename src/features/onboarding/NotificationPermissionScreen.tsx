import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../shared/types/navigation';
import { useOnboarding } from '../../shared/providers/OnboardingProvider';
import { useNotification } from '../../shared/providers/NotificationProvider';
import { theme } from '../../shared/utils/theme';

function parseTime(time: string): { hour: number; minute: number } {
  const [h, m] = time.split(':').map(Number);
  return { hour: h ?? 8, minute: m ?? 0 };
}

type Props = {
  navigation: NativeStackNavigationProp<
    OnboardingStackParamList,
    'NotificationPermission'
  >;
};

export function NotificationPermissionScreen({ navigation }: Props) {
  const { setOnboardingStep, dailyDeliveryTime } = useOnboarding();
  const { requestPermission, scheduleDaily } = useNotification();

  const proceed = async () => {
    await setOnboardingStep('witness');
    navigation.replace('WitnessTransition');
  };

  const handleAllow = async () => {
    const granted = await requestPermission();
    if (granted) {
      const { hour, minute } = parseTime(dailyDeliveryTime ?? '08:00');
      await scheduleDaily(hour, minute);
    }
    await proceed();
  };

  const handleNotNow = async () => {
    await proceed();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headline}>Allow delivery</Text>
      <Text style={styles.body}>
        To receive the Word at your appointed hour.
      </Text>
      <Pressable onPress={handleAllow} style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>Allow</Text>
      </Pressable>
      <Pressable onPress={handleNotNow} style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonText}>Not now</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  headline: {
    fontSize: 24,
    fontWeight: '500',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  body: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  primaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 999,
    backgroundColor: theme.colors.accent,
    borderWidth: 1,
    borderColor: theme.colors.accentStrong,
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 15,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.accentText,
  },
  secondaryButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 999,
    alignItems: 'center',
    alignSelf: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    color: theme.colors.textMuted,
  },
});
