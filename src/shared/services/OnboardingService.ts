import { localStorageRepository } from '../repositories/LocalStorageRepository';
import { profileRepository } from '../repositories/ProfileRepository';
import { authRepository } from '../repositories/AuthRepository';

export class OnboardingService {
  async getOnboardingStep(): Promise<string | null> {
    return localStorageRepository.getOnboardingStep();
  }

  async setOnboardingStep(step: string): Promise<void> {
    await localStorageRepository.setOnboardingStep(step);
  }

  async clearOnboardingForDev(): Promise<void> {
    await localStorageRepository.clearOnboardingForDev();
  }

  async saveTimeWithoutCompleting(time: string): Promise<void> {
    const user = (await authRepository.getSession()).user;
    if (user) {
      await profileRepository.upsertProfile(user.id, {
        daily_delivery_time: time,
      });
    }
    await localStorageRepository.setDailyDeliveryTime(time);
  }

  async isOnboardingCompleted(): Promise<boolean> {
    const user = (await authRepository.getSession()).user;
    if (user) {
      const profile = await profileRepository.getProfile(user.id);
      if (profile?.onboarding_completed) return true;
    }
    return localStorageRepository.getOnboardingCompleted();
  }

  async completeOnboarding(dailyDeliveryTime: string): Promise<void> {
    const user = (await authRepository.getSession()).user;

    if (user) {
      await profileRepository.upsertProfile(user.id, {
        daily_delivery_time: dailyDeliveryTime,
        onboarding_completed: true,
      });
    }

    await localStorageRepository.setOnboardingCompleted(true);
    await localStorageRepository.setDailyDeliveryTime(dailyDeliveryTime);
  }

  async getDailyDeliveryTime(): Promise<string | null> {
    const user = (await authRepository.getSession()).user;
    if (user) {
      const profile = await profileRepository.getProfile(user.id);
      if (profile?.daily_delivery_time) return profile.daily_delivery_time;
    }
    return localStorageRepository.getDailyDeliveryTime();
  }

  async setDailyDeliveryTime(time: string): Promise<void> {
    const user = (await authRepository.getSession()).user;

    if (user) {
      await profileRepository.upsertProfile(user.id, {
        daily_delivery_time: time,
      });
    }

    await localStorageRepository.setDailyDeliveryTime(time);
  }
}

export const onboardingService = new OnboardingService();
