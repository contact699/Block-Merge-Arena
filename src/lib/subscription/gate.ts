// Subscription paywall gate.
// Phase 2 stub — always returns false (no subscription).
// Phase 3 replaces with a RevenueCat-backed subscription state hook.

export function requireSubscription(): boolean {
  return false;
}
