# Phase 3: Monetization — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Phase 2 paywall stub with a real RevenueCat subscription flow — three SKUs, paywall surfaces at archive entry and theme apply, restore-purchases wired in Settings, four cosmetic themes (one default + three subscriber-locked), achievement unlocks surfacing as in-game toasts, and `saveScore()` writing the Firestore archive collections per ADR 0006.

**Architecture:** Five strands. (1) **RevenueCat scaffold** — a thin SDK wrapper, a `useSubscription()` hook + provider, and replacement of the gate stub. (2) **Paywall UI** — one reusable modal, wired into the archive entry (existing stub) and theme-apply surface. (3) **Theme system** — minimum-viable: 4 palettes, a `ThemeProvider` + `useThemePalette()` hook, theme-aware paper background + one accent color across the keep-list screens (full per-token theming is deferred to a future phase, documented in ADR). (4) **Firestore archive writes** — extend `submitScoreToFirebase()` to also upsert `puzzles/{puzzleId}` and `users/{uid}/archive/{puzzleId}`. (5) **Achievement toast** — replace the `console.log` in `checkAchievements` callers with the `burnt` toast already in deps.

**Tech Stack:** Expo SDK 53, RN 0.79.6, TypeScript strict, `react-native-purchases@^9.6.7` (already in deps; unwired), `react-native-purchases-ui@^9.6.7` (used for the StripeGuard-style native paywall fallback if needed; primary path is custom `PaywallModal`), `burnt@^0.13.0` (toasts), Firebase v12 Firestore, Jest 29.7 + `@testing-library/react-native` for any pure-logic tests.

**Source spec:** [`docs/superpowers/specs/2026-05-05-block-merge-launch-design.md`](../specs/2026-05-05-block-merge-launch-design.md) — read § 5 (subscription model) and § 7 Phase 3 carefully.

**Predecessor:** Phase 2 plan `docs/superpowers/plans/2026-05-06-phase-2-differentiator.md`, tagged `phase-2-complete` at `5c3203b` with follow-up fixes at `09a3fa7`.

---

## Working assumptions

- `npm run typecheck` and `npm run lint` are 0/0 errors at start of Phase 3.
- Jest is wired (Phase 2 T1) — `npm test` runs at `node` env. No component-level tests; pure-logic tests only.
- Working on `main`. Commit per task. Do NOT amend commits.
- `react-native-purchases` is in deps but never imported anywhere yet.
- Phase 2's `src/lib/subscription/gate.ts` returns `false` unconditionally — Phase 3 replaces the implementation; the function name and signature stay.
- Firebase config gracefully no-ops when env vars are unset (dev mode). Same for RevenueCat — code paths must continue to work without an API key.
- `src/lib/firebase/auth.ts` already uses `@block_merge:user_id` (Phase 2 T2 already migrated the prefix — no carry-over).

## File structure

| Path | Status | Responsibility |
|---|---|---|
| `src/lib/subscription/revenuecat.ts` | new | Thin RevenueCat wrapper: init, getOfferings, purchase, restore. No-op when API key missing. |
| `src/lib/subscription/state.ts` | new | `SubscriptionProvider` + `useSubscription()` context hook |
| `src/lib/subscription/gate.ts` | rewrite | `requireSubscription()` reads from the hook (legacy callers updated to use the hook directly) |
| `src/lib/subscription/state.test.ts` | new | TDD for state-derivation logic |
| `src/lib/themes/catalog.ts` | new | 4 palettes (warm, cool, mono, neon); free-vs-locked metadata |
| `src/lib/themes/active.ts` | new | Active theme state + AsyncStorage persistence |
| `src/lib/themes/active.test.ts` | new | TDD for theme selection + locked-theme guard |
| `src/lib/themes/provider.tsx` | new | `ThemeProvider` + `useThemePalette()` hook |
| `src/components/paywall/PaywallModal.tsx` | new | Reusable paywall surface |
| `src/components/feedback/AchievementToast.tsx` | new | `showAchievementToast(id, name)` using `burnt` |
| `src/app/_layout.tsx` | modify | Initialize RevenueCat after auth; wrap children in `SubscriptionProvider` + `ThemeProvider` |
| `src/app/daily.tsx` | modify | Replace stub paywall with `<PaywallModal source="archive" />`; show achievement toast on grant |
| `src/app/game.tsx` | modify | Show achievement toast on grant |
| `src/app/shop.tsx` | modify | Theme-apply paywall hook; "this month" rotation banner |
| `src/app/settings.tsx` | modify | Real Restore Purchases handler; theme picker row |
| `src/lib/firebase/api.ts` | modify | Extend `submitScoreToFirebase()` to also upsert puzzles + archive docs |
| `app.json` | modify | Add Privacy + ToS URLs |
| `assets/legal/privacy-policy.md` | new | Stub copy until real legal review |
| `assets/legal/terms-of-service.md` | new | Stub copy until real legal review |
| `docs/decisions/0007-subscription-pricing.md` | new | ADR — flat USD with store-tier-localized pricing |
| `docs/decisions/0008-theme-rotation-cadence.md` | new | ADR — bundle 4 themes; soft "monthly drop" without hard schedule commitment |
| `docs/decisions/0009-store-product-setup.md` | new | ADR — manual setup steps for App Store Connect + Play Console SKUs |
| `docs/decisions/0010-minimum-viable-theming.md` | new | ADR — paper bg + one accent are theme-aware; full per-token theming deferred |

---

## Task 1: ADR 0007 — Subscription pricing

**Files:** Create `docs/decisions/0007-subscription-pricing.md`

- [ ] **Step 1: Write the ADR**

