import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { onboardingService } from '../services/OnboardingService';

interface OnboardingContextValue {
  completed: boolean;
  loading: boolean;
  dailyDeliveryTime: string | null;
  completeOnboarding: (time: string) => Promise<void>;
  setDailyDeliveryTime: (time: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [completed, setCompleted] = useState(false);
  const [dailyDeliveryTime, setDailyDeliveryTimeState] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const done = await onboardingService.isOnboardingCompleted();
    const time = await onboardingService.getDailyDeliveryTime();
    setCompleted(done);
    setDailyDeliveryTimeState(time);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const completeOnboarding = useCallback(async (time: string) => {
    await onboardingService.completeOnboarding(time);
    setCompleted(true);
    setDailyDeliveryTimeState(time);
  }, []);

  const setDailyDeliveryTime = useCallback(async (time: string) => {
    await onboardingService.setDailyDeliveryTime(time);
    setDailyDeliveryTimeState(time);
  }, []);

  return (
    <OnboardingContext.Provider
      value={{
        completed,
        loading,
        dailyDeliveryTime,
        completeOnboarding,
        setDailyDeliveryTime,
        refresh,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider');
  return ctx;
}
