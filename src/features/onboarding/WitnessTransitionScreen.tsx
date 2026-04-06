import React, { useRef, useEffect, useState } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../shared/types/navigation';
import { useOnboarding } from '../../shared/providers/OnboardingProvider';
import { theme } from '../../shared/utils/theme';

const LINES = [
  'You will hear from those who came before you.',
  'Prophets. Apostles. Witnesses.',
  'Receive them.',
];

const HOLD_MS = [1700, 1700, 1600];

type Props = {
  navigation: NativeStackNavigationProp<
    OnboardingStackParamList,
    'WitnessTransition'
  >;
};

export function WitnessTransitionScreen({ navigation }: Props) {
  const [lineIndex, setLineIndex] = useState(0);
  const opacity = useRef(new Animated.Value(0)).current;
  const { setOnboardingStep } = useOnboarding();

  useEffect(() => {
    if (lineIndex >= LINES.length) {
      const fadeOut = Animated.timing(opacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      });
      fadeOut.start(() => {
        setOnboardingStep('carousel');
        navigation.replace('Onboarding');
      });
      return () => fadeOut.stop();
    }

    const seq = Animated.sequence([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.delay(HOLD_MS[lineIndex] ?? 800),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]);
    seq.start(() => setLineIndex((i) => i + 1));
    return () => seq.stop();
  }, [lineIndex, opacity, navigation, setOnboardingStep]);

  const line = LINES[lineIndex] ?? '';

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.line, { opacity }]}>{line}</Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  line: {
    fontSize: 22,
    fontWeight: '500',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    lineHeight: 32,
  },
});
