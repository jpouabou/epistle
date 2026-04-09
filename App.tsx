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
import { AnalyticsProvider } from './src/shared/providers/AnalyticsProvider';
import { AppNavigator } from './src/navigation/AppNavigator';
import { theme } from './src/shared/utils/theme';

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      <AuthProvider>
        <AnalyticsProvider>
          <OnboardingProvider>
            <SubscriptionProvider>
              <NotificationProvider>
                <EncounterProvider>
                  <AppNavigator />
                </EncounterProvider>
              </NotificationProvider>
            </SubscriptionProvider>
          </OnboardingProvider>
        </AnalyticsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
