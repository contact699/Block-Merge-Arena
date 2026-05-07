# Phase 4: Polish & Launch Gates — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Block Merge to the App Store and Play Store. Resolve five open questions as ADRs, land the small remaining code work (cascade origin math, Sentry crash reporting, production build hygiene, real legal URLs), document every manual user task that gates submission, run the 2-week soft launch in Canada, then flip the wide-launch gate when metrics clear.

**Architecture:** Three strands. (1) **Code polish** — cascade origin math from on-screen cell coords, Sentry integration, production console-log stripping. (2) **Decision ADRs** that drive manual user work: country, legal copy, perf baseline, asset specs, crash reporting, launch procedures. (3) **Manual-task tracking** as a single living checklist. Final tasks are deployment gates (soft launch + 2-week wait + wide launch + tag).

**Tech Stack:** Expo SDK 53, RN 0.79.6, TypeScript strict. Adds `@sentry/react-native` and `babel-plugin-transform-remove-console`. Existing: jest, lint, typecheck, Maestro. EAS Build for store submissions.

**Source spec:** [`docs/superpowers/specs/2026-05-05-block-merge-launch-design.md`](../specs/2026-05-05-block-merge-launch-design.md) — read § 7 Phase 4 carefully.

**Predecessor:** Phase 3 plan `docs/superpowers/plans/2026-05-06-phase-3-monetization.md`, tagged `phase-3-complete` at `bad260c` with cleanup at `839d8e3`.

---

## Working assumptions

- `npm run typecheck` and `npm run lint` are 0/0 errors at start of Phase 4.
- Jest 38 tests passing across grants, grid, sfx, haptics, subscription state, themes active.
- Working on `main`. Commit per task.
- The user owns App Store Connect, Play Console, RevenueCat dashboard, Sentry account, Termly account, and the `blockmerge.app` DNS — Phase 4 documents what to do in each but cannot execute on their behalf.
- Many tasks are "ADR + manual user follow-up." The plan's value is making the user's work obvious and small.

## File structure

| Path | Status | Responsibility |
|---|---|---|
| `src/lib/cascade/origin.ts` | new | Pure helper — convert (row, col, boardLayout) → cascade origin in screen coords |
| `src/lib/cascade/origin.test.ts` | new | Unit tests for the math |
| `src/components/GameBoard.tsx` | modify | Capture page-relative layout via `onLayout` and expose for cascade origin |
| `src/app/game.tsx` | modify | Use `getCascadeOrigin` instead of hardcoded `{x:0, y:200}` |
| `src/app/daily.tsx` | modify | Same — replace hardcoded origin |
| `src/lib/observability/sentry.ts` | new | Sentry init wrapper with no-op fallback when DSN missing |
| `src/components/observability/ErrorBoundary.tsx` | new | Sentry-wrapping error boundary |
| `src/app/_layout.tsx` | modify | Init Sentry on boot; wrap children in `<ErrorBoundary>` |
| `src/lib/analytics/events.ts` | modify | Sentry breadcrumbs at key tracked events |
| `babel.config.js` | modify | Add `transform-remove-console` for production env |
| `assets/legal/privacy-policy.md` | delete | Replaced by hosted Termly content |
| `assets/legal/terms-of-service.md` | delete | Replaced by hosted Termly content |
| `app.json` | modify | Replace placeholder URLs with real Termly URLs once T6 lands |
| `docs/decisions/0011-soft-launch-country.md` | new | ADR — Canada |
| `docs/decisions/0012-legal-copy-source.md` | new | ADR — Termly + hosted URLs |
| `docs/decisions/0013-performance-baseline.md` | new | ADR — iPhone 13 / Pixel 5; 60fps cascade gate; how to measure |
| `docs/decisions/0014-app-icon-and-asset-specs.md` | new | ADR — icon redesign approach + screenshot/preview-video shot lists |
| `docs/decisions/0015-crash-reporting.md` | new | ADR — Sentry over Firebase Crashlytics |
| `docs/decisions/0016-store-listing-copy.md` | new | ADR — App Store + Play Console listing copy in en-US + en-GB |
| `docs/decisions/0017-launch-procedures.md` | new | ADR — soft-launch procedure + wide-launch day-of checklist + kill-switch playbook |
| `docs/launch/manual-checklist.md` | new | Living checklist — every manual user task with current status |

---

## Task 1: ADR 0011 — Soft-launch country

**Files:** Create `docs/decisions/0011-soft-launch-country.md`

- [ ] **Step 1: Write the ADR**

```markdown
# ADR 0011: Soft-launch Country

**Status:** Active
**Date:** 2026-05-07
**Decision:** Canada. Two-week measurement window before wide launch.

## Context

The launch design (§ 7 Phase 4) called out Canada vs. New Zealand as candidates. Both are English-speaking, smaller App Store / Play Store markets where a soft launch generates real retention numbers without burning the global launch.

| Factor | Canada | New Zealand |
|---|---|---|
| Population | 39M | 5M |
| iOS market share | ~57% | ~33% |
| Daily active mobile gamers | High | Lower |
| Time zone overlap with US ops | Same | 17h offset |
| Marketing influence on US launch | Cross-pollinates US TikTok | Limited |

## Decision

**Canada.** Reasons:
1. Higher install volume → faster to statistically meaningful retention numbers.
2. Same time zones — easier ops, clearer event timestamps in PostHog.
3. Cross-pollination with US-language social media boosts the wide-launch moment.
4. NZ's smaller market means a misfire in NZ tells us less about US-market behavior.

## Procedure

1. After Phase 4 code work + asset prep, build production EAS profiles for iOS + Android.
2. In App Store Connect → submit for review → in **Pricing and Availability**, select **Canada only**.
3. In Play Console → submit → in **Countries / regions**, select **Canada only**.
4. Once approved, monitor PostHog for 14 days. Gate to wide launch:
   - Crash-free sessions ≥ 99.5% (Sentry)
   - D1 retention ≥ 50%
   - D7 retention ≥ 25%
5. If any gate fails, fix and re-soft-launch for another 14 days.

## Revisit if

Canada conversion looks anomalously different from US benchmarks (rare but possible) — could expand to multi-country soft launch (Canada + UK + AU).
```

- [ ] **Step 2: Commit**