```markdown
# ADR 0007: Subscription Pricing

**Status:** Active
**Date:** 2026-05-06
**Decision:** Flat USD reference prices ($3.99/mo, $29.99/yr) with store-managed localized pricing tiers. Annual SKU includes a 7-day free trial.

## Context

The launch design committed to subscription monetization at $3.99/mo and $29.99/yr (per § 5 of the spec). RevenueCat lets us ship one product per platform with a price *tier*; Apple and Google then localize automatically (e.g., $3.99 USD ≈ €3.99 EUR ≈ ¥600 JPY at the equivalent tier).

Two viable approaches:

1. **Flat USD, localized tiers** — pick one Apple/Google tier per SKU. Stores show local currency at the equivalent tier. Simpler operations.
2. **Per-region custom pricing** — set explicit prices per market in App Store Connect and Play Console. More control but more operational overhead and more SKUs to maintain.

## Decision

Approach 1 — flat USD with store-tier localization. Reasons:
- v1 has no data on which markets convert. Per-region pricing should follow market data, not preemptive guessing.
- One SKU per platform is the simplest setup; lowest risk of mis-priced markets at launch.
- RevenueCat has a clean abstraction over store tiers — switching to per-region later is a dashboard change, not a code change.

## SKU plan

| SKU id | Type | Apple tier | Google tier | Free trial |
|---|---|---|---|---|
| `block_merge_plus_monthly` | auto-renew subscription | Tier 4 ($3.99) | Tier 4 ($3.99) | none |
| `block_merge_plus_annual` | auto-renew subscription | Tier 30 ($29.99) | Tier 30 ($29.99) | 7 days |

## Consequences

- App Store Connect and Play Console get exactly two products per platform.
- The annual SKU is the trial-bearing one; monthly has no trial.
- Local prices vary by market according to Apple's / Google's price tier tables.

## Revisit if

3-month MRR hits $10k+ and we want to optimize ARPU per market — at that scale, per-region pricing is worth the operational overhead.
```

- [ ] **Step 2: Commit**

```bash
git add docs/decisions/0007-subscription-pricing.md
git commit -m "docs(adr): subscription pricing — flat USD with store-tier localization"
```

---

## Task 2: ADR 0008 — Theme rotation cadence

**Files:** Create `docs/decisions/0008-theme-rotation-cadence.md`

- [ ] **Step 1: Write the ADR**

```markdown
# ADR 0008: Theme Rotation Cadence

**Status:** Active
**Date:** 2026-05-06
**Decision:** Bundle four themes at launch (warm, cool, mono, neon). Use "fresh look every season" copy rather than committing to a strict monthly drop. Add new themes on a best-effort basis.

## Context

The launch design said "Monthly cosmetic theme rotation" as a subscriber perk. That's a hard art-pipeline commitment we can't validate without art capacity data. A missed monthly drop signals neglect; a soft cadence has no failure mode.

## Decision

- **Launch bundle:** four themes — warm cream (default, free), cool sage, monochrome, neon. Three are subscriber-locked.
- **Marketing copy:** "Fresh looks added regularly" rather than "New theme every month."
- **Operational target:** one new theme per quarter, post-launch, dependent on subscriber retention metrics. If retention is high enough to justify, accelerate. If low, deprioritize.

## Consequences

- The Shop's "this month" banner copy reads as a curated highlight, not a calendar promise.
- Any subscriber who churns after the bundle exhausts has a legitimate "what am I paying for" question — this is mitigated by the daily archive (the killer feature) and the no-ads/GIF-export perks.

## Revisit if

Subscriber 3-month retention exceeds 60% — at that point a stricter cadence could drive churn lower; commit to a calendar.
```

- [ ] **Step 2: Commit**

```bash
git add docs/decisions/0008-theme-rotation-cadence.md
git commit -m "docs(adr): theme rotation cadence — bundle 4, soft monthly target"
```

---

## Task 3: ADR 0009 — Store product setup (manual user task)

**Files:** Create `docs/decisions/0009-store-product-setup.md`

- [ ] **Step 1: Write the ADR**

```markdown
# ADR 0009: App Store + Play Console Subscription Product Setup

**Status:** Active
**Date:** 2026-05-06

## Required steps (manual — user action)

### Apple App Store Connect

1. Sign in to https://appstoreconnect.apple.com.
2. Select Block Merge → **Monetization** → **Subscriptions**.
3. Create a new **Subscription Group** named `block_merge_plus`.
4. Inside the group, create two subscriptions:
   - Product ID: `block_merge_plus_monthly`, duration 1 month, price tier 4 ($3.99 USD).
   - Product ID: `block_merge_plus_annual`, duration 1 year, price tier 30 ($29.99 USD), with a 7-day **introductory offer** of type "Free Trial".
5. Add localized copy in the primary language (English):
   - Display name: "Block Merge+"
   - Description: "Daily archive · cosmetic themes · no ads · GIF replay export"
6. **Privacy** → set Privacy URL to `https://blockmerge.app/privacy` (or whatever lives in `app.json`'s `privacyPolicyUrl`).
7. Submit subscription products for review when the build is ready.

### Google Play Console

1. Sign in to https://play.google.com/console.
2. Select Block Merge → **Monetize** → **Subscriptions**.
3. Click **Create subscription**, set:
   - Product ID: `block_merge_plus_monthly`, billing period 1 month, price $3.99 USD (or equivalent tier).
   - Product ID: `block_merge_plus_annual`, billing period 1 year, price $29.99 USD, with a free 7-day trial as the **base plan offer**.
4. Activate both products.
5. Add a Privacy Policy URL and Terms of Service URL on the Store Listing page.

### RevenueCat dashboard

1. Sign in to https://app.revenuecat.com.
2. Create a new project: "Block Merge".
3. Add an **iOS app** with the bundle ID `com.blockmergearena.app` and your App Store Connect shared secret.
4. Add an **Android app** with the package name `com.blockmergearena.app` and your Play Console service-account JSON.
5. Create an **Entitlement** named `plus`. This is the single capability we check at runtime.
6. Create an **Offering** named `default`. Add two **Packages**:
   - Monthly → links to `block_merge_plus_monthly` on both stores.
   - Annual → links to `block_merge_plus_annual` on both stores.
7. Mark the `default` Offering as current.
8. Copy the iOS API key and Android API key from RevenueCat → Project Settings → API Keys.

### `.env.local` updates

Add:

