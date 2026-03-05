import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import Purchases from 'react-native-purchases';
import { REVENUECAT_ENTITLEMENT_ID } from '../utils/constants';
import { usePurchases } from './PurchasesProvider';

interface SubscriptionContextValue {
  subscriptionActive: boolean;
  refresh: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { iapAvailable } = usePurchases();
  const [subscriptionActive, setSubscriptionActiveState] = useState(false);

  const refresh = useCallback(async () => {
    if (!iapAvailable) {
      setSubscriptionActiveState(false);
      return;
    }
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const entitlement = customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT_ID];
      setSubscriptionActiveState(Boolean(entitlement?.isActive));
    } catch {
      setSubscriptionActiveState(false);
    }
  }, [iapAvailable]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <SubscriptionContext.Provider
      value={{
        subscriptionActive,
        refresh,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx)
    throw new Error('useSubscription must be used within SubscriptionProvider');
  return ctx;
}