```bash
git add docs/decisions/0011-soft-launch-country.md
git commit -m "docs(adr): soft-launch in Canada with 2-week measurement window"
```

---

## Task 2: ADR 0012 — Legal copy source

**Files:** Create `docs/decisions/0012-legal-copy-source.md`

- [ ] **Step 1: Write the ADR**

```markdown
# ADR 0012: Legal Copy Source

**Status:** Active
**Date:** 2026-05-07
**Decision:** Termly for Privacy Policy + Terms of Service. Host on Termly's CDN at first; migrate to `blockmerge.app/privacy` + `/terms` via Cloudflare Pages once a production domain is set up.

## Context

Phase 3 left placeholders at `assets/legal/{privacy-policy,terms-of-service}.md` and `app.json` points to `https://blockmerge.app/{privacy,terms}` URLs that 404. App Store Connect requires non-404 privacy URLs for any subscription product.

Three options:

| Option | Cost | Speed | Quality |
|---|---|---|---|
| Termly subscription | $99/yr | 1 hour to live | High — generated from a questionnaire matching CCPA/GDPR/UK-DPA |
| Generic template (TermsFeed, Iubenda free tier) | $0 | 30 min | Medium — boilerplate, may miss subscription-specific clauses |
| Law firm | $1.5–4k | 2–4 weeks | Highest — bespoke |

## Decision

**Termly** for v1. Reasons:
1. Speed — we need URLs live before App Store submission. Termly delivers in an hour.
2. Coverage — Termly's questionnaire asks the right questions for our stack (subscriptions, anonymous auth, RevenueCat, PostHog, Firebase). Generic templates miss this.
3. Cost — $99/yr is negligible vs. delaying launch.
4. Replaceable — when MRR justifies a real lawyer (post-launch, ~$10k MRR), we swap in their copy. URL stays the same.

## Setup procedure (manual user task)

1. Sign up at https://termly.io with the company email used for App Store Connect.
2. Use Termly's questionnaire to generate:
   - Privacy Policy
   - Terms of Service
3. Each generated document gets a permanent URL like `https://app.termly.io/policy-viewer/policy.html?policyUUID=xxxxxxxx`.
4. Either:
   - **(Phase 4 default)** Use Termly's hosted URLs directly. Update `app.json`'s `privacyPolicyUrl` and `termsOfServiceUrl` to those URLs. App Store Connect accepts them.
   - **(Post-launch)** Set up `blockmerge.app/privacy` and `/terms` as redirects on Cloudflare Pages or Netlify. Termly provides an embeddable iframe + auto-update mechanism.

For Phase 4 we do option (a) — fastest path to non-404 URLs.

## Consequences

- T11 of this plan replaces `app.json`'s placeholder URLs with the Termly URLs once the user generates them.
- The `assets/legal/*.md` stubs are deleted (no longer authoritative).
- Settings.tsx's `Linking.openURL(...)` calls also need updating (currently point at `blockmerge.app`); T11 covers that.

## Revisit if

MRR > $10k/month (real lawyer becomes worth it) or a regulatory change requires bespoke language.
```

- [ ] **Step 2: Commit**

```bash
git add docs/decisions/0012-legal-copy-source.md
git commit -m "docs(adr): legal copy via Termly hosted URLs for v1"
```

---

## Task 3: ADR 0013 — Performance baseline + measurement procedure

**Files:** Create `docs/decisions/0013-performance-baseline.md`

- [ ] **Step 1: Write the ADR**

```markdown
# ADR 0013: Performance Baseline + Measurement Procedure

**Status:** Active
**Date:** 2026-05-07
**Decision:** Pin the 60fps cascade gate to **iPhone 13** and **Pixel 5**. The 30fps minimum gate is **iPhone X** and **Samsung Galaxy A53** (the lowest-end devices we still support).

## Context

The launch design committed to 60fps cascade on a "current mid-range premium" device and 30fps on a "low-end Android" floor. We need exact device names so QA + perf work has a target.

## Decision

| Tier | Devices | Frame target | Acceptable failure |
|---|---|---|---|
| Premium | iPhone 13, Pixel 5 | 60fps sustained during 7×+ cascade | Any drop below 50fps for >2 frames |
| Floor | iPhone X, Samsung Galaxy A53 | 30fps minimum during 5×+ cascade | Any drop below 24fps |

Why these picks:
- **iPhone 13** — released late 2021; "current mid-range premium" by mid-2026 standards.
- **Pixel 5** — same era; reasonable Android perf reference.
- **iPhone X** — oldest iOS device we want to support (iOS 17+ floor).
- **Samsung Galaxy A53** — popular low-end Android in 2024–25; representative of the bottom 20% of Android installs.

## Measurement procedure

1. Build production EAS bundles for iOS + Android.
2. Install on each target device.
3. Run a 5-minute "cascade torture test" — open Endless mode, force a high-multiplier setup, watch the cascade fire.
4. Use:
   - **iOS:** Xcode Instruments → Animation Hitches template, with the device tethered.
   - **Android:** `adb shell dumpsys gfxinfo com.blockmergearena.app` after a session, or Android Studio Profiler.
5. Log frame stats. Failures get filed as Sentry issues with `perf-` tag (T6 wires this in).

## Failure remedies

If a tier fails:
1. Profile to find the hotspot (most likely candidates: Reanimated worklet hot loops, Skia overdraw if used, AsyncStorage bursts, Firestore re-renders).
2. Apply targeted fix — usually `useMemo`, `React.memo`, or `runOnUI` boundary tightening.
3. Re-measure. Don't ship until the gate passes.

## Out of scope for v1

