import React, { useRef, useEffect } from 'react';
import { Image, Animated, Easing, StyleProp, ImageStyle } from 'react-native';

const BREATH_DURATION = 5500;
const SCALE_MIN = 1;
const SCALE_MAX = 1.02;

type Props = {
  source: number;
  style?: StyleProp<ImageStyle>;
  slower?: boolean;
};

export function BreathingImage({ source, style, slower }: Props) {
  const scale = useRef(new Animated.Value(SCALE_MIN)).current;

  useEffect(() => {
    const duration = slower ? BREATH_DURATION * 1.3 : BREATH_DURATION;
    const loop = Animated.loop(
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
    loop.start();
    return () => loop.stop();
  }, [scale, slower]);

  return (
    <Animated.View style={[{ transform: [{ scale }] }]}>
      <Image source={source} style={style} resizeMode="cover" />
    </Animated.View>
  );
}
