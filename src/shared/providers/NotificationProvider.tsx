import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { notificationService } from '../services/NotificationService';

interface NotificationContextValue {
  permissionGranted: boolean | null;
  requestPermission: () => Promise<boolean>;
  scheduleDaily: (hour: number, minute: number) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(
    null
  );

  const requestPermission = useCallback(async () => {
    const granted = await notificationService.requestPermission();
    setPermissionGranted(granted);
    return granted;
  }, []);

  const scheduleDaily = useCallback(
    async (hour: number, minute: number) => {
      await notificationService.scheduleDaily(hour, minute);
    },
    []
  );

  useEffect(() => {
    notificationService.requestPermission().then(setPermissionGranted);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        permissionGranted,
        requestPermission,
        scheduleDaily,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
}