- ProMotion 120Hz on iPhone 13 Pro and up (we target 60Hz; ProMotion is a future polish task).
- Tablet performance (iPad / Android tablet aren't supported in v1).
```

- [ ] **Step 2: Commit**

```bash
git add docs/decisions/0013-performance-baseline.md
git commit -m "docs(adr): perf baseline — iPhone 13/Pixel 5 at 60fps; iPhone X/A53 at 30fps floor"
```

---

## Task 4: ADR 0014 — App icon + asset specs

**Files:** Create `docs/decisions/0014-app-icon-and-asset-specs.md`

- [ ] **Step 1: Write the ADR**

```markdown
# ADR 0014: App Icon + Store Asset Specs

**Status:** Active
**Date:** 2026-05-07

## Icon

**Decision:** Hire a designer via a curated marketplace (Dribbble Pro / Working Not Working / Fiverr Pro tier). Budget ~$300–600. Brief:
- Concept: ember-on-cream block with a soft inner shadow. Single block, slight tilt.
- 1024×1024 master file.
- iOS variants: light + dark + tinted (iOS 18+).
- Android: adaptive icon foreground + monochrome variant.

Why hire vs. DIY: a launch icon is what gets clicked or scrolled past in the App Store. The ROI on a $400 designer is much better than 8 hours of mediocre DIY in Figma. Use a designer who has shipped icon redesigns for puzzle/casual games specifically.

## Screenshots — six per platform

iOS App Store and Play Console both want six (or up to ten) screenshots. Use the same six for both, sized per the requirements of each.

**Shot list:**
1. **The hook:** game board mid-cascade with a 5× ember merge highlighted. Caption: "Place. Clear. Merge."
2. **Daily ritual:** the daily hero card with "ENDS IN" timer (or now, the streak count). Caption: "Same puzzle for everyone."
3. **Share grid:** an emoji-grid screenshot with a recognizable score. Caption: "Share your daily."
4. **Theme picker:** the four themes side by side. Caption: "Make it yours."
5. **Combo theater:** an active 7-line clear with the multiplier strip showing 9×. Caption: "Big risks. Bigger merges."
6. **Leaderboard:** today's leaderboard with the player highlighted. Caption: "Beat them all."

## Preview video — 15 seconds

Both stores accept a 15s preview. Single video, run the merge cascade twice (once 3×, once 7×), end with the share grid being copied + pasted. Background music: subtle ambient (or silence — Apple recommends short videos that read at low volume).

Shot:
1. (0–3s) Player taps to place a piece, line clears.
2. (3–6s) Three gems pulse, fuse into a 3× cluster — first cascade.
3. (6–10s) Camera tilts. Another piece placed, big multi-line clear, 7× cascade with slow-mo.
4. (10–13s) Share grid renders below the board.
5. (13–15s) "Block Merge" wordmark + App Store badge.

## Description copy

**Title (30 char limit):** "Block Merge"

**Subtitle (30 char limit, iOS only):** "A daily puzzle that merges"

**Full description (4000 char limit):**

```
A daily block puzzle where leftover pieces fuse into multipliers. Same puzzle every day, for everyone — share your grid.

GAMEPLAY
• Place tetromino-style pieces on an 8×8 board
• Complete rows or columns to clear them
• Leftover blocks become colored gems
• Same-color gems touching merge into multipliers (×2, ×3, ×5+)
• Higher multipliers = exponentially higher score

DAILY RITUAL
• One puzzle per day, same pieces for everyone
• One run, no retries — make it count
• Share your grid as colored squares + circles
• Catch up on every past daily with Block Merge+

ENDLESS PRACTICE
• Free, unlimited mode for sharpening your merge instincts
• No timer, no pressure
• Beat your high score

BLOCK MERGE+ ($3.99/mo, $29.99/yr — 7-day free trial)
• Daily archive — every past puzzle, replayable
• Cosmetic themes — warm cream, cool sage, monochrome, neon
• No ads
• Replay GIF export

Designed for the patient puzzler. No timers. No streak nags. No slot-machine animations. Just block, merge, share.
```

**en-GB variant** — same copy with these tweaks:
- "$3.99/mo" → "£3.49/mo"
- "$29.99/yr" → "£24.99/yr"
- "color" → "colour" wherever it appears

## Submission checklist (manual)

- [ ] Icon master generated and committed to `assets/icon-1024.png`
- [ ] Six screenshots captured on iPhone 15 Pro (6.7"), Pixel 8 Pro (6.7")
- [ ] Preview video edited and exported as `.mp4` (1080×1920 portrait)
- [ ] App Store Connect copy fields populated (en-US, en-GB)
- [ ] Play Console copy fields populated (en-US, en-GB)
- [ ] Privacy URL pointing at Termly (per ADR 0012)
- [ ] In-app subscription products linked (per ADR 0009)
```

- [ ] **Step 2: Commit**

```bash
git add docs/decisions/0014-app-icon-and-asset-specs.md
git commit -m "docs(adr): app icon + screenshot + preview video + listing copy specs"
```

---

## Task 5: ADR 0015 — Crash reporting (Sentry)

**Files:** Create `docs/decisions/0015-crash-reporting.md`

- [ ] **Step 1: Write the ADR**

```markdown
# ADR 0015: Crash Reporting

**Status:** Active
**Date:** 2026-05-07
**Decision:** Sentry via `@sentry/react-native`. Free tier (5k events/mo) covers v1 scale.

## Context

The launch gate requires crash-free sessions ≥ 99.5%. We need real-time crash visibility tied to git SHAs (sourcemaps) and PostHog user IDs.

| | Sentry | Firebase Crashlytics |
|---|---|---|
| RN integration quality | First-class, well-maintained | Adequate but Expo SDK 53 bridge is finicky |
| Sourcemap upload | Built into the EAS build hook | Requires custom plugin work for Expo |
| Free tier | 5k events/mo | Unlimited |
| Alert quality | Strong (Slack/email per issue, deduplication, regression detection) | Basic |
| Already in stack | No | Yes (firebase) |

## Decision

**Sentry.** Reasons:
1. Better Expo SDK 53 RN bridge — matches our existing PostHog-on-RN choice for the same reason.
2. EAS Build has a documented Sentry sourcemap upload step. Crashlytics requires a custom Expo config plugin.
3. Sourcemap → release association → fast root-cause triage. Crashlytics requires more glue.
4. Slack alerting at issue creation is the difference between catching a regression in 30 minutes vs. 4 hours.

Cost projection: 5k events / month is enough for v1. At 50k MAU + 99.5% crash-free → ~250 crash events / month → well under cap.

## Consequences

- New env vars: `EXPO_PUBLIC_SENTRY_DSN` (the project DSN — safe to ship in client).
- New dep: `@sentry/react-native`.
- New scripts: sourcemap upload as an EAS post-build hook.
- All `track()` calls in `src/lib/analytics/events.ts` also fire a Sentry breadcrumb so crash reports include the player's last 20 events.

## Revisit if

50k+ MAU and event volume crosses the free-tier ceiling — at that scale Sentry's $26/mo Team tier is fine, no migration needed.
```

- [ ] **Step 2: Commit**

```bash
git add docs/decisions/0015-crash-reporting.md
git commit -m "docs(adr): Sentry for crash reporting — better RN integration than Crashlytics"
```

---

## Task 6: Sentry integration — wrapper + ErrorBoundary + breadcrumbs

**Files:**
- Create: `src/lib/observability/sentry.ts`
- Create: `src/components/observability/ErrorBoundary.tsx`
- Modify: `src/app/_layout.tsx`
- Modify: `src/lib/analytics/events.ts`
- Modify: `package.json` (add dep)
- Modify: `.env.example` (add DSN)

### Step 1: Install the SDK

```bash
npm install --legacy-peer-deps @sentry/react-native
```

The Expo + Sentry pairing also requires running the install script, which patches the iOS + Android native projects (handled at next prebuild — not needed for the Metro dev server). Document the `npx @sentry/wizard@latest -i reactNative` step in the ADR's manual section, but for code work we just need the JS-side wrapper.

### Step 2: Write the wrapper

`src/lib/observability/sentry.ts`:

```ts
// src/lib/observability/sentry.ts
//
// Thin wrapper around @sentry/react-native. No-ops when DSN is not set
// (dev mode without Sentry credentials).
import * as Sentry from '@sentry/react-native';

let initialized = false;

export function initSentry(): void {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    console.warn('[sentry] DSN not set — crash reporting disabled');
    return;
  }
  if (initialized) return;
  Sentry.init({
    dsn,
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000,
    // Sample 100% of errors in v1; sample 10% of perf transactions.
    tracesSampleRate: 0.1,
  });
  initialized = true;
}

