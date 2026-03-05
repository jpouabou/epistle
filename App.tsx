/**
 * Epistle - Daily video encounter app
 * @format
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/shared/providers/AuthProvider';
import { OnboardingProvider } from './src/shared/providers/OnboardingProvider';
import { PurchasesProvider } from './src/shared/providers/PurchasesProvider';
import { SubscriptionProvider } from './src/shared/providers/SubscriptionProvider';
import { EncounterProvider } from './src/shared/providers/EncounterProvider';
import { NotificationProvider } from './src/shared/providers/NotificationProvider';
import { AppNavigator } from './src/navigation/AppNavigator';

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <AuthProvider>
        <OnboardingProvider>
          <PurchasesProvider>
            <SubscriptionProvider>
            <NotificationProvider>
              <EncounterProvider>
                <AppNavigator />
              </EncounterProvider>
            </NotificationProvider>
            </SubscriptionProvider>
          </PurchasesProvider>
        </OnboardingProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
