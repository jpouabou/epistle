import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  StyleSheet,
  AppState,
  type AppStateStatus,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Video from 'react-native-video';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../shared/types/navigation';
import { useOnboarding } from '../../shared/providers/OnboardingProvider';
import { SAMPLE_VIDEO_URL } from '../../shared/utils/constants';

type Props = {
  navigation: NativeStackNavigationProp<
    OnboardingStackParamList,
    'SamplePlayback'
  >;
};

export function SamplePlaybackScreen({ navigation }: Props) {
  const [videoEnded, setVideoEnded] = useState(false);
  const [paused, setPaused] = useState(false);
  const verseOpacity = useRef(new Animated.Value(0)).current;
  const referenceOpacity = useRef(new Animated.Value(0)).current;
  const postOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const { setOnboardingStep } = useOnboarding();

  const handleEnd = useCallback(() => {
    setVideoEnded(true);
  }, []);

  const handleAppStateChange = useCallback((nextState: AppStateStatus) => {
    setPaused(nextState !== 'active');
  }, []);

  React.useEffect(() => {
    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, [handleAppStateChange]);

  React.useEffect(() => {
    if (!videoEnded) return;
    const seq = Animated.sequence([
      Animated.timing(verseOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.delay(400),
      Animated.timing(referenceOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.delay(800),
      Animated.timing(postOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.delay(800),
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]);
    seq.start();
    return () => seq.stop();
  }, [videoEnded, verseOpacity, referenceOpacity, postOpacity, buttonOpacity]);

  const handleJoin = () => {
    setOnboardingStep('paywall');
    navigation.replace('Paywall');
  };

  if (videoEnded) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <Animated.Text style={[styles.postText, { opacity: verseOpacity }]}>
            And we know that all things work together for good to them that love
            God, to them who are the called according to his purpose.
          </Animated.Text>
          <Animated.Text
            style={[styles.postText, styles.referenceText, { opacity: referenceOpacity }]}
          >
            Romans 8:28
          </Animated.Text>
          <Animated.Text style={[styles.postText, { opacity: postOpacity }]}>
            This was a sample. Your visitation awaits you.
          </Animated.Text>
        </View>
        <Animated.View style={[styles.buttonWrap, { opacity: buttonOpacity }]}>
          <Pressable onPress={handleJoin} style={styles.button}>
            <Text style={styles.buttonText}>Join</Text>
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <Video
        source={{ uri: SAMPLE_VIDEO_URL }}
        style={styles.video}
        resizeMode="contain"
        onEnd={handleEnd}
        paused={paused}
        controls={false}
        ignoreSilentSwitch="ignore"
        playInBackground={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  postText: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 16,
  },
  referenceText: {
    fontWeight: '700',
    marginBottom: 18,
  },
  buttonWrap: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginBottom: 32,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 999,
    backgroundColor: '#111',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 8,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.92)',
  },
});