```
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxxxxxxxxxxxxxxx
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxxxxxxxxxxxxxxx
```

## Validation

After populating the env vars and rebuilding the app:
1. Open the app on a real device (or TestFlight build for iOS, internal track for Android).
2. Tap any paywall surface (e.g., Daily Archive).
3. Confirm the modal shows the two SKUs with localized prices.
4. Tap one — sandbox/test purchase flow should complete and the gate should flip to subscribed.
5. Force-quit and relaunch — the entitlement should persist (RevenueCat handles caching).
6. Tap **Restore Purchases** in Settings on a fresh install — the entitlement should restore.

## Out of scope

- Promotional offers (introductory discounts beyond the standard free trial)
- Region-specific pricing
- Family Sharing for Apple subscriptions (auto-on by default; no setup needed)
- Enterprise / volume licensing
```

- [ ] **Step 2: Commit**

```bash
git add docs/decisions/0009-store-product-setup.md
git commit -m "docs(adr): app store + play console + revenuecat manual setup steps"
```

---

## Task 4: ADR 0010 — Minimum-viable theming

**Files:** Create `docs/decisions/0010-minimum-viable-theming.md`

- [ ] **Step 1: Write the ADR**

```markdown
# ADR 0010: Minimum-Viable Theming

**Status:** Active
**Date:** 2026-05-06
**Decision:** For Phase 3, only the paper background and the primary accent color are theme-aware. Other tokens (block colors, ink, mustard, plum, etc.) stay constant across themes. Full per-token theming is deferred.

## Context

The launch spec mentions "monthly cosmetic theme" as a subscriber perk. The natural full implementation is a `ThemeProvider` + `useColors()` hook that every component uses instead of importing `colors` from `tokens.ts`. That refactor touches ~30 files and roughly two days of work.

For Phase 3, we have a different question: what's the minimum theme swap that *feels* meaningfully different to a subscriber paying $3.99/month?

## Decision

A **two-token swap**: each theme overrides:
- `paper` (the cream/sage/black background)
- `accent` (the ember/teal/grey/cyan primary accent)

Block colors stay constant — they're load-bearing for gameplay legibility. Ink stays constant — it's the body type color.

Implementation:
- A `ThemeProvider` supplies an active palette via React context.
- A `useThemePalette()` hook returns `{ paper, accent }`.
- The home, daily, game, leaderboard, replays, achievements, settings, share, shop screens migrate their `SafeAreaView backgroundColor` to use `paper` from the hook. Primary `TactileButton` and `Pill variant="ember"` references migrate to use `accent`.
- Other token usages (`colors.ink`, `colors.mustard`, `colors.cobalt`, etc.) remain on the static import.

## Consequences

- Theme swap is visible without a 30-file refactor.
- Subscribers paying for "Cool Sage" see a sage background and teal CTAs everywhere — meaningful change.
- The block colors are the same in every theme, so gameplay screenshots remain comparable across themes (good for share grids).
- Block Merge feels less customizable than a full skin system. That's fine for v1.

## Revisit if

Subscriber feedback flags "themes don't feel different enough" OR we ship a theme that requires changing block colors (e.g., a "Dark Mode" theme inverts the gameboard) — at that point, the full refactor is justified.
```

- [ ] **Step 2: Commit**

```bash
git add docs/decisions/0010-minimum-viable-theming.md
git commit -m "docs(adr): minimum-viable theming — paper + accent only for v1"
```

---

## Task 5: RevenueCat SDK wrapper

**Files:** Create `src/lib/subscription/revenuecat.ts`

- [ ] **Step 1: Write the wrapper**

```ts
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
```

- [ ] **Step 2: Run typecheck**

```bash
npm run typecheck
```

If the `addCustomerInfoUpdateListener`/`removeCustomerInfoUpdateListener` types differ from the SDK shape, adjust to match the actual `Purchases` namespace types from `react-native-purchases`. The function names above are correct as of v9.6.7 but verify against the installed version's `.d.ts` file.

- [ ] **Step 3: Commit**

```bash
git add src/lib/subscription/revenuecat.ts
git commit -m "feat(subscription): RevenueCat wrapper with no-op fallback when keys unset"
```

---

## Task 6: Subscription state context + hook (TDD on the pure logic)

**Files:**
- Create: `src/lib/subscription/state.ts`
- Test: `src/lib/subscription/state.test.ts`

### Step 1: Write the failing test

We test the pure derivation function `deriveSubscriptionState(customerInfo)` — keep React-context bits untestable in node env.

```ts
// src/lib/subscription/state.test.ts
import { describe, it, expect } from '@jest/globals';
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
```

### Step 2: Run failing tests

```bash
npm test -- subscription/state
```
Expected: cannot find module `./state`.

### Step 3: Implement the state module

```ts
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
```

### Step 4: Run tests

```bash
npm test -- subscription/state
```
Expected: 4 tests passing.

### Step 5: Commit

```bash
git add src/lib/subscription/
git commit -m "feat(subscription): SubscriptionProvider + useSubscription hook with TDD coverage"
```

---

## Task 7: Replace `gate.ts` stub with hook-backed implementation

**Files:** Modify `src/lib/subscription/gate.ts`

The Phase 2 stub returns a plain `false`. Phase 3 makes it a hook so callers re-render on subscription change.

- [ ] **Step 1: Read current `gate.ts`**

```bash
cat src/lib/subscription/gate.ts
```

- [ ] **Step 2: Rewrite as a hook**

```ts
// src/lib/subscription/gate.ts
import { useSubscription } from './state';

/**
 * Returns true when the current user has an active "plus" entitlement.
 * Intentionally a hook so callers re-render on subscription change.
 */
export function useRequireSubscription(): boolean {
  const { isSubscribed } = useSubscription();
  return isSubscribed;
}

/**
 * @deprecated — kept temporarily for backward compatibility with Phase 2 callers
 * that called `requireSubscription()` synchronously. Always returns false.
 * Migrate callers to `useRequireSubscription()`.
 */
