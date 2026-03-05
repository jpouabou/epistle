import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utils/constants';

export class LocalStorageRepository {
  async getOnboardingCompleted(): Promise<boolean> {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
    return value === 'true';
  }

  async setOnboardingCompleted(completed: boolean): Promise<void> {
    await AsyncStorage.setItem(
      STORAGE_KEYS.ONBOARDING_COMPLETED,
      completed ? 'true' : 'false'
    );
  }

  async getDailyDeliveryTime(): Promise<string | null> {
    return AsyncStorage.getItem(STORAGE_KEYS.DAILY_DELIVERY_TIME);
  }

  async setDailyDeliveryTime(time: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.DAILY_DELIVERY_TIME, time);
  }

  async getOnboardingStep(): Promise<string | null> {
    return AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_STEP);
  }

  async setOnboardingStep(step: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_STEP, step);
  }

  async getSubscriptionActive(): Promise<boolean> {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.SUBSCRIPTION_ACTIVE);
    return value === 'true';
  }

  async setSubscriptionActive(active: boolean): Promise<void> {
    await AsyncStorage.setItem(
      STORAGE_KEYS.SUBSCRIPTION_ACTIVE,
      active ? 'true' : 'false'
    );
  }

  async clearOnboardingForDev(): Promise<void> {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETED),
      AsyncStorage.removeItem(STORAGE_KEYS.ONBOARDING_STEP),
      AsyncStorage.removeItem(STORAGE_KEYS.SUBSCRIPTION_ACTIVE),
      AsyncStorage.removeItem(STORAGE_KEYS.DAILY_DELIVERY_TIME),
    ]);
  }

  async getAnonymousMode(): Promise<boolean> {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.ANONYMOUS_MODE);
    return value === 'true';
  }

  async setAnonymousMode(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem(
      STORAGE_KEYS.ANONYMOUS_MODE,
      enabled ? 'true' : 'false'
    );
  }

  async getSeenVideoIds(): Promise<string[]> {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.SEEN_VIDEOS);
    if (!json) return [];
    try {
      const parsed = JSON.parse(json) as string[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  async addSeenVideoId(videoId: string): Promise<void> {
    const ids = await this.getSeenVideoIds();
    if (!ids.includes(videoId)) {
      ids.push(videoId);
      await AsyncStorage.setItem(STORAGE_KEYS.SEEN_VIDEOS, JSON.stringify(ids));
    }
  }

  async getDailySelection(date: string): Promise<string | null> {
    return AsyncStorage.getItem(STORAGE_KEYS.DAILY_SELECTION_PREFIX + date);
  }

  async setDailySelection(date: string, videoId: string): Promise<void> {
    await AsyncStorage.setItem(
      STORAGE_KEYS.DAILY_SELECTION_PREFIX + date,
      videoId
    );
  }
}

export const localStorageRepository = new LocalStorageRepository();
