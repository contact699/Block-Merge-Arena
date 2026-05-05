# Phase 1: Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cut scope down to the 8 launch screens, populate production backend, wire analytics, and apply the tactile-console redesign across every remaining surface — leaving the codebase coherent, smaller, and ready for the differentiator work in Phase 2.

**Architecture:** Three concurrent strands of work, none of which depend on each other in v1: (1) **delete + rename** to slim the codebase to launch scope and rebrand, (2) **backend wiring** to make Firebase + analytics actually live, (3) **redesign** of the seven not-yet-styled screens against the existing tactile-console primitives in `src/components/design/` and the tokens in `src/lib/design/tokens.ts`. Phase 1 explicitly does *not* change game mechanics — the 5-minute tournament timer stays intact and Phase 2 owns its replacement.

**Tech Stack:** Expo SDK 53, React Native 0.79.6, TypeScript strict, NativeWind 4 (utilities only — primitive components use inline styles), `expo-router` typed routes, `expo-linear-gradient`, Firebase v12, RevenueCat (present, unwired — Phase 3 owns), PostHog or Firebase Analytics (decision in T7), Maestro for e2e.

**Source spec:** [`docs/superpowers/specs/2026-05-05-block-merge-launch-design.md`](../specs/2026-05-05-block-merge-launch-design.md) — read it first if you haven't.

---

## Working assumptions

- The tactile-console primitives (`TactileCell`, `Pill`, `TactileButton`, `GlassCard`, `DeepCard`) and the design tokens already exist on `main`. Welcome / Home / Game are already redesigned. Reference `src/app/welcome.tsx`, `src/app/index.tsx`, and `src/app/game.tsx` for the exact patterns to replicate.
- Maestro flows under `.maestro/flows/{social,progression,onboarding}/` exist for cut features and need to come out.
- TypeScript strict mode is on. `npm run typecheck` is green at the start of Phase 1 — every task must keep it green.
- No jest unit tests exist. Verification per task is: typecheck + relevant Maestro flow + manual visual check on dev server.
- Commits per task. Work on `main` directly (or a long-lived `phase-1` branch — your call). Do NOT amend commits.

## File structure for Phase 1

| Path | What it does |
|---|---|
| `src/app/daily.tsx` | **(new, replaces tournament.tsx)** Daily run screen — visual restyle only this phase |
| `src/app/leaderboard.tsx` | Restyle |
| `src/app/replays.tsx` | Restyle |
| `src/app/achievements.tsx` | Restyle + slim catalog from 20+ → 6 |
| `src/app/settings.tsx` | Restyle |
| `src/app/share.tsx` | Restyle (real share grid is Phase 2) |
| `src/app/shop.tsx` | Restyle (cosmetic-only catalog cleanup is Phase 3) |
| `src/app/_layout.tsx` | Drop cut routes; add new `daily` route |
| `app.json` | Rename `Block Merge Arena` → `Block Merge` |
| `src/lib/analytics/events.ts` | **(new)** Analytics wrapper with strongly-typed event names |
| `docs/decisions/0001-analytics-platform.md` | **(new)** ADR — PostHog vs Firebase Analytics |
| `docs/decisions/0002-firebase-production-setup.md` | **(new)** ADR — production Firebase configuration steps |
| `.env.example` | **(new)** Document required env vars with placeholders |
| `CLAUDE.md` | Update positioning + scope to match the launch design |
| **DELETED:** `src/app/{squads,battlepass,ranks,friends,tutorials}.tsx` | + supporting types/utils/catalogs |
| **DELETED:** `.maestro/flows/social/{squads,friends}.yaml`, `.maestro/flows/progression/{ranks,battlepass}.yaml` | |

---

## Task 1: Audit & delete cut feature screens

Remove the screens for features cut in v1. Each deletion has to be matched by a routing update (Task 2) so the app still builds. We do screen files first, then the supporting types/utils.

**Files:**
- Delete: `src/app/squads.tsx`, `src/app/battlepass.tsx`, `src/app/ranks.tsx`, `src/app/friends.tsx`, `src/app/tutorials.tsx`

- [ ] **Step 1: Verify no other source file imports these screens**

```bash
git grep -E "from '@/app/(squads|battlepass|ranks|friends|tutorials)'" src/
```
Expected: no matches. Screen files are referenced only by `expo-router` via filesystem.

- [ ] **Step 2: Delete the five screen files**

```bash
rm src/app/squads.tsx src/app/battlepass.tsx src/app/ranks.tsx src/app/friends.tsx src/app/tutorials.tsx
```

- [ ] **Step 3: Run typecheck — expect failures from `<Link href="/squads">` etc. in Home**

```bash
npm run typecheck
```
Expected: errors about typed routes referencing deleted screens. Note the locations — Task 2 fixes them.

- [ ] **Step 4: Commit (broken state intentionally — Task 2 closes the gap)**

```bash
git add -A src/app/
git commit -m "chore: delete cut v1 screens (squads/battlepass/ranks/friends/tutorials)"
```

---

## Task 2: Remove typed-route references to cut screens

Restore typecheck. Cut the `Link` references in `src/app/index.tsx` (Home) that point to deleted screens, and remove the corresponding nav tiles.

**Files:**
- Modify: `src/app/index.tsx` (remove NavTile entries for squads, ranks, battlepass, friends, tutorials)
- Modify: `src/app/_layout.tsx` (no changes needed — it only declares index/game; expo-router auto-discovers the rest)

- [ ] **Step 1: Find every `Link href="/X"` for cut screens**

```bash
git grep -n -E "href=\"/(squads|battlepass|ranks|friends|tutorials)\"" src/
```
Expected: matches in `src/app/index.tsx`.

- [ ] **Step 2: Remove the corresponding `NavTile` JSX blocks from `src/app/index.tsx`**

Open the file and delete the `NavTile` entries for those routes. The remaining nav grid should be:

