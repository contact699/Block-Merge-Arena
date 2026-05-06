// src/lib/subscription/state.ts
import { createContext, useContext, useEffect, useState, useMemo, type ReactNode, createElement } from 'react';
import type { CustomerInfo, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import {
  getCurrentCustomerInfo,
  getOfferings,
  addCustomerInfoListener,
  purchasePackage,
  restorePurchases,
  revenueCatReady,
  isRevenueCatInitialized,
} from './revenuecat';

const ENTITLEMENT_ID = 'plus';

export interface SubscriptionState {
  isSubscribed: boolean;
  customerInfo: CustomerInfo | null;
}

export function deriveSubscriptionState(info: CustomerInfo | null): SubscriptionState {
  if (!info) return { isSubscribed: false, customerInfo: null };
  const isSubscribed = Boolean(info.entitlements.active[ENTITLEMENT_ID]);
  return { isSubscribed, customerInfo: info };
}

interface SubscriptionContextValue extends SubscriptionState {
  /** True once initRevenueCat() has resolved (success OR failure). Consumers
   * should treat `ready && !offering` as "subscriptions unavailable" rather
   * than "still loading". */
  ready: boolean;
  offering: PurchasesOffering | null;
  refreshOfferings: () => Promise<void>;
  purchase: (pkg: PurchasesPackage) => Promise<boolean>;
  restore: () => Promise<boolean>;
}

const SubscriptionContext = createContext<SubscriptionContextValue>({
  isSubscribed: false,
  customerInfo: null,
  ready: false,
  offering: null,
  refreshOfferings: async () => {},
  purchase: async () => false,
  restore: async () => false,
});

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [ready, setReady] = useState<boolean>(false);

  // Wait for initRevenueCat to settle before fetching state. Subscribing to
  // updates also has to wait — addCustomerInfoListener is a no-op until init
  // completes, so the listener has to be attached on the post-ready side too.
  useEffect(() => {
    let cancelled = false;
    let unsub: () => void = () => {};
    (async () => {
      await revenueCatReady;
      if (cancelled) return;
      setReady(true);
      // If init resolved without configuring (no API key), the calls below
      // return null cleanly — that's the no-op fallback.
      if (isRevenueCatInitialized()) {
        const info = await getCurrentCustomerInfo();
        if (!cancelled) setCustomerInfo(info);
        const off = await getOfferings();
        if (!cancelled) setOffering(off);
        unsub = addCustomerInfoListener((next) => setCustomerInfo(next));
      }
    })();
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  const value: SubscriptionContextValue = useMemo(() => {
    const derived = deriveSubscriptionState(customerInfo);
    return {
      ...derived,
      ready,
      offering,
      refreshOfferings: async () => setOffering(await getOfferings()),
      purchase: async (pkg) => {
        const info = await purchasePackage(pkg);
        if (info) setCustomerInfo(info);
        return Boolean(info && info.entitlements.active[ENTITLEMENT_ID]);
      },
      restore: async () => {
        const info = await restorePurchases();
        if (info) setCustomerInfo(info);
        return Boolean(info && info.entitlements.active[ENTITLEMENT_ID]);
      },
    };
  }, [customerInfo, offering, ready]);

  return createElement(SubscriptionContext.Provider, { value }, children);
}

export function useSubscription(): SubscriptionContextValue {
  return useContext(SubscriptionContext);
}
