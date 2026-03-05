import React, { useRef, useEffect } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../shared/types/navigation';
import { useOnboarding } from '../../shared/providers/OnboardingProvider';

type Props = {
  navigation: NativeStackNavigationProp<
    OnboardingStackParamList,
    'SampleIntro'
  >;
};

export function SampleIntroScreen({ navigation }: Props) {
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const { setOnboardingStep } = useOnboarding();

  useEffect(() => {
    const seq = Animated.sequence([
      Animated.delay(400),
      Animated.timing(titleOpacity, {
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
    ]);
    seq.start();
    return () => seq.stop();
  }, [titleOpacity, subtitleOpacity]);

  const handleReceive = () => {
    setOnboardingStep('sample_playback');
    navigation.replace('SamplePlayback');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <Animated.Text style={[styles.title, { opacity: titleOpacity }]}>
          A glimpse
        </Animated.Text>
        <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
          This is a preview. Your daily visitation will be given at the appointed
          hour.
        </Animated.Text>
      </View>
      <Pressable onPress={handleReceive} style={styles.button}>
        <Text style={styles.buttonText}>Receive a sample</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingHorizontal: 32,
  },
  content: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '30%',
  },
  title: {
    fontSize: 32,
    fontWeight: '500',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 12,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 999,
    backgroundColor: '#111',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 15,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.92)',
  },
});
