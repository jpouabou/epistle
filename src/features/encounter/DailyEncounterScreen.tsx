import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Video, { OnProgressData, OnLoadData } from 'react-native-video';
import { useEncounter } from '../../shared/providers/EncounterProvider';
import { useSubscription } from '../../shared/providers/SubscriptionProvider';

const WATCH_THRESHOLD = 0.95;

export function DailyEncounterScreen() {
  const { state, loading, markSeen } = useEncounter();
  const { subscriptionActive } = useSubscription();
  const navigation = useNavigation();
  const [duration, setDuration] = useState(0);
  const hasMarkedSeen = useRef(false);

  const handleProgress = useCallback(
    (data: OnProgressData) => {
      if (state.state !== 'video' || hasMarkedSeen.current || duration <= 0)
        return;
      const progress = data.currentTime / duration;
      if (progress >= WATCH_THRESHOLD) {
        hasMarkedSeen.current = true;
        markSeen(state.video.id);
      }
    },
    [state, duration, markSeen],
  );

  const handleLoad = useCallback((data: OnLoadData) => {
    setDuration(data.duration);
  }, []);

  const handleEnd = useCallback(() => {
    if (state.state === 'video' && !hasMarkedSeen.current) {
      hasMarkedSeen.current = true;
      markSeen(state.video.id);
    }
  }, [state, markSeen]);

  if (!subscriptionActive) {
    const handleJoin = () => {
      navigation.getParent()?.navigate('Paywall' as never);
    };
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <Text style={styles.message}>
          Join to receive your daily visitation at the appointed hour.
        </Text>
        <Pressable onPress={handleJoin} style={styles.joinButton}>
          <Text style={styles.joinButtonText}>Join</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <ActivityIndicator size="large" color="#eee" />
      </SafeAreaView>
    );
  }

  if (state.state === 'no_videos') {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <Text style={styles.message}>
          You have received your Word for today. Come back at the appointed
          time.
        </Text>
      </SafeAreaView>
    );
  }

  if (state.state === 'seen') {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <Text style={styles.message}>Carry this word with you today.</Text>
      </SafeAreaView>
    );
  }

  if (state.state === 'video') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Video
          source={{ uri: state.video.video_url }}
          style={styles.video}
          resizeMode="contain"
          onProgress={handleProgress}
          onLoad={handleLoad}
          onEnd={handleEnd}
          controls={true}
          ignoreSilentSwitch="ignore"
          playInBackground={false}
        />
      </SafeAreaView>
    );
  }

  return null;
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
  center: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  message: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 24,
  },
  joinButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  joinButtonText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.95)',
  },
});