```tsx
<View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
  <NavTile href="/leaderboard" testID="leaderboard-button" label="Leaderboard" hint="Today's standings" accent={colors.cobalt} />
  <NavTile href="/replays" testID="replays-button" label="Replays" hint="Watch ghosts" accent={colors.plum} />
</View>
<View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
  <NavTile href="/shop" testID="shop-button" label="Shop" hint="Themes" accent={colors.mustard} />
  <NavTile href="/achievements" testID="achievements-button" label="Achievements" hint="6 badges" accent={colors.forest} />
</View>
<View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
  <NavTile href="/share" testID="share-button" label="Share" hint="Your grid" accent={colors.rose} />
  <NavTile href="/settings" testID="settings-nav" label="Settings" hint="Audio · theme" accent={colors.teal} />
</View>
```

Also remove the `friends-button` `Pressable` near the top quick-play row — replace it with a stub linking to the daily archive (which Phase 2 builds, so for now: link to `/leaderboard`):

```tsx
<Link href="/leaderboard" asChild>
  <Pressable testID="leaderboard-quick-button" style={{ flex: 1 }}>
    <GlassCard style={{ padding: 14 }}>
      <Text style={{ fontSize: 9, fontWeight: fontWeight.bold, color: colors.cobalt, letterSpacing: 1.6 }}>
        TODAY
      </Text>
      <Text style={{ fontSize: 16, fontWeight: fontWeight.heavy, color: colors.ink, marginTop: 4 }}>
        Leaderboard
      </Text>
      <Text style={{ fontSize: 22, fontWeight: fontWeight.black, color: colors.ink, marginTop: 6 }}>
        Top 100
      </Text>
      <Text style={{ fontSize: 9, fontWeight: fontWeight.bold, color: colors.inkSoft, marginTop: 2, letterSpacing: 1.6 }}>
        VIEW STANDINGS
      </Text>
    </GlassCard>
  </Pressable>
</Link>
```

- [ ] **Step 3: Run typecheck — expect green**

```bash
npm run typecheck
```
Expected: passes cleanly.

- [ ] **Step 4: Run dev server and tap-test Home, all surviving routes load**

```bash
npm start
```
Then on a device: open every nav tile, confirm no crashes. There should be no leftover dead links.

- [ ] **Step 5: Commit**

```bash
git add src/app/index.tsx
git commit -m "chore: remove home nav links to cut screens; add leaderboard quick tile"
```

---

## Task 3: Delete supporting code for cut features

Now remove the types, utils, catalogs, and components that exclusively served cut screens. **Do not delete anything that's also used by surviving screens** — verify with grep first.

**Files:**
- Delete: `src/lib/types/{squad,battlepass,ranks,friends}.ts`
- Delete: `src/lib/utils/{squad,battlepass,ranks,friends}.ts`
- Delete: `src/lib/battlepass/catalog.ts`
- Delete: `src/lib/tutorial/catalog.ts`
- Delete: `src/components/TutorialOverlay.tsx`
- Delete: `src/lib/utils/tutorial.ts` **only if** unused after the welcome.tsx change below
- Modify: `src/app/welcome.tsx` (remove tutorial overlay; replace with silent-demo placeholder note for Phase 2)

- [ ] **Step 1: Grep each candidate file for external usage**

```bash
for f in squad battlepass ranks friends; do
  echo "--- $f ---"
  git grep -l "from '@/lib/types/$f'" src/ || echo "(no type usages)"
  git grep -l "from '@/lib/utils/$f'" src/ || echo "(no util usages)"
done
```
Expected: only the about-to-be-deleted screens reference them. If anything else does (e.g. the leaderboard imports a friends type), STOP — that screen needs the import removed first, then resume.

- [ ] **Step 2: Strip the tutorial machinery from `src/app/welcome.tsx`**

The redesigned welcome.tsx still references `TutorialOverlay`, `WELCOME_TUTORIAL`, `completeStep`, `skipTutorial`, and `hasCompletedWelcome`. The silent-demo onboarding from Phase 2 will replace this entirely; for Phase 1 we collapse it to a simple "tap to continue" flow that calls `markWelcomeComplete` and routes home.

Replace the imports block with:

```tsx
import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, fontWeight } from '@/lib/design/tokens';
import { TactileCell } from '@/components/design/TactileCell';
import { TactileButton } from '@/components/design/TactileButton';
import { Pill } from '@/components/design/Pill';
import { markWelcomeComplete } from '@/lib/utils/tutorial';
```

Replace the `handleNext` / `handleSkip` / `handleFinish` / tutorial-step logic with a single completion handler:

```tsx
const handleStart = async (): Promise<void> => {
  await markWelcomeComplete();
  router.replace('/');
};
```

Remove the `<TutorialOverlay />` JSX block entirely. Keep the rewards modal but trigger it inline when the player taps "Start playing" — or, simpler for Phase 1, just route straight home and let Phase 2's silent-demo work design the welcome reward properly.

The minimal Phase 1 welcome:

```tsx
<View style={{ marginTop: 'auto', gap: 10 }}>
  <TactileButton variant="primary" onPress={handleStart}>
    Start playing
  </TactileButton>
  <Pressable onPress={handleStart} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, alignItems: 'center', paddingVertical: 12 })}>
    <Text style={{ color: colors.inkSoft, fontWeight: fontWeight.semibold }}>I have an account</Text>
  </Pressable>
</View>
```

(Both buttons currently route home. Phase 3 wires up "I have an account" to RevenueCat restore.)

- [ ] **Step 3: Replace `src/lib/utils/tutorial.ts` with the minimal welcome-only API**

First confirm no other code imports from this module beyond the welcome flow:

```bash
git grep "from '@/lib/utils/tutorial'" src/
```

Surviving callers should only be `src/app/welcome.tsx` and `src/app/index.tsx` (for `hasCompletedWelcome`). If any other file imports `completeStep`, `skipTutorial`, `WELCOME_TUTORIAL`, or other multi-step tutorial machinery, remove those imports first.

Then replace the entire file contents:

```ts
// src/lib/utils/tutorial.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'block-merge:welcome-complete';

export async function hasCompletedWelcome(): Promise<boolean> {
  return (await AsyncStorage.getItem(KEY)) === '1';
}

export async function markWelcomeComplete(): Promise<void> {
  await AsyncStorage.setItem(KEY, '1');
}
```

