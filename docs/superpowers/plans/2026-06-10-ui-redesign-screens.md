# UI Redesign Plan 2 — Non-Game Screen Restyle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the eight non-game screens (Home, Welcome, Leaderboard, Replays, Achievements, Settings, Share, Shop) to the evolved tactile-console identity using two new shared primitives (`ScreenHeader`, `AsyncStateView`) and consistent iconography, preserving all testIDs and fixing the unimplemented sign-out.

**Architecture:** Two reusable primitives carry the repeated patterns — `ScreenHeader` (back chevron + title + optional right action) replaces every hand-rolled back-button/header, and `AsyncStateView` (loading/error/empty/content with a retry button) replaces the ad-hoc `loading ? … :` blocks whose catch handlers only `console.error` (audit M3.3). Screens become thin compositions of primitives + design tokens. No behavior changes except: standardized error/retry UX, lucide iconography replacing emoji, and a real sign-out.

**Tech Stack:** TypeScript strict, React Native, `lucide-react-native` (installed), existing design tokens/primitives (`src/lib/design/tokens.ts`, `src/components/design/`), Jest.

**Builds on:** Plan 1 (`2026-06-10-ui-redesign-core-interaction.md`, merged). Spec: `2026-06-10-ui-ux-redesign-design.md` §3–§4. Audit items closed: M3.3 (error/retry UX), H6 (sign-out + achievement iconography).

**Conventions for every task:** run from repo root. `npx jest <path>` for tests; `npm run typecheck` and `npm run lint` before each commit. Preserve EVERY existing `testID` exactly (Maestro flows depend on them — never rename or remove one). Commit messages end with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`. Use the evolved tokens from Plan 1: `colors`, `space`, `fontSize`, `fontWeight`, `radii`, `shadows` from `@/lib/design/tokens`.

**Current screen inventory (verified):**
| Screen | File | Lines | Async data | Notable testIDs |
|---|---|---|---|---|
| Home | `index.tsx` | 399 | initial `loading` | `home-screen`, `settings-button`, `tournament-button`, `endless-mode-button`, `leaderboard-quick-button`, `leaderboard-button`, `replays-button`, `shop-button`, `achievements-button`, `share-button`, `settings-nav` |
| Welcome | `welcome.tsx` | 186 | none | `welcome-screen`, `lets-play-button` |
| Leaderboard | `leaderboard.tsx` | 492 | `loading`+catch | `leaderboard-screen`, `back-button` |
| Replays | `replays.tsx` | 438 | `loading`+catch | `replays-screen`, `back-button` |
| Achievements | `achievements.tsx` | 134 | none | `achievements-screen`, `back-button` |
| Settings | `settings.tsx` | 436 | `loading` | `settings-screen`, `back-button`, `sound-toggle-row`, `haptic-toggle-row`, `theme-row`, `reduced-motion-toggle-row`, `display-name-row`, `restore-purchases-row`, `theme-option-*` |
| Share | `share.tsx` | 451 | `loading`+catch | `share-screen`, `back-button`, `copy-grid-button` |
| Shop | `shop.tsx` | 92 | none | `shop-screen`, `back-button` |

---

### Task 1: ScreenHeader primitive

**Files:**
- Create: `src/components/design/ScreenHeader.tsx`

No unit test (pure visual); verification is `npm run typecheck`.

- [ ] **Step 1: Implement**

```tsx
// Shared screen header — back chevron + title + optional right action.
// Replaces the hand-rolled back-button/title blocks on every secondary screen.
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { colors, fontSize, fontWeight, space } from '@/lib/design/tokens';

