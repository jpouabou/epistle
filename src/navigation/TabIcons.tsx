import React from 'react';
import { View, StyleSheet } from 'react-native';

const SIZE = 24;

type IconProps = {
  color: string;
  focused?: boolean;
};

export function TodayTabIcon({ color, focused }: IconProps) {
  return (
    <View style={styles.frame}>
      <View
        style={[
          styles.ring,
          {
            borderColor: color,
            width: focused ? 18 : 16,
            height: focused ? 18 : 16,
            borderRadius: focused ? 9 : 8,
          },
        ]}
      />
      <View
        style={[
          styles.todayCore,
          {
            backgroundColor: color,
            opacity: focused ? 1 : 0.75,
          },
        ]}
      />
    </View>
  );
}

export function VisitationsTabIcon({ color, focused }: IconProps) {
  return (
    <View style={styles.frame}>
      <View style={styles.visitationsStack}>
        <View
          style={[
            styles.visitationsLine,
            {
              backgroundColor: color,
              width: focused ? 16 : 14,
            },
          ]}
        />
        <View
          style={[
            styles.visitationsLine,
            {
              backgroundColor: color,
              width: focused ? 12 : 10,
            },
          ]}
        />
        <View
          style={[
            styles.visitationsLine,
            {
              backgroundColor: color,
              width: focused ? 16 : 14,
            },
          ]}
        />
      </View>
    </View>
  );
}

export function WitnessesTabIcon({ color, focused }: IconProps) {
  return (
    <View style={styles.frame}>
      <View
        style={[
          styles.witnessHead,
          {
            borderColor: color,
            backgroundColor: focused ? color : 'transparent',
          },
        ]}
      />
      <View
        style={[
          styles.witnessShoulders,
          {
            borderColor: color,
          },
        ]}
      />
    </View>
  );
}

export function SettingsTabIcon({ color, focused }: IconProps) {
  return (
    <View style={styles.frame}>
      <View
        style={[
          styles.settingsOuter,
          {
            borderColor: color,
            transform: [{ rotate: focused ? '18deg' : '0deg' }],
          },
        ]}
      />
      <View
        style={[
          styles.settingsInner,
          {
            backgroundColor: color,
            opacity: focused ? 1 : 0.75,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1.5,
  },
  todayCore: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  visitationsStack: {
    alignItems: 'center',
    gap: 3,
  },
  visitationsLine: {
    height: 1.8,
    borderRadius: 999,
  },
  witnessHead: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.4,
    marginBottom: 2,
  },
  witnessShoulders: {
    width: 16,
    height: 9,
    borderWidth: 1.4,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomWidth: 0,
  },
  settingsOuter: {
    position: 'absolute',
    width: 15,
    height: 15,
    borderWidth: 1.5,
    borderRadius: 4,
  },
  settingsInner: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
});
