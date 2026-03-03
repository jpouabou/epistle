import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import notifee, { EventType } from '@notifee/react-native';
import { useOnboarding } from '../shared/providers/OnboardingProvider';
import { useAuth } from '../shared/providers/AuthProvider';
import { OnboardingScreen } from '../features/onboarding/OnboardingScreen';
import { TimePickerScreen } from '../features/onboarding/TimePickerScreen';
import { DailyEncounterScreen } from '../features/encounter/DailyEncounterScreen';
import { CharactersGalleryScreen } from '../features/characters/CharactersGalleryScreen';
import { CharacterDetailScreen } from '../features/characters/CharacterDetailScreen';
import { SettingsScreen } from '../features/settings/SettingsScreen';
import { AuthScreen } from '../features/auth/AuthScreen';
import type { OnboardingStackParamList } from '../shared/types/navigation';
import type { MainTabParamList } from '../shared/types/navigation';
import type { CharactersStackParamList } from '../shared/types/navigation';
import type { SettingsStackParamList } from '../shared/types/navigation';

const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();
const MainTabs = createBottomTabNavigator<MainTabParamList>();
const CharactersStack = createNativeStackNavigator<CharactersStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

function CharactersNavigator() {
  return (
    <CharactersStack.Navigator
      screenOptions={{ headerShown: false }}
    >
      <CharactersStack.Screen name="Gallery" component={CharactersGalleryScreen} />
      <CharactersStack.Screen name="CharacterDetail" component={CharacterDetailScreen} />
    </CharactersStack.Navigator>
  );
}

function SettingsNavigator() {
  return (
    <SettingsStack.Navigator
      screenOptions={{ headerShown: false }}
    >
      <SettingsStack.Screen name="SettingsMain" component={SettingsScreen} />
      <SettingsStack.Screen name="Auth" component={AuthScreenWrapper} />
    </SettingsStack.Navigator>
  );
}

function AuthScreenWrapper({ navigation }: { navigation: { goBack: () => void } }) {
  const { continueWithoutAccount } = useAuth();
  const handleContinue = async () => {
    await continueWithoutAccount();
    navigation.goBack();
  };
  return <AuthScreen onContinueWithoutAccount={handleContinue} />;
}

function MainNavigator() {
  return (
    <MainTabs.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1a1a2e' },
        headerTintColor: '#eee',
        tabBarStyle: { backgroundColor: '#1a1a2e' },
        tabBarActiveTintColor: '#eee',
        tabBarInactiveTintColor: '#666',
      }}
    >
      <MainTabs.Screen
        name="DailyEncounter"
        component={DailyEncounterScreen}
        options={{ title: 'Today', tabBarLabel: 'Today' }}
      />
      <MainTabs.Screen
        name="Characters"
        component={CharactersNavigator}
        options={{ title: 'Characters', tabBarLabel: 'Characters' }}
      />
      <MainTabs.Screen
        name="Settings"
        component={SettingsNavigator}
        options={{ title: 'Settings', tabBarLabel: 'Settings' }}
      />
    </MainTabs.Navigator>
  );
}

function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color="#eee" />
    </View>
  );
}

export function AppNavigator() {
  const { completed, loading } = useOnboarding();
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    const sub = notifee.onForegroundEvent(({ type }) => {
      if (type === EventType.PRESS && navigationRef.isReady()) {
        navigationRef.navigate('DailyEncounter' as never);
      }
    });
    return () => sub();
  }, [navigationRef]);

  useEffect(() => {
    notifee.getInitialNotification().then((notification) => {
      if (notification && navigationRef.isReady()) {
        navigationRef.navigate('DailyEncounter' as never);
      }
    });
  }, [navigationRef]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <NavigationContainer ref={navigationRef}>
        {completed ? <MainNavigator /> : <OnboardingStackWrapper />}
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

function OnboardingStackWrapper() {
  return (
    <OnboardingStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#1a1a2e' },
      }}
    >
      <OnboardingStack.Screen name="Onboarding" component={OnboardingScreen} />
      <OnboardingStack.Screen name="TimePicker" component={TimePickerScreen} />
    </OnboardingStack.Navigator>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loading: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
