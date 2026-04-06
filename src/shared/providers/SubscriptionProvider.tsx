import React, { createContext, useContext } from 'react';

interface SubscriptionContextValue {
  subscriptionActive: boolean;
  trialActive: boolean;
  trialDaysRemaining: number | null;
  renewalDate: string | null;
  managementURL: string | null;
  billingIssueDetectedAt: string | null;
  hasBillingIssue: boolean;
  refresh: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

const noopRefresh = async () => {};

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  return (
    <SubscriptionContext.Provider
      value={{
        subscriptionActive: true,
        trialActive: false,
        trialDaysRemaining: null,
        renewalDate: null,
        managementURL: null,
        billingIssueDetectedAt: null,
        hasBillingIssue: false,
        refresh: noopRefresh,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return ctx;
}