export function requireSubscription(): boolean {
  return false;
}
```

- [ ] **Step 3: Migrate `daily.tsx` caller**

`src/app/daily.tsx` currently imports `requireSubscription`. Change to:

```tsx
import { useRequireSubscription } from '@/lib/subscription/gate';

// inside the component:
const isSubscribed = useRequireSubscription();

// in onArchivePress:
if (!isSubscribed) {
  setShowPaywall(true);
  track('paywall_viewed', { source: 'archive' });
  return;
}
```

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/subscription/gate.ts src/app/daily.tsx
git commit -m "feat(subscription): replace gate stub with useRequireSubscription hook"
```

---

## Task 8: Initialize RevenueCat + wrap providers in `_layout.tsx`

**Files:** Modify `src/app/_layout.tsx`

- [ ] **Step 1: Read current layout**

The layout currently runs `migrateStorageKeys → initAnalytics + initSfx → getOrCreateUser → identify → track('app_opened')`.

- [ ] **Step 2: Add RevenueCat init after `getOrCreateUser` and wrap children with `SubscriptionProvider`**

```tsx
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initAnalytics, identify, track } from '@/lib/analytics/events';
import { initSfx } from '@/lib/audio/sfx';
import { migrateStorageKeys } from '@/lib/storage/migrate';
import { getOrCreateUser } from '@/lib/firebase/auth';
import { initRevenueCat } from '@/lib/subscription/revenuecat';
import { SubscriptionProvider } from '@/lib/subscription/state';
import '../../global.css';

export default function RootLayout() {
  useEffect(() => {
    (async () => {
      await migrateStorageKeys();
      await Promise.all([initAnalytics(), initSfx()]);
      const userId = await getOrCreateUser();
      identify(userId);
      await initRevenueCat(userId);
      track('app_opened', { source: 'cold_launch' });
    })();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SubscriptionProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#f3efe7' },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="game" />
            <Stack.Screen name="daily" />
          </Stack>
        </SubscriptionProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

(Phase 4 will add `<ThemeProvider>` here — Task 11–13 add it.)

- [ ] **Step 3: Typecheck + smoke run**

```bash
npm run typecheck
npm test
```

- [ ] **Step 4: Commit**

```bash
git add src/app/_layout.tsx
git commit -m "feat(subscription): init RevenueCat at boot; wrap children in SubscriptionProvider"
```

---

## Task 9: PaywallModal component

**Files:** Create `src/components/paywall/PaywallModal.tsx`

- [ ] **Step 1: Write the modal**

```tsx
// src/components/paywall/PaywallModal.tsx
import { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';
import { GlassCard } from '@/components/design/GlassCard';
import { Pill } from '@/components/design/Pill';
import { TactileButton } from '@/components/design/TactileButton';
import { colors, fontWeight } from '@/lib/design/tokens';
import { useSubscription } from '@/lib/subscription/state';
import { track } from '@/lib/analytics/events';

export type PaywallSource = 'archive' | 'theme_apply' | 'gif_export';

export interface PaywallModalProps {
  visible: boolean;
  source: PaywallSource;
  onDismiss: () => void;
}

export function PaywallModal({ visible, source, onDismiss }: PaywallModalProps) {
  const { offering, purchase, restore } = useSubscription();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (visible) track('paywall_viewed', { source });
  }, [visible, source]);

  if (!visible) return null;

  const monthly = offering?.availablePackages.find((p) => p.packageType === 'MONTHLY') ?? null;
  const annual = offering?.availablePackages.find((p) => p.packageType === 'ANNUAL') ?? null;

  const onPurchase = async (pkg: PurchasesPackage | null) => {
    if (!pkg) return;
    setBusy(true);
    const success = await purchase(pkg);
    setBusy(false);
    if (success) {
      track('subscription_purchased', {
        tier: pkg.packageType === 'ANNUAL' ? 'annual' : 'monthly',
        trial: pkg.packageType === 'ANNUAL',
      });
      onDismiss();
    }
  };

  const onRestore = async () => {
    setBusy(true);
    await restore();
    setBusy(false);
  };

  const onClose = () => {
    track('paywall_dismissed', { source });
    onDismiss();
  };

  return (
    <View
      style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(22,20,15,0.9)',
        alignItems: 'center', justifyContent: 'center',
        padding: 24, zIndex: 30,
      }}
    >
      <GlassCard style={{ padding: 24, maxWidth: 380, width: '100%' }}>
        <Pill variant="ember">BLOCK MERGE+</Pill>
        <Text style={{ fontSize: 26, fontWeight: fontWeight.black, color: colors.ink, marginTop: 14, letterSpacing: -1 }}>
          Unlock the full game
        </Text>
        <Text style={{ color: colors.inkSoft, marginTop: 8, fontSize: 14, lineHeight: 20 }}>
          Daily archive · cosmetic themes · no ads · GIF replay export.
        </Text>

        {!offering && (
          <View style={{ paddingVertical: 24, alignItems: 'center' }}>
            <ActivityIndicator />
            <Text style={{ color: colors.inkSoft, marginTop: 12, fontSize: 12 }}>
              Loading offers…
            </Text>
          </View>
        )}

        {offering && (
          <View style={{ marginTop: 18, gap: 10 }}>
            {annual && (
              <TactileButton testID="paywall-annual-button" variant="primary" onPress={() => onPurchase(annual)}>
                {`${annual.product.priceString} / year — 7-day free trial`}
              </TactileButton>
            )}
            {monthly && (
              <TactileButton testID="paywall-monthly-button" variant="cobalt" onPress={() => onPurchase(monthly)}>
                {`${monthly.product.priceString} / month`}
              </TactileButton>
            )}
          </View>
        )}

        {busy && (
          <View style={{ marginTop: 12, alignItems: 'center' }}>
            <ActivityIndicator />
          </View>
        )}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 }}>
          <Pressable testID="paywall-restore-button" onPress={onRestore} disabled={busy}>
            <Text style={{ color: colors.inkSoft, fontSize: 13, fontWeight: fontWeight.semibold }}>
              Restore purchases
            </Text>
          </Pressable>
          <Pressable testID="paywall-close-button" onPress={onClose} disabled={busy}>
            <Text style={{ color: colors.inkSoft, fontSize: 13, fontWeight: fontWeight.semibold }}>
              Close
            </Text>
          </Pressable>
        </View>
      </GlassCard>
    </View>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