export function ScreenHeader({
  title,
  right,
  onBack,
  backTestID = 'back-button',
}: {
  title: string;
  right?: React.ReactNode;
  /** Defaults to router.back(). */
  onBack?: () => void;
  backTestID?: string;
}) {
  const router = useRouter();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: space.lg,
        paddingTop: space.md,
        paddingBottom: space.sm,
      }}
    >
      <Pressable
        testID={backTestID}
        onPress={onBack ?? (() => router.back())}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}
      >
        <ChevronLeft size={22} color={colors.ember} strokeWidth={2.5} />
        <Text style={{ color: colors.ember, fontSize: fontSize.subtitle, fontWeight: fontWeight.bold }}>
          Back
        </Text>
      </Pressable>
      <Text
        style={{ color: colors.ink, fontSize: fontSize.title, fontWeight: fontWeight.black, letterSpacing: -0.6, flex: 1, textAlign: 'center' }}
        numberOfLines={1}
      >
        {title}
      </Text>
      <View style={{ minWidth: 64, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}
```

- [ ] **Step 2:** `npm run typecheck` (exit 0), `npm run lint` (clean).
- [ ] **Step 3: Commit**
```bash
git add src/components/design/ScreenHeader.tsx
git commit -m "feat(design): ScreenHeader primitive — back chevron + title + right slot"
```

---

### Task 2: AsyncStateView primitive + asyncState helper

**Files:**
- Create: `src/components/design/AsyncStateView.tsx`
- Test: `src/components/design/asyncState.test.ts`
- Create: `src/components/design/asyncState.ts` (pure helper, tested)

- [ ] **Step 1: Write the failing test** `src/components/design/asyncState.test.ts`

```typescript
import { asyncState } from './asyncState';

describe('asyncState', () => {
  it('returns loading when loading is true (regardless of others)', () => {
    expect(asyncState({ loading: true, error: null, isEmpty: true })).toBe('loading');
  });
  it('returns error when not loading and error is set', () => {
    expect(asyncState({ loading: false, error: 'boom', isEmpty: true })).toBe('error');
  });
  it('returns empty when not loading, no error, and empty', () => {
    expect(asyncState({ loading: false, error: null, isEmpty: true })).toBe('empty');
  });
  it('returns content when not loading, no error, not empty', () => {
    expect(asyncState({ loading: false, error: null, isEmpty: false })).toBe('content');
  });
});
```

- [ ] **Step 2:** Run `npx jest src/components/design/asyncState.test.ts` — expect FAIL (module missing).

- [ ] **Step 3: Implement the helper** `src/components/design/asyncState.ts`

```typescript
export type AsyncPhase = 'loading' | 'error' | 'empty' | 'content';

export function asyncState(s: { loading: boolean; error: string | null; isEmpty: boolean }): AsyncPhase {
  if (s.loading) return 'loading';
  if (s.error) return 'error';
  if (s.isEmpty) return 'empty';
  return 'content';
}
```

- [ ] **Step 4:** Run `npx jest src/components/design/asyncState.test.ts` — expect 4 PASS.

- [ ] **Step 5: Implement the view** `src/components/design/AsyncStateView.tsx`

```tsx
// Standardized async UI: loading spinner, error+retry, empty message, or content.
// Replaces ad-hoc `loading ? … :` blocks whose catch handlers only console.error
// (audit M3.3 — users now get a retry instead of an infinite spinner).
import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { colors, fontSize, fontWeight, space, radii } from '@/lib/design/tokens';
import { TactileButton } from '@/components/design/TactileButton';
import { asyncState } from './asyncState';

export function AsyncStateView({
  loading,
  error,
  isEmpty,
  emptyMessage = 'Nothing here yet.',
  onRetry,
  children,
}: {
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
  emptyMessage?: string;
  onRetry?: () => void;
  children: React.ReactNode;
}) {
  const phase = asyncState({ loading, error, isEmpty });

  if (phase === 'loading') {
    return (
      <View testID="async-loading" style={{ alignItems: 'center', paddingVertical: space.xl * 2 }}>
        <ActivityIndicator color={colors.ember} />
      </View>
    );
  }
  if (phase === 'error') {
    return (
      <View testID="async-error" style={{ alignItems: 'center', paddingVertical: space.xl, paddingHorizontal: space.lg, gap: space.md }}>
        <Text style={{ color: colors.inkSoft, fontSize: fontSize.body, textAlign: 'center' }}>
          {error}
        </Text>
        {onRetry && (
          <TactileButton testID="async-retry" variant="ink" onPress={onRetry}>
            Try again
          </TactileButton>
        )}
      </View>
    );
  }
  if (phase === 'empty') {
    return (
      <View testID="async-empty" style={{ alignItems: 'center', paddingVertical: space.xl * 2, paddingHorizontal: space.lg }}>
        <Text style={{ color: colors.inkDim, fontSize: fontSize.body, textAlign: 'center' }}>{emptyMessage}</Text>
      </View>
    );
  }
  return <>{children}</>;
}
```

(If `TactileButton`'s prop names differ — e.g. no `variant="ink"` — read `src/components/design/TactileButton.tsx` and use a valid variant. Plan 1 used `ink` and `cobalt`/`primary`/`plain`.)

- [ ] **Step 6:** `npm run typecheck` (exit 0), `npx jest` (full suite: prior count + 4), `npm run lint` (clean).
- [ ] **Step 7: Commit**
```bash
git add src/components/design/AsyncStateView.tsx src/components/design/asyncState.ts src/components/design/asyncState.test.ts
git commit -m "feat(design): AsyncStateView + asyncState helper — standardized loading/error/empty with retry (audit M3.3)"
```

---

### Task 3: ModeIcon primitive (lucide, replaces 🏆/🎮 emoji)

**Files:**
- Create: `src/components/design/ModeIcon.tsx`

- [ ] **Step 1: Implement**

```tsx
// Run-mode icon — replaces the 🏆/🎮 emoji used across leaderboard/replays/share.
import React from 'react';
import { Trophy, Gamepad2 } from 'lucide-react-native';
import { colors } from '@/lib/design/tokens';

export function ModeIcon({
  mode,
  size = 16,
  color,
}: {
  mode: 'tournament' | 'endless' | string;
  size?: number;
  color?: string;
}) {
  const Icon = mode === 'tournament' ? Trophy : Gamepad2;
  return <Icon size={size} color={color ?? colors.inkSoft} strokeWidth={2.25} />;
}
```

- [ ] **Step 2:** `npm run typecheck` (exit 0), `npm run lint` (clean).
- [ ] **Step 3: Commit**
```bash
git add src/components/design/ModeIcon.tsx
git commit -m "feat(design): ModeIcon primitive (lucide Trophy/Gamepad2)"
```

---

### Tasks 4–11: per-screen restyle

**Shared procedure for every screen task below.** The implementer MUST:
1. Read the current screen file fully first.
2. Replace the hand-rolled header/back-button block with `<ScreenHeader title="…" />` (keeping the `back-button` testID — `ScreenHeader`'s default `backTestID` is `back-button`, so don't pass it unless the screen used a different id). Keep the screen-root `testID` (e.g. `leaderboard-screen`) on the `SafeAreaView`.
3. Where the screen has async data with a `loading` state and a `catch` that only `console.error`s: add an `error` state string, set it in the catch, and wrap the data region in `<AsyncStateView loading={loading} error={error} isEmpty={…} onRetry={loadFn}>…</AsyncStateView>`. The `loadFn` is the existing fetch function.
4. Replace 🏆/🎮 emoji with `<ModeIcon mode={…} />`.
5. Apply evolved tokens (`space`, `fontSize`) to replace magic-number paddings/sizes where you touch them — do NOT rewrite working layout wholesale; evolve, don't replace (spec: Direction A).
6. PRESERVE every existing testID exactly. Do not add new behavior beyond error/retry + iconography (and the sign-out fix in Task 9).
7. Verify: `npm run typecheck` (exit 0), `npm run lint` (clean), and run the screen's Maestro flow IF an emulator is available (otherwise list preserved testIDs proving the flow still resolves). `npx jest` must still pass.

Each task commits its single screen file (plus any flow file only if a testID genuinely had to change — avoid this).

---

### Task 4: Achievements restyle + badge iconography

**Files:** Modify `src/app/achievements.tsx`

- [ ] **Step 1:** Read the file. Apply the shared procedure. Additionally: this screen shows the six badges (First Merge, Five-Cluster, Daily Debut, A Week Steady, Quick Hand, Centurion). Replace any emoji/placeholder badge glyphs with `lucide-react-native` icons tinted per `colors` (e.g. `Sparkles`, `Layers`, `Calendar`, `Flame`, `Zap`, `Target` — pick sensible mappings; locked/unlocked state shown via opacity + accent color). Keep `achievements-screen` and `back-button` testIDs.
- [ ] **Step 2:** typecheck + lint + jest green.
- [ ] **Step 3: Commit** `git commit -m "feat(achievements): ScreenHeader + lucide badge iconography (audit H6)"`

### Task 5: Leaderboard restyle + AsyncStateView

**Files:** Modify `src/app/leaderboard.tsx`

- [ ] **Step 1:** Read the file. Apply the shared procedure. The fetch (`loadFn` around line 171) has a `catch` (line 196) that only `console.error`s — add an `error` state, set a user-facing message in the catch (e.g. `'Couldn't load the leaderboard.'`), wrap the list (around the `loading ?` at line 424) in `AsyncStateView` with `isEmpty={entries.length === 0}` and `onRetry={loadFn}`. Replace the `getModeIcon` 🏆/🎮 (line 203) with `<ModeIcon>`. Keep `leaderboard-screen`, `back-button`.
- [ ] **Step 2:** typecheck + lint + jest green; `maestro test .maestro/flows/navigation/home-navigation.yaml` references leaderboard nav — confirm testIDs intact.
- [ ] **Step 3: Commit** `git commit -m "feat(leaderboard): ScreenHeader + AsyncStateView retry + ModeIcon (audit M3.3)"`

### Task 6: Replays restyle + AsyncStateView

**Files:** Modify `src/app/replays.tsx`

- [ ] **Step 1:** Read the file. Apply the shared procedure. Catch at line 208 only logs — add `error` state + message (`'Couldn't load replays.'`), wrap the list (`loading ?` at line 342) in `AsyncStateView` (`isEmpty={replays.length === 0}`, `emptyMessage="No replays yet — play a run to record one."`, `onRetry={loadFn}`). Replace 🏆/🎮 (lines 127, 325) with `<ModeIcon>`. Keep `replays-screen`, `back-button`, and the replay-code input testIDs if present.
- [ ] **Step 2:** typecheck + lint + jest green.
- [ ] **Step 3: Commit** `git commit -m "feat(replays): ScreenHeader + AsyncStateView retry + ModeIcon (audit M3.3)"`

### Task 7: Share restyle + AsyncStateView

**Files:** Modify `src/app/share.tsx`

- [ ] **Step 1:** Read the file. Apply the shared procedure. Catch at line 74 only logs — add `error` state + message, wrap the content (`loading ?` at line 439) in `AsyncStateView` with `onRetry={loadFn}`. The `🏆`/icon mapping for highlight types (line 141 `case 'high_score': return '🏆'`) may stay as emoji IF it's part of share-grid content (emoji grid is intentional) — but the screen chrome/mode markers should use lucide. Use judgment: share-GRID emoji = keep; screen UI emoji = lucide. Keep `share-screen`, `back-button`, `copy-grid-button`. Do NOT wire the daily "Share result" button (that's Phase 2 product scope).
- [ ] **Step 2:** typecheck + lint + jest green.
- [ ] **Step 3: Commit** `git commit -m "feat(share): ScreenHeader + AsyncStateView retry (audit M3.3)"`

