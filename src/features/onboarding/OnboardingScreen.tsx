import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  Animated,
  Easing,
  StyleSheet,
  FlatList,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../shared/types/navigation';
import { BIBLE_CHARACTERS } from '../../shared/utils/constants';

const { width, height } = Dimensions.get('window');

const IMAGE_SECTION_HEIGHT = height * 0.55;
const TEXT_SECTION_HEIGHT = height * 0.33;
const BOTTOM_SECTION_HEIGHT = height * 0.1;
const HORIZONTAL_PADDING = width * 0.1;

const NAME_FADE_DELAY = 350;
const NAME_FADE_DURATION = 700;
const DESC_FADE_DELAY = 150;
const DESC_FADE_DURATION = 550;

const JESUS_NAME_FADE_DELAY = 1200;
const JESUS_NAME_FADE_DURATION = 800;
const JESUS_DESC_FADE_DELAY = 200;
const JESUS_DESC_FADE_DURATION = 600;
const JESUS_STILLNESS_HOLD = 1000;
const JESUS_ZOOM_DURATION = 5000;
const JESUS_ZOOM_SCALE = 1.13;
const JESUS_TEXT_FADEOUT_DURATION = 2500;
const JESUS_BOTTOM_FADE_DELAY = 1500;
const JESUS_BOTTOM_FADE_DURATION = 600;

type CharacterSlideProps = {
  item: (typeof BIBLE_CHARACTERS)[number];
  isActive: boolean;
  isLastSlide: boolean;
  onNext: () => void;
  currentIndex: number;
  totalCount: number;
};

function CharacterSlide({
  item,
  isActive,
  isLastSlide,
  onNext,
  currentIndex,
  totalCount,
}: CharacterSlideProps) {
  const isJesus = item.id === 'jesus';
  const nameOpacity = useRef(new Animated.Value(0)).current;
  const descOpacity = useRef(new Animated.Value(0)).current;
  const imageScale = useRef(new Animated.Value(1)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;
  const bottomOpacity = useRef(new Animated.Value(isJesus ? 0 : 1)).current;
  const hasAnimated = useRef(false);

  const nameDelay = isJesus ? JESUS_NAME_FADE_DELAY : NAME_FADE_DELAY;
  const nameDuration = isJesus ? JESUS_NAME_FADE_DURATION : NAME_FADE_DURATION;
  const descDelay = isJesus ? JESUS_DESC_FADE_DELAY : DESC_FADE_DELAY;
  const descDuration = isJesus ? JESUS_DESC_FADE_DURATION : DESC_FADE_DURATION;

  useEffect(() => {
    if (isActive && !hasAnimated.current) {
      hasAnimated.current = true;

      if (isJesus) {
        Animated.sequence([
          Animated.delay(JESUS_NAME_FADE_DELAY),
          Animated.timing(nameOpacity, {
            toValue: 1,
            duration: JESUS_NAME_FADE_DURATION,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.delay(JESUS_DESC_FADE_DELAY),
          Animated.timing(descOpacity, {
            toValue: 1,
            duration: JESUS_DESC_FADE_DURATION,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.delay(JESUS_STILLNESS_HOLD),
          Animated.parallel([
            Animated.timing(imageScale, {
              toValue: JESUS_ZOOM_SCALE,
              duration: JESUS_ZOOM_DURATION,
              useNativeDriver: true,
            }),
            Animated.timing(textOpacity, {
              toValue: 0,
              duration: JESUS_TEXT_FADEOUT_DURATION,
              useNativeDriver: true,
            }),
          ]),
          Animated.delay(JESUS_BOTTOM_FADE_DELAY),
          Animated.timing(bottomOpacity, {
            toValue: 0.9,
            duration: JESUS_BOTTOM_FADE_DURATION,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        Animated.sequence([
          Animated.delay(nameDelay),
          Animated.timing(nameOpacity, {
            toValue: 1,
            duration: nameDuration,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.delay(descDelay),
          Animated.timing(descOpacity, {
            toValue: 1,
            duration: descDuration,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]).start();
      }
    }
  }, [isActive, isJesus, nameOpacity, descOpacity, imageScale, textOpacity, bottomOpacity, nameDelay, nameDuration, descDelay, descDuration]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={[styles.slide, { width }]}>
        <View style={styles.imageSection}>
          <Animated.View
            style={[
              styles.characterImageWrapper,
              {
                transform: [{ scale: imageScale }],
              },
            ]}
          >
            <Image
              source={item.image}
              style={styles.characterImage}
              resizeMode="cover"
            />
          </Animated.View>
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.98)']}
            locations={[0, 0.4, 1]}
            style={styles.imageGradient}
            pointerEvents="none"
          />
        </View>

        <View style={styles.textSection}>
          <Animated.Text
            style={[
              styles.characterName,
              {
                opacity: isJesus
                  ? Animated.multiply(nameOpacity, textOpacity)
                  : nameOpacity,
              },
              isJesus && styles.characterNameJesus,
            ]}
          >
            {item.name}
          </Animated.Text>
          <Animated.Text
            style={[
              styles.description,
              {
                opacity: isJesus
                  ? Animated.multiply(descOpacity, textOpacity)
                  : descOpacity,
              },
            ]}
          >
            {item.description}
          </Animated.Text>
        </View>

        <Animated.View
          style={[
            styles.bottomSection,
            isJesus && { opacity: bottomOpacity },
          ]}
        >
          {isLastSlide ? (
            <Pressable onPress={onNext} style={styles.nextButton}>
              <Text style={styles.nextButtonText}>Continue</Text>
            </Pressable>
          ) : (
            <Text style={styles.swipeHint}>Swipe to continue</Text>
          )}
          <View style={styles.dots}>
            {Array.from({ length: totalCount }).map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === currentIndex && styles.dotActive]}
              />
            ))}
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'Onboarding'>;
};

export function OnboardingScreen({ navigation }: Props) {
  const [index, setIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onMomentumScrollEnd = (
    e: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(i);
  };

  const handleNext = () => {
    if (index < BIBLE_CHARACTERS.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: index + 1,
        animated: true,
      });
    } else {
      navigation.navigate('TimePicker');
    }
  };

  const renderItem = ({
    item,
    index: slideIndex,
  }: {
    item: (typeof BIBLE_CHARACTERS)[number];
    index: number;
  }) => (
    <CharacterSlide
      item={item}
      isActive={slideIndex === index}
      isLastSlide={slideIndex === BIBLE_CHARACTERS.length - 1}
      onNext={handleNext}
      currentIndex={index}
      totalCount={BIBLE_CHARACTERS.length}
    />
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={BIBLE_CHARACTERS}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        style={styles.flatList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  flatList: {
    flex: 1,
  },
  slide: {
    flex: 1,
    height,
  },
  imageSection: {
    height: IMAGE_SECTION_HEIGHT,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  characterImageWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: IMAGE_SECTION_HEIGHT * 1.15,
    width: width,
  },
  characterImage: {
    width: width,
    height: IMAGE_SECTION_HEIGHT * 1.15,
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  textSection: {
    height: TEXT_SECTION_HEIGHT,
    marginTop: -38,
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  characterName: {
    fontSize: 34,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  characterNameJesus: {
    letterSpacing: 2,
  },
  description: {
    fontSize: 17,
    lineHeight: 26,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
  },
  bottomSection: {
    height: BOTTOM_SECTION_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.85,
  },
  swipeHint: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    marginBottom: 10,
  },
  nextButton: {
    paddingVertical: 10,
    paddingHorizontal: 28,
    marginBottom: 10,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  dotActive: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    width: 18,
  },
});
