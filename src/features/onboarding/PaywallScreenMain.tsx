import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../shared/types/navigation';
import { PaywallContent } from './PaywallContent';

type Props = {
  navigation: NativeStackNavigationProp<MainStackParamList, 'Paywall'>;
};

export function PaywallScreenMain({ navigation }: Props) {
  const handleJoinSuccess = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  const handleNotNow = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <PaywallContent onJoinSuccess={handleJoinSuccess} onNotNow={handleNotNow} />
      <View style={styles.actions}>
        <Pressable onPress={handleNotNow} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Not now</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingHorizontal: 32,
  },
  actions: {
    paddingVertical: 16,
    marginBottom: 48,
    alignItems: 'center',
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
});