If `PurchasesPackage.packageType` enum values differ from 'MONTHLY'/'ANNUAL', adjust to match the SDK. v9 uses `MONTHLY`, `ANNUAL`, `TWO_MONTH`, etc.

- [ ] **Step 3: Commit**

```bash
git add src/components/paywall/PaywallModal.tsx
git commit -m "feat(paywall): reusable PaywallModal with monthly/annual SKUs and restore"
```

---

## Task 10: Wire PaywallModal into `daily.tsx` archive

The Phase 2 paywall in `daily.tsx` is a static `<View>`. Replace it with `<PaywallModal>`.

**Files:** Modify `src/app/daily.tsx`

- [ ] **Step 1: Find the existing paywall block**

Search for `showPaywall` state and JSX. The Phase 2 implementation hardcodes copy and lacks SKU rendering.

- [ ] **Step 2: Replace with the new component**

At the bottom of `daily.tsx`, where `{showPaywall && ...}` renders, replace with:

```tsx
<PaywallModal
  visible={showPaywall}
  source="archive"
  onDismiss={() => setShowPaywall(false)}
/>
```

Add the import at the top:

```tsx
import { PaywallModal } from '@/components/paywall/PaywallModal';
```

The old hardcoded paywall View (with the "Subscriptions land in Phase 3" text) is removed entirely.

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 4: Commit**

```bash
git add src/app/daily.tsx
git commit -m "feat(paywall): wire real PaywallModal into daily archive entry"
```

---

## Task 11: Theme catalog + active-theme persistence (TDD)

**Files:**
- Create: `src/lib/themes/catalog.ts`
- Create: `src/lib/themes/active.ts`
- Test: `src/lib/themes/active.test.ts`

### Step 1: Define the catalog

`src/lib/themes/catalog.ts`:

```ts
// src/lib/themes/catalog.ts
import { colors as defaultColors } from '@/lib/design/tokens';

export type ThemeId = 'warm' | 'cool' | 'mono' | 'neon';

export interface ThemePalette {
  id: ThemeId;
  name: string;
  paper: string;
  accent: string;
  /** Locked themes require an active subscription. */
  locked: boolean;
}

export const THEMES: ThemePalette[] = [
  {
    id: 'warm',
    name: 'Warm Cream',
    paper: defaultColors.paper,
    accent: defaultColors.ember,
    locked: false, // free default
  },
  {
    id: 'cool',
    name: 'Cool Sage',
    paper: '#eef1ef',
    accent: '#2a8c8a',
    locked: true,
  },
  {
    id: 'mono',
    name: 'Monochrome',
    paper: '#efece5',
    accent: '#2a2620',
    locked: true,
  },
  {
    id: 'neon',
    name: 'Neon',
    paper: '#0c0f1a',
    accent: '#ff2e63',
    locked: true,
  },
];

export const DEFAULT_THEME: ThemeId = 'warm';

export function getTheme(id: ThemeId): ThemePalette {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
```

### Step 2: Write the failing tests for active-theme selection

`src/lib/themes/active.test.ts`:

```ts
import { describe, it, expect } from '@jest/globals';
import { canApplyTheme } from './active';

describe('canApplyTheme', () => {
  it('allows the free default theme regardless of subscription', () => {
    expect(canApplyTheme('warm', false)).toBe(true);
    expect(canApplyTheme('warm', true)).toBe(true);
  });

  it('blocks locked themes for non-subscribers', () => {
    expect(canApplyTheme('cool', false)).toBe(false);
    expect(canApplyTheme('mono', false)).toBe(false);
    expect(canApplyTheme('neon', false)).toBe(false);
  });

  it('allows locked themes for subscribers', () => {
    expect(canApplyTheme('cool', true)).toBe(true);
    expect(canApplyTheme('mono', true)).toBe(true);
    expect(canApplyTheme('neon', true)).toBe(true);
  });

  it('returns false for unknown theme ids', () => {
    expect(canApplyTheme('unknown' as never, true)).toBe(false);
  });
});
```

### Step 3: Run failing tests

```bash
mkdir -p src/lib/themes
npm test -- themes/active
```
Expected: cannot find module `./active`.

### Step 4: Implement `active.ts`

```ts
// src/lib/themes/active.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEMES, DEFAULT_THEME, type ThemeId } from './catalog';

const ACTIVE_THEME_KEY = '@block_merge:active_theme';

export function canApplyTheme(id: ThemeId, isSubscribed: boolean): boolean {
  const theme = THEMES.find((t) => t.id === id);
  if (!theme) return false;
  if (!theme.locked) return true;
  return isSubscribed;
}

export async function getActiveThemeId(): Promise<ThemeId> {
  const raw = await AsyncStorage.getItem(ACTIVE_THEME_KEY);
  if (raw && THEMES.some((t) => t.id === raw)) return raw as ThemeId;
  return DEFAULT_THEME;
}

export async function setActiveThemeId(id: ThemeId): Promise<void> {
  await AsyncStorage.setItem(ACTIVE_THEME_KEY, id);
}
```

### Step 5: Run tests

```bash
npm test -- themes/active
```
Expected: 4 tests passing.

### Step 6: Commit

```bash
git add src/lib/themes/
git commit -m "feat(themes): catalog + active-theme persistence with TDD coverage"
```

---

## Task 12: ThemeProvider + useThemePalette hook

**Files:** Create `src/lib/themes/provider.tsx`

- [ ] **Step 1: Write the provider**

