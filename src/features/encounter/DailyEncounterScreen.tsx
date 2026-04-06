import React, { useRef, useState, useCallback, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  StatusBar,
  Animated,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Video, { OnProgressData, OnLoadData } from 'react-native-video';
import { useEncounter } from '../../shared/providers/EncounterProvider';
import { useOnboarding } from '../../shared/providers/OnboardingProvider';
import { theme } from '../../shared/utils/theme';
import type { Video as EncounterVideo } from '../../shared/types/database';

const WATCH_THRESHOLD = 0.95;
const PREP_DURATION_MS = 2200;
const CLOSING_WORD_HOLD_MS = 1800;
const CLOSING_WORD_FADE_MS = 500;
const CLOSING_WORD_FADE_IN_MS = 420;
const DEFAULT_TAB_BAR_STYLE = {
  backgroundColor: theme.colors.tabBar,
  borderTopWidth: 1,
  borderTopColor: theme.colors.border,
  height: 72,
  paddingTop: 8,
  paddingBottom: 10,
};

function formatTimeForDisplay(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const hour = h ?? 8;
  const minute = m ?? 0;
  const period = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${minute.toString().padStart(2, '0')} ${period}`;
}

function formatWitnessName(name: string | null | undefined): string {
  if (!name) return 'A witness';
  return name;
}

type PreparationStep = 'be_still' | 'receive';
type PostPlaybackPhase = 'closing' | 'scripture';

export function DailyEncounterScreen() {
  const { state, loading, markSeen, refresh } = useEncounter();
  const { dailyDeliveryTime } = useOnboarding();
  const navigation = useNavigation<any>();
  const [duration, setDuration] = useState(0);
  const hasMarkedSeen = useRef(false);
  const [now, setNow] = useState(() => Date.now());
  const [receivingPhase, setReceivingPhase] = useState<
    'idle' | PreparationStep | 'playing'
  >('idle');
  const [finishedVideo, setFinishedVideo] = useState<EncounterVideo | null>(null);
  const [postPlaybackPhase, setPostPlaybackPhase] = useState<PostPlaybackPhase>('closing');
  const [completedFirstEncounter, setCompletedFirstEncounter] = useState(false);
  const closingOpacity = useRef(new Animated.Value(0)).current;

  const beforeTime = (() => {
    const effectiveUnlockTime =
      state.state === 'video' || state.state === 'seen'
        ? state.unlockTime
        : dailyDeliveryTime;
    if (!effectiveUnlockTime) return false;
    const [h, m] = effectiveUnlockTime.split(':').map(Number);
    const appointed = new Date(now);
    appointed.setHours(h ?? 8, m ?? 0, 0, 0);
    return now < appointed.getTime();
  })();
  const canAccessFirstEncounter =
    (state.state === 'video' && state.isFirstEncounter) ||
    completedFirstEncounter;

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 30 * 1000);

    return () => clearInterval(interval);
  }, []);

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
      setReceivingPhase('idle');
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

  useEffect(() => {
    if (!finishedVideo) {
      setPostPlaybackPhase('closing');
      closingOpacity.setValue(0);
      return;
    }

    setPostPlaybackPhase('closing');
    closingOpacity.setValue(0);

    const sequence = Animated.sequence([
      Animated.timing(closingOpacity, {
        toValue: 1,
        duration: CLOSING_WORD_FADE_IN_MS,
        useNativeDriver: true,
      }),
      Animated.delay(CLOSING_WORD_HOLD_MS),
      Animated.timing(closingOpacity, {
        toValue: 0,
        duration: CLOSING_WORD_FADE_MS,
        useNativeDriver: true,
      }),
    ]);

    sequence.start(({ finished }) => {
      if (finished) {
        setPostPlaybackPhase('scripture');
      }
    });

    return () => {
      closingOpacity.stopAnimation();
      sequence.stop();
    };
  }, [finishedVideo, closingOpacity]);

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

  const renderGlow = () => <View style={styles.glow} pointerEvents="none" />;

  const renderCenteredBlock = (children: React.ReactNode) => (
    <View style={styles.centeredBlock}>
      {renderGlow()}
      <View style={styles.centeredContent}>{children}</View>
    </View>
  );

  const renderCompletedEncounter = (
    video: EncounterVideo,
    options?: { showClosingTransition?: boolean },
  ) => {
    const showClosingTransition = options?.showClosingTransition ?? false;
    const closingText =
      (video.closing_text?.trim() && video.closing_text) ||
      'Receive this word.';
    const scriptureText =
      (video.kjv_text?.trim() && video.kjv_text) ||
      video.reference ||
      'The word has been received.';
    const referenceText = video.reference || '—';

    return (
      <SafeAreaView
        style={
          showClosingTransition && postPlaybackPhase === 'closing'
            ? styles.fullscreenStage
            : styles.screen
        }
        edges={
          showClosingTransition && postPlaybackPhase === 'closing' ? [] : ['top']
        }
      >
        {showClosingTransition && postPlaybackPhase === 'closing' ? (
          <View style={styles.closingStage}>
            <StatusBar hidden />
            <Animated.Text
              style={[styles.closingWordText, { opacity: closingOpacity }]}
            >
              {closingText}
            </Animated.Text>
          </View>
        ) : (
          <>
            <StatusBar hidden={false} />
            {renderTitle()}
            <View style={styles.completedWrap}>
              <View style={styles.scripturePanel}>
                <Text style={styles.label}>Today&apos;s scripture</Text>
                <Text style={styles.scriptureText}>{scriptureText}</Text>
                <Text style={styles.scriptureReference}>{referenceText}</Text>
              </View>
              <View style={styles.returnPanel}>
                <Text style={styles.returnTitle}>Come back tomorrow.</Text>
                <Text style={styles.returnBody}>
                  {dailyDeliveryTime
                    ? `Your next encounter will arrive at ${formatTimeForDisplay(dailyDeliveryTime)}.`
                    : 'Your next encounter will arrive at your appointed hour.'}
                </Text>
              </View>
            </View>
          </>
        )}
      </SafeAreaView>
    );
  };

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
    return renderCompletedEncounter(finishedVideo, {
      showClosingTransition: true,
    });
  }

  if (state.state === 'seen' && state.video) {
    return renderCompletedEncounter(state.video);
  }

  if (state.state === 'video') {
    if (receivingPhase === 'be_still') {
      return (
        <SafeAreaView style={styles.screen} edges={['top']}>
          {renderCenteredBlock(
            <>
              <Text style={styles.witnessIntro}>
                {formatWitnessName(state.video.character)} is about to speak.
              </Text>
              <Text style={styles.preparation}>Be still.</Text>
            </>,
          )}
        </SafeAreaView>
      );
    }
    if (receivingPhase === 'receive') {
      return (
        <SafeAreaView style={styles.screen} edges={['top']}>
          {renderCenteredBlock(
            <>
              <Text style={styles.witnessIntro}>
                {formatWitnessName(state.video.character)} is about to speak.
              </Text>
              <Text style={styles.preparation}>Receive the word.</Text>
            </>,
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
            <Text style={styles.witnessIntro}>
              Today, {formatWitnessName(state.video.character)} will speak.
            </Text>
            <Text style={styles.primary}>
              {state.isFirstEncounter
                ? 'Your first visitation has arrived.'
                : 'Your visitation has arrived.'}
            </Text>
            <Text style={styles.secondary}>
              {state.isFirstEncounter
                ? 'Receive your first word.'
                : 'Receive the word.'}
            </Text>
            <Pressable onPress={handleReceive} style={styles.cta}>
              <Text style={styles.ctaText}>
                {state.isFirstEncounter ? 'Receive first word' : 'Receive'}
              </Text>
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
  fullscreenStage: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
    maxWidth: 320,
  },
  completedWrap: {
    flex: 1,
    justifyContent: 'center',
    gap: 18,
  },
  closingStage: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  closingWordText: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  scripturePanel: {
    paddingVertical: 28,
    paddingHorizontal: 24,
    borderRadius: 28,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  returnPanel: {
    paddingVertical: 22,
    paddingHorizontal: 22,
    borderRadius: 24,
    backgroundColor: theme.colors.surface,
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
    marginBottom: 14,
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
  witnessIntro: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: theme.colors.accentStrong,
    textAlign: 'center',
    marginBottom: 14,
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
  returnTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  returnBody: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.textSecondary,
    textAlign: 'center',
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
