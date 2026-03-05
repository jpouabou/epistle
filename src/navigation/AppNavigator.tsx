import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import notifee, { EventType } from '@notifee/react-native';
import { useOnboarding } from '../shared/providers/OnboardingProvider';
import { useAuth } from '../shared/providers/AuthProvider';
import { ArrivalScreen } from '../features/onboarding/ArrivalScreen';
import { InvitationScreen } from '../features/onboarding/InvitationScreen';
import { ChooseHourScreen } from '../features/onboarding/ChooseHourScreen';
import { NotificationPermissionScreen } from '../features/onboarding/NotificationPermissionScreen';
import { WitnessTransitionScreen } from '../features/onboarding/WitnessTransitionScreen';
import { SampleIntroScreen } from '../features/onboarding/SampleIntroScreen';
import { SamplePlaybackScreen } from '../features/onboarding/SamplePlaybackScreen';
import { PaywallScreen } from '../features/onboarding/PaywallScreen';
import { PaywallScreenMain } from '../features/onboarding/PaywallScreenMain';
import { OnboardingScreen } from '../features/onboarding/OnboardingScreen';
import { DailyEncounterScreen } from '../features/encounter/DailyEncounterScreen';
import { HistoryScreen } from '../features/history/HistoryScreen';
import { CharactersGalleryScreen } from '../features/characters/CharactersGalleryScreen';
import { CharacterDetailScreen } from '../features/characters/CharacterDetailScreen';
import { SettingsScreen } from '../features/settings/SettingsScreen';
import { AuthScreen } from '../features/auth/AuthScreen';
import type { OnboardingStackParamList } from '../shared/types/navigation';
import type { MainTabParamList } from '../shared/types/navigation';
import type { MainStackParamList } from '../shared/types/navigation';
import type { CharactersStackParamList } from '../shared/types/navigation';
import type { SettingsStackParamList } from '../shared/types/navigation';
import {
  TodayTabIcon,
  VisitationsTabIcon,
  WitnessesTabIcon,
  SettingsTabIcon,
} from './TabIcons';

const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();
const MainTabs = createBottomTabNavigator<MainTabParamList>();
const CharactersStack = createNativeStackNavigator<CharactersStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

function CharactersNavigator() {
  return (
    <CharactersStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#000' },
      }}
    >
      <CharactersStack.Screen name="Gallery" component={CharactersGalleryScreen} />
      <CharactersStack.Screen
        name="CharacterDetail"
        component={CharacterDetailScreen}
        options={{ animation: 'fade' }}
      />
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

function MainTabsNavigator() {
  return (
    <MainTabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#0c0c0c', borderTopWidth: 0 },
        tabBarActiveTintColor: '#eee',
        tabBarInactiveTintColor: '#666',
      }}
    >
      <MainTabs.Screen
        name="DailyEncounter"
        component={DailyEncounterScreen}
        options={{
          title: 'Today',
          tabBarLabel: 'Today',
          tabBarIcon: ({ color, focused }) => (
            <TodayTabIcon color={color} focused={focused} />
          ),
        }}
      />
      <MainTabs.Screen
        name="Characters"
        component={CharactersNavigator}
        options={{
          title: 'Witnesses',
          tabBarLabel: 'Witnesses',
          tabBarIcon: ({ color, focused }) => (
            <WitnessesTabIcon color={color} focused={focused} />
          ),
        }}
      />
      <MainTabs.Screen
        name="Visitations"
        component={HistoryScreen}
        options={{
          title: 'Visitations',
          tabBarLabel: 'Visitations',
          tabBarIcon: ({ color, focused }) => (
            <VisitationsTabIcon color={color} focused={focused} />
          ),
        }}
      />
      <MainTabs.Screen
        name="Settings"
        component={SettingsNavigator}
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <SettingsTabIcon color={color} focused={focused} />
          ),
        }}
      />
    </MainTabs.Navigator>
  );
}

function MainNavigator() {
  return (
    <MainStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: '#000' },
      }}
    >
      <MainStack.Screen name="MainTabs" component={MainTabsNavigator} />
      <MainStack.Screen name="Paywall" component={PaywallScreenMain} />
    </MainStack.Navigator>
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
  const { completed, loading, loadingStep } = useOnboarding();
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    const sub = notifee.onForegroundEvent(({ type }) => {
      if (type === EventType.PRESS && navigationRef.isReady()) {
        (navigationRef as any).navigate('MainTabs', {
          screen: 'DailyEncounter',
        });
      }
    });
    return () => sub();
  }, [navigationRef]);

  useEffect(() => {
    notifee.getInitialNotification().then((notification) => {
      if (notification && navigationRef.isReady()) {
        (navigationRef as any).navigate('MainTabs', {
          screen: 'DailyEncounter',
        });
      }
    });
  }, [navigationRef]);

  if (loading || (!completed && loadingStep)) {
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

function getInitialRoute(step: string | null): keyof OnboardingStackParamList {
  switch (step) {
    case 'invitation':
      return 'Invitation';
    case 'choose_hour':
      return 'ChooseHour';
    case 'notification':
      return 'NotificationPermission';
    case 'witness':
      return 'WitnessTransition';
    case 'sample_intro':
      return 'SampleIntro';
    case 'sample_playback':
      return 'SamplePlayback';
    case 'paywall':
      return 'Paywall';
    case 'carousel':
      return 'Onboarding';
    default:
      return 'Arrival';
  }
}

function OnboardingStackWrapper() {
  const { onboardingStep } = useOnboarding();
  const initialRoute = getInitialRoute(onboardingStep);

  return (
    <OnboardingStack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: '#000' },
      }}
    >
      <OnboardingStack.Screen name="Arrival" component={ArrivalScreen} />
      <OnboardingStack.Screen name="Invitation" component={InvitationScreen} />
      <OnboardingStack.Screen name="ChooseHour" component={ChooseHourScreen} />
      <OnboardingStack.Screen
        name="NotificationPermission"
        component={NotificationPermissionScreen}
      />
      <OnboardingStack.Screen
        name="WitnessTransition"
        component={WitnessTransitionScreen}
      />
      <OnboardingStack.Screen name="Onboarding" component={OnboardingScreen} />
      <OnboardingStack.Screen name="SampleIntro" component={SampleIntroScreen} />
      <OnboardingStack.Screen
        name="SamplePlayback"
        component={SamplePlaybackScreen}
      />
      <OnboardingStack.Screen name="Paywall" component={PaywallScreen} />
    </OnboardingStack.Navigator>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loading: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