- [ ] **Step 4: Delete the cut files**

```bash
rm src/lib/types/squad.ts src/lib/types/battlepass.ts src/lib/types/ranks.ts src/lib/types/friends.ts
rm src/lib/utils/squad.ts src/lib/utils/battlepass.ts src/lib/utils/ranks.ts src/lib/utils/friends.ts
rm -rf src/lib/battlepass/ src/lib/tutorial/
rm src/components/TutorialOverlay.tsx
```

- [ ] **Step 5: Run typecheck and fix any straggler imports**

```bash
npm run typecheck
```
Expected: passes. If something fails (e.g. an achievement util references squad XP), grep the offending symbol and clean up.

- [ ] **Step 6: Run the welcome maestro flow on a sim/device**

```bash
npm run e2e -- .maestro/flows/onboarding/welcome.yaml
```
Expected: it may fail because the flow assumes the multi-step tutorial. If it does, open `.maestro/flows/onboarding/welcome.yaml`, simplify it to the new flow:

```yaml
appId: com.blockmergearena.app
---
- launchApp
- assertVisible:
    id: "welcome-screen"
- tapOn:
    id: "lets-play-button"  # rename from "start playing" — keep stable testID
- assertVisible:
    id: "home-screen"
```

You'll need to add `testID="lets-play-button"` back to the new welcome's primary `TactileButton`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: delete cut feature support code; collapse welcome to phase-1 stub"
```

---

## Task 4: Update CLAUDE.md to reflect the new positioning and scope

Future agents reading CLAUDE.md will get the wrong instructions if it still says "Block Merge Arena, Gen Z 10-15, 49 features." Bring it in sync with the design spec.

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Replace the project header**

Edit `CLAUDE.md`. Change the first three lines:

```markdown
# Block Merge — Project Guide

> **Project:** Block Merge — Daily block puzzle with merge cascade for adult crossover puzzlers (Wordle/NYT Games audience)
> **Status:** Phase 1 of launch plan in progress — see `docs/superpowers/plans/2026-05-05-phase-1-foundation.md`
```

- [ ] **Step 2: Replace the screens table**

Replace the `## 📱 App Screens` section with the eight v1 screens:

```markdown
## 📱 App Screens (v1)

| Screen | Route | Description |
|--------|-------|-------------|
| Home | `/` | Daily hero card + nav |
| Welcome | `/welcome` | First-run onboarding |
| Daily | `/daily` | One run per day, no timer |
| Endless | `/game` | Free practice, unlimited |
| Leaderboard | `/leaderboard` | Daily standings |
| Replays | `/replays` | 6-char ghost replays |
| Achievements | `/achievements` | Six tasteful badges |
| Settings | `/settings` | Audio, theme, account |
| Share | `/share` | Annotated emoji grid |
| Shop | `/shop` | Cosmetic themes only |

**Cut from v1:** Squads, Battle Pass, Ranks Ladder, Friends-by-code, Tutorials-as-screen, 5-min Sprint mode.
```

- [ ] **Step 3: Remove the "Feature Summary" section entirely**

That section claims "100% complete" and lists cut features. Delete the whole `## 🎉 Feature Summary` block.

- [ ] **Step 4: Add a pointer to the spec near the top**

Insert after the project header:

```markdown
## Source of truth

- **Launch design:** `docs/superpowers/specs/2026-05-05-block-merge-launch-design.md`
- **Phase 1 plan:** `docs/superpowers/plans/2026-05-05-phase-1-foundation.md`
- **Design tokens:** `src/lib/design/tokens.ts`
- **Tactile primitives:** `src/components/design/`
```

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: rewrite CLAUDE.md for v1 scope and positioning"
```

---

## Task 5: Rename Block Merge Arena → Block Merge

Rebrand. Touches `app.json`, the splash plugin permissions strings, and any user-facing copy. Bundle ID stays `com.blockmergearena.app` (changing it breaks installed app continuity for testers and is a Phase 4 concern at most).

**Files:**
- Modify: `app.json`, `package.json`, splash assets references, `src/app/welcome.tsx`, anywhere `"Block Merge Arena"` appears in user-visible copy

- [ ] **Step 1: Update `app.json`**

```json
{
  "expo": {
    "name": "Block Merge",
    "slug": "block-merge",
    "scheme": "blockmerge",
    ...
    "plugins": [
      "expo-router",
      [
        "expo-image-picker",
        {
          "photosPermission": "Allow Block Merge to access your photos to customize your profile.",
          "cameraPermission": "Allow Block Merge to access your camera to take profile pictures."
        }
      ],
      ...
    ]
  }
}
```

Leave `bundleIdentifier` and `package` as `com.blockmergearena.app`. Leave `eas.projectId` unchanged.

- [ ] **Step 2: Update `package.json`**

```json
{
  "name": "block-merge",
  ...
  "description": "A daily block puzzle where leftover pieces fuse into multipliers."
}
```

- [ ] **Step 3: Grep for stragglers and replace**

```bash
git grep -l "Block Merge Arena" -- ':!docs/' ':!CLAUDE.md' ':!.design-source'
```

Each file in the list (excluding the design spec which is historical record): replace `Block Merge Arena` → `Block Merge`. Likely candidates: README, source comments, e2e flow names.

- [ ] **Step 4: Run typecheck**

```bash
npm run typecheck
```
Expected: passes.

- [ ] **Step 5: Run dev server, verify the title bar / splash text reflects the rename**

```bash
npm start
```
Open in simulator. The OS app name (sim home screen) won't update without a rebuild — that's fine; we're checking copy inside the app.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: rename Block Merge Arena → Block Merge"
```

---

## Task 6: Document Firebase production setup

Firebase env vars are placeholders. We can't populate them in code — the user has to create a Firebase project, enable services, and produce the keys. What we *can* do is document the steps and the env template so the user has a checklist.

**Files:**
- Create: `.env.example`
- Create: `docs/decisions/0002-firebase-production-setup.md`