### Task 8: Shop restyle

**Files:** Modify `src/app/shop.tsx`

- [ ] **Step 1:** Read the file (92 lines, small). Apply ScreenHeader + tokens. Keep `shop-screen`, `back-button`.
- [ ] **Step 2:** typecheck + lint + jest green.
- [ ] **Step 3: Commit** `git commit -m "feat(shop): ScreenHeader + token restyle"`

### Task 9: Settings restyle + real sign-out

**Files:** Modify `src/app/settings.tsx`

- [ ] **Step 1:** Read the file. Apply ScreenHeader + tokens. Keep ALL testIDs: `settings-screen`, `back-button`, `sound-toggle-row`, `haptic-toggle-row`, `theme-row`, `reduced-motion-toggle-row`, `display-name-row`, `restore-purchases-row`, `theme-option-*`.
- [ ] **Step 2: Fix sign-out (audit H6).** Line 365 is `onPress={() => console.warn('sign out not implemented yet')}`. Implement a real sign-out: read `src/lib/firebase/auth.ts` for the available sign-out (Firebase anonymous auth — there may be a `signOut`/`getOrCreateUser` reset). The correct behavior for this app's anonymous model: sign out of Firebase auth if a `signOut` export exists, and clear the local user id / reset to a fresh anonymous identity. If `firebase/auth.ts` exposes no sign-out, add a minimal `signOutUser()` there that calls Firebase `signOut(auth)` when `auth` is non-null and clears the cached user-id AsyncStorage key, then call it from the row with a confirmation `Alert`. Wrap in try/catch with a user-facing error (no silent `console.warn`). If the anonymous model makes "sign out" meaningless, instead make the row a "Reset local data" action with a confirmation Alert, and rename its label accordingly — pick the option that fits the actual auth code and note which you chose.
- [ ] **Step 3:** typecheck + lint + jest green; `maestro test .maestro/flows/settings/settings.yaml` testIDs intact.
- [ ] **Step 4: Commit** `git commit -m "feat(settings): ScreenHeader + real sign-out/reset action (audit H6)"`

