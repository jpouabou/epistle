import React, { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { analyticsService } from '../services/AnalyticsService';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    analyticsService.trackAppOpen();

    const subscription = AppState.addEventListener('change', (nextState) => {
      const wasBackgrounded =
        appState.current === 'background' || appState.current === 'inactive';

      if (wasBackgrounded && nextState === 'active') {
        analyticsService.trackAppOpen();
      }

      appState.current = nextState;
    });

    return () => subscription.remove();
  }, []);

  return <>{children}</>;
}