- [ ] **Step 1: Create `.env.example`**

```bash
# Block Merge — environment variables
# Copy this file to `.env.local` and fill in values from your Firebase project.
# Required for cloud leaderboard, replays, and subscription state sync.

EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=

# Analytics — set per Task 7 decision
# EXPO_PUBLIC_POSTHOG_KEY=
# EXPO_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

- [ ] **Step 2: Create the ADR**

`docs/decisions/0002-firebase-production-setup.md`:

```markdown
# ADR 0002: Firebase Production Setup

**Status:** Active
**Date:** 2026-05-05

## Context

`src/lib/firebase/config.ts` reads from `EXPO_PUBLIC_FIREBASE_*` env vars. These are unset, which causes the app to fall back to local-only mode (auth state in AsyncStorage, no global leaderboard, no cloud replay sync). This is the only hard launch blocker.

## Required steps (manual)

1. Create a new Firebase project at https://console.firebase.google.com.
2. Enable **Authentication** → **Anonymous sign-in**.
3. Create a **Firestore database** in production mode, region `us-central` (default).
4. Add a **Web app** to the project (the keys are the same on iOS/Android via the Expo config).
5. Copy the config values into `.env.local`:
   - `apiKey` → `EXPO_PUBLIC_FIREBASE_API_KEY`
   - `authDomain` → `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `projectId` → `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
   - `storageBucket` → `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `messagingSenderId` → `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `appId` → `EXPO_PUBLIC_FIREBASE_APP_ID`
6. Set Firestore security rules. Minimum viable for v1:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /scores/{scoreId} {
         allow read: if true;
         allow create: if request.auth != null
           && request.resource.data.userId == request.auth.uid
           && request.resource.data.score is int
           && request.resource.data.score >= 0
           && request.resource.data.score < 1000000;
       }
       match /users/{userId} {
         allow read: if true;
         allow write: if request.auth != null && request.auth.uid == userId;
       }
       match /replays/{replayId} {
         allow read: if true;
         allow create: if request.auth != null
           && request.resource.data.userId == request.auth.uid;
       }
     }
   }
   ```

7. For Android builds, download `google-services.json` from project settings → place at repo root (already gitignored — verify with `cat .gitignore | grep google-services`).
8. For iOS builds, download `GoogleService-Info.plist` → place at repo root.

## Validation

Run the app on a real device (not simulator). Watch the Metro logs for `✅ Firebase initialized successfully`. Then open Firestore in the console → confirm a document appears in `users` after the first launch (anonymous auth creates a profile).

## Out of scope

- App Check (Phase 4)
- Cloud Functions for daily-puzzle generation (Phase 2 if needed; Phase 1 keeps deterministic seeding client-side)
- Multi-region Firestore (Phase 4 if international launch needs it)
```

- [ ] **Step 3: Commit**

```bash
git add .env.example docs/decisions/
git commit -m "docs: firebase production setup ADR + env template"
```

---

## Task 7: Pick analytics platform (decision doc)

Decide PostHog vs Firebase Analytics. This is a one-time decision recorded as an ADR. Default recommendation: **PostHog** (better funnel analysis, cleaner SDK). Firebase Analytics is the cheaper alternative if MAU projections are high.

**Files:**
- Create: `docs/decisions/0001-analytics-platform.md`

- [ ] **Step 1: Write the ADR with the decision**

`docs/decisions/0001-analytics-platform.md`:

```markdown
# ADR 0001: Analytics Platform

**Status:** Active
**Date:** 2026-05-05
**Decision:** PostHog (cloud, US region).

## Context

We need to measure the success metrics from the launch design:
- D7 retention ≥ 35%
- Share rate ≥ 8%
- Subscription conversion ≥ 2% within 60d

Two viable options:

| | PostHog | Firebase Analytics |
|---|---|---|
| Funnel + cohort analysis | First-class | Limited; requires BigQuery export |
| Free tier | 1M events/mo | Unlimited |
| Self-host option | Yes | No |
| Already in stack | No | Yes (firebase v12 in deps) |
| SDK quality (RN) | Good — `posthog-react-native` | Adequate — `expo-firebase-analytics` deprecated for SDK 53 |

## Decision

PostHog. Funnel quality matters more than cost at our expected scale (≤ 50k MAU in year one ≈ 2M events/mo at $0.31/1k = ~$300/yr — acceptable). Firebase Analytics' deprecated Expo bridge is a real problem for SDK 53.

## Consequences

- Add `posthog-react-native` to dependencies.
- New env vars: `EXPO_PUBLIC_POSTHOG_KEY`, `EXPO_PUBLIC_POSTHOG_HOST`.
- All event taxonomy lives in `src/lib/analytics/events.ts` — no inline `posthog.capture()` calls anywhere else.

## Revisit if

MAU passes 200k (cost crosses $1k/mo) or PostHog event-quality issues emerge. Migration target: Firebase Analytics + BigQuery.
```

- [ ] **Step 2: Commit**

```bash
git add docs/decisions/0001-analytics-platform.md
git commit -m "docs: ADR 0001 — pick PostHog for analytics"
```

---

## Task 8: Install + initialize PostHog

Wire the SDK so events can fire. The wrapper module is the only place that talks to PostHog directly.

**Files:**
- Create: `src/lib/analytics/events.ts`
- Modify: `src/app/_layout.tsx` (init at root)
- Modify: `package.json` (add dep)

- [ ] **Step 1: Install dependency**

```bash
npm install --legacy-peer-deps posthog-react-native
```
Expected: installs cleanly. PostHog has no peer-dep conflicts with our stack.

- [ ] **Step 2: Create the analytics wrapper**

`src/lib/analytics/events.ts`:

