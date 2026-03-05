import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../shared/types/navigation';
import { useOnboarding } from '../../shared/providers/OnboardingProvider';
import { useNotification } from '../../shared/providers/NotificationProvider';

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
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  headline: {
    fontSize: 22,
    fontWeight: '500',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  body: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 16,
  },
  primaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 999,
    backgroundColor: '#111',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 15,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.92)',
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
    color: 'rgba(255,255,255,0.75)',
  },
});
