/**
 * Epistle - Daily video encounter app
 * @format
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/shared/providers/AuthProvider';
import { OnboardingProvider } from './src/shared/providers/OnboardingProvider';
import { SubscriptionProvider } from './src/shared/providers/SubscriptionProvider';
import { EncounterProvider } from './src/shared/providers/EncounterProvider';
import { NotificationProvider } from './src/shared/providers/NotificationProvider';
import { AppNavigator } from './src/navigation/AppNavigator';
import { theme } from './src/shared/utils/theme';

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      <AuthProvider>
        <OnboardingProvider>
          <SubscriptionProvider>
            <NotificationProvider>
              <EncounterProvider>
                <AppNavigator />
              </EncounterProvider>
            </NotificationProvider>
          </SubscriptionProvider>
        </OnboardingProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