```ts
import PostHog from 'posthog-react-native';

let client: PostHog | null = null;

export async function initAnalytics(): Promise<void> {
  const apiKey = process.env.EXPO_PUBLIC_POSTHOG_KEY;
  const host = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';
  if (!apiKey) {
    console.warn('[analytics] EXPO_PUBLIC_POSTHOG_KEY not set — analytics disabled');
    return;
  }
  client = new PostHog(apiKey, { host, captureAppLifecycleEvents: true });
  await client.ready;
}

// Strongly-typed event taxonomy. New events go here, never inline in screens.
type EventMap = {
  app_opened: { source?: 'push' | 'cold_launch' | 'deeplink' };
  daily_started: { puzzle_id: string };
  daily_completed: { puzzle_id: string; score: number; max_multiplier: number };
  endless_started: Record<string, never>;
  endless_completed: { score: number; max_multiplier: number };
  share_grid_tapped: { source: 'daily' | 'endless'; score: number };
  paywall_viewed: { source: 'archive' | 'gif_export' | 'theme_apply' };
  paywall_dismissed: { source: 'archive' | 'gif_export' | 'theme_apply' };
  subscription_purchased: { tier: 'monthly' | 'annual'; trial: boolean };
};

export function track<K extends keyof EventMap>(event: K, props: EventMap[K]): void {
  if (!client) return;
  client.capture(event, props as Record<string, unknown>);
}

export function identify(userId: string, traits?: Record<string, unknown>): void {
  if (!client) return;
  client.identify(userId, traits);
}
```

- [ ] **Step 3: Initialize at app root**

Modify `src/app/_layout.tsx`:

```tsx
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initAnalytics, track } from '@/lib/analytics/events';
// eslint-disable-next-line import/no-unresolved
import '../../global.css';

export default function RootLayout() {
  useEffect(() => {
    initAnalytics().then(() => track('app_opened', { source: 'cold_launch' }));
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
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
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

- [ ] **Step 4: Run typecheck**

```bash
npm run typecheck
```
Expected: passes.

- [ ] **Step 5: Run the dev server with the env var unset; confirm graceful no-op**

```bash
npm start
```
Open the app. Check Metro logs for `[analytics] EXPO_PUBLIC_POSTHOG_KEY not set`. Confirm app loads normally.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(analytics): add PostHog wrapper with typed event taxonomy"
```

---

## Task 9: Wire `daily_started` and `endless_started` events

Drop two `track()` calls into the two run-entry surfaces. This is the only event wiring Phase 1 owns; the rest land alongside the features that produce them in Phases 2/3.

**Files:**
- Modify: `src/app/game.tsx` (endless run start)
- Modify: `src/app/daily.tsx` (Task 10 creates this; revisit after T10 to add the event)

- [ ] **Step 1: Edit `src/app/game.tsx` — add `track('endless_started', {})` to `startNewGame`**

```tsx
import { track } from '@/lib/analytics/events';

// inside startNewGame():
const startNewGame = (): void => {
  setBoard(createEmptyBoard());
  setPieces(generatePieces(3));
  setScore(0);
  setMultiplier(1);
  setGems([]);
  setGameOver(false);
  setSelectedPieceIndex(undefined);
  setPowerUps(getStartingPowerUps());
  setActivePowerUp(null);
  setRecentPoints(0);
  setComboCount(0);
  track('endless_started', {});
};
```

- [ ] **Step 2: Run typecheck**

```bash
npm run typecheck
```

- [ ] **Step 3: Defer `daily_started` to Task 10 (the daily screen rename creates it)**

Note in your task tracker: after T10 lands, return here and add `track('daily_started', { puzzle_id: getTodayDateString() })` at the top of the daily run handler.

- [ ] **Step 4: Commit**

```bash
git add src/app/game.tsx
git commit -m "feat(analytics): track endless run starts"
```

---

## Task 10: Daily screen — rename `tournament.tsx` → `daily.tsx` and restyle

Rename + visual redesign. **The 5-minute timer logic stays intact** — Phase 2 owns its removal. We're just renaming the file, restyling the chrome, and dropping the `daily_started` event.

**Files:**
- Create: `src/app/daily.tsx` (copy from `src/app/tournament.tsx`, then restyle)
- Delete: `src/app/tournament.tsx`
- Modify: `src/app/index.tsx` (point hero card to `/daily` instead of `/tournament`)
- Modify: `.maestro/flows/gameplay/tournament.yaml` → `.maestro/flows/gameplay/daily.yaml` (rename + update `tapOn` ids)

- [ ] **Step 1: Copy & rename**

```bash
git mv src/app/tournament.tsx src/app/daily.tsx
```

- [ ] **Step 2: Restyle `src/app/daily.tsx` against the tactile-console pattern**

The pattern to mirror: `src/app/game.tsx` (which already uses the cream paper background, ambient blob, top HUD, glass cards). Apply the same shell:

```tsx
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontWeight } from '@/lib/design/tokens';
import { GlassCard, DeepCard } from '@/components/design/GlassCard';
import { TactileButton } from '@/components/design/TactileButton';
import { Pill } from '@/components/design/Pill';
import { track } from '@/lib/analytics/events';
import { getTodayDateString } from '@/lib/utils/tournament';
// ... existing tournament gameplay imports
```

The screen structure should be:

1. `SafeAreaView` with `backgroundColor: colors.paper`.
2. Two ambient blob `View`s (ember top-right, cobalt bottom-left) — copy from `welcome.tsx`.
3. **Hero header**: `DeepCard` with the puzzle date, time-remaining (existing 5-min countdown code), the "ENTER" CTA. Same visual language as the home tournament hero.
4. **Body**: pre-game state shows the rules ("One run · No timer · Same pieces"), the active state delegates to the existing tournament gameplay components. Phase 2 will rip out the timer; for now leave it visible but already inside the new chrome.
5. CTA button: `<TactileButton variant="primary" testID="start-tournament-button" onPress={startTournament}>Begin run</TactileButton>`.

Keep all existing testIDs (`tournament-screen`, `start-tournament-button`, etc.) — Maestro flows depend on them. Phase 2 can rename them when it migrates the gameplay logic.

- [ ] **Step 3: Add the `daily_started` event**

In the screen's `startTournament` (or equivalent run-start handler):

```tsx
import { getTodayDateString } from '@/lib/utils/tournament';

const startTournament = (): void => {
  track('daily_started', { puzzle_id: getTodayDateString() });
  // ... existing logic
};
```

