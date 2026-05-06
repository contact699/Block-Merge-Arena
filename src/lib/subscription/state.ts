// src/lib/subscription/state.ts
import { createContext, useContext, useEffect, useState, useMemo, type ReactNode, createElement } from 'react';
import type { CustomerInfo, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import {
  getCurrentCustomerInfo,
  getOfferings,
  addCustomerInfoListener,
  purchasePackage,
  restorePurchases,
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
  offering: PurchasesOffering | null;
  refreshOfferings: () => Promise<void>;
  purchase: (pkg: PurchasesPackage) => Promise<boolean>;
  restore: () => Promise<boolean>;
}

const SubscriptionContext = createContext<SubscriptionContextValue>({
  isSubscribed: false,
  customerInfo: null,
  offering: null,
  refreshOfferings: async () => {},
  purchase: async () => false,
  restore: async () => false,
});

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);

  // Initial fetch + subscribe to live updates
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const info = await getCurrentCustomerInfo();
      if (!cancelled) setCustomerInfo(info);
      const off = await getOfferings();
      if (!cancelled) setOffering(off);
    })();
    const unsub = addCustomerInfoListener((info) => setCustomerInfo(info));
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  const value: SubscriptionContextValue = useMemo(() => {
    const derived = deriveSubscriptionState(customerInfo);
    return {
      ...derived,
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
  }, [customerInfo, offering]);

  return createElement(SubscriptionContext.Provider, { value }, children);
}

export function useSubscription(): SubscriptionContextValue {
  return useContext(SubscriptionContext);
}
