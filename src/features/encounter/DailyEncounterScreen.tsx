import React, { useRef, useState, useCallback, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Animated,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Video, { OnProgressData, OnLoadData } from 'react-native-video';
import { useEncounter } from '../../shared/providers/EncounterProvider';
import { useOnboarding } from '../../shared/providers/OnboardingProvider';
import { theme } from '../../shared/utils/theme';
import type { Video as EncounterVideo } from '../../shared/types/database';

const WATCH_THRESHOLD = 0.95;
const PREP_DURATION_MS = 2200;
const POST_VIDEO_SETTLE_MS = 520;
const CLOSING_HOLD_MS = 1500;
const DEFAULT_TAB_BAR_STYLE = {
  backgroundColor: theme.colors.tabBar,
  borderTopWidth: 1,
  borderTopColor: theme.colors.border,
  height: 72,
  paddingTop: 8,
  paddingBottom: 10,
};

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

export function DailyEncounterScreen() {
  const { state, loading, markSeen } = useEncounter();
  const { dailyDeliveryTime } = useOnboarding();
  const navigation = useNavigation<any>();
  const [duration, setDuration] = useState(0);
  const hasMarkedSeen = useRef(false);
  const [receivingPhase, setReceivingPhase] = useState<
    'idle' | PreparationStep | 'playing'
  >('idle');
  const [finishedVideo, setFinishedVideo] = useState<EncounterVideo | null>(null);
  const [completedFirstEncounter, setCompletedFirstEncounter] = useState(false);
  const closingOpacity = useState(() => new Animated.Value(0))[0];
  const scriptureOpacity = useState(() => new Animated.Value(0))[0];
  const actionsOpacity = useState(() => new Animated.Value(0))[0];

  const beforeTime = isBeforeAppointedTime(dailyDeliveryTime ?? null);
  const canAccessFirstEncounter =
    (state.state === 'video' && state.isFirstEncounter) ||
    completedFirstEncounter;

  const renderTitle = () => (
    <View style={styles.titleRow}>
      <Text style={styles.title}>Today</Text>
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
    if (state.state === 'video') {
      setFinishedVideo(state.video);
      setCompletedFirstEncounter(state.isFirstEncounter);
      if (!hasMarkedSeen.current) {
        hasMarkedSeen.current = true;
        markSeen(state.video.id, state.video);
      }
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

  useLayoutEffect(() => {
    const isPlaying = receivingPhase === 'playing';

    navigation.setOptions({
      tabBarStyle: isPlaying ? { display: 'none' } : DEFAULT_TAB_BAR_STYLE,
    });

    return () => {
      navigation.setOptions({
        tabBarStyle: DEFAULT_TAB_BAR_STYLE,
      });
    };
  }, [navigation, receivingPhase]);

  useEffect(() => {
    if (!finishedVideo) return;
    closingOpacity.setValue(0);
    scriptureOpacity.setValue(0);
    actionsOpacity.setValue(0);

    const seq = Animated.sequence([
      Animated.delay(POST_VIDEO_SETTLE_MS),
      Animated.timing(closingOpacity, {
        toValue: 1,
        duration: 560,
        useNativeDriver: true,
      }),
      Animated.delay(CLOSING_HOLD_MS),
      Animated.timing(closingOpacity, {
        toValue: 0,
        duration: 480,
        useNativeDriver: true,
      }),
      Animated.delay(260),
      Animated.timing(scriptureOpacity, {
        toValue: 1,
        duration: 620,
        useNativeDriver: true,
      }),
      Animated.delay(520),
      Animated.timing(actionsOpacity, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
    ]);

    seq.start();
    return () => seq.stop();
  }, [finishedVideo, closingOpacity, scriptureOpacity, actionsOpacity]);

  const renderGlow = () => <View style={styles.glow} pointerEvents="none" />;

  const renderCenteredBlock = (children: React.ReactNode) => (
    <View style={styles.centeredBlock}>
      {renderGlow()}
      <View style={styles.centeredContent}>{children}</View>
    </View>
  );

  const handleFinishExperience = useCallback(() => {
    setFinishedVideo(null);
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (beforeTime && !canAccessFirstEncounter) {
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

  if (finishedVideo) {
    const closingText =
      (finishedVideo.closing_text?.trim() && finishedVideo.closing_text) ||
      'Receive this word.';
    const scriptureText =
      (finishedVideo.kjv_text?.trim() && finishedVideo.kjv_text) ||
      finishedVideo.reference ||
      'The word has been received.';

    return (
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        {renderTitle()}
        <View style={styles.postExperience}>
          <Animated.Text style={[styles.closingWord, { opacity: closingOpacity }]}>
            {closingText}
          </Animated.Text>
          <Animated.View style={[styles.scriptureBlock, { opacity: scriptureOpacity }]}>
            <Text style={styles.scriptureText}>{scriptureText}</Text>
            {finishedVideo.reference ? (
              <Text style={styles.scriptureReference}>{finishedVideo.reference}</Text>
            ) : null}
          </Animated.View>
        </View>
        <Animated.View style={[styles.actionsRow, { opacity: actionsOpacity }]}>
          <Pressable onPress={handleFinishExperience} style={styles.cta}>
            <Text style={styles.ctaText}>Until tomorrow</Text>
          </Pressable>
        </Animated.View>
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
        <SafeAreaView style={styles.container} edges={[]}>
          <StatusBar hidden />
          <Video
            source={{ uri: state.video.video_url }}
            style={styles.video}
            resizeMode="cover"
            onProgress={handleProgress}
            onLoad={handleLoad}
            onEnd={handleEnd}
            controls={true}
            fullscreen={true}
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
    backgroundColor: theme.colors.background,
    paddingHorizontal: 32,
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
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
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  glow: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: theme.colors.glow,
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
  postExperience: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scriptureBlock: {
    alignItems: 'center',
    maxWidth: 320,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  primary: {
    fontSize: 26,
    fontWeight: '500',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  secondary: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  tertiary: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: 12,
  },
  reference: {
    fontSize: 22,
    fontWeight: '500',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  returnLine: {
    fontSize: 13,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  message: {
    fontSize: 18,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  messageDim: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 28,
  },
  preparation: {
    fontSize: 24,
    fontWeight: '500',
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  cta: {
    marginTop: 32,
    paddingVertical: 12,
    paddingHorizontal: 28,
    backgroundColor: theme.colors.accent,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.accentStrong,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.accentText,
  },
  actionsRow: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 28,
  },
  closingWord: {
    fontSize: 30,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 0,
    position: 'absolute',
    left: 32,
    right: 32,
  },
  scriptureText: {
    fontSize: 22,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 18,
  },
  scriptureReference: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.accentStrong,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
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
});
