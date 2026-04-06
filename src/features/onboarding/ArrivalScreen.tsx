import React, { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../shared/types/navigation';
import { useOnboarding } from '../../shared/providers/OnboardingProvider';
import { theme } from '../../shared/utils/theme';

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'Arrival'>;
};

export function ArrivalScreen({ navigation }: Props) {
  const epistleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const { setOnboardingStep } = useOnboarding();

  useEffect(() => {
    const seq = Animated.sequence([
      Animated.delay(700),
      Animated.timing(epistleOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.delay(200),
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.delay(1500),
      Animated.parallel([
        Animated.timing(epistleOpacity, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(subtitleOpacity, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(800),
    ]);
    seq.start(() => {
      setOnboardingStep('invitation');
      navigation.replace('Invitation');
    });
    return () => seq.stop();
  }, [epistleOpacity, subtitleOpacity, navigation, setOnboardingStep]);

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.title, { opacity: epistleOpacity }]}>
        Epistle
      </Animated.Text>
      <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
        Your daily visitation
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 40,
    fontWeight: '500',
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '400',
    color: theme.colors.textSecondary,
  },
});