- [ ] **Step 4: Update `src/app/index.tsx` hero card link**

Change the tournament hero `<Link href="/tournament" asChild>` to `<Link href="/daily" asChild>`. Update the `testID="tournament-button"` to keep working with the existing Maestro flow.

- [ ] **Step 5: Add the new route to `_layout.tsx`** (already done in Task 8, double-check)

```tsx
<Stack.Screen name="daily" />
```

- [ ] **Step 6: Rename the Maestro flow**

```bash
git mv .maestro/flows/gameplay/tournament.yaml .maestro/flows/gameplay/daily.yaml
```

Edit `.maestro/flows/gameplay/daily.yaml` if any `tapOn: id` strings reference deleted screens. The `tournament-button` on Home stays the same — it just routes to `/daily` now.

- [ ] **Step 7: Run typecheck**

```bash
npm run typecheck
```
Expected: passes.

- [ ] **Step 8: Run the daily flow**

```bash
npm run e2e -- .maestro/flows/gameplay/daily.yaml
```
Expected: passes.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(daily): rename tournament → daily and apply tactile redesign"
```

---

## Task 11: Leaderboard restyle

Cream paper background, glass cards per row, ember accents on the player's own row. Strip any "rank/season" copy that was carrying ranked-ladder language.

**Files:**
- Modify: `src/app/leaderboard.tsx`

- [ ] **Step 1: Read the current leaderboard implementation top-to-bottom**

```bash
cat src/app/leaderboard.tsx | head -200
```

Note the existing tabs (`all/endless/tournament/recent`), the data fetching, and the row component shape.

- [ ] **Step 2: Rewrite the chrome to match the tactile-console shell**

Replace `bg-black` and dark wrappers. Apply:
- `SafeAreaView` with `backgroundColor: colors.paper`
- Ambient ember blob top-right
- Header: `<Pill variant="ember">DAILY · TODAY</Pill>` + display-lg title
- Tab strip: a small inline component within `src/app/leaderboard.tsx` — no need for a shared component:

  ```tsx
  function TabStrip({ active, onChange, tabs }: {
    active: string;
    onChange: (v: string) => void;
    tabs: { id: string; label: string }[];
  }) {
    return (
      <View style={{ flexDirection: 'row', gap: 4, padding: 4, borderRadius: 999, backgroundColor: 'rgba(22,20,15,0.06)', alignSelf: 'flex-start' }}>
        {tabs.map((t) => {
          const isActive = active === t.id;
          return (
            <Pressable
              key={t.id}
              onPress={() => onChange(t.id)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: isActive ? colors.ink : 'transparent',
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: fontWeight.heavy, letterSpacing: 1.2, color: isActive ? colors.paper : colors.inkSoft }}>
                {t.label.toUpperCase()}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  }
  ```

- Each leaderboard row: `<GlassCard style={{ paddingVertical: 12, paddingHorizontal: 14, marginBottom: 8 }}>` with rank | avatar/name | score laid out in a single flex row
- Player's own row: ember-bordered (`borderColor: colors.ember, borderWidth: 2`), score text colored `colors.ember`

Keep all data fetching and tab state untouched — visual only.

- [ ] **Step 3: Drop ranked-ladder copy**

Find references to "Bronze", "Gold", "Master", "Diamond", "rank points", "season" in this file and remove them or replace with neutral language ("position", "best"). The ranks system is cut; the leaderboard is just score order.

- [ ] **Step 4: Typecheck + manual visual on dev server**

```bash
npm run typecheck && npm start
```

Tap from Home → Leaderboard. Confirm: cream background, glass row cards, ember highlight on your row.

- [ ] **Step 5: Run the maestro flow**

```bash
npm run e2e -- .maestro/flows/navigation/  # leaderboard nav check is in here
```

- [ ] **Step 6: Commit**

```bash
git add src/app/leaderboard.tsx
git commit -m "feat(leaderboard): tactile-console restyle; drop ranked-ladder language"
```

---

## Task 12: Replays restyle

Same shell pattern, but the row content is a 6-char code + score + small board thumbnail. Phase 2 owns the GIF-export tap; Phase 1 just visually styles the existing replay list and "watch" affordance.

**Files:**
- Modify: `src/app/replays.tsx`

- [ ] **Step 1: Read the current replays.tsx structure**

- [ ] **Step 2: Replace chrome (paper background, ambient blob, glass row cards)**

Each replay row should render:
```
[🎟 K7P2QM]   Score 24,180   ×7   [Watch ▶]
```
- Code in a `<Pill variant="ink">` with monospaced text
- Score using `colors.ink` heavy
- Multiplier in `colors.ember`
- "Watch" button: `<TactileButton variant="cobalt" fullWidth={false}>Watch</TactileButton>`

Add an empty state for when there are no replays yet:

```tsx
<View style={{ alignItems: 'center', padding: 32 }}>
  <Text style={{ fontSize: 18, fontWeight: fontWeight.heavy, color: colors.ink }}>No replays yet</Text>
  <Text style={{ fontSize: 13, color: colors.inkSoft, marginTop: 6, textAlign: 'center' }}>
    Finish a daily run and we'll save the replay automatically. Share the 6-character code with anyone.
  </Text>
</View>
```

- [ ] **Step 3: Typecheck + visual check**

```bash
npm run typecheck && npm start
```

- [ ] **Step 4: Maestro check**

```bash
npm run e2e -- .maestro/flows/economy/replays.yaml
```

- [ ] **Step 5: Commit**

```bash
git add src/app/replays.tsx
git commit -m "feat(replays): tactile-console restyle"
```

---

## Task 13: Achievements — slim to six + restyle

Two changes in one task: trim the achievement catalog from 20+ to six tasteful badges, then restyle.

**Files:**
- Modify: `src/lib/utils/achievements.ts` (or wherever the catalog lives — confirm with grep)
- Modify: `src/app/achievements.tsx`

- [ ] **Step 1: Find the catalog**

```bash
git grep -l "ACHIEVEMENTS\|achievement_catalog\|export const.*[Aa]chievement" src/lib/
```

The audit said the catalog is in `src/lib/utils/achievements.ts`. Confirm.

- [ ] **Step 2: Replace the catalog with six entries**

```ts
// src/lib/utils/achievements.ts (catalog section only — keep persistence helpers)
export const ACHIEVEMENTS = [
  { id: 'first-merge',     name: 'First Merge',     hint: 'Merge two gems for the first time',         reward: 0 },
  { id: 'five-cluster',    name: 'Five-Cluster',    hint: 'Land a ×5 multiplier',                       reward: 0 },
  { id: 'first-daily',     name: 'Daily Debut',     hint: 'Complete your first daily run',              reward: 0 },
  { id: 'streak-7',        name: 'A Week Steady',   hint: 'Play the daily seven days in a row',         reward: 0 },
  { id: 'sub-three',       name: 'Quick Hand',      hint: 'Finish a run in under three minutes',        reward: 0 },
  { id: 'centurion',       name: 'Centurion',       hint: 'Play one hundred dailies',                   reward: 0 },
] as const;
```

(Reward currency stays at 0 — Phase 3 reconsiders whether achievements unlock anything monetary. For v1 they're status, not prizes.)

- [ ] **Step 3: Verify nothing references deleted achievement IDs**

```bash
git grep -F "achievement.id" src/ | head
git grep -E "id: '(?!first-merge|five-cluster|first-daily|streak-7|sub-three|centurion)" src/lib/utils/achievements.ts
```
Expected: only the six new IDs in the catalog. Anything else likely lives in old grant-on-event hooks — clean those up.

- [ ] **Step 4: Restyle `src/app/achievements.tsx`**

Same shell. Each badge as a `GlassCard` with:
- Icon (use `lucide-react-native` minimal stroke icons, not emoji — keep tasteful)
- Name (display-sm)
- Hint (body-sm, ink-soft)
- Locked state: greyscale + 0.4 opacity + small lock icon
- Unlocked state: ember accent stripe at top of card

- [ ] **Step 5: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 6: Maestro**

```bash
npm run e2e -- .maestro/flows/progression/achievements.yaml
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(achievements): slim catalog to six tasteful badges; tactile restyle"
```

---

## Task 14: Settings restyle

Standard settings list. Group into sections: AUDIO, DISPLAY, ACCOUNT, ABOUT. Each row is a label + control (switch / chevron / value text).

**Files:**
- Modify: `src/app/settings.tsx`

- [ ] **Step 1: Read current settings**

- [ ] **Step 2: Apply shell + section grouping**

Structure:

```tsx
<SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }}>
  <ScrollView contentContainerStyle={{ padding: 14 }}>
    <SettingsGroup label="AUDIO">
      <SettingsRow label="Sound effects" right={<Switch ... />} />
      <SettingsRow label="Haptics" right={<Switch ... />} />
    </SettingsGroup>
    <SettingsGroup label="DISPLAY">
      <SettingsRow label="Theme" right={<Text>Warm cream ›</Text>} onPress={...} />
      <SettingsRow label="Reduced motion" right={<Switch ... />} />
    </SettingsGroup>
    <SettingsGroup label="ACCOUNT">
      <SettingsRow label="Display name" right={<Text>{name} ›</Text>} onPress={...} />
      <SettingsRow label="Restore purchases" right={<Text>›</Text>} onPress={...} />
      <SettingsRow label="Sign out" right={<Text>›</Text>} onPress={...} variant="destructive" />
    </SettingsGroup>
    <SettingsGroup label="ABOUT">
      <SettingsRow label="Version" right={<Text>{version}</Text>} />
      <SettingsRow label="Privacy" right={<Text>›</Text>} onPress={...} />
      <SettingsRow label="Terms" right={<Text>›</Text>} onPress={...} />
    </SettingsGroup>
  </ScrollView>
</SafeAreaView>
```

Both helpers live inline at the top of `src/app/settings.tsx` — no new shared module needed:

```tsx
function SettingsGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={{ fontSize: 10, fontWeight: fontWeight.bold, letterSpacing: 1.6, color: colors.inkSoft, marginLeft: 14, marginBottom: 8 }}>
        {label}
      </Text>
      <GlassCard style={{ padding: 0, overflow: 'hidden' }}>{children}</GlassCard>
    </View>
  );
}

