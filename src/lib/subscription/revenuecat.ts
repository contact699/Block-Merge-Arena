// src/lib/subscription/revenuecat.ts
//
// Thin wrapper over react-native-purchases. No-ops cleanly when API keys are
// unset (dev mode without RevenueCat credentials).
import { Platform } from 'react-native';
import Purchases, {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
} from 'react-native-purchases';

const ENTITLEMENT_ID = 'plus';

let initialized = false;

function getApiKey(): string | null {
  if (Platform.OS === 'ios') return process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? null;
  if (Platform.OS === 'android') return process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? null;
  return null;
}

export async function initRevenueCat(userId: string): Promise<void> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('[revenuecat] API key not set — subscription features disabled');
    return;
  }
  try {
    Purchases.configure({ apiKey, appUserID: userId });
    initialized = true;
  } catch (e) {
    console.warn('[revenuecat] init failed', e);
  }
}

export async function getOfferings(): Promise<PurchasesOffering | null> {
  if (!initialized) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current ?? null;
  } catch (e) {
    console.warn('[revenuecat] getOfferings failed', e);
    return null;
  }
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo | null> {
  if (!initialized) return null;
  try {
    const result = await Purchases.purchasePackage(pkg);
    return result.customerInfo;
  } catch (e: unknown) {
    if (typeof e === 'object' && e !== null && 'userCancelled' in e && (e as { userCancelled?: boolean }).userCancelled) {
      return null;
    }
    console.warn('[revenuecat] purchase failed', e);
    return null;
  }
}

export async function restorePurchases(): Promise<CustomerInfo | null> {
  if (!initialized) return null;
  try {
    return await Purchases.restorePurchases();
  } catch (e) {
    console.warn('[revenuecat] restore failed', e);
    return null;
  }
}

export async function getCurrentCustomerInfo(): Promise<CustomerInfo | null> {
  if (!initialized) return null;
  try {
    return await Purchases.getCustomerInfo();
  } catch (e) {
    console.warn('[revenuecat] getCustomerInfo failed', e);
    return null;
  }
}

export function isSubscribed(info: CustomerInfo | null): boolean {
  if (!info) return false;
  return Boolean(info.entitlements.active[ENTITLEMENT_ID]);
}

export function addCustomerInfoListener(cb: (info: CustomerInfo) => void): () => void {
  if (!initialized) return () => {};
  Purchases.addCustomerInfoUpdateListener(cb);
  return () => Purchases.removeCustomerInfoUpdateListener(cb);
}
