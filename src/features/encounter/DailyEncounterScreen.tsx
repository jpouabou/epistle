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
const PREP_DURATION_MS = 3200;
const VIDEO_REVEAL_MS = 1600;
const VIDEO_ENDING_FADE_MS = 1800;
const CLOSING_WORD_BREATH_MS = 500;
const CLOSING_WORD_HOLD_MS = 2800;
const CLOSING_WORD_FADE_MS = 1400;
const CLOSING_WORD_FADE_IN_MS = 1100;
const SCRIPTURE_FADE_IN_MS = 1200;
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
  const scriptureOpacity = useRef(new Animated.Value(0)).current;
  const videoRevealOpacity = useRef(new Animated.Value(1)).current;
  const videoRevealGlowOpacity = useRef(new Animated.Value(0.18)).current;
  const videoFadeOpacity = useRef(new Animated.Value(0)).current;
  const hasStartedEndingFade = useRef(false);

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

      const remainingTime = Math.max(duration - data.currentTime, 0);
      if (
        receivingPhase === 'playing' &&
        !hasStartedEndingFade.current &&
        remainingTime <= VIDEO_ENDING_FADE_MS / 1000
      ) {
        hasStartedEndingFade.current = true;
        Animated.timing(videoFadeOpacity, {
          toValue: 1,
          duration: Math.max(remainingTime * 1000, 900),
          useNativeDriver: true,
        }).start();
      }

      const progress = data.currentTime / duration;
      if (progress >= WATCH_THRESHOLD) {
        hasMarkedSeen.current = true;
        markSeen(state.video.id, state.video);
      }
    },
    [state, duration, markSeen, receivingPhase, videoFadeOpacity],
  );

  const handleLoad = useCallback((data: OnLoadData) => {
    setDuration(data.duration);
  }, []);

  const handleEnd = useCallback(() => {
    if (state.state === 'video') {
      videoFadeOpacity.setValue(1);
      setReceivingPhase('idle');
      setFinishedVideo(state.video);
      setCompletedFirstEncounter(state.isFirstEncounter);
      if (!hasMarkedSeen.current) {
        hasMarkedSeen.current = true;
        markSeen(state.video.id, state.video);
      }
    }
  }, [state, markSeen, videoFadeOpacity]);

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
    if (receivingPhase === 'playing') {
      hasStartedEndingFade.current = false;
      videoFadeOpacity.setValue(0);
      videoRevealOpacity.setValue(1);
      videoRevealGlowOpacity.setValue(0.18);

      Animated.parallel([
        Animated.timing(videoRevealOpacity, {
          toValue: 0,
          duration: VIDEO_REVEAL_MS,
          useNativeDriver: true,
        }),
        Animated.timing(videoRevealGlowOpacity, {
          toValue: 0,
          duration: VIDEO_REVEAL_MS,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    if (!finishedVideo) {
      hasStartedEndingFade.current = false;
      videoFadeOpacity.setValue(0);
      videoRevealOpacity.setValue(1);
      videoRevealGlowOpacity.setValue(0.18);
    }
  }, [
    receivingPhase,
    finishedVideo,
    videoFadeOpacity,
    videoRevealOpacity,
    videoRevealGlowOpacity,
  ]);

  useEffect(() => {
    if (!finishedVideo) {
      closingOpacity.setValue(0);
      if (state.state === 'seen') {
        setPostPlaybackPhase('scripture');
        scriptureOpacity.setValue(1);
      } else {
        setPostPlaybackPhase('closing');
        scriptureOpacity.setValue(0);
      }
      return;
    }

    setPostPlaybackPhase('closing');
    closingOpacity.setValue(0);
    scriptureOpacity.setValue(0);

    const sequence = Animated.sequence([
      Animated.delay(CLOSING_WORD_BREATH_MS),
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
        Animated.timing(scriptureOpacity, {
          toValue: 1,
          duration: SCRIPTURE_FADE_IN_MS,
          useNativeDriver: true,
        }).start();
      }
    });

    return () => {
      closingOpacity.stopAnimation();
      scriptureOpacity.stopAnimation();
      sequence.stop();
    };
  }, [finishedVideo, state.state, closingOpacity, scriptureOpacity]);

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
            <Animated.View
              style={[styles.completedWrap, { opacity: scriptureOpacity }]}
            >
              <View style={styles.scriptureSection}>
                <Text style={styles.label}>Today&apos;s scripture</Text>
                <Text style={styles.scriptureText}>{scriptureText}</Text>
                <Text style={styles.scriptureReference}>{referenceText}</Text>
                <View style={styles.scriptureUnderline} />
              </View>
            </Animated.View>
            <Animated.View
              style={[styles.returnFooter, { opacity: scriptureOpacity }]}
            >
              <Text style={styles.returnFooterTitle}>Come back tomorrow.</Text>
              <Text style={styles.returnFooterBody}>
                {dailyDeliveryTime
                  ? `Your next encounter will arrive at ${formatTimeForDisplay(dailyDeliveryTime)}.`
                  : 'Your next encounter will arrive at your appointed hour.'}
              </Text>
            </Animated.View>
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
          <Animated.View
            pointerEvents="none"
            style={[styles.videoRevealVeil, { opacity: videoRevealOpacity }]}
          />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.videoRevealGlow,
              { opacity: videoRevealGlowOpacity },
            ]}
          />
          <Animated.View
            pointerEvents="none"
            style={[styles.videoFadeOverlay, { opacity: videoFadeOpacity }]}
          />
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        {renderTitle()}
        {renderCenteredBlock(
          <>
            {state.isFirstEncounter ? null : (
              <Text style={styles.witnessIntro}>
                {formatWitnessName(state.video.character)} is about to speak.
              </Text>
            )}
            <Text style={styles.primary}>
              {state.isFirstEncounter
                ? 'Your first visitation has arrived.'
                : 'Your visitation has arrived.'}
            </Text>
       
            <Pressable onPress={handleReceive} style={styles.cta}>
              <Text style={styles.ctaText}>
                {state.isFirstEncounter ? 'Receive encounter' : 'Receive encounter'}
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
    paddingBottom: 88,
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
  scriptureSection: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  scriptureUnderline: {
    width: 52,
    height: 2,
    borderRadius: 999,
    backgroundColor: theme.colors.borderStrong,
    marginTop: 20,
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
  returnFooter: {
    position: 'absolute',
    left: 32,
    right: 32,
    bottom: 28,
    alignItems: 'center',
  },
  returnFooterTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: 4,
  },
  returnFooterBody: {
    fontSize: 13,
    lineHeight: 19,
    color: theme.colors.textMuted,
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
  videoFadeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.background,
  },
  videoRevealVeil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.background,
  },
  videoRevealGlow: {
    position: 'absolute',
    top: '16%',
    left: '12%',
    right: '12%',
    height: '52%',
    borderRadius: 999,
    backgroundColor: theme.colors.glow,
  },
});
