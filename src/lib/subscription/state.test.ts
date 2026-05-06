import { describe, it, expect } from '@jest/globals';

jest.mock('react-native-purchases', () => ({}));
jest.mock('./revenuecat', () => ({
  getCurrentCustomerInfo: jest.fn(),
  getOfferings: jest.fn(),
  addCustomerInfoListener: jest.fn(),
  purchasePackage: jest.fn(),
  restorePurchases: jest.fn(),
}));

import { deriveSubscriptionState } from './state';
import type { CustomerInfo } from 'react-native-purchases';

function makeCustomerInfo(activeEntitlements: string[]): CustomerInfo {
  return {
    entitlements: {
      active: Object.fromEntries(activeEntitlements.map((id) => [id, { isActive: true } as never])),
      all: {},
    },
    activeSubscriptions: [],
    allPurchasedProductIdentifiers: [],
    nonSubscriptionTransactions: [],
    latestExpirationDate: null,
    firstSeen: '',
    originalAppUserId: '',
    requestDate: '',
    allExpirationDates: {},
    allPurchaseDates: {},
    originalApplicationVersion: null,
    originalPurchaseDate: null,
    managementURL: null,
  } as unknown as CustomerInfo;
}

describe('deriveSubscriptionState', () => {
  it('returns isSubscribed=false when customerInfo is null', () => {
    expect(deriveSubscriptionState(null).isSubscribed).toBe(false);
  });

  it('returns isSubscribed=false when no active entitlements', () => {
    expect(deriveSubscriptionState(makeCustomerInfo([])).isSubscribed).toBe(false);
  });

  it('returns isSubscribed=true when "plus" entitlement is active', () => {
    expect(deriveSubscriptionState(makeCustomerInfo(['plus'])).isSubscribed).toBe(true);
  });

  it('returns isSubscribed=false when only an unrelated entitlement is active', () => {
    expect(deriveSubscriptionState(makeCustomerInfo(['some-other-entitlement'])).isSubscribed).toBe(false);
  });
});