### Task 10: Home (index) restyle

**Files:** Modify `src/app/index.tsx`

- [ ] **Step 1:** Read the file. Home is the root — it keeps its hero/daily-card layout and nav grid (NO ScreenHeader, it has no back). Apply evolved tokens (`space`, `fontSize`), tidy the initial `loading` block (line 124) to use a centered `ActivityIndicator` in `colors.ember` (or `AsyncStateView` with no retry). Keep every nav testID listed in the inventory table.
- [ ] **Step 2:** typecheck + lint + jest green; `maestro test .maestro/flows/navigation/home-navigation.yaml` testIDs intact.
- [ ] **Step 3: Commit** `git commit -m "feat(home): token restyle + tidy loading state"`

### Task 11: Welcome restyle

**Files:** Modify `src/app/welcome.tsx`

- [ ] **Step 1:** Read the file (186 lines, no async). Apply evolved tokens; keep it a single clean first-run screen (the silent-demo onboarding is Phase-2 product scope — do NOT build it here). Keep `welcome-screen`, `lets-play-button`.
- [ ] **Step 2:** typecheck + lint + jest green; `maestro test .maestro/flows/onboarding/welcome.yaml` and `.maestro/flows/setup/skip-welcome.yaml` testIDs intact.
- [ ] **Step 3: Commit** `git commit -m "feat(welcome): token restyle"`

