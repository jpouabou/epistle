import { Platform } from 'react-native';
import { supabase } from '../utils/supabase';
import { localStorageRepository } from '../repositories/LocalStorageRepository';

type AnalyticsEventName = 'app_open' | 'onboarding_completed';

function getLocalDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export class AnalyticsService {
  private async insertEvent(
    eventName: AnalyticsEventName,
    eventDate: string,
    properties: Record<string, unknown> = {}
  ): Promise<void> {
    try {
      const deviceId = await localStorageRepository.getOrCreateDeviceId();
      await supabase.from('analytics_events').insert({
        device_id: deviceId,
        event_name: eventName,
        event_date: eventDate,
        platform: Platform.OS,
        properties,
      });
    } catch {
      // Fail silently so analytics never interrupts the devotional flow.
    }
  }

  async trackAppOpen(): Promise<void> {
    const today = getLocalDateString();
    const lastTracked = await localStorageRepository.getAnalyticsLastAppOpenDate();
    if (lastTracked === today) return;

    await this.insertEvent('app_open', today);
    await localStorageRepository.setAnalyticsLastAppOpenDate(today);
  }

  async trackOnboardingCompleted(dailyDeliveryTime: string): Promise<void> {
    const alreadyTracked =
      await localStorageRepository.getAnalyticsOnboardingTracked();
    if (alreadyTracked) return;

    const today = getLocalDateString();
    await this.insertEvent('onboarding_completed', today, {
      daily_delivery_time: dailyDeliveryTime,
    });
    await localStorageRepository.setAnalyticsOnboardingTracked(true);
  }
}

export const analyticsService = new AnalyticsService();
