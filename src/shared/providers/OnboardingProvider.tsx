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
  onboardingStep: string | null;
  loadingStep: boolean;
  completeOnboarding: (time: string) => Promise<void>;
  setOnboardingStep: (step: string) => Promise<void>;
  setDailyDeliveryTime: (time: string) => Promise<void>;
  saveTimeWithoutCompleting: (time: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [completed, setCompleted] = useState(false);
  const [dailyDeliveryTime, setDailyDeliveryTimeState] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [onboardingStep, setOnboardingStepState] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [done, time, step] = await Promise.all([
        onboardingService.isOnboardingCompleted(),
        onboardingService.getDailyDeliveryTime(),
        onboardingService.getOnboardingStep(),
      ]);
      setCompleted(done);
      setDailyDeliveryTimeState(time);
      setOnboardingStepState(step);
    } catch {
      setCompleted(false);
      setDailyDeliveryTimeState(null);
      setOnboardingStepState(null);
    } finally {
      setLoading(false);
      setLoadingStep(false);
    }
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

  const setOnboardingStep = useCallback(async (step: string) => {
    await onboardingService.setOnboardingStep(step);
    setOnboardingStepState(step);
  }, []);

  const saveTimeWithoutCompleting = useCallback(async (time: string) => {
    await onboardingService.saveTimeWithoutCompleting(time);
    setDailyDeliveryTimeState(time);
  }, []);

  return (
    <OnboardingContext.Provider
      value={{
        completed,
        loading,
        dailyDeliveryTime,
        onboardingStep,
        loadingStep,
        completeOnboarding,
        setOnboardingStep,
        setDailyDeliveryTime,
        saveTimeWithoutCompleting,
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
