import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Purchases, {
  type PurchasesOffering,
  type PurchasesPackage,
} from 'react-native-purchases';
import { usePurchases } from '../../shared/providers/PurchasesProvider';
import { useSubscription } from '../../shared/providers/SubscriptionProvider';
import { REVENUECAT_ENTITLEMENT_ID } from '../../shared/utils/constants';

type Props = {
  onJoinSuccess: () => void;
  onNotNow: () => void;
};

export function PaywallContent({ onJoinSuccess, onNotNow }: Props) {
  const { iapAvailable } = usePurchases();
  const { refresh } = useSubscription();
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOfferings = useCallback(async () => {
    if (!iapAvailable) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const offerings = await Purchases.getOfferings();
      setOffering(offerings.current);
    } catch (e) {
      setError('Unable to load offerings');
      setOffering(null);
    } finally {
      setLoading(false);
    }
  }, [iapAvailable]);

  useEffect(() => {
    loadOfferings();
  }, [loadOfferings]);

  const getDefaultPackage = (): PurchasesPackage | null => {
    if (!offering) return null;
    // Prefer monthly, then annual, then first available
    return (
      offering.monthly ??
      offering.annual ??
      offering.availablePackages[0] ??
      null
    );
  };

  const handlePurchase = useCallback(
    async (pkg: PurchasesPackage) => {
      if (!iapAvailable) return;
      setPurchasing(true);
      setError(null);
      try {
        const { customerInfo } = await Purchases.purchasePackage(pkg);
        // Purchase succeeded; always dismiss and refresh (entitlements may be delayed or use different ID in test)
        await refresh();
        onJoinSuccess();
      } catch (e: unknown) {
        const rcError = e as { userCancelled?: boolean; code?: string };
        if (rcError?.userCancelled) {
          // User cancelled, no error to show
          return;
        }
        setError('Purchase failed. Please try again.');
      } finally {
        setPurchasing(false);
      }
    },
    [iapAvailable, refresh, onJoinSuccess]
  );

  const handleRestore = useCallback(async () => {
    if (!iapAvailable) return;
    setRestoring(true);
    setError(null);
    try {
      const customerInfo = await Purchases.restorePurchases();
      const hasAccess = Boolean(
        customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT_ID]?.isActive
      );
      const hasAnyEntitlement =
        Object.keys(customerInfo.entitlements.active).length > 0;
      if (hasAccess || hasAnyEntitlement) {
        await refresh();
        onJoinSuccess();
      } else {
        setError('No previous purchase found.');
      }
    } catch {
      setError('Restore failed. Please try again.');
    } finally {
      setRestoring(false);
    }
  }, [iapAvailable, refresh, onJoinSuccess]);

  const defaultPackage = getDefaultPackage();
  const busy = purchasing || restoring;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="rgba(255,255,255,0.7)" />
      </View>
    );
  }

  return (
    <View style={styles.content}>
      <Text style={styles.title}>Begin your daily visitation</Text>
      <Text style={styles.subtitle}>
        Start a 3-day trial. Then continue with a subscription.
      </Text>

      {!iapAvailable ? (
        <View style={styles.unavailable}>
          <Text style={styles.unavailableText}>
            Purchases are not configured. Add your RevenueCat API keys to
            .env.development (and .env.production for release), then rebuild the
            app so the native module can read them.
          </Text>
        </View>
      ) : offering && defaultPackage ? (
        <View style={styles.packages}>
          <Pressable
            onPress={() => handlePurchase(defaultPackage)}
            style={[styles.packageButton, busy && styles.packageButtonDisabled]}
            disabled={busy}
          >
            <Text style={styles.packageTitle}>
              {defaultPackage.packageType === 'MONTHLY'
                ? 'Monthly'
                : defaultPackage.packageType === 'ANNUAL'
                  ? 'Annual'
                  : 'Subscribe'}
            </Text>
            <Text style={styles.packagePrice}>
              {defaultPackage.product.priceString}
              {defaultPackage.packageType === 'MONTHLY' && '/month'}
              {defaultPackage.packageType === 'ANNUAL' && '/year'}
            </Text>
            {defaultPackage.product.introPrice && (
              <Text style={styles.packageIntro}>
                {defaultPackage.product.introPrice.priceString} for trial
              </Text>
            )}
          </Pressable>
        </View>
      ) : (
        <View style={styles.unavailable}>
          <Text style={styles.unavailableText}>
            No offerings available. Configure products in RevenueCat dashboard.
          </Text>
        </View>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      {iapAvailable && (
        <Pressable
          onPress={handleRestore}
          style={[styles.restoreButton, busy && styles.restoreButtonDisabled]}
          disabled={busy}
        >
          <Text style={styles.restoreText}>Restore purchases</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '500',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  packages: {
    width: '100%',
    marginBottom: 24,
  },
  packageButton: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
  },
  packageButtonDisabled: {
    opacity: 0.6,
  },
  packageTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 4,
  },
  packagePrice: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.95)',
  },
  packageIntro: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  unavailable: {
    paddingVertical: 24,
    paddingHorizontal: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    marginBottom: 24,
  },
  unavailableText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
  error: {
    fontSize: 14,
    color: '#ff6b6b',
    textAlign: 'center',
    marginBottom: 16,
  },
  restoreButton: {
    marginBottom: 24,
  },
  restoreButtonDisabled: {
    opacity: 0.5,
  },
  restoreText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
});
