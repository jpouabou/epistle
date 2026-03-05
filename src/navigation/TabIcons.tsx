import React from 'react';
import { View, StyleSheet } from 'react-native';

const SIZE = 24;
const CENTER = SIZE / 2;

type IconProps = {
  color: string;
  focused?: boolean;
};

export function TodayTabIcon({ color }: IconProps) {
  return (
    <View style={[styles.iconContainer, { borderColor: color }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
    </View>
  );
}

export function VisitationsTabIcon({ color }: IconProps) {
  const line = { width: 14, height: 1.5, borderRadius: 1, backgroundColor: color };
  return (
    <View style={styles.listIconContainer}>
      <View style={[line, { marginBottom: 4 }]} />
      <View style={[line, { marginBottom: 4 }]} />
      <View style={line} />
    </View>
  );
}

export function WitnessesTabIcon({ color }: IconProps) {
  return (
    <View style={[styles.book, { borderColor: color }]}>
      <View style={[styles.bookCover, { borderColor: color }]} />
      <View style={[styles.bookSpine, { backgroundColor: color }]} />
      <View style={[styles.bookCover, { borderColor: color }]} />
    </View>
  );
}

function getToothStyle(angleDeg: number, color: string) {
  const rad = (angleDeg * Math.PI) / 180;
  const r = 7;
  const toothW = 2;
  const toothH = 6;
  const left = CENTER + r * Math.cos(rad) - toothW / 2;
  const top = CENTER + r * Math.sin(rad) - toothH / 2;
  return {
    backgroundColor: color,
    left,
    top,
    transform: [{ rotate: `${angleDeg}deg` }],
  };
}

export function SettingsTabIcon({ color }: IconProps) {
  const teeth = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <View style={styles.gearContainer}>
      <View style={[styles.gearCircle, { borderColor: color }]} />
      <View style={[styles.gearInner, { borderColor: color }]} />
      {teeth.map((angle, i) => (
        <View
          key={i}
          style={[styles.gearTooth, getToothStyle(angle, color)]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  book: {
    width: 14,
    height: 20,
    borderWidth: 1,
    borderRadius: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  bookSpine: {
    width: 1,
    height: '100%',
    opacity: 0.5,
  },
  bookCover: {
    flex: 1,
  },
  gearContainer: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gearCircle: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
  },
  gearInner: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1,
  },
  gearTooth: {
    position: 'absolute',
    width: 2,
    height: 6,
    borderRadius: 1,
  },
  listIconContainer: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
