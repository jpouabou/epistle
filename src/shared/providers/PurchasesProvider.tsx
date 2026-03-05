import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';
import {
  REVENUECAT_API_KEY_APPLE,
  REVENUECAT_API_KEY_GOOGLE,
} from '../utils/constants';

const isConfigured = (key: string) =>
  typeof key === 'string' && !key.includes('YOUR_');

interface PurchasesContextValue {
  iapAvailable: boolean;
}

const PurchasesContext = createContext<PurchasesContextValue | null>(null);

export function PurchasesProvider({ children }: { children: React.ReactNode }) {
  const [iapAvailable, setIapAvailable] = useState(false);

  useEffect(() => {
    const apiKey =
      Platform.OS === 'ios'
        ? REVENUECAT_API_KEY_APPLE
        : REVENUECAT_API_KEY_GOOGLE;

    const configured = isConfigured(apiKey);
    let configureSuccess = false;
    let configureError: string | null = null;
    if (configured) {
      try {
        Purchases.configure({ apiKey });
        setIapAvailable(true);
        configureSuccess = true;
      } catch (e) {
        setIapAvailable(false);
        configureError = e instanceof Error ? e.message : String(e);
      }
    }

    // #region agent log
    fetch('http://127.0.0.1:7898/ingest/c49cc5b1-b626-4b90-918c-76d2c4a06c91', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '645b57' },
      body: JSON.stringify({
        sessionId: '645b57',
        runId: 'investigate',
        hypothesisId: 'purchases-provider',
        location: 'PurchasesProvider.tsx:configure',
        message: 'RevenueCat configure result',
        data: {
          platform: Platform.OS,
          isConfigured: configured,
          configureSuccess,
          configureError,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }, []);

  return (
    <PurchasesContext.Provider value={{ iapAvailable }}>
      {children}
    </PurchasesContext.Provider>
  );
}

export function usePurchases() {
  const ctx = useContext(PurchasesContext);
  return ctx ?? { iapAvailable: false };
}
