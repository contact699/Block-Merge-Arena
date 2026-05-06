// Subscription paywall gate.
//
// `useRequireSubscription` is the new hook-based check that re-renders on
// subscription change. The synchronous `requireSubscription()` is kept as a
// deprecated stub so any Phase 2 imports still typecheck during the migration.

import { useSubscription } from './state';

/**
 * Returns true when the current user has an active "plus" entitlement.
 * Hook so callers re-render on subscription change.
 */
export function useRequireSubscription(): boolean {
  const { isSubscribed } = useSubscription();
  return isSubscribed;
}

/**
 * @deprecated Use `useRequireSubscription()` instead. Always returns false.
 * Will be removed once all callers are migrated.
 */
export function requireSubscription(): boolean {
  return false;
}