export function identifySentryUser(userId: string): void {
  if (!initialized) return;
  Sentry.setUser({ id: userId });
}

export function breadcrumb(category: string, message: string, data?: Record<string, unknown>): void {
  if (!initialized) return;
  Sentry.addBreadcrumb({
    category,
    message,
    level: 'info',
    data,
  });
}

export function captureException(error: unknown, context?: Record<string, unknown>): void {
  if (!initialized) {
    console.error('[sentry] not initialized; error:', error);
    return;
  }
  Sentry.captureException(error, { extra: context });
}

export const SentryErrorBoundary = Sentry.ErrorBoundary;
```

### Step 3: Write the ErrorBoundary component

`src/components/observability/ErrorBoundary.tsx`:

```tsx
import { View, Text, Pressable } from 'react-native';
import { SentryErrorBoundary } from '@/lib/observability/sentry';
import { colors, fontWeight } from '@/lib/design/tokens';

function FallbackUI({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <Text style={{ fontSize: 24, fontWeight: fontWeight.black, color: colors.ink, letterSpacing: -1 }}>
        Something broke.
      </Text>
      <Text style={{ color: colors.inkSoft, fontSize: 14, marginTop: 12, textAlign: 'center' }}>
        We've sent the report. Tap below to try again.
      </Text>
      <Text style={{ color: colors.inkDim, fontSize: 11, marginTop: 18, textAlign: 'center' }}>
        {error.message}
      </Text>
      <Pressable
        onPress={resetError}
        style={{ marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: colors.ember, borderRadius: 12 }}
      >
        <Text style={{ color: 'white', fontWeight: fontWeight.heavy }}>Reload</Text>
      </Pressable>
    </View>
  );
}

export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <SentryErrorBoundary fallback={({ error, resetError }) => <FallbackUI error={error as Error} resetError={resetError} />}>
      {children}
    </SentryErrorBoundary>
  );
}
```

### Step 4: Wire into `_layout.tsx`

Modify `src/app/_layout.tsx`:

```tsx
import { initSentry, identifySentryUser } from '@/lib/observability/sentry';
import { ErrorBoundary } from '@/components/observability/ErrorBoundary';
// ... existing imports