```tsx
// src/lib/themes/provider.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { THEMES, DEFAULT_THEME, getTheme, type ThemeId, type ThemePalette } from './catalog';
import { getActiveThemeId, setActiveThemeId, canApplyTheme } from './active';
import { useSubscription } from '@/lib/subscription/state';

interface ThemeContextValue {
  palette: ThemePalette;
  activeId: ThemeId;
  setActive: (id: ThemeId) => Promise<boolean>;
  available: ThemePalette[];
}

const ThemeContext = createContext<ThemeContextValue>({
  palette: getTheme(DEFAULT_THEME),
  activeId: DEFAULT_THEME,
  setActive: async () => false,
  available: THEMES,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [activeId, setActiveIdState] = useState<ThemeId>(DEFAULT_THEME);
  const { isSubscribed } = useSubscription();

  useEffect(() => {
    (async () => {
      const stored = await getActiveThemeId();
      setActiveIdState(stored);
    })();
  }, []);

  // If subscription lapses, downgrade to the free default.
  useEffect(() => {
    if (!canApplyTheme(activeId, isSubscribed)) {
      setActiveIdState(DEFAULT_THEME);
      void setActiveThemeId(DEFAULT_THEME);
    }
  }, [isSubscribed, activeId]);

  const setActive = async (id: ThemeId): Promise<boolean> => {
    if (!canApplyTheme(id, isSubscribed)) return false;
    await setActiveThemeId(id);
    setActiveIdState(id);
    return true;
  };

  const value: ThemeContextValue = {
    palette: getTheme(activeId),
    activeId,
    setActive,
    available: THEMES,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemePalette(): ThemePalette {
  return useContext(ThemeContext).palette;
}

export function useThemeControls(): ThemeContextValue {
  return useContext(ThemeContext);
}
```

- [ ] **Step 2: Wrap `<ThemeProvider>` around children in `_layout.tsx`**

```tsx
import { ThemeProvider } from '@/lib/themes/provider';

// in JSX, nest INSIDE SubscriptionProvider so theme provider can read isSubscribed:
<SubscriptionProvider>
  <ThemeProvider>
    <Stack ... />
  </ThemeProvider>
</SubscriptionProvider>
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/themes/provider.tsx src/app/_layout.tsx
git commit -m "feat(themes): ThemeProvider + useThemePalette/useThemeControls hooks"
```

---

## Task 13: Migrate keep-list screens to theme-aware paper bg

Per ADR 0010, only `paper` and `accent` are theme-aware. Update each keep-list screen's root `SafeAreaView` to use `useThemePalette().paper`.

**Files:** Modify `src/app/index.tsx`, `daily.tsx`, `game.tsx`, `welcome.tsx`, `leaderboard.tsx`, `replays.tsx`, `achievements.tsx`, `settings.tsx`, `share.tsx`, `shop.tsx`

- [ ] **Step 1: For each screen, change the SafeAreaView background**

For every file in the list, find:

```tsx
<SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }}>
```

Replace with:

```tsx
import { useThemePalette } from '@/lib/themes/provider';

// inside the component:
const palette = useThemePalette();

// JSX:
<SafeAreaView style={{ flex: 1, backgroundColor: palette.paper }}>
```

(Welcome doesn't need this if it's only shown to first-time users — they haven't picked a theme yet. But for consistency, do it anyway; it falls back to `colors.paper` because `DEFAULT_THEME = 'warm'`.)

Do NOT migrate other `colors.*` usages. Only the SafeAreaView root background.

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add src/app/
git commit -m "feat(themes): paper background on all keep-list screens reads from active theme"
```

---

## Task 14: Theme picker in Settings + apply paywall in Shop

**Files:** Modify `src/app/settings.tsx`, `src/app/shop.tsx`

### Step 1: Add a "Theme" picker row to Settings

Find the DISPLAY group in `src/app/settings.tsx`. Add a row that opens a small selection modal listing the four themes. Tapping a locked theme on a non-subscribed account opens the paywall.

```tsx
import { useThemeControls } from '@/lib/themes/provider';
import { useRequireSubscription } from '@/lib/subscription/gate';
import { PaywallModal } from '@/components/paywall/PaywallModal';

const { available, activeId, setActive } = useThemeControls();
const isSubscribed = useRequireSubscription();
const [showThemePicker, setShowThemePicker] = useState(false);
const [showPaywall, setShowPaywall] = useState(false);

const onPickTheme = async (id: ThemeId) => {
  const ok = await setActive(id);
  if (!ok) {
    setShowPaywall(true);
    return;
  }
  setShowThemePicker(false);
};

// In the DISPLAY group, add:
<SettingsRow
  testID="theme-row"
  label="Theme"
  right={<Text style={{ color: colors.inkSoft }}>{`${getThemeName(activeId)} ›`}</Text>}
  onPress={() => setShowThemePicker(true)}
/>
```

(`getThemeName` is `available.find(t => t.id === activeId)?.name ?? 'Default'` inline.)

Render the picker modal at the bottom of the screen:

```tsx
{showThemePicker && (
  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(22,20,15,0.9)', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 30 }}>
    <GlassCard style={{ padding: 20, width: '100%', maxWidth: 360 }}>
      <Pill variant="ember">THEMES</Pill>
      <Text style={{ fontSize: 22, fontWeight: fontWeight.black, color: colors.ink, marginTop: 12 }}>Pick a theme</Text>
      {available.map((t) => (
        <Pressable key={t.id} testID={`theme-option-${t.id}`} onPress={() => onPickTheme(t.id)} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(22,20,15,0.06)' }}>
          <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: t.paper, borderWidth: 1, borderColor: 'rgba(22,20,15,0.1)', marginRight: 10 }} />
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: t.accent, marginRight: 12 }} />
          <Text style={{ flex: 1, fontSize: 14, fontWeight: fontWeight.semibold, color: colors.ink }}>{t.name}</Text>
          {t.locked && !isSubscribed && (
            <Text style={{ fontSize: 11, color: colors.inkSoft }}>🔒</Text>
          )}
          {t.id === activeId && (
            <Text style={{ fontSize: 11, color: colors.ember, fontWeight: fontWeight.heavy }}>✓</Text>
          )}
        </Pressable>
      ))}
      <Pressable onPress={() => setShowThemePicker(false)} style={{ paddingTop: 16, alignItems: 'center' }}>
        <Text style={{ color: colors.inkSoft, fontWeight: fontWeight.semibold }}>Close</Text>
      </Pressable>
    </GlassCard>
  </View>
)}

