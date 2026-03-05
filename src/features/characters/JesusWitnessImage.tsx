import React, { useRef, useEffect } from 'react';
import {
  Image,
  View,
  Animated,
  Easing,
  StyleProp,
  ImageStyle,
} from 'react-native';
import { Platform } from 'react-native';

const BREATH_DURATION = 5500;
const SCALE_MIN = 1;
const SCALE_MAX = 1.02;
const FLOAT_RANGE = 6;
const FLOAT_DURATION = 3200;

type Props = {
  source: number;
  style?: StyleProp<ImageStyle>;
  slower?: boolean;
};

export function JesusWitnessImage({ source, style, slower }: Props) {
  const scale = useRef(new Animated.Value(SCALE_MIN)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const duration = slower ? BREATH_DURATION * 1.3 : BREATH_DURATION;
    const breathLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: SCALE_MAX,
          duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: SCALE_MIN,
          duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    breathLoop.start();

    const floatSequence = Animated.sequence([
      Animated.timing(translateY, {
        toValue: -FLOAT_RANGE,
        duration: FLOAT_DURATION,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: FLOAT_RANGE,
        duration: FLOAT_DURATION,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]);
    const floatAnim = Animated.loop(floatSequence, { iterations: 4 });
    floatAnim.start();

    return () => {
      breathLoop.stop();
      floatAnim.stop();
    };
  }, [scale, translateY, slower]);

  return (
    <Animated.View
      style={[
        styles.floatWrapper,
        {
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.glowOuter}>
        <View style={styles.glowInner}>
          <Animated.View style={[{ transform: [{ scale }] }]}>
            <Image source={source} style={style} resizeMode="cover" />
          </Animated.View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = {
  floatWrapper: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  glowOuter: {
    padding: 4,
    borderRadius: 9999,
    backgroundColor: 'transparent',
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: '#d4af37',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.5,
          shadowRadius: 18,
        }
      : {
          elevation: 8,
        }),
  },
  glowInner: {
    overflow: 'hidden' as const,
    borderRadius: 9999,
    borderWidth: 0.5,
    borderColor: 'rgba(212, 175, 55, 0.15)',
  },
};
