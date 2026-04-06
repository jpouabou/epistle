import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utils/constants';
import type { LocalDailySelection } from '../types/database';

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

  async getFirstEncounterPending(): Promise<boolean> {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.FIRST_ENCOUNTER_PENDING);
    return value === 'true';
  }

  async setFirstEncounterPending(pending: boolean): Promise<void> {
    await AsyncStorage.setItem(
      STORAGE_KEYS.FIRST_ENCOUNTER_PENDING,
      pending ? 'true' : 'false'
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
      AsyncStorage.removeItem(STORAGE_KEYS.FIRST_ENCOUNTER_PENDING),
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

  async getDailyUnlockTime(date: string): Promise<string | null> {
    return AsyncStorage.getItem(STORAGE_KEYS.DAILY_UNLOCK_TIME_PREFIX + date);
  }

  async setDailyUnlockTime(date: string, time: string | null): Promise<void> {
    const key = STORAGE_KEYS.DAILY_UNLOCK_TIME_PREFIX + date;
    if (time) {
      await AsyncStorage.setItem(key, time);
    } else {
      await AsyncStorage.removeItem(key);
    }
  }

  async getAllDailySelections(): Promise<LocalDailySelection[]> {
    const keys = await AsyncStorage.getAllKeys();
    const selectionKeys = keys.filter((key) =>
      key.startsWith(STORAGE_KEYS.DAILY_SELECTION_PREFIX)
    );

    if (selectionKeys.length === 0) return [];

    const values = await Promise.all(
      selectionKeys.map(async (key) => ({
        key,
        videoId: await AsyncStorage.getItem(key),
      }))
    );

    return values
      .map(({ key, videoId }) => {
        if (!videoId) return null;
        const date = key.replace(STORAGE_KEYS.DAILY_SELECTION_PREFIX, '');
        return {
          date,
          video_id: videoId,
          unlock_time: null,
        } satisfies LocalDailySelection;
      })
      .filter((value): value is LocalDailySelection => value !== null);
  }
}

export const localStorageRepository = new LocalStorageRepository();