export default function RootLayout() {
  useEffect(() => {
    (async () => {
      initSentry();
      await migrateStorageKeys();
      await Promise.all([initAnalytics(), initSfx()]);
      const userId = await getOrCreateUser();
      identify(userId);
      identifySentryUser(userId);
      await initRevenueCat(userId);
      track('app_opened', { source: 'cold_launch' });
    })();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <SubscriptionProvider>
            <ThemeProvider>
              <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#f3efe7' } }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="game" />
                <Stack.Screen name="daily" />
              </Stack>
            </ThemeProvider>
          </SubscriptionProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

### Step 5: Wire breadcrumbs into the analytics taxonomy

Modify `src/lib/analytics/events.ts` so every `track(...)` call also drops a Sentry breadcrumb. This way crash reports include the last 20 user actions for free.

Add at the bottom of the existing `track` function:

```ts
import { breadcrumb } from '@/lib/observability/sentry';

export function track<K extends keyof EventMap>(event: K, props: EventMap[K]): void {
  if (!client) return;
  client.capture(event, props as unknown as JsonProps);
  breadcrumb('analytics', String(event), props as JsonProps);
}
```

(Keep PostHog as the primary analytics destination; Sentry just gets the event metadata as breadcrumb context.)

### Step 6: Add DSN to `.env.example`

Modify `.env.example`:

```
# Sentry (crash reporting — see docs/decisions/0015-crash-reporting.md)
EXPO_PUBLIC_SENTRY_DSN=
```

Add after the RevenueCat block.

### Step 7: Typecheck + lint + jest

```bash
npm run typecheck
npm run lint
npm test
```
Expected: clean, 38 tests passing.

### Step 8: Commit

```bash
git add -A
git commit -m "feat(observability): wire Sentry crash reporting + error boundary + breadcrumbs"
```

---

## Task 7: Cascade origin math

**Files:**
- Create: `src/lib/cascade/origin.ts`
- Test: `src/lib/cascade/origin.test.ts`
- Modify: `src/app/game.tsx`, `src/app/daily.tsx`

### Step 1: Write the failing test

`src/lib/cascade/origin.test.ts`:

```ts
import { describe, it, expect } from '@jest/globals';
import { computeCascadeOrigin } from './origin';

describe('computeCascadeOrigin', () => {
  const layout = {
    boardX: 16,
    boardY: 200,
    boardSize: 320,
    cellSize: 38,
    boardPadding: 8,
  };

  it('places origin at the center of the (0,0) cell', () => {
    const o = computeCascadeOrigin({ row: 0, col: 0 }, layout);
    // boardX + boardPadding + cellSize/2 = 16 + 8 + 19 = 43
    expect(o.x).toBe(43);
    expect(o.y).toBe(227); // 200 + 8 + 19
  });

  it('places origin at the center of the (4,4) cell', () => {
    const o = computeCascadeOrigin({ row: 4, col: 4 }, layout);
    // boardX + boardPadding + 4*(cellSize+gap) + cellSize/2
    // assume gap = 0 since we don't pass it in the test data
    expect(o.x).toBeGreaterThan(16 + 8 + 4 * 38);
    expect(o.x).toBeLessThan(16 + 8 + 5 * 38);
  });

  it('clamps origin to the board bounds for the (7,7) corner', () => {
    const o = computeCascadeOrigin({ row: 7, col: 7 }, layout);
    expect(o.x).toBeLessThan(layout.boardX + layout.boardSize);
    expect(o.y).toBeLessThan(layout.boardY + layout.boardSize);
  });
});
```

### Step 2: Run failing tests

```bash
mkdir -p src/lib/cascade
npm test -- cascade/origin
```
Expected: cannot find module `./origin`.

### Step 3: Implement the math

`src/lib/cascade/origin.ts`:

```ts
// src/lib/cascade/origin.ts
//
// Convert a board cell (row, col) plus the GameBoard's measured layout into
// screen-space coords for the cascade animation overlay. The board renders
// with `boardPadding` of inner padding and `cellSize` per cell; cells are
// laid out top-left → bottom-right in standard 8×8 grid order.

export interface BoardLayout {
  /** Page-relative X of the GameBoard wrapper's top-left. */
  boardX: number;
  /** Page-relative Y of the GameBoard wrapper's top-left. */
  boardY: number;
  /** Width = height of the GameBoard wrapper. */
  boardSize: number;
  /** Computed pixel size of one cell. */
  cellSize: number;
  /** Inner padding between board edge and the first cell. */
  boardPadding: number;
  /** Optional: gap between cells (defaults to 0). */
  cellGap?: number;
}

export interface Cell {
  row: number;
  col: number;
}

export interface ScreenPoint {
  x: number;
  y: number;
}

export function computeCascadeOrigin(cell: Cell, layout: BoardLayout): ScreenPoint {
  const gap = layout.cellGap ?? 0;
  const half = layout.cellSize / 2;
  const x = layout.boardX + layout.boardPadding + cell.col * (layout.cellSize + gap) + half;
  const y = layout.boardY + layout.boardPadding + cell.row * (layout.cellSize + gap) + half;
  return { x, y };
}
```

### Step 4: Run tests — should pass

```bash
npm test -- cascade/origin
```
Expected: 3 tests passing.

### Step 5: Capture board layout via `onLayout` in the GameBoard wrapper

The GameBoard component already exists. We need its callers (game.tsx, daily.tsx) to know the board's screen position. The simplest pattern: wrap the `<GameBoard>` in a `<View onLayout={...}>` in each caller and store the layout in state.

In `src/app/game.tsx`:

```tsx
import { useState } from 'react';
import { computeCascadeOrigin, type BoardLayout } from '@/lib/cascade/origin';

const [boardLayout, setBoardLayout] = useState<BoardLayout | null>(null);

// somewhere — find the GameBoard wrapper View. Looks something like:
<View
  onLayout={(e) => {
    const { x, y, width } = e.nativeEvent.layout;
    // GameBoard internals: boardSize 320, padding 8, gap 2. These are stable.
    const boardSize = width;
    const boardPadding = 8;
    const cellGap = 2;
    const cellSize = (boardSize - boardPadding * 2 - cellGap * 7) / 8;
    setBoardLayout({ boardX: x, boardY: y, boardSize, cellSize, boardPadding, cellGap });
  }}
>
  <GameBoard ... />
</View>
```

Then where the cascade is fired — replace the hardcoded origin:

```tsx
// before:
setActiveCascade({
  id: Date.now(),
  multiplier: bestGem.multiplier,
  color: resolveBlockColor(bestGem.color),
  origin: { x: 0, y: 200 },
});

// after:
const origin = boardLayout
  ? computeCascadeOrigin({ row: bestGem.row, col: bestGem.col }, boardLayout)
  : { x: 0, y: 200 }; // fallback if layout hasn't been measured yet
setActiveCascade({
  id: Date.now(),
  multiplier: bestGem.multiplier,
  color: resolveBlockColor(bestGem.color),
  origin,
});
```

If `bestGem.row` / `bestGem.col` aren't already on the gem object: check `src/lib/game/merge.ts`'s `mergeGems` return shape. If row/col aren't there, the cluster's first cell coords work just as well (they're stored on the source cell). If neither exists, fall back to averaging the cluster cells' coords.

Read `src/lib/game/merge.ts` first to find the right field names. The test data may need to be adjusted to match — what matters is the cascade origin lands roughly on the merged cluster.

### Step 6: Same edits to `src/app/daily.tsx`

Apply the identical pattern. Both files have the cascade firing in their `handleCellPress` (or equivalent) function.

### Step 7: Run typecheck + tests

```bash
npm run typecheck
npm test
```
Expected: clean, 41 tests passing (38 + 3 new origin tests).

### Step 8: Commit

```bash
git add -A
git commit -m "feat(cascade): origin math from board layout instead of hardcoded coords"
```

---

## Task 8: Production console-log stripping + version bump

**Files:**
- Modify: `babel.config.js`
- Modify: `package.json` (add dev dep)
- Verify: `app.json` version is `1.0.0`

### Step 1: Install babel plugin

```bash
npm install --legacy-peer-deps --save-dev babel-plugin-transform-remove-console
```

### Step 2: Modify `babel.config.js`

Read the current file first:

```bash
cat babel.config.js
```

Add a production env block that uses the strip-console plugin. Existing test env stays intact. The non-test, non-production path keeps console logs (so `expo start` dev sessions are noisy, which is what we want).

Pattern:

```js
module.exports = function (api) {
  const isTest = api.env('test');
  const isProduction = api.env('production');
  api.cache(true);
  if (isTest) {
    return { presets: ['@babel/preset-env', '@babel/preset-typescript'] };
  }
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin', // existing
      ...(isProduction ? [['transform-remove-console', { exclude: ['error', 'warn'] }]] : []),
    ],
  };
};
```

Adjust to whatever the actual existing config looks like — preserve any other plugins (e.g. NativeWind's transform).

### Step 3: Verify `app.json` version

```bash
grep '"version"' app.json
```
Expected: `"version": "1.0.0"`. If not, bump to 1.0.0.

### Step 4: Verify the lint/typecheck/jest still pass

```bash
npm run typecheck
npm run lint
npm test
```

### Step 5: Commit

```bash
git add -A
git commit -m "build: strip console logs in production builds; confirm v1.0.0"
```

---

## Task 9: ADR 0016 — Store listing copy (en-US + en-GB)

**Files:** Create `docs/decisions/0016-store-listing-copy.md`

This ADR is the canonical copy source. Manual user task copies these into App Store Connect / Play Console at submission time.

- [ ] **Step 1: Write the ADR**

```markdown
# ADR 0016: Store Listing Copy

**Status:** Active
**Date:** 2026-05-07

## en-US

**App name:** Block Merge
**Subtitle (iOS):** A daily puzzle that merges
**Promotional text (170 char):** Same puzzle every day. Place blocks, clear lines, watch leftover gems fuse into multipliers. Share your grid.
**Keywords (iOS, 100 char):** puzzle,daily,blocks,merge,wordle,tetris,brain,zen,calm,gems,combo,share,leaderboard,casual

**Description (4000 char):**

```
A daily block puzzle where leftover pieces fuse into multipliers. Same puzzle every day, for everyone — share your grid.

GAMEPLAY
• Place tetromino-style pieces on an 8×8 board
• Complete rows or columns to clear them
• Leftover blocks become colored gems
• Same-color gems touching merge into multipliers (×2, ×3, ×5+)
• Higher multipliers = exponentially higher score

DAILY RITUAL
• One puzzle per day, same pieces for everyone
• One run, no retries — make it count
• Share your grid as colored squares + circles
• Catch up on every past daily with Block Merge+

ENDLESS PRACTICE
• Free, unlimited mode for sharpening your merge instincts
• No timer, no pressure
• Beat your high score

BLOCK MERGE+ ($3.99/mo, $29.99/yr — 7-day free trial)
• Daily archive — every past puzzle, replayable
• Cosmetic themes — warm cream, cool sage, monochrome, neon
• No ads
• Replay GIF export

Designed for the patient puzzler. No timers. No streak nags. No slot-machine animations. Just block, merge, share.
```

## en-GB

Same as en-US with these substitutions:
- `$3.99/mo` → `£3.49/mo`
- `$29.99/yr` → `£24.99/yr`
- `colored` → `coloured` (2 occurrences)
- `colors` → `colours` (1 occurrence)

## Image alt text (Play Store accessibility)

For each screenshot, provide a single line of alt text matching the caption from ADR 0014.

## Submission notes

- App Category: **Games / Puzzle**
- Age rating: **4+** (no objectionable content)
- Content rights: **Yes, this app contains, shows, or accesses third-party content** — disclose Firebase, RevenueCat, PostHog, Sentry as data processors.
```

- [ ] **Step 2: Commit**

```bash
git add docs/decisions/0016-store-listing-copy.md
git commit -m "docs(adr): canonical store listing copy in en-US + en-GB"
```

---

## Task 10: ADR 0017 — Launch procedures

**Files:** Create `docs/decisions/0017-launch-procedures.md`

- [ ] **Step 1: Write the ADR**

```markdown
# ADR 0017: Launch Procedures

**Status:** Active
**Date:** 2026-05-07

## Soft launch — Canada, two-week measurement

### Day 0 (submission day)

1. Build production EAS profiles for iOS + Android.
   ```bash
   npx eas build --profile production --platform ios
   npx eas build --profile production --platform android
   ```
2. Submit for review:
   ```bash
   npx eas submit --platform ios
   npx eas submit --platform android
   ```
3. In App Store Connect → Pricing & Availability → set **Canada only**.
4. In Play Console → Countries / regions → set **Canada only**.
5. Submit for review.

### Days 1–3 (review window)

- Apple review usually clears within 24h. Google Play within 4–8h.
- If rejected: read the rejection, fix, re-submit. Common rejections:
  - Privacy URL 404 — check Termly URL is live (per ADR 0012).
  - Subscription metadata missing — check ADR 0009 was followed.
  - Test account doesn't work — provide a sandbox tester.

### Days 4–17 (measurement window)

Daily ritual:
1. Check Sentry dashboard. Crash-free target: ≥ 99.5%.
2. Check PostHog `app_opened` cohort retention. D1 ≥ 50%, D7 ≥ 25%.
3. Check `subscription_purchased` count. Sub conversion ≥ 2% MAU within 60d (extrapolate at 14d).
4. Check `share_grid_tapped / daily_completed`. Share rate ≥ 8%.
5. App Store rating — must be ≥ 4.6 by day 14.

### Day 14 — gate decision

Pass: proceed to wide launch.
Fail: identify the failing metric. Likely fixes:
- Crashes — Sentry will name the source. Hot-fix and re-submit.
- D1 too low — onboarding regressions. Probably the welcome flow.
- D7 too low — retention failure. Game itself is the issue. (Hardest to fix; may need to delay wide launch.)
- Sub conversion too low — paywall friction. Try `theme_apply` paywall as a softer gate.

## Wide launch — Tuesday morning ET

### Pre-flight (the day before)

- [ ] Verify all SKUs active in App Store Connect + Play Console.
- [ ] Verify RevenueCat dashboard shows offerings live in all target markets.
- [ ] Verify Sentry alert routing is on (Slack channel #block-merge-launch).
- [ ] Pre-stage social posts (Twitter, TikTok, IG).
- [ ] Notify any waitlist subscribers / press contacts.

### Day-of

1. **08:00 ET** — flip availability in App Store Connect (Pricing & Availability → all worldwide).
2. **08:00 ET** — flip availability in Play Console (Countries → all worldwide).
3. **08:30 ET** — post launch announcement on Twitter / TikTok with screenshots + 15s video.
4. **09:00 ET** — confirm app shows up in US App Store search ("block merge").
5. **All day** — monitor Sentry every 30 min for unexpected crash spikes.
6. **18:00 ET** — review the day's PostHog dashboard. Tomorrow's adjustments based on hour-by-hour install / churn.

### Kill-switch playbook

If a critical bug surfaces during launch:

1. **Less than 30 min to fix:** push a hot-fix EAS Update (no store re-submission required). User opens the app, OTA pulls the fix.
   ```bash
   npx eas update --branch production --message "hotfix: <issue>"
   ```
2. **More than 30 min to fix:** flip availability OFF in App Store Connect + Play Console. Both stores let you remove the app from sale within minutes. The existing installed base keeps working; new installs are blocked.
3. **Game is fundamentally broken:** force-show a maintenance screen via a remote-config flag. (Phase 4 doesn't ship a remote-config system — if needed, a Firebase Remote Config integration is a fast follow-up.)

### Post-launch week 1

Daily review of:
- New 1-star reviews — respond if signal, ignore if pure venting.
- Sentry top-5 issues — fix the top issue weekly.
- PostHog funnel: install → daily run → share → subscribe. Find the biggest drop-off, prioritize fix.
```

- [ ] **Step 2: Commit**

```bash
git add docs/decisions/0017-launch-procedures.md
git commit -m "docs(adr): soft + wide launch procedures with day-by-day playbook"
```

---

## Task 11: Replace legal stubs with real Termly URLs

**Files:**
- Delete: `assets/legal/privacy-policy.md`, `assets/legal/terms-of-service.md`
- Modify: `app.json`
- Modify: `src/app/settings.tsx`

This task gates on the user having generated their Termly URLs (manual task per ADR 0012).

- [ ] **Step 1: Confirm the user has Termly URLs ready**

Check the manual checklist (created by Task 13):

```bash
grep -A2 "Termly" docs/launch/manual-checklist.md
```

If the URLs are not yet in the checklist, this task is **blocked** — wait on the user.

If they are, capture them as variables for the next step:

```
PRIVACY_URL=https://app.termly.io/policy-viewer/policy.html?policyUUID=<UUID-FROM-USER>
TERMS_URL=https://app.termly.io/policy-viewer/policy.html?policyUUID=<UUID-FROM-USER>
```

- [ ] **Step 2: Delete the legal stubs**

```bash
rm assets/legal/privacy-policy.md assets/legal/terms-of-service.md
```

- [ ] **Step 3: Update `app.json`**

Replace the placeholder URLs:

```json
"privacyPolicyUrl": "<PRIVACY_URL>",
"termsOfServiceUrl": "<TERMS_URL>",
```

- [ ] **Step 4: Update `src/app/settings.tsx`**

Find the two `Linking.openURL` calls for privacy/terms. Replace `https://blockmerge.app/privacy` and `/terms` with the Termly URLs.

- [ ] **Step 5: Run typecheck**

```bash
npm run typecheck
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(legal): replace placeholder URLs with Termly-hosted privacy + terms"
```

---

## Task 12: Manual-task checklist

**Files:** Create `docs/launch/manual-checklist.md`

This is the single source of truth for every manual user task that gates submission. The user updates it as they complete each.

- [ ] **Step 1: Create the directory**

```bash
mkdir -p docs/launch
```

- [ ] **Step 2: Write the checklist**

```markdown
# Block Merge Launch — Manual Checklist

> All tasks the user (not the agent) must complete before App Store / Play Store submission. Update statuses as you go.

## Backend infrastructure

- [ ] Firebase production project created (per ADR 0002)
- [ ] Firebase env vars populated in `.env.local`
- [ ] Firebase Auth → Anonymous sign-in enabled
- [ ] Firestore → security rules per ADR 0002 + ADR 0006 deployed
- [ ] PostHog account created (per ADR 0001)
- [ ] PostHog API key in `.env.local`
- [ ] RevenueCat project created (per ADR 0009)
- [ ] iOS + Android app entries linked in RevenueCat dashboard
- [ ] Entitlement `plus` configured
- [ ] Offering `default` with monthly + annual packages configured
- [ ] RevenueCat API keys in `.env.local`
- [ ] Sentry project created (per ADR 0015)
- [ ] Sentry DSN in `.env.local`

## Store products

- [ ] App Store Connect — `block_merge_plus_monthly` SKU created (Tier 4 / $3.99)
- [ ] App Store Connect — `block_merge_plus_annual` SKU created (Tier 30 / $29.99) with 7-day intro offer
- [ ] Subscription Group `block_merge_plus` created
- [ ] Apple subscription review materials filled in (display name, description, screenshot)
- [ ] Play Console — `block_merge_plus_monthly` subscription created
- [ ] Play Console — `block_merge_plus_annual` subscription created with 7-day trial offer
- [ ] Both products activated in Play Console

## Legal

- [ ] Termly account created (per ADR 0012)
- [ ] Privacy policy generated → URL: ___________________________________
- [ ] Terms of service generated → URL: ___________________________________
- [ ] Plan T11 executed (URLs replace placeholders in app.json + settings.tsx)

## Assets

- [ ] App icon designer engaged (per ADR 0014)
- [ ] App icon 1024×1024 master delivered → committed at `assets/icon.png`
- [ ] iOS icon variants (light / dark / tinted) generated
- [ ] Android adaptive icon foreground + monochrome generated
- [ ] Screenshot 1 of 6 captured (game board mid-cascade)
- [ ] Screenshot 2 of 6 captured (daily hero)
- [ ] Screenshot 3 of 6 captured (share grid)
- [ ] Screenshot 4 of 6 captured (theme picker)
- [ ] Screenshot 5 of 6 captured (combo theater)
- [ ] Screenshot 6 of 6 captured (leaderboard)
- [ ] 15s preview video shot, edited, exported (1080×1920 portrait)

## Audio (Phase 2 carry-over)

- [ ] `assets/sounds/merge-2x.m4a` generated and committed
- [ ] `assets/sounds/merge-3x.m4a` generated and committed
- [ ] `assets/sounds/merge-5x.m4a` generated and committed
- [ ] `assets/sounds/merge-7x.m4a` generated and committed

## Real-device QA (per ADR 0013)

- [ ] iPhone 13 — cascade hits 60fps target
- [ ] iPhone X — cascade ≥ 30fps minimum
- [ ] Pixel 5 — cascade hits 60fps target
- [ ] Samsung Galaxy A53 — cascade ≥ 30fps minimum
- [ ] Daily run completes end-to-end on each device
- [ ] Paywall renders + sandbox purchase succeeds on iPhone 13
- [ ] Paywall renders + sandbox purchase succeeds on Pixel 5
- [ ] Restore Purchases flips entitlement on a fresh install (iOS)
- [ ] Restore Purchases flips entitlement on a fresh install (Android)
- [ ] Achievement toast surfaces on grant
- [ ] Theme picker applies; subscription downgrade reverts to default
- [ ] Maestro full suite passes on at least one real device

## Submission

- [ ] App Store Connect listing copy populated (per ADR 0016 — en-US + en-GB)
- [ ] Play Console listing copy populated (per ADR 0016 — en-US + en-GB)
- [ ] Screenshots uploaded to both stores
- [ ] Preview video uploaded (App Store Connect requires 1080×1920)
- [ ] Privacy URL field populated in both stores
- [ ] Terms URL field populated in both stores (Play Store only)
- [ ] App reviewed and approved on Apple
- [ ] App reviewed and approved on Google
- [ ] Soft-launch availability flipped to **Canada only** on both stores
- [ ] Day 1 of 14-day soft-launch measurement window started

## Soft-launch metrics gate (after 14 days)

- [ ] Sentry crash-free sessions ≥ 99.5%
- [ ] PostHog D1 retention ≥ 50%
- [ ] PostHog D7 retention ≥ 25%
- [ ] Subscription conversion (extrapolated) ≥ 2% MAU
- [ ] Share rate (`share_grid_tapped / daily_completed`) ≥ 8%
- [ ] App Store rating ≥ 4.6

## Wide launch (per ADR 0017 day-of)

- [ ] All SKUs active in all target markets
- [ ] RevenueCat dashboard verified
- [ ] Sentry Slack alerts confirmed
- [ ] Pre-staged launch posts ready
- [ ] App Store availability flipped worldwide at 08:00 ET
- [ ] Play Console availability flipped worldwide at 08:00 ET
- [ ] Launch announcement posted by 08:30 ET
- [ ] App appears in US App Store search by 09:00 ET
- [ ] First-day Sentry monitoring complete with no critical incidents
```

- [ ] **Step 3: Commit**

```bash
git add docs/launch/manual-checklist.md
git commit -m "docs(launch): manual checklist for every gating user task"
```

---

## Task 13: Soft-launch deploy gate

This is a procedural task — no code changes. The plan documents what to do; the user executes.

- [ ] **Step 1: Confirm prerequisites from `docs/launch/manual-checklist.md`**

Open the checklist. Every item under "Backend infrastructure", "Store products", "Legal", "Assets", "Audio", "Real-device QA", and "Submission" sections must be checked OFF before this gate.

If any are unchecked, soft-launch is blocked. The user must complete them.

- [ ] **Step 2: Run final pre-build verification**

```bash
npm run typecheck
npm run lint
npm test
npm run e2e
```
All must be 0/0/passing.

- [ ] **Step 3: Run an EAS production build**

```bash
npx eas build --profile production --platform all
```

Wait for both iOS + Android builds to finish (typically 15–30 min each).

- [ ] **Step 4: Submit for store review**

```bash
npx eas submit --platform ios
npx eas submit --platform android
```

- [ ] **Step 5: Tag the soft-launch state**

```bash
git tag soft-launch-v1.0
git push origin soft-launch-v1.0
```

- [ ] **Step 6: Mark soft-launch start in the checklist**

Update `docs/launch/manual-checklist.md` — check the "soft-launch availability flipped to Canada only" item and add today's date.

- [ ] **Step 7: Wait 14 days**

This is genuinely a wait. Check Sentry + PostHog daily. Don't make changes during measurement unless something is critically broken (then hot-fix via EAS Update per ADR 0017's kill-switch playbook).

---

## Task 14: Wide-launch deploy gate

- [ ] **Step 1: Verify soft-launch metrics passed**

Check the "Soft-launch metrics gate" section of `docs/launch/manual-checklist.md`. Every metric must be ≥ its threshold.

If any failed: this gate is BLOCKED. Triage per ADR 0017's "Day 14 — gate decision" section. Fix, re-soft-launch, retry.

- [ ] **Step 2: Run pre-flight checklist**

Walk through the "Wide launch" section of `docs/launch/manual-checklist.md`. Every checkbox must be checked.

- [ ] **Step 3: Day-of execution**

Follow ADR 0017's "Wide launch — Tuesday morning ET" section step by step. The agent's role here is execution support: monitor Sentry, watch PostHog event streams, run hot-fix builds if needed.

- [ ] **Step 4: Tag launch**

After day 1 completes without critical incident:

```bash
git tag launch-v1.0
git push origin launch-v1.0
```

- [ ] **Step 5: Update plan + spec status**

In this plan, mark every task complete.
In `docs/superpowers/specs/2026-05-05-block-merge-launch-design.md`, update the front-matter `Status:` to `Launched 2026-XX-XX`.

```bash
git add docs/superpowers/
git commit -m "chore(launch): tag v1.0 and mark spec status as launched"
```

- [ ] **Step 6: Hand off to operations**

Phase 5 (post-launch operations — not part of the launch plan) covers: weekly Sentry triage, monthly theme drops per ADR 0008, subscriber retention analysis, Phase 6+ feature work driven by metrics.

---

## Open questions for post-launch

| # | Question | Answered when |
|---|---|---|
| 1 | Sound designer hire trigger (per ADR 0004) | After 90 days post-launch |
| 2 | Sprint mode revival (per ADR 0003) | If subscriber 3-month retention < 25% |
| 3 | Per-region pricing (per ADR 0007) | If 3-month MRR > $10k |
| 4 | Real legal review (per ADR 0012) | If MRR > $10k/month |
| 5 | Theme rotation calendar (per ADR 0008) | If subscriber 3-month retention > 60% |
| 6 | Full per-token theming (per ADR 0010) | If subscriber feedback says themes don't feel different enough |
| 7 | Family Sharing for subscriptions | Apple defaults this on; revisit if support inquiries |
| 8 | Web version of the daily | Phase 6 candidate; out of v1 |
