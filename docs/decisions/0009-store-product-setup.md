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