---

### Task 12: Final verification

- [ ] **Step 1:** `npm run typecheck` (exit 0), `npx jest` (all green), `npm run lint` (clean).
- [ ] **Step 2:** Grep for residual emoji in screen chrome: `rg "🏆|🎮" src/app` — confirm only intentional share-grid emoji remain (Task 7), not screen chrome.
- [ ] **Step 3:** Confirm no testID was removed: `rg 'testID="' src/app` and diff the set against the inventory table above — every id must still exist.
- [ ] **Step 4:** If an emulator is available, run the full suite `npm run e2e`. Otherwise note that device QA uses `docs/superpowers/plans/2026-06-10-redesign-manual-qa.md`.
- [ ] **Step 5: Commit** any final touch-ups; otherwise report the branch is ready.

---

## Self-review (done at write time)

- **Spec coverage:** §4 table — Home→T10, Welcome→T11, Leaderboard→T5, Replays→T6, Achievements→T4, Settings→T9, Share→T7, Shop→T8; `ScreenHeader`→T1, `AsyncStateView`→T2 (closes M3.3); §3 achievements iconography→T4, ModeIcon→T3; sign-out (H6)→T9.
- **Out of scope (explicit, matches Plan 1 §9):** silent-demo onboarding (welcome), daily "Share result" button wiring, percentile/streak/ghost-racing product features, canvas effect choreography. Not touched here.
- **Placeholder scan:** Tasks 1–3 have complete code; Tasks 4–11 are restyle tasks specified by pattern + acceptance + testID preservation rather than pre-written JSX, because pre-writing every screen's full markup without the file in front of me would be speculative — the shared procedure + per-screen specifics + the Task 1–3 primitives give the implementer everything needed. This is the honest, correct granularity for visual restyle work.
- **Type/name consistency:** `ScreenHeader`, `AsyncStateView`, `asyncState`, `ModeIcon`, `AsyncPhase` consistent across tasks.
- **Known judgment points (flagged, not placeholders):** TactileButton variant names (T2), achievements badge icon mapping (T4), share-grid-vs-chrome emoji distinction (T7), the sign-out-vs-reset decision against the real auth model (T9).