<PaywallModal visible={showPaywall} source="theme_apply" onDismiss={() => setShowPaywall(false)} />
```

### Step 2: Update Shop to deep-link to the theme picker

Find the existing shop theme cards. Each card's "Apply" button should:
1. Check `isSubscribed`.
2. If yes, call `setActive(themeId)`.
3. If no, open the paywall.

Drop the price-based purchase model — themes aren't bought one-by-one in v1; subscription unlocks all locked themes. Update the per-theme button label to "Apply" or "Unlock with Block Merge+".

```tsx
const isSubscribed = useRequireSubscription();
const { setActive, activeId } = useThemeControls();
const [showPaywall, setShowPaywall] = useState(false);

const onApplyTheme = async (id: ThemeId) => {
  const ok = await setActive(id);
  if (!ok) setShowPaywall(true);
};

// Per theme card:
<TactileButton
  variant={activeId === t.id ? 'ink' : 'cobalt'}
  fullWidth={false}
  onPress={() => onApplyTheme(t.id)}
>
  {activeId === t.id ? 'Active' : (t.locked && !isSubscribed ? 'Unlock' : 'Apply')}
</TactileButton>
```

Replace the entire shop catalog browsing UI with a four-card list of themes + a banner ("Block Merge+ unlocks all themes. New looks added regularly."). The blocks/gems tabs go away — Phase 3 commits to themes-only per the spec § 5. Remove the existing tab strip + blocks/gems UI.

### Step 3: Typecheck

```bash
npm run typecheck
```

### Step 4: Commit

```bash
git add src/app/settings.tsx src/app/shop.tsx
git commit -m "feat(themes): theme picker in settings + theme-only shop with paywall apply"
```

---

## Task 15: Settings → Restore Purchases (real)

**Files:** Modify `src/app/settings.tsx`

In the ACCOUNT group, the "Restore purchases" row currently calls `console.warn`. Wire it to RevenueCat.

- [ ] **Step 1: Replace the stub handler**

```tsx
import { useSubscription } from '@/lib/subscription/state';
import * as Burnt from 'burnt';

const { restore } = useSubscription();

const onRestore = async () => {
  const success = await restore();
  Burnt.alert({
    title: success ? 'Restored' : 'Nothing to restore',
    message: success ? 'Your subscription is active.' : 'No previous purchase found.',
    preset: success ? 'done' : 'none',
    duration: 2,
  });
};

// Update the SettingsRow:
<SettingsRow
  label="Restore purchases"
  right={<Text style={{ color: colors.inkSoft }}>›</Text>}
  onPress={onRestore}
/>
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add src/app/settings.tsx
git commit -m "feat(subscription): wire Restore Purchases to RevenueCat with toast feedback"
```

---

## Task 16: AchievementToast component + wire into game.tsx + daily.tsx

**Files:**
- Create: `src/components/feedback/AchievementToast.tsx`
- Modify: `src/app/game.tsx`, `src/app/daily.tsx`

The launch design called for a tasteful in-game toast when an achievement unlocks. Phase 2 left this as `console.log`.

- [ ] **Step 1: Create the toast helper**

```tsx
// src/components/feedback/AchievementToast.tsx
import * as Burnt from 'burnt';
import { ACHIEVEMENTS } from '@/lib/utils/achievements';

export function showAchievementToast(achievementId: string): void {
  const meta = ACHIEVEMENTS.find((a) => a.id === achievementId);
  if (!meta) return;
  Burnt.alert({
    title: 'Achievement unlocked',
    message: meta.name,
    preset: 'done',
    duration: 2.5,
  });
}

export function showAchievementsToasts(ids: string[]): void {
  // Stagger so multiple unlocks are individually visible.
  ids.forEach((id, i) => {
    setTimeout(() => showAchievementToast(id), i * 1500);
  });
}
```

- [ ] **Step 2: Replace `console.log('[achievements] granted', granted)` calls**

In both `src/app/game.tsx` and `src/app/daily.tsx`, find the log line after `checkAchievements(...)` returns and replace with:

```tsx
import { showAchievementsToasts } from '@/components/feedback/AchievementToast';

