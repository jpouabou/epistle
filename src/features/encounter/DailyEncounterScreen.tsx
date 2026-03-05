import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Video, { OnProgressData, OnLoadData } from 'react-native-video';
import { useEncounter } from '../../shared/providers/EncounterProvider';
import { useSubscription } from '../../shared/providers/SubscriptionProvider';
import { useOnboarding } from '../../shared/providers/OnboardingProvider';

const WATCH_THRESHOLD = 0.95;
const PREP_DURATION_MS = 2200;

function isBeforeAppointedTime(dailyDeliveryTime: string | null): boolean {
  if (!dailyDeliveryTime) return false;
  const [h, m] = dailyDeliveryTime.split(':').map(Number);
  const now = new Date();
  const appointed = new Date(now);
  appointed.setHours(h ?? 8, m ?? 0, 0, 0);
  return now.getTime() < appointed.getTime();
}

function formatTimeForDisplay(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const hour = h ?? 8;
  const minute = m ?? 0;
  const period = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${minute.toString().padStart(2, '0')} ${period}`;
}

type PreparationStep = 'be_still' | 'receive';

type DevForceState = null | 'before' | 'invitation' | 'received';

const isDev = typeof __DEV__ !== 'undefined' && __DEV__;

export function DailyEncounterScreen() {
  const { state, loading, markSeen } = useEncounter();
  const { subscriptionActive } = useSubscription();
  const { dailyDeliveryTime } = useOnboarding();
  const navigation = useNavigation();
  const [duration, setDuration] = useState(0);
  const hasMarkedSeen = useRef(false);
  const [receivingPhase, setReceivingPhase] = useState<
    'idle' | PreparationStep | 'playing'
  >('idle');
  const [devForceState, setDevForceState] = useState<DevForceState>(null);

  const beforeTime = isBeforeAppointedTime(dailyDeliveryTime ?? null);

  const showDevMenu = useCallback(() => {
    if (!isDev) return;
    Alert.alert('Today screen (dev)', 'Force which state to show:', [
      { text: 'Before time', onPress: () => setDevForceState('before') },
      { text: 'Invitation', onPress: () => setDevForceState('invitation') },
      { text: 'Received', onPress: () => setDevForceState('received') },
      { text: 'Use real state', onPress: () => setDevForceState(null) },
    ]);
  }, []);

  const renderTitle = () => (
    <View style={styles.titleRow}>
      <Text style={styles.title}>Today</Text>
      {isDev && (
        <Pressable onPress={showDevMenu} style={styles.devButton}>
          <Text style={styles.devButtonText}>Test states</Text>
        </Pressable>
      )}
    </View>
  );

  const handleProgress = useCallback(
    (data: OnProgressData) => {
      if (state.state !== 'video' || hasMarkedSeen.current || duration <= 0)
        return;
      const progress = data.currentTime / duration;
      if (progress >= WATCH_THRESHOLD) {
        hasMarkedSeen.current = true;
        markSeen(state.video.id, state.video);
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
      markSeen(state.video.id, state.video);
    }
  }, [state, markSeen]);

  const handleReceive = useCallback(() => {
    setReceivingPhase('be_still');
  }, []);

  useEffect(() => {
    if (receivingPhase !== 'be_still') return;
    const t = setTimeout(() => setReceivingPhase('receive'), PREP_DURATION_MS);
    return () => clearTimeout(t);
  }, [receivingPhase]);

  useEffect(() => {
    if (receivingPhase !== 'receive') return;
    const t = setTimeout(() => setReceivingPhase('playing'), PREP_DURATION_MS);
    return () => clearTimeout(t);
  }, [receivingPhase]);

  useEffect(() => {
    if (state.state !== 'video') setReceivingPhase('idle');
  }, [state.state]);

  const renderGlow = () => <View style={styles.glow} pointerEvents="none" />;

  const renderCenteredBlock = (children: React.ReactNode) => (
    <View style={styles.centeredBlock}>
      {renderGlow()}
      <View style={styles.centeredContent}>{children}</View>
    </View>
  );

  // Dev-only overrides to quickly preview Today states regardless of real time/subscription.
  if (isDev && devForceState === 'before') {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        {renderTitle()}
        {renderCenteredBlock(
          <>
            <Text style={styles.primary}>The word will come.</Text>
            <Text style={styles.secondary}>At the appointed time.</Text>
            {dailyDeliveryTime && (
              <Text style={styles.tertiary}>
                Today at {formatTimeForDisplay(dailyDeliveryTime)}.
              </Text>
            )}
          </>,
        )}
      </SafeAreaView>
    );
  }

  if (isDev && devForceState === 'invitation' && receivingPhase === 'idle') {
    const canReceive = state.state === 'video';
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        {renderTitle()}
        {renderCenteredBlock(
          <>
            <Text style={styles.primary}>Your visitation has arrived.</Text>
            <Text style={styles.secondary}>Receive the word.</Text>
            <Pressable
              onPress={() => canReceive && handleReceive()}
              style={styles.cta}
            >
              <Text style={styles.ctaText}>Receive</Text>
            </Pressable>
            {isDev && !canReceive && (
              <Text style={[styles.devHintText, { marginTop: 20 }]}>
                (Real state is not &quot;video&quot; — Receive will only work
                when it is)
              </Text>
            )}
          </>,
        )}
      </SafeAreaView>
    );
  }

  if (isDev && devForceState === 'received') {
    const ref =
      state.state === 'seen' && state.video
        ? state.video.reference || '—'
        : 'Romans 8:28–29';
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        {renderTitle()}
        {renderCenteredBlock(
          <>
            <Text style={styles.label}>Today&apos;s visitation</Text>
            <Text style={styles.reference}>{ref}</Text>
            <Text style={styles.tertiary}>Delivered this morning.</Text>
            <Text style={styles.returnLine}>Return tomorrow.</Text>
          </>,
        )}
      </SafeAreaView>
    );
  }

  if (!subscriptionActive) {
    const handleJoin = () => {
      navigation.getParent()?.navigate('Paywall' as never);
    };
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        {isDev && (
          <Pressable onPress={showDevMenu} style={styles.devButtonFloating}>
            <Text style={styles.devButtonText}>Test states</Text>
          </Pressable>
        )}
        {renderCenteredBlock(
          <>
            <Text style={styles.message}>
              The word will come at the appointed hour.
            </Text>
            <Text style={styles.messageDim}>
              Join to receive your visitation.
            </Text>
            <Pressable onPress={handleJoin} style={styles.cta}>
              <Text style={styles.ctaText}>Join</Text>
            </Pressable>
          </>,
        )}
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        {isDev && (
          <Pressable onPress={showDevMenu} style={styles.devButtonFloating}>
            <Text style={styles.devButtonText}>Test states</Text>
          </Pressable>
        )}
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="rgba(255,255,255,0.4)" />
        </View>
      </SafeAreaView>
    );
  }

  if (beforeTime) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        {renderTitle()}
        {renderCenteredBlock(
          <>
            <Text style={styles.primary}>The word will come.</Text>
            <Text style={styles.secondary}>At the appointed time.</Text>
            {dailyDeliveryTime && (
              <Text style={styles.tertiary}>
                Today at {formatTimeForDisplay(dailyDeliveryTime)}.
              </Text>
            )}
          </>,
        )}
      </SafeAreaView>
    );
  }

  if (state.state === 'no_videos') {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        {isDev && (
          <Pressable onPress={showDevMenu} style={styles.devButtonFloating}>
            <Text style={styles.devButtonText}>Test states</Text>
          </Pressable>
        )}
        {renderCenteredBlock(
          <>
            <Text style={styles.primary}>
              You have received your word for today.
            </Text>
            <Text style={styles.secondary}>Return at the appointed time.</Text>
          </>,
        )}
      </SafeAreaView>
    );
  }

  if (state.state === 'seen' && state.video) {
    const ref = state.video.reference || '—';
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        {renderTitle()}
        {renderCenteredBlock(
          <>
            <Text style={styles.label}>Today&apos;s visitation</Text>
            <Text style={styles.reference}>{ref}</Text>
            <Text style={styles.tertiary}>Delivered this morning.</Text>
            <Text style={styles.returnLine}>Return tomorrow.</Text>
          </>,
        )}
      </SafeAreaView>
    );
  }

  if (state.state === 'video') {
    if (receivingPhase === 'be_still') {
      return (
        <SafeAreaView style={styles.screen} edges={['top']}>
          {renderCenteredBlock(
            <Text style={styles.preparation}>Be still.</Text>,
          )}
        </SafeAreaView>
      );
    }
    if (receivingPhase === 'receive') {
      return (
        <SafeAreaView style={styles.screen} edges={['top']}>
          {renderCenteredBlock(
            <Text style={styles.preparation}>Receive the word.</Text>,
          )}
        </SafeAreaView>
      );
    }
    if (receivingPhase === 'playing') {
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

    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        {renderTitle()}
        {renderCenteredBlock(
          <>
            <Text style={styles.primary}>Your visitation has arrived.</Text>
            <Text style={styles.secondary}>Receive the word.</Text>
            <Pressable onPress={handleReceive} style={styles.cta}>
              <Text style={styles.ctaText}>Receive</Text>
            </Pressable>
          </>,
        )}
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000',
    paddingHorizontal: 32,
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  glow: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(180,140,80,0.03)',
    top: '50%',
    left: '50%',
    marginLeft: -160,
    marginTop: -160,
  },
  centeredBlock: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 280,
  },
  centeredContent: {
    alignItems: 'center',
  },
  primary: {
    fontSize: 26,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
    marginBottom: 16,
  },
  secondary: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 8,
  },
  tertiary: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginBottom: 12,
  },
  reference: {
    fontSize: 22,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.92)',
    textAlign: 'center',
    marginBottom: 16,
  },
  returnLine: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    marginTop: 8,
  },
  message: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 12,
  },
  messageDim: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    marginBottom: 28,
  },
  preparation: {
    fontSize: 24,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  cta: {
    marginTop: 32,
    paddingVertical: 12,
    paddingHorizontal: 28,
    backgroundColor: '#0c0c0c',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.92)',
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  devButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  devButtonFloating: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    zIndex: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
  },
  devButtonText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  devHintText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.35)',
  },
});
