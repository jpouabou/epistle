/**
 * Epistle - Daily video encounter app
 * @format
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/shared/providers/AuthProvider';
import { OnboardingProvider } from './src/shared/providers/OnboardingProvider';
import { EncounterProvider } from './src/shared/providers/EncounterProvider';
import { NotificationProvider } from './src/shared/providers/NotificationProvider';
import { AppNavigator } from './src/navigation/AppNavigator';

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <AuthProvider>
        <OnboardingProvider>
          <NotificationProvider>
            <EncounterProvider>
              <AppNavigator />
            </EncounterProvider>
          </NotificationProvider>
        </OnboardingProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
