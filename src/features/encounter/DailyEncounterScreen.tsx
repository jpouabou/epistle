import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Video, { OnProgressData, OnLoadData } from 'react-native-video';
import { useEncounter } from '../../shared/providers/EncounterProvider';

const WATCH_THRESHOLD = 0.95;

export function DailyEncounterScreen() {
  const { state, loading, markSeen } = useEncounter();
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
    [state, duration, markSeen]
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#eee" />
      </View>
    );
  }

  if (state.state === 'no_videos') {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>
          No new message today. Come back tomorrow.
        </Text>
      </View>
    );
  }

  if (state.state === 'seen') {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>
          Carry this word with you today.
        </Text>
      </View>
    );
  }

  if (state.state === 'video') {
    return (
      <View style={styles.container}>
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
      </View>
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
    color: '#eee',
    textAlign: 'center',
    lineHeight: 28,
  },
});