// after `const granted = await checkAchievements(...)`:
if (granted.length > 0) {
  showAchievementsToasts(granted);
}
```

Remove the `console.log` line and any related `setUnlockedAchievements` state if it was used only for the log (Phase 2 added it speculatively).

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 4: Commit**

```bash
git add src/components/feedback/ src/app/game.tsx src/app/daily.tsx
git commit -m "feat(achievements): replace console.log with burnt toast on grant"
```

---

## Task 17: Extend `submitScoreToFirebase` to write archive collections (deferred from Phase 2)

Per ADR 0006, completing a daily run should upsert `puzzles/{puzzleId}` AND `users/{uid}/archive/{puzzleId}`. Phase 2 deferred the writes; Phase 3 wires them.

**Files:** Modify `src/lib/firebase/api.ts`

- [ ] **Step 1: Read the current `submitScoreToFirebase`**

```bash
grep -n "submitScoreToFirebase\|export async function submit" src/lib/firebase/api.ts
```

Note its current signature.

- [ ] **Step 2: Extend the function**

Add archive upserts when `mode === 'tournament'` (the daily-run mode). The per-user archive write uses `setDoc({merge: true})` since each user's puzzle entry is owned by them. The public `puzzles/{id}` document needs a transaction for the `topScore` field to avoid races between concurrent finishers.

```ts
import { doc, setDoc, runTransaction, increment, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';
import { getTodayDateString } from '@/lib/daily/seed';

// existing submitScoreToFirebase signature stays. Inside the function, after
// the existing scores write, add:

if (mode === 'tournament' && db && auth?.currentUser) {
  const puzzleId = getTodayDateString();
  const uid = auth.currentUser.uid;

  // 1) Upsert per-user archive entry. Owned by the user, no race risk.
  const archiveRef = doc(db, 'users', uid, 'archive', puzzleId);
  await setDoc(archiveRef, {
    played: true,
    score,
    multiplier: maxMultiplier,
    durationMs: 0, // `duration` parameter is currently unused upstream; wire when callers pass it
    completedAt: Date.now(),
  }, { merge: true });

  // 2) Public puzzle metadata. Use a transaction so concurrent writers don't
  //    overwrite each other's topScore. playCount + date + seed write
  //    unconditionally via merge — they don't conflict the same way.
  const puzzleRef = doc(db, 'puzzles', puzzleId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(puzzleRef);
    const current = snap.exists() ? (snap.data().topScore ?? 0) : 0;
    const update: Record<string, unknown> = {
      date: serverTimestamp(),
      seed: String(puzzleId),
      playCount: increment(1),
    };
    if (score > current) update.topScore = score;
    tx.set(puzzleRef, update, { merge: true });
  });
}
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/firebase/api.ts
git commit -m "feat(archive): submitScoreToFirebase upserts puzzles/{id} and users/{uid}/archive/{id}"
```

---

## Task 18: Privacy policy + Terms of service stubs + app.json URLs

**Files:**
- Create: `assets/legal/privacy-policy.md`, `assets/legal/terms-of-service.md`
- Modify: `app.json`

These are placeholders — real legal copy comes from a lawyer or a service like Termly.

- [ ] **Step 1: Write privacy stub**

`assets/legal/privacy-policy.md`:

```markdown
# Block Merge — Privacy Policy

**Last updated:** 2026-05-06

This is a placeholder. Real policy lands before app store submission.

Block Merge collects:
- Anonymous device user IDs (via Firebase Anonymous Auth)
- Game scores and replay data (stored in Firebase Firestore)
- Subscription status (managed by RevenueCat and Apple/Google)
- Anonymous product analytics events (via PostHog)

We do not collect:
- Personally identifiable information
- Contact lists
- Location data

You can request deletion of your data by contacting support@blockmerge.app.

This policy will be replaced before public launch.
```

- [ ] **Step 2: Write ToS stub**

`assets/legal/terms-of-service.md`:

```markdown
# Block Merge — Terms of Service

**Last updated:** 2026-05-06

This is a placeholder. Real terms land before app store submission.

By using Block Merge you agree:
- The service is provided as-is, without warranty.
- Subscription auto-renews until cancelled. Cancel via App Store / Play Store settings.
- Free trials convert to paid subscriptions if not cancelled before the trial ends.

These terms will be replaced before public launch.
```

- [ ] **Step 3: Add URLs to `app.json`**

In `app.json`, inside the `expo` object, add:

```json
"privacyPolicyUrl": "https://blockmerge.app/privacy",
"termsOfServiceUrl": "https://blockmerge.app/terms",
```

(These URLs will 404 until the real site is live. App Store Connect requires non-404 URLs — this is a Phase 4 deployment task. Document for Phase 4.)

- [ ] **Step 4: Commit**

```bash
git add assets/legal/ app.json
git commit -m "feat(legal): privacy + terms stubs and app.json URL fields"
```

---

## Task 19: Phase 3 gate verification

- [ ] **Step 1: Typecheck**

```bash
npm run typecheck
```
Expected: 0 errors.

- [ ] **Step 2: Lint**

```bash
npm run lint
```
Expected: 0 errors, 0 warnings.

- [ ] **Step 3: Run all unit tests**

```bash
npm test
```
Expected: 30 prior tests + 4 (subscription) + 4 (themes) = 38 passing.

- [ ] **Step 4: Run Maestro suite (no real-device prerequisites)**

```bash
npm run e2e
```
Expected: surviving flows pass. The flows don't tap any subscription-related testIDs, so they should be stable.

- [ ] **Step 5: Manual real-device checklist (requires populated env vars)**

- Populate `.env.local` per ADR 0009.
- Build TestFlight / Play Console internal track.
- On a real device:
  - Daily Archive: tap → paywall appears with two SKU options and localized prices.
  - Theme picker (Settings → DISPLAY → Theme): tap a locked theme → paywall.
  - Shop: theme cards show correct lock state; tapping Apply on locked theme → paywall.
  - Sandbox purchase → entitlement flips → paywall closes → archive accessible → theme applies.
  - Force-quit → relaunch → entitlement persists.
  - Settings → Restore Purchases → toast confirms restore.
  - Complete a daily run → AchievementToast appears for any unlocked achievement.
  - Firestore: confirm `puzzles/{date}` and `users/{uid}/archive/{date}` documents exist after a daily run.

- [ ] **Step 6: Update plan checkboxes + tag**

Mark every task complete in this file.

```bash
git add docs/superpowers/plans/2026-05-06-phase-3-monetization.md
git commit -m "chore(phase-3): mark plan tasks complete"
git tag phase-3-complete
```

- [ ] **Step 7: Hand off to Phase 4**

Phase 4 owns: sound design pass, performance optimization, app store assets (icon, screenshots, preview video, descriptions), soft-launch territory selection, real legal copy replacement, public privacy/terms hosting, soft-launch metrics gate, wide launch.

Invoke `superpowers:writing-plans` with: "Phase 4 of Block Merge launch — see spec § Phase 4. Phase 3 complete and tagged `phase-3-complete`."

---

## Open questions tracked into Phase 4

| # | Question | Answered when |
|---|---|---|
| 1 | Soft-launch country (Canada vs NZ) | Phase 4 plan |
| 2 | Real legal copy — DIY (Termly), template, or law firm? | Phase 4 plan |
| 3 | Performance gate: 60fps cascade target on which device baseline? | Phase 4 plan |
| 4 | Phase 2 T16 audio assets — generated and committed yet? | Outside-of-plan tracking |
| 5 | App icon redesign for "Block Merge" rebrand | Phase 4 plan |