function SettingsRow({
  label,
  right,
  onPress,
  destructive,
  isLast,
}: {
  label: string;
  right?: React.ReactNode;
  onPress?: () => void;
  destructive?: boolean;
  isLast?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: 'rgba(22,20,15,0.06)',
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Text style={{ fontSize: 14, fontWeight: fontWeight.semibold, color: destructive ? colors.emberDeep : colors.ink }}>
        {label}
      </Text>
      <View>{right}</View>
    </Pressable>
  );
}
```

The "Restore purchases" and "Sign out" rows are stubs in Phase 1 — they call console.warn for now. Phase 3 wires restore to RevenueCat; sign-out can be a stub that resets AsyncStorage and routes to welcome.

- [ ] **Step 3: Typecheck + manual visual**

- [ ] **Step 4: Maestro**

```bash
npm run e2e -- .maestro/flows/settings/
```

- [ ] **Step 5: Commit**

```bash
git add src/app/settings.tsx
git commit -m "feat(settings): tactile-console restyle with grouped sections"
```

---

## Task 15: Share + Shop restyle

Two short tasks combined since both are visual-only (Share's real grid is Phase 2; Shop's real catalog is Phase 3).

**Files:**
- Modify: `src/app/share.tsx`, `src/app/shop.tsx`

- [ ] **Step 1: Restyle `src/app/share.tsx`**

Skeleton:

```tsx
<SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }}>
  <View style={{ padding: 18 }}>
    <Pill variant="ember">SHARE</Pill>
    <Text style={{ fontSize: 32, fontWeight: fontWeight.black, color: colors.ink, marginTop: 12, letterSpacing: -1 }}>
      Your daily grid
    </Text>
    <Text style={{ color: colors.inkSoft, marginTop: 6 }}>
      Phase 1 placeholder. The annotated emoji grid generator lands in Phase 2.
    </Text>
  </View>
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
    <GlassCard style={{ padding: 20, width: '100%', maxWidth: 360 }}>
      <Text style={{ fontFamily: 'Courier', fontSize: 12, color: colors.ink, lineHeight: 16 }}>
        {`Block Merge #—\nGrid renders here in Phase 2.`}
      </Text>
    </GlassCard>
    <TactileButton variant="primary" style={{ marginTop: 18 }}>Copy grid</TactileButton>
  </View>
