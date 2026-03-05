import React, { useRef, useEffect } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../shared/types/navigation';
import { useOnboarding } from '../../shared/providers/OnboardingProvider';

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'Invitation'>;
};

export function InvitationScreen({ navigation }: Props) {
  const primaryOpacity = useRef(new Animated.Value(0)).current;
  const secondaryOpacity = useRef(new Animated.Value(0)).current;
  const { setOnboardingStep } = useOnboarding();

  useEffect(() => {
    const seq = Animated.sequence([
      Animated.delay(900),
      Animated.timing(primaryOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.delay(200),
      Animated.timing(secondaryOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]);
    seq.start();
    return () => seq.stop();
  }, [primaryOpacity, secondaryOpacity]);

  const handleEnter = () => {
    setOnboardingStep('choose_hour');
    navigation.replace('ChooseHour');
  };

  return (
    <View style={styles.container}>
      <View style={styles.textStack}>
        <Animated.Text style={[styles.primary, { opacity: primaryOpacity }]}>
          Every morning, you will receive a word from God.
        </Animated.Text>
        <Animated.Text style={[styles.secondary, { opacity: secondaryOpacity }]}>
          Given once. Not repeated.
        </Animated.Text>
      </View>
      <Pressable onPress={handleEnter} style={styles.enterButton}>
        <Text style={styles.enterButtonText}>Enter</Text>
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
  textStack: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primary: {
    fontSize: 22,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 32,
  },
  secondary: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 8,
  },
  enterButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 999,
    backgroundColor: '#111',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 15,
  },
  enterButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.92)',
  },
});
