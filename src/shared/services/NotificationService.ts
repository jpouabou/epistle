import notifee, {
  AndroidImportance,
  TimestampTrigger,
  TriggerType,
  RepeatFrequency,
} from '@notifee/react-native';

const CHANNEL_ID = 'epistle-daily';
const NOTIFICATION_ID = 'epistle-daily-message';

export class NotificationService {
  async requestPermission(): Promise<boolean> {
    const settings = await notifee.requestPermission();
    return settings.authorizationStatus >= 1;
  }

  async createChannel(): Promise<void> {
    await notifee.createChannel({
      id: CHANNEL_ID,
      name: 'Daily Message',
      importance: AndroidImportance.HIGH,
    });
  }

  async cancelAll(): Promise<void> {
    await notifee.cancelAllNotifications();
  }

  async scheduleDaily(hour: number, minute: number): Promise<void> {
    await this.cancelAll();
    await this.createChannel();

    const date = new Date();
    date.setHours(hour, minute, 0, 0);
    if (date.getTime() <= Date.now()) {
      date.setDate(date.getDate() + 1);
    }

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: date.getTime(),
      repeatFrequency: RepeatFrequency.DAILY,
    };

    await notifee.createTriggerNotification(
      {
        id: NOTIFICATION_ID,
        title: 'Epistle',
        body: 'A message is ready.',
        android: {
          channelId: CHANNEL_ID,
        },
      },
      trigger
    );
  }

  async getInitialNotification(): Promise<{ type: string } | null> {
    const notification = await notifee.getInitialNotification();
    if (notification) return { type: 'daily' };
    return null;
  }
}

export const notificationService = new NotificationService();
