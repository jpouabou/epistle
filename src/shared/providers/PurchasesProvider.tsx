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