</SafeAreaView>
```

The "Copy grid" button is a stub for now — `console.warn('share grid not implemented yet')`. Phase 2 wires it.

- [ ] **Step 2: Restyle `src/app/shop.tsx`**

Header: `<Pill variant="mustard">SHOP</Pill>` + "Themes" title.

For now show one card per theme using existing palette tokens (`warm`, `cool`, `mono`, `neon` from the design spec):

```tsx
<GlassCard style={{ padding: 14, marginBottom: 10 }}>
  <Text style={{ fontSize: 9, fontWeight: fontWeight.bold, color: colors.cobalt, letterSpacing: 1.6 }}>COOL SAGE</Text>
  <Text style={{ fontSize: 18, fontWeight: fontWeight.heavy, color: colors.ink, marginTop: 4 }}>
    Sage theme
  </Text>
  <Text style={{ color: colors.inkSoft, fontSize: 12, marginTop: 4 }}>
    Cool palette · soft greens
  </Text>
  <TactileButton variant="cobalt" style={{ marginTop: 10 }} fullWidth={false}>$1.99</TactileButton>
</GlassCard>
```

The buttons stub `console.warn('purchase not implemented yet')`. Phase 3 wires actual purchases.

- [ ] **Step 3: Typecheck + visual**

```bash
npm run typecheck && npm start
```

- [ ] **Step 4: Maestro**

```bash
npm run e2e -- .maestro/flows/economy/
```

- [ ] **Step 5: Commit**

```bash
git add src/app/share.tsx src/app/shop.tsx
git commit -m "feat(share, shop): tactile-console restyle (placeholders for phase-2/3 wiring)"
```

---

## Task 16: Maestro flow cleanup

Delete flows for cut features. Keep the surviving flows updated against the new screen names.

**Files:**
- Delete: `.maestro/flows/social/squads.yaml`, `.maestro/flows/social/friends.yaml`
- Delete: `.maestro/flows/progression/ranks.yaml`, `.maestro/flows/progression/battlepass.yaml`

- [ ] **Step 1: Delete flows for cut features**

```bash
rm .maestro/flows/social/squads.yaml .maestro/flows/social/friends.yaml
rm .maestro/flows/progression/ranks.yaml .maestro/flows/progression/battlepass.yaml
```

- [ ] **Step 2: Update package.json scripts to remove dead-flow runners**

Open `package.json`, remove the lines that point at deleted flows. Surviving scripts: `e2e`, `e2e:navigation`, `e2e:gameplay`, `e2e:economy`, `e2e:settings`. Drop `e2e:progression` and `e2e:social` only if those directories are now empty (achievements stays under progression; share stays under social).

```bash
ls .maestro/flows/progression/ .maestro/flows/social/
```

If both still have flows: keep the scripts, but they'll only run the survivors. Done.

- [ ] **Step 3: Run the full e2e suite once**

```bash
npm run e2e
```

Expected: all surviving flows pass. If any fail, the failures should be related to the home nav grid changes from Task 2 — adjust the flow's `tapOn` ids to match.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "test(e2e): remove maestro flows for cut features"
```

---

## Task 17: Phase 1 gate verification

Final pass before declaring Phase 1 complete and starting Phase 2 plan-writing.

- [ ] **Step 1: Typecheck**

```bash
npm run typecheck
```
Must be clean.

- [ ] **Step 2: Lint**

```bash
npm run lint
```
Must be clean.

- [ ] **Step 3: Full Maestro suite**

```bash
npm run e2e
```
Must pass.

- [ ] **Step 4: Manual visual walkthrough on a real device**

Order: Welcome → Home → Daily → Endless → Leaderboard → Replays → Achievements → Settings → Share → Shop. Confirm:
- Every screen has the cream paper background.
- No screen still has the old `bg-black` purple-on-black look.
- No dead routes.
- Ember accent applied consistently.

- [ ] **Step 5: Confirm Firebase + analytics live (with real keys)**

- Populate `.env.local` with real Firebase keys per ADR 0002.
- Populate `EXPO_PUBLIC_POSTHOG_KEY` per ADR 0001.
- Run app on a real device, watch Metro logs for `✅ Firebase initialized successfully`.
- Open PostHog dashboard, confirm `app_opened` event lands.
- Open Firestore console, confirm `users/{uid}` doc appears after first run.

- [ ] **Step 6: Update plan checkboxes in this document**

Mark every task complete in this file.

- [ ] **Step 7: Commit + tag**

```bash
git add docs/superpowers/plans/2026-05-05-phase-1-foundation.md
git commit -m "chore(phase-1): mark plan tasks complete"
git tag phase-1-complete
```

- [ ] **Step 8: Hand off to Phase 2 planning**

Open the design spec at `docs/superpowers/specs/2026-05-05-block-merge-launch-design.md` § 7 Phase 2. Invoke `superpowers:writing-plans` with: "Phase 2 of Block Merge launch — see spec § Phase 2. Phase 1 complete and tagged `phase-1-complete`."

---

## Open questions tracked into Phase 2

| # | Question | Answered when |
|---|---|---|
| 1 | Sound designer freelance vs. AI-generated? | Phase 2 plan write-up |
| 2 | Soft-launch country: Canada vs. NZ | Phase 4 plan write-up |
| 3 | Cosmetic theme cadence sustainability (1/month) | After Phase 1 measures art-pipeline cost |
| 4 | Should the 5-min Tournament code become "Sprint" mode for subscribers, or be deleted? | Phase 2 plan write-up |
