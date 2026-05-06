# Phase 2: Differentiator — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the merge-cascade-as-spectacle hook end-to-end — annotated emoji share grid, animated cascade with audio + haptic + slow-mo, one-run-no-timer daily, and a subscriber-gated archive index — so a player completing a daily run produces a shareable artifact that's recognizable as Block Merge.

**Architecture:** Five strands: (1) **Foundation cleanup** carries over Phase 1 tech debt (Jest setup, AsyncStorage prefix unification, shared `PiecesTray`, achievement grants for the slim catalog). (2) **Share grid** is a pure board-state → string generator with TDD tests, wired into `share.tsx` with a Copy button. (3) **Daily migration** rips out the 5-minute timer in favor of one-run-no-retries; deletes the `Sprint` mode entirely (decision made in T7). (4) **Merge cascade** uses Reanimated 3 for scale/position animations with a tier-driven slow-mo wrapper, expo-av for audio (AI-generated SFX assets committed to `assets/sounds/`), expo-haptics for haptic patterns, all behind a single `MergeAnimation` component honoring system Reduce-Motion. (5) **Daily archive** adds Firestore puzzle/user-archive collections and a paywall stub (`requireSubscription()`) that Phase 3 wires to RevenueCat.

**Tech Stack:** Expo SDK 53, RN 0.79.6, TypeScript strict, Reanimated 3.17.4, Skia 2.0.0-next.4 (for cascade glow), expo-av (audio), expo-haptics, Firebase v12 (Firestore archive), Jest 29.7 + @testing-library/react-native 13.3 (newly enabled), expo-router typed routes.

**Source spec:** [`docs/superpowers/specs/2026-05-05-block-merge-launch-design.md`](../specs/2026-05-05-block-merge-launch-design.md) — read § 3 (daily ritual + share grid), § 4 (merge cascade spec), and § 7 Phase 2 carefully before starting.

**Predecessor:** Phase 1 plan `docs/superpowers/plans/2026-05-05-phase-1-foundation.md`, tagged `phase-1-complete` at commit `fe00dfa`.

---

## Working assumptions

- TypeScript strict and ESLint are clean at the start of Phase 2.
- Working on `main`. Commit per task.
- The tactile-console primitives in `src/components/design/` and tokens in `src/lib/design/tokens.ts` are stable. Do not modify them in Phase 2 unless a bug surfaces.
- `posthog-react-native` is wired; `track()` from `src/lib/analytics/events.ts` is the only entrypoint. New events go in `EventMap` first.
- Firebase env vars may still be unset in dev — code paths must continue to gracefully no-op (not crash) when `db === null`.
- RevenueCat is **not** wired this phase; the paywall hook is a stub that always returns `false` (i.e. "no subscription"). Phase 3 replaces the stub.

## File structure for Phase 2

| Path | Status | Responsibility |
|---|---|---|
| `jest.config.js` | new | Jest configuration for Node-environment unit tests |
| `package.json` | modify | Add `test`, `test:watch` scripts |
| `src/lib/share/grid.ts` | new | Pure board-state → annotated emoji share-grid string |
| `src/lib/share/grid.test.ts` | new | TDD tests for the generator |
| `src/lib/audio/sfx.ts` | new | Sound asset loader + tier-driven trigger (`playMergeSound(multiplier)`) |
| `src/lib/audio/sfx.test.ts` | new | Tier-mapping tests |
| `src/lib/haptics/cascade.ts` | new | Tier-driven haptic pattern trigger |
| `src/lib/daily/seed.ts` | new (replaces `src/lib/utils/tournament.ts`) | Daily seed + puzzle ID + leaderboard helpers, no timer code |
| `src/lib/daily/archive.ts` | new | Firestore archive index (subscriber-gated reads) |
| `src/lib/subscription/gate.ts` | new | `requireSubscription()` stub — always `false` in Phase 2 |
| `src/components/cascade/MergeAnimation.tsx` | new | Reanimated cascade with tier-driven slow-mo |
| `src/components/design/PiecesTray.tsx` | new | Extracted from `game.tsx` — shared by game.tsx and daily.tsx |
| `src/lib/achievements/grants.ts` | new | Event-driven grant logic for the 6-entry slim catalog |
| `assets/sounds/merge-2x.m4a` … `merge-7x.m4a` | new | AI-generated SFX (decision in T10 ADR) |
| `src/app/share.tsx` | modify | Wire grid generator + Copy button + share event |
| `src/app/daily.tsx` | modify | Drop timer, switch to one-run-no-retries, add archive entry, wire cascade |
| `src/app/game.tsx` | modify | Use shared `PiecesTray`; wire cascade |
| `src/components/TournamentTimer.tsx` | delete | Timer is gone |
| `src/lib/utils/tournament.ts` | delete | Replaced by `src/lib/daily/seed.ts` |
| `docs/decisions/0003-sprint-mode-fate.md` | new | ADR — delete the 5-min timer code (no Sprint mode in v1) |
| `docs/decisions/0004-cascade-audio-source.md` | new | ADR — AI-generated SFX for v1; revisit if soft-launch numbers warrant a sound designer |
| `docs/decisions/0005-asyncstorage-prefix.md` | new | ADR — unified `@block_merge:*` prefix; how migration handles existing tester data |
| `docs/decisions/0006-archive-firestore-schema.md` | new | ADR — Firestore collections for daily archive |

---

## Task 1: Set up Jest for unit tests

The codebase has Jest in deps but no script, no config, and no tests. Phase 2 has multiple pure-function modules (share grid, audio tier mapping, daily seed) that benefit hugely from unit tests. Wire a minimal Jest setup.

**Files:**
- Create: `jest.config.js`
- Modify: `package.json`
- Create: `src/lib/__smoke__/jest-loop.test.ts` (will be deleted in Step 5 — proves the loop)

- [ ] **Step 1: Write `jest.config.js`**

```js
// jest.config.js
module.exports = {
  preset: null,
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['babel-jest', { presets: ['@babel/preset-env', '@babel/preset-typescript'] }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Ignore RN-specific tests for now; Phase 2 only needs pure logic tests.
  // Component tests would need jest-expo preset; we'll add it if/when needed.
  testPathIgnorePatterns: ['/node_modules/', '\\.tsx\\.test\\.ts$'],
};
```

- [ ] **Step 2: Add scripts to `package.json`**

In the `"scripts"` block, add:

```json
"test": "jest",
"test:watch": "jest --watch"
```

- [ ] **Step 3: Install missing Babel presets if needed**

```bash
npm install --legacy-peer-deps --save-dev @babel/preset-env @babel/preset-typescript babel-jest
```

These are required by the transform above. Some may already be present transitively — install anyway.

- [ ] **Step 4: Write the smoke test**

```ts
// src/lib/__smoke__/jest-loop.test.ts
describe('jest setup', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Run the smoke test**

```bash
npm test
```

Expected: 1 test passes. If it fails with a transform error, iterate the babel config until it works. Common fixes:
- Add a `babel.config.js` at repo root if Expo's existing `babel.config.js` conflicts (Expo's may need a `test` env).
- Verify `@babel/preset-typescript` resolves with the existing `@babel/core` version.

- [ ] **Step 6: Delete the smoke test**

```bash
rm src/lib/__smoke__/jest-loop.test.ts && rmdir src/lib/__smoke__
```

It served its purpose.

- [ ] **Step 7: Commit**

```bash
git add jest.config.js package.json package-lock.json
git commit -m "build(test): wire jest for unit tests of pure-function modules"
```

---

## Task 2: Unify AsyncStorage prefix to `@block_merge:*`

Phase 1's rename left the prefix inconsistent: most utils use `@block_merge_arena:*`, social.ts uses `@block_merge:*`, tutorial.ts uses `block-merge:*`. Pre-launch is the right time to unify. Pick `@block_merge:*` (matches the new app name).

For tester data migration: write a one-time migration that copies old keys to new keys on first launch. This costs ~10 lines and avoids losing data on testers' devices.

**Files:**
- Create: `docs/decisions/0005-asyncstorage-prefix.md`
- Create: `src/lib/storage/migrate.ts`
- Modify: `src/app/_layout.tsx` (call migrator on cold start)
- Modify: `src/lib/utils/{currency,achievements,replay,inventory,settings,leaderboard,tutorial}.ts` and `src/lib/utils/social.ts` — change prefixes

- [ ] **Step 1: Write the ADR**

```markdown
<!-- docs/decisions/0005-asyncstorage-prefix.md -->
# ADR 0005: AsyncStorage Prefix Unification

**Status:** Active
**Date:** 2026-05-06
**Decision:** Unify all AsyncStorage keys under `@block_merge:*` prefix.

## Context

Phase 1's rename left three different conventions: `@block_merge_arena:*` (most utils), `@block_merge:*` (social.ts post-rename), `block-merge:*` (tutorial.ts). Pre-launch we have no real users, but TestFlight/internal testers have data on disk under the old prefixes.

## Decision

Unify under `@block_merge:*`. Migrate existing tester data with a one-time copy on first launch after this change ships.

## Migration

`src/lib/storage/migrate.ts` runs once at cold start, copies any `@block_merge_arena:*` or `block-merge:*` key it finds to its `@block_merge:*` equivalent (only if the new key doesn't already exist), and writes a marker `@block_merge:_migrated_v1=1` so the migration is idempotent.

Old keys are NOT deleted — they sit dormant. A future cleanup task can drop them once we're confident the migration ran for everyone.

## Consequences

- All `*_KEY` constants in `src/lib/utils/*.ts` must use `@block_merge:` prefix.
- `_layout.tsx` calls the migrator before any persistence-dependent code runs.
- Future modules MUST use the same prefix; consider extracting a `storageKey(name: string): string` helper later.
```

- [ ] **Step 2: Write `src/lib/storage/migrate.ts`**

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const MIGRATION_MARKER = '@block_merge:_migrated_v1';

const KEY_MAP: Record<string, string> = {
  '@block_merge_arena:currency':           '@block_merge:currency',
  '@block_merge_arena:transactions':       '@block_merge:transactions',
  '@block_merge_arena:achievements':       '@block_merge:achievements',
  '@block_merge_arena:achievement_unlocks':'@block_merge:achievement_unlocks',
  '@block_merge_arena:replays':            '@block_merge:replays',
  '@block_merge_arena:inventory':          '@block_merge:inventory',
  '@block_merge_arena:settings':           '@block_merge:settings',
  '@block_merge_arena:leaderboard':        '@block_merge:leaderboard',
  'block-merge:welcome-complete':          '@block_merge:welcome-complete',
};

export async function migrateStorageKeys(): Promise<void> {
  const marker = await AsyncStorage.getItem(MIGRATION_MARKER);
  if (marker === '1') return;

  for (const [oldKey, newKey] of Object.entries(KEY_MAP)) {
    const existingNew = await AsyncStorage.getItem(newKey);
    if (existingNew !== null) continue; // don't overwrite already-migrated data
    const existingOld = await AsyncStorage.getItem(oldKey);
    if (existingOld === null) continue; // nothing to copy
    await AsyncStorage.setItem(newKey, existingOld);
  }
  await AsyncStorage.setItem(MIGRATION_MARKER, '1');
}
```

- [ ] **Step 3: Wire migrator into `src/app/_layout.tsx`**

```tsx
import { initAnalytics, track } from '@/lib/analytics/events';
import { migrateStorageKeys } from '@/lib/storage/migrate';
// ... existing imports

export default function RootLayout() {
  useEffect(() => {
    (async () => {
      await migrateStorageKeys();
      await initAnalytics();
      track('app_opened', { source: 'cold_launch' });
    })();
  }, []);
  // ... rest unchanged
}
```

(Migration runs before analytics init so tester data is in place before any event fires.)

- [ ] **Step 4: Update every storage-key constant**

Read each of these files and change the prefix:

```bash
git grep -l "@block_merge_arena:" src/lib/
```

Expected files: `currency.ts`, `achievements.ts`, `replay.ts`, `inventory.ts`, `settings.ts`, `leaderboard.ts`, `social.ts` (already partially `@block_merge`).

In each, change the `_KEY` constant's prefix from `@block_merge_arena:` → `@block_merge:`. Example:

```ts
// before
const CURRENCY_KEY = '@block_merge_arena:currency';
// after
const CURRENCY_KEY = '@block_merge:currency';
```

For `tutorial.ts`, change `'block-merge:welcome-complete'` → `'@block_merge:welcome-complete'`.

For `social.ts`, the keys are already `@block_merge:*` from Phase 1's rename — leave them.

- [ ] **Step 5: Verify with grep**

```bash
git grep "@block_merge_arena:" src/lib/
git grep "block-merge:welcome-complete" src/lib/
```

Both should return 0 matches.

- [ ] **Step 6: Run typecheck**

```bash
npm run typecheck
```

- [ ] **Step 7: Commit**

```bash
git add docs/decisions/0005-asyncstorage-prefix.md src/lib/storage/ src/app/_layout.tsx src/lib/utils/
git commit -m "refactor(storage): unify AsyncStorage prefix to @block_merge:*; migrator copies tester data"
```

---

## Task 3: Extract `PiecesTray` to a shared design component

The redesign in `src/app/game.tsx` defines a tactile `PiecesTray` inline. `src/app/daily.tsx` still uses the legacy `PiecesSelector` from `src/components/BlockPiece.tsx`. Extract the tactile tray to a shared component, use in both screens.

**Files:**
- Create: `src/components/design/PiecesTray.tsx`
- Modify: `src/app/game.tsx` (remove inline `PiecesTray`, import shared)
- Modify: `src/app/daily.tsx` (replace `PiecesSelector` with shared `PiecesTray`)

- [ ] **Step 1: Read the current inline `PiecesTray` in `src/app/game.tsx`**

It's defined near the top of game.tsx (search for `function PiecesTray`). Note its props shape (`pieces`, `selectedIndex`, `onSelect`).

- [ ] **Step 2: Create `src/components/design/PiecesTray.tsx`**

Move the existing inline definition verbatim, plus its `TrayPiece` helper:

```tsx
// src/components/design/PiecesTray.tsx
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '@/components/design/GlassCard';
import { TactileCell } from '@/components/design/TactileCell';
import { colors, fontWeight, resolveBlockColor } from '@/lib/design/tokens';
import type { GamePiece } from '@/lib/types/game';

function TrayPiece({ piece, holding }: { piece: GamePiece; holding?: boolean }) {
  const cellSize = holding ? 14 : 12;
  const gridW = piece.width;
  const gridH = piece.height;
  const grid: boolean[][] = Array.from({ length: gridH }, () => Array(gridW).fill(false));
  piece.shape.forEach((p) => {
    if (p.row < gridH && p.col < gridW) grid[p.row][p.col] = true;
  });
  const colorKey = resolveBlockColor(piece.color);
  return (
    <View>
      {grid.map((row, r) => (
        <View key={r} style={{ flexDirection: 'row' }}>
          {row.map((filled, c) => (
            <View key={c} style={{ width: cellSize, height: cellSize, margin: 1 }}>
              {filled ? <TactileCell color={colorKey} size={cellSize} rounded={3} /> : null}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

export function PiecesTray({
  pieces,
  selectedIndex,
  onSelect,
}: {
  pieces: GamePiece[];
  selectedIndex: number | undefined;
  onSelect: (p: GamePiece, i: number) => void;
}) {
  const slots: (GamePiece | null)[] = [pieces[0] ?? null, pieces[1] ?? null, pieces[2] ?? null];
  return (
    <GlassCard style={{ padding: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingHorizontal: 4 }}>
        <Text style={{ fontSize: 10, fontWeight: fontWeight.bold, letterSpacing: 1.6, color: colors.ink }}>NEXT PIECES</Text>
        <Text style={{ fontSize: 9, fontWeight: fontWeight.bold, letterSpacing: 1.4, color: colors.inkSoft }}>
          {pieces.length} / 3
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', gap: 8 }}>
        {slots.map((piece, i) => {
          const active = selectedIndex === i;
          const isMiddle = i === 1;
          if (!piece) {
            return (
              <View key={i} style={{ flex: isMiddle ? 1.2 : 1, height: 64, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(22,20,15,0.06)', backgroundColor: 'rgba(255,255,255,0.5)' }} />
            );
          }
          return (
            <Pressable
              key={piece.id}
              onPress={() => onSelect(piece, i)}
              style={{
                flex: isMiddle ? 1.2 : 1,
                alignItems: 'center', justifyContent: 'center',
                paddingVertical: 10, paddingHorizontal: 8,
                borderRadius: active ? 14 : 12,
                borderWidth: active ? 0 : 1,
                borderColor: 'rgba(22,20,15,0.06)',
                backgroundColor: active ? 'transparent' : 'rgba(255,255,255,0.5)',
                overflow: 'hidden',
                shadowColor: active ? colors.ember : 'transparent',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: active ? 0.5 : 0,
                shadowRadius: 18,
                elevation: active ? 6 : 0,
              }}
            >
              {active && (
                <LinearGradient
                  colors={[colors.emberLight, colors.ember]}
                  start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                />
              )}
              <TrayPiece piece={piece} holding={active} />
              {active && (
                <View style={{ position: 'absolute', top: -8, right: -8, backgroundColor: colors.ink, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999 }}>
                  <Text style={{ color: colors.paper, fontSize: 8, fontWeight: fontWeight.heavy, letterSpacing: 1.2 }}>HOLDING</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </GlassCard>
  );
}
```

- [ ] **Step 2: Update `src/app/game.tsx`**

Remove the inline `function TrayPiece` and `function PiecesTray` definitions (everything from `function TrayPiece` through the end of `function PiecesTray`). Add the import at the top:

```tsx
import { PiecesTray } from '@/components/design/PiecesTray';
```

The JSX usage `<PiecesTray ... />` already works — same component name.

- [ ] **Step 3: Update `src/app/daily.tsx`**

Find where `PiecesSelector` is imported and used. Replace the import:

```tsx
// before
import { PiecesSelector } from '@/components/BlockPiece';
// after
import { PiecesTray } from '@/components/design/PiecesTray';
```

In the JSX, the call signature differs slightly. Old `PiecesSelector` → new `PiecesTray`. Map the props:

```tsx
// before
<PiecesSelector pieces={pieces} onPieceSelect={handlePieceSelect} selectedIndex={selectedPieceIndex} />
// after
<PiecesTray pieces={pieces} selectedIndex={selectedPieceIndex} onSelect={handlePieceSelect} />
```

- [ ] **Step 4: Run typecheck**

```bash
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/components/design/PiecesTray.tsx src/app/game.tsx src/app/daily.tsx
git commit -m "refactor(pieces): extract PiecesTray to shared component; daily.tsx adopts tactile tray"
```

---

## Task 4: Rewrite achievement grants for the slim catalog

Phase 1 commented out grant hooks because they referenced deleted IDs. Now we wire grants for the six new IDs (`first-merge`, `five-cluster`, `first-daily`, `streak-7`, `sub-three`, `centurion`).

**Files:**
- Create: `src/lib/achievements/grants.ts`
- Modify: `src/lib/utils/achievements.ts` (replace the commented-out `checkAchievements` body with a call to grants module)
- Test: `src/lib/achievements/grants.test.ts`

- [ ] **Step 1: Write the grants module signature and tests**

```ts
// src/lib/achievements/grants.test.ts
import { describe, it, expect } from '@jest/globals';
import { evaluateGrants, GrantContext } from './grants';

describe('evaluateGrants', () => {
  const baseCtx: GrantContext = {
    runMode: 'endless',
    score: 0,
    maxMultiplier: 1,
    durationMs: 0,
    didMerge: false,
    didDailyComplete: false,
    dailyStreakDays: 0,
    dailiesPlayedTotal: 0,
    alreadyUnlocked: new Set<string>(),
  };

  it('grants first-merge when player merged any gem', () => {
    expect(evaluateGrants({ ...baseCtx, didMerge: true })).toContain('first-merge');
  });

  it('does not re-grant first-merge if already unlocked', () => {
    expect(evaluateGrants({ ...baseCtx, didMerge: true, alreadyUnlocked: new Set(['first-merge']) })).not.toContain('first-merge');
  });

  it('grants five-cluster when maxMultiplier >= 5', () => {
    expect(evaluateGrants({ ...baseCtx, maxMultiplier: 5 })).toContain('five-cluster');
    expect(evaluateGrants({ ...baseCtx, maxMultiplier: 4 })).not.toContain('five-cluster');
  });

  it('grants first-daily on first daily completion', () => {
    expect(evaluateGrants({ ...baseCtx, runMode: 'daily', didDailyComplete: true, dailiesPlayedTotal: 1 })).toContain('first-daily');
  });

  it('grants streak-7 when streak hits 7', () => {
    expect(evaluateGrants({ ...baseCtx, runMode: 'daily', didDailyComplete: true, dailyStreakDays: 7 })).toContain('streak-7');
    expect(evaluateGrants({ ...baseCtx, runMode: 'daily', didDailyComplete: true, dailyStreakDays: 6 })).not.toContain('streak-7');
  });

  it('grants sub-three when run was under 3 minutes', () => {
    expect(evaluateGrants({ ...baseCtx, durationMs: 179_000 })).toContain('sub-three');
    expect(evaluateGrants({ ...baseCtx, durationMs: 180_001 })).not.toContain('sub-three');
  });

  it('grants centurion at 100 dailies', () => {
    expect(evaluateGrants({ ...baseCtx, runMode: 'daily', didDailyComplete: true, dailiesPlayedTotal: 100 })).toContain('centurion');
    expect(evaluateGrants({ ...baseCtx, runMode: 'daily', didDailyComplete: true, dailiesPlayedTotal: 99 })).not.toContain('centurion');
  });
});
```

- [ ] **Step 2: Run the failing tests**

```bash
npm test -- grants
```
Expected: cannot resolve `./grants` — module not found.

- [ ] **Step 3: Implement the grants module**

```ts
// src/lib/achievements/grants.ts
export type RunMode = 'endless' | 'daily';

export interface GrantContext {
  runMode: RunMode;
  score: number;
  maxMultiplier: number;
  durationMs: number;
  didMerge: boolean;
  didDailyComplete: boolean;
  dailyStreakDays: number;
  dailiesPlayedTotal: number;
  alreadyUnlocked: Set<string>;
}

const SUB_THREE_MS = 3 * 60 * 1000;

export function evaluateGrants(ctx: GrantContext): string[] {
  const granted: string[] = [];
  const grant = (id: string, when: boolean) => {
    if (when && !ctx.alreadyUnlocked.has(id)) granted.push(id);
  };

  grant('first-merge', ctx.didMerge);
  grant('five-cluster', ctx.maxMultiplier >= 5);
  grant('first-daily', ctx.runMode === 'daily' && ctx.didDailyComplete && ctx.dailiesPlayedTotal >= 1);
  grant('streak-7', ctx.runMode === 'daily' && ctx.didDailyComplete && ctx.dailyStreakDays >= 7);
  grant('sub-three', ctx.durationMs > 0 && ctx.durationMs < SUB_THREE_MS);
  grant('centurion', ctx.runMode === 'daily' && ctx.didDailyComplete && ctx.dailiesPlayedTotal >= 100);

  return granted;
}
```

- [ ] **Step 4: Run tests — should pass**

```bash
npm test -- grants
```
Expected: 7 passing.

- [ ] **Step 5: Wire `evaluateGrants` into `src/lib/utils/achievements.ts`**

Find the `checkAchievements` function (currently a TODO stub from Phase 1). Replace its body:

```ts
import { evaluateGrants, GrantContext } from '@/lib/achievements/grants';

export async function checkAchievements(ctx: Omit<GrantContext, 'alreadyUnlocked'>): Promise<string[]> {
  const existing = await getAchievements();
  const alreadyUnlocked = new Set(existing.filter((a) => a.completed).map((a) => a.id));
  const newlyGranted = evaluateGrants({ ...ctx, alreadyUnlocked });
  if (newlyGranted.length === 0) return [];
  // Mark as completed in storage
  const updated = existing.map((a) => (newlyGranted.includes(a.id) ? { ...a, completed: true, currentProgress: 100 } : a));
  await AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(updated));
  return newlyGranted;
}
```

(Adapt to the actual storage shape in achievements.ts — the existing code has type details that determine exact field names like `currentProgress` or `progress`.)

- [ ] **Step 6: Wire `checkAchievements` calls into the run-completion paths**

In `src/app/game.tsx`, after a run ends (game-over branch), call:

```tsx
import { checkAchievements } from '@/lib/utils/achievements';

// inside the game-over handler:
await checkAchievements({
  runMode: 'endless',
  score,
  maxMultiplier: multiplier,
  durationMs: Date.now() - runStartTimestampRef.current,
  didMerge: multiplier > 1,
  didDailyComplete: false,
  dailyStreakDays: 0,
  dailiesPlayedTotal: 0,
});
```

You'll need to track `runStartTimestampRef` — add `const runStartTimestampRef = useRef<number>(Date.now());` and reset it in `startNewGame`.

In `src/app/daily.tsx`, do the same on completion with `runMode: 'daily'` and the daily-streak / total counters from a small new helper in `src/lib/daily/seed.ts` (created in T8).

- [ ] **Step 7: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(achievements): wire grants for slim 6-badge catalog with TDD tests"
```

---

## Task 5: Share grid generator (TDD)

Pure function: takes a board state + score + multiplier + puzzle id, returns the formatted multi-line emoji string.

**Files:**
- Create: `src/lib/share/grid.ts`
- Test: `src/lib/share/grid.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/share/grid.test.ts
import { describe, it, expect } from '@jest/globals';
import { renderShareGrid, ShareGridInput } from './grid';

const empty = (): (null | { color: string; gem?: boolean; mult?: number })[][] =>
  Array.from({ length: 8 }, () => Array(8).fill(null));

describe('renderShareGrid', () => {
  it('formats the header line with puzzle id, score, and combo', () => {
    const out = renderShareGrid({ puzzleId: '142', score: 24180, maxMultiplier: 7, board: empty() });
    expect(out.split('\n')[0]).toBe('Block Merge #142 · 24,180 · ×7 combo');
  });

  it('omits the combo segment if maxMultiplier <= 1', () => {
    const out = renderShareGrid({ puzzleId: '5', score: 100, maxMultiplier: 1, board: empty() });
    expect(out.split('\n')[0]).toBe('Block Merge #5 · 100');
  });

  it('renders empty cells as ⬜', () => {
    const out = renderShareGrid({ puzzleId: '1', score: 0, maxMultiplier: 1, board: empty() });
    const lines = out.split('\n').slice(1, 9);
    for (const line of lines) {
      expect(line).toBe('⬜⬜⬜⬜⬜⬜⬜⬜');
    }
  });

  it('renders solid blocks as colored squares', () => {
    const board = empty();
    board[0][0] = { color: 'ember' };
    board[0][1] = { color: 'cobalt' };
    board[0][2] = { color: 'forest' };
    const out = renderShareGrid({ puzzleId: '1', score: 0, maxMultiplier: 1, board });
    expect(out.split('\n')[1].slice(0, 3)).toBe('🟧🟦🟩');
  });

  it('renders merged gems as colored circles with superscript multiplier', () => {
    const board = empty();
    board[0][0] = { color: 'ember', gem: true, mult: 5 };
    const out = renderShareGrid({ puzzleId: '1', score: 0, maxMultiplier: 5, board });
    // 🔴 + ⁵ — superscript five (U+2075)
    expect(out.split('\n')[1].startsWith('🔴⁵')).toBe(true);
  });

  it('appends the url footer', () => {
    const out = renderShareGrid({ puzzleId: '1', score: 0, maxMultiplier: 1, board: empty() });
    expect(out.endsWith('blockmerge.app')).toBe(true);
  });

  it('uses tabular grouping for scores >= 1,000', () => {
    const out = renderShareGrid({ puzzleId: '1', score: 1234567, maxMultiplier: 1, board: empty() });
    expect(out.split('\n')[0]).toContain('1,234,567');
  });
});
```

- [ ] **Step 2: Run failing tests**

```bash
npm test -- grid
```
Expected: module-not-found.

- [ ] **Step 3: Implement the generator**

```ts
// src/lib/share/grid.ts

export interface ShareGridCell {
  color: string;
  gem?: boolean;
  mult?: number;
}

export interface ShareGridInput {
  puzzleId: string;
  score: number;
  maxMultiplier: number;
  board: (ShareGridCell | null)[][];
}

const BLOCK_EMOJI: Record<string, string> = {
  ember: '🟧',
  cobalt: '🟦',
  forest: '🟩',
  mustard: '🟨',
  plum: '🟪',
  rose: '🟥',
  teal: '🟫',
  ink: '⬛',
};

const GEM_EMOJI: Record<string, string> = {
  ember: '🔴',
  cobalt: '🔵',
  forest: '🟢',
  mustard: '🟡',
  plum: '🟣',
  rose: '🌸',
  teal: '🔷',
  ink: '⚫',
};

const SUPERSCRIPTS = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];

function superscriptNumber(n: number): string {
  return String(n).split('').map((d) => SUPERSCRIPTS[Number(d)] ?? d).join('');
}

function formatHeader(input: ShareGridInput): string {
  const score = input.score.toLocaleString('en-US');
  if (input.maxMultiplier > 1) {
    return `Block Merge #${input.puzzleId} · ${score} · ×${input.maxMultiplier} combo`;
  }
  return `Block Merge #${input.puzzleId} · ${score}`;
}

function renderCell(cell: ShareGridCell | null): string {
  if (cell === null) return '⬜';
  if (cell.gem) {
    const base = GEM_EMOJI[cell.color] ?? '⚪';
    if (cell.mult && cell.mult > 1) return base + superscriptNumber(cell.mult);
    return base;
  }
  return BLOCK_EMOJI[cell.color] ?? '⬛';
}

export function renderShareGrid(input: ShareGridInput): string {
  const lines: string[] = [];
  lines.push(formatHeader(input));
  for (const row of input.board) {
    lines.push(row.map(renderCell).join(''));
  }
  lines.push('blockmerge.app');
  return lines.join('\n');
}
```

- [ ] **Step 4: Run tests — should pass**

```bash
npm test -- grid
```
Expected: 7 passing.

- [ ] **Step 5: Commit**

```bash
git add src/lib/share/
git commit -m "feat(share): annotated emoji grid generator with TDD coverage"
```

---

## Task 6: Wire share grid into `share.tsx`

Replace the Phase 1 placeholder with the real generator. Add a Copy button that uses `expo-clipboard`.

**Files:**
- Modify: `src/app/share.tsx`
- Modify: `src/lib/analytics/events.ts` (add `share_grid_copied` if not already there — note: `share_grid_tapped` already exists)

- [ ] **Step 1: Find where the player's last completed run lands in storage**

The replay system in `src/lib/utils/replay.ts` saves replays. Each replay should have `finalBoardState`, `finalScore`, `maxMultiplier`, `puzzleId` (or you may need to derive `puzzleId` from `runDate`). Read the file end-to-end to confirm the shape.

If `finalBoardState` isn't stored, pivot: store it on the replay record going forward (modify `src/lib/game/replay-recorder.ts` to capture board state at game-over). This may add a Step 1.5 to the task.

- [ ] **Step 2: Add a `getLastCompletedRun()` helper in `src/lib/utils/replay.ts`**

```ts
export async function getLastCompletedRun(): Promise<{
  puzzleId: string;
  score: number;
  maxMultiplier: number;
  board: (ShareGridCell | null)[][];
} | null> {
  const replays = await getReplays();
  if (replays.length === 0) return null;
  const latest = replays[0]; // assumes sorted desc by createdAt
  return {
    puzzleId: latest.puzzleId ?? latest.runDate ?? 'unknown',
    score: latest.finalScore,
    maxMultiplier: latest.maxMultiplier ?? 1,
    board: latest.finalBoardState ?? [],
  };
}
```

Adapt to actual replay record shape. If `finalBoardState` is missing, defer this task — Phase 2 owes a small replay-recorder upgrade.

- [ ] **Step 3: Update `src/app/share.tsx`**

Replace the placeholder JSX with a real grid render and a Copy button:

```tsx
import * as Clipboard from 'expo-clipboard';
import { renderShareGrid } from '@/lib/share/grid';
import { getLastCompletedRun } from '@/lib/utils/replay';
import { track } from '@/lib/analytics/events';
// ... existing imports

const [grid, setGrid] = useState<string | null>(null);
const [score, setScore] = useState(0);

useEffect(() => {
  (async () => {
    const run = await getLastCompletedRun();
    if (!run) return;
    setScore(run.score);
    setGrid(renderShareGrid(run));
  })();
}, []);

const onCopy = async () => {
  if (!grid) return;
  await Clipboard.setStringAsync(grid);
  track('share_grid_tapped', { source: 'daily', score });
  // TODO: surface a toast/snackbar — using `burnt` package which is already in deps
};

// JSX:
{grid ? (
  <GlassCard style={{ padding: 20, width: '100%', maxWidth: 360 }}>
    <Text style={{ fontFamily: 'Courier', fontSize: 12, color: colors.ink, lineHeight: 16 }}>
      {grid}
    </Text>
  </GlassCard>
) : (
  <Text style={{ color: colors.inkSoft, padding: 24, textAlign: 'center' }}>
    Finish a run to generate your grid.
  </Text>
)}
<TactileButton testID="copy-grid-button" variant="primary" onPress={onCopy} style={{ marginTop: 18, maxWidth: 360 }} disabled={!grid}>
  Copy grid
</TactileButton>
```

(Confirm `expo-clipboard` is installed: `grep expo-clipboard package.json`. It is — Phase 1 noted it.)

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 5: Visual smoke test**

```bash
npm start
```

Tap Home → Endless → play and lose. Then navigate to Share. Confirm the grid renders with proper emoji rows and the header looks like the spec example.

- [ ] **Step 6: Commit**

```bash
git add src/app/share.tsx src/lib/utils/replay.ts
git commit -m "feat(share): wire annotated emoji grid into share screen with Copy button"
```

---

## Task 7: ADR — delete the 5-min Sprint mode (do not preserve as subscriber feature)

Resolve the open question. Delete the timer code rather than parking it as a future "Sprint" mode for subscribers.

**Files:**
- Create: `docs/decisions/0003-sprint-mode-fate.md`

- [ ] **Step 1: Write the ADR**

```markdown
<!-- docs/decisions/0003-sprint-mode-fate.md -->
# ADR 0003: Delete the 5-min Sprint Mode

**Status:** Active
**Date:** 2026-05-06
**Decision:** Delete the timer-based tournament code path entirely. No "Sprint" mode for subscribers in v1.

## Context

The Phase 1 codebase preserved the 5-minute tournament timer logic in `daily.tsx` (renamed from `tournament.tsx`). The launch design committed to one-run-no-timer for the daily, but left open whether the timer code should be re-purposed as a "Sprint" mode (subscriber perk) or deleted.

Subscriber perks already include: daily archive, GIF export, monthly cosmetic theme, no-ads guarantee. That's enough value for $3.99/mo at v1.

## Decision

Delete. Reasons:

1. **Scope reduction.** Maintaining a second game mode is not free — paywall logic, separate Maestro flow, separate analytics events, separate UI surface, separate balance tuning.
2. **Different game.** A timed run plays differently from an untimed one. Pacing the same merge mechanic into 5 minutes pushes players toward speed-clears, undercutting the "patience-rewarded" positioning.
3. **Re-addable later.** If subscriber retention plateaus post-launch and we need fresh content, Sprint mode is exactly the kind of feature you can add in 2 weeks. No need to carry the code burden until then.

## Consequences

- T8 strips all timer logic from `daily.tsx`.
- T8 deletes `src/components/TournamentTimer.tsx`.
- T8 deletes timer state, `time_remaining` computations, freeze power-up logic (the freeze power-up is gone with the timer — it has no meaning).
- Power-ups in v1: Reroll, Blast, Target. (Freeze deleted.)
- ColorBomb stays — it's gameplay-affecting, not timer-affecting.

## Revisit if

Subscriber retention drops below 25% at month 3 and we need new modes to drive resubscription.
```

- [ ] **Step 2: Commit**

```bash
git add docs/decisions/0003-sprint-mode-fate.md
git commit -m "docs(adr): delete sprint mode, no timer-based daily in v1"
```

---

## Task 8: Strip the 5-min timer from Daily; rename utils/tournament → daily/seed

Implements the T7 ADR.

**Files:**
- Modify: `src/app/daily.tsx`
- Delete: `src/components/TournamentTimer.tsx`
- Move: `src/lib/utils/tournament.ts` → `src/lib/daily/seed.ts`
- Modify: `src/lib/game/powerups.ts` (drop the `freeze` power-up entirely)
- Modify: imports throughout

- [ ] **Step 1: Move the seed/utility module**

```bash
mkdir -p src/lib/daily
git mv src/lib/utils/tournament.ts src/lib/daily/seed.ts
```

- [ ] **Step 2: Rename internal symbols in `src/lib/daily/seed.ts`**

Read the file. Functions like `getTournamentSeed`, `getTimeRemaining`, `isTournamentActive`, etc. need to be:
- Renamed: `getTournamentSeed` → `getDailySeed`, `getTodayDateString` stays.
- Removed: `getTimeRemaining`, `isTournamentActive`, anything timer-related.

Add helpers required by T4 / Achievement grants:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const DAILIES_PLAYED_KEY = '@block_merge:dailies_played_total';
const DAILY_LAST_PLAYED_KEY = '@block_merge:daily_last_played';
const DAILY_STREAK_KEY = '@block_merge:daily_streak';

export async function recordDailyCompletion(puzzleId: string): Promise<{ totalPlayed: number; streakDays: number }> {
  // total
  const totalRaw = await AsyncStorage.getItem(DAILIES_PLAYED_KEY);
  const totalPlayed = (totalRaw ? parseInt(totalRaw, 10) : 0) + 1;
  await AsyncStorage.setItem(DAILIES_PLAYED_KEY, String(totalPlayed));

  // streak — increments if last_played was yesterday's puzzleId, resets if older gap, no-op if same id
  const lastPlayed = await AsyncStorage.getItem(DAILY_LAST_PLAYED_KEY);
  const prevStreakRaw = await AsyncStorage.getItem(DAILY_STREAK_KEY);
  const prevStreak = prevStreakRaw ? parseInt(prevStreakRaw, 10) : 0;
  let streakDays: number;
  if (lastPlayed === puzzleId) {
    streakDays = prevStreak; // same daily, no change
  } else if (lastPlayed && isYesterday(lastPlayed, puzzleId)) {
    streakDays = prevStreak + 1;
  } else {
    streakDays = 1; // either first ever, or gap broke streak
  }
  await AsyncStorage.setItem(DAILY_LAST_PLAYED_KEY, puzzleId);
  await AsyncStorage.setItem(DAILY_STREAK_KEY, String(streakDays));
  return { totalPlayed, streakDays };
}

function isYesterday(prevId: string, todayId: string): boolean {
  // puzzleId is YYYY-MM-DD per getTodayDateString
  const prev = new Date(prevId + 'T00:00:00Z').getTime();
  const today = new Date(todayId + 'T00:00:00Z').getTime();
  const diff = today - prev;
  return diff > 0 && diff <= 36 * 60 * 60 * 1000; // up to 36h grace for timezone slop
}
```

- [ ] **Step 3: Update every import of the old path**

```bash
git grep -l "from '@/lib/utils/tournament'" src/
```

For each file, change to `from '@/lib/daily/seed'`. Symbol renames if needed: `getTournamentSeed` → `getDailySeed`.

- [ ] **Step 4: Strip timer from `src/app/daily.tsx`**

Find every reference to:
- `TournamentTimer` (the component)
- `timeRemaining`, `setTimeRemaining`
- `handleTimeUp`
- The 5-minute interval / countdown logic

Delete them all. The run continues until `hasValidMoves(...)` returns false (the same condition Game uses).

After the existing run-end branch, add:

```tsx
import { recordDailyCompletion, getTodayDateString } from '@/lib/daily/seed';
import { checkAchievements } from '@/lib/utils/achievements';

// inside game-over handler, after saving the score:
const puzzleId = getTodayDateString();
const { totalPlayed, streakDays } = await recordDailyCompletion(puzzleId);
const granted = await checkAchievements({
  runMode: 'daily',
  score,
  maxMultiplier: multiplier,
  durationMs: Date.now() - runStartTimestampRef.current,
  didMerge: multiplier > 1,
  didDailyComplete: true,
  dailyStreakDays: streakDays,
  dailiesPlayedTotal: totalPlayed,
});
track('daily_completed', { puzzle_id: puzzleId, score, max_multiplier: multiplier });
// granted IDs can be passed to a "you unlocked X" toast — Phase 2 UI is optional
```

- [ ] **Step 5: Delete `src/components/TournamentTimer.tsx`**

```bash
rm src/components/TournamentTimer.tsx
```

- [ ] **Step 6: Drop the `freeze` power-up**

In `src/lib/game/powerups.ts`, find the `freeze` entry in the catalog and delete it. Remove `Freeze` from any UI lists (e.g. `POWER_UP_META` in `src/app/game.tsx`). Delete `src/lib/game/powerups/freeze.ts` if it exists.

```bash
git grep -l -i "freeze" src/
```

Update each match — usually just deleting an entry.

- [ ] **Step 7: Update Maestro flow `daily.yaml`**

Open `.maestro/flows/gameplay/daily.yaml`. Remove any assertions about a 5-minute timer or "TIME REMAINING" text. The flow should now:

```yaml
appId: com.blockmergearena.app
---
- launchApp
- assertVisible:
    id: "home-screen"
- tapOn:
    id: "tournament-button"
- assertVisible:
    id: "tournament-screen"
- tapOn:
    id: "start-tournament-button"
- assertVisible:
    id: "cell-0-0"
```

(The testIDs preserve from Phase 1 to keep the flow stable. We may rename them in a future cleanup task.)

- [ ] **Step 8: Typecheck and run jest**

```bash
npm run typecheck && npm test
```

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(daily): drop 5-min timer; switch to one-run-no-retries; add streak tracking"
```

---

## Task 9: ADR — AI-generated SFX for v1

Resolve the second open question.

**Files:**
- Create: `docs/decisions/0004-cascade-audio-source.md`

- [ ] **Step 1: Write the ADR**

```markdown
<!-- docs/decisions/0004-cascade-audio-source.md -->
# ADR 0004: Cascade Audio Source

**Status:** Active
**Date:** 2026-05-06
**Decision:** AI-generated SFX for v1 (ElevenLabs SFX or equivalent), committed as static `.m4a` files in `assets/sounds/`. Revisit post-soft-launch.

## Context

The merge cascade spec (§ 4 of the launch design) specifies tier-based audio:
- 2× = warm bell strike
- 3× = layered bells
- 5× = bells + low hum sustain
- 7×+ = chord swell + sub-bass thump
- chain bonus = rising semitone per merge

The launch design recommended a sound designer (~$2–4k). The Phase 1 plan called this out as an open question.

## Decision

**AI-generated SFX for v1.** Reasons:

1. **Pre-PMF risk management.** Spending $2–4k on bespoke audio before product-market-fit is validated is premature. Soft launch in Phase 4 will generate retention numbers we can decide against.
2. **Speed.** AI-generated sounds via ElevenLabs SFX or similar can be iterated in hours, not weeks. Phase 2 has fixed timing constraints.
3. **Quality bar is achievable.** Modern AI SFX is good enough for "feels different from Block Blast" without a designer. The bar is "doesn't feel cheap," not "sounds like a film."
4. **Re-do later.** If soft-launch metrics validate the game and audio is identified as a low-quality area, replacing assets is one PR — the loader is decoupled from the assets.

## Generation prompts (commit these alongside the ADR)

For each tier, generate at `~1.0s` length, `44.1kHz`, mono `.m4a`:

| File | Prompt |
|---|---|
| `merge-2x.m4a` | "Soft warm chime, single struck bell, glockenspiel timbre, decay 0.8s" |
| `merge-3x.m4a` | "Layered bell chord, third + fifth interval, glockenspiel + marimba undertone, decay 0.9s" |
| `merge-5x.m4a` | "Layered bells with sustained low hum underneath, weighty satisfying, 1.0s" |
| `merge-7x.m4a` | "Full bell chord swell with sub-bass thump on attack, dramatic, 1.2s" |

Place the generated files at `assets/sounds/`. Commit them.

## Consequences

- `src/lib/audio/sfx.ts` loads these four files at boot via `expo-av`.
- Asset bundle size: ~4 × 30KB = 120KB. Negligible.
- Total audio cost for v1: $0–$30 (free tier of most AI audio services).
- Future replacement is a single-commit drop-in.

## Revisit if

Soft launch (Phase 4) shows D7 retention ≥ 30% AND share rate ≥ 5% — the game is working but feels low-fi. At that point, hire a designer for ~$2k to re-record the four tier sounds plus add UI + music.
```

- [ ] **Step 2: Commit**

```bash
git add docs/decisions/0004-cascade-audio-source.md
git commit -m "docs(adr): AI-generated SFX for v1; sound designer post-soft-launch if metrics warrant"
```

---

## Task 10: Audio module — load + trigger by tier

The runtime side of T9. Tier-driven `playMergeSound(multiplier)` API.

**Files:**
- Create: `src/lib/audio/sfx.ts`
- Test: `src/lib/audio/sfx.test.ts` (tier-mapping logic only — actual playback is hard to unit-test)
- Asset placeholders: `assets/sounds/.gitkeep` (the actual `.m4a` files come from a separate human-driven step described in the ADR; T10 commits the loader code, T17 commits the sound files)

- [ ] **Step 1: Write tier-mapping test**

```ts
// src/lib/audio/sfx.test.ts
import { describe, it, expect } from '@jest/globals';
import { tierForMultiplier, AudioTier } from './sfx';

describe('tierForMultiplier', () => {
  it.each([
    [1, null],
    [2, '2x'],
    [3, '3x'],
    [4, '3x'], // 4 falls into the 3x bucket
    [5, '5x'],
    [6, '5x'],
    [7, '7x'],
    [12, '7x'],
  ] as [number, AudioTier | null][])('multiplier %i → tier %s', (mult, expected) => {
    expect(tierForMultiplier(mult)).toBe(expected);
  });
});
```

- [ ] **Step 2: Implement `src/lib/audio/sfx.ts`**

```ts
import { Audio } from 'expo-av';

export type AudioTier = '2x' | '3x' | '5x' | '7x';

const SOUND_FILES: Record<AudioTier, number> = {
  '2x': require('../../../assets/sounds/merge-2x.m4a'),
  '3x': require('../../../assets/sounds/merge-3x.m4a'),
  '5x': require('../../../assets/sounds/merge-5x.m4a'),
  '7x': require('../../../assets/sounds/merge-7x.m4a'),
};

const sounds: Partial<Record<AudioTier, Audio.Sound>> = {};
let initPromise: Promise<void> | null = null;

export async function initSfx(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: false,
      shouldDuckAndroid: true,
    });
    for (const tier of ['2x', '3x', '5x', '7x'] as AudioTier[]) {
      try {
        const { sound } = await Audio.Sound.createAsync(SOUND_FILES[tier]);
        sounds[tier] = sound;
      } catch (e) {
        console.warn(`[sfx] failed to load ${tier}`, e);
      }
    }
  })();
  return initPromise;
}

export function tierForMultiplier(mult: number): AudioTier | null {
  if (mult < 2) return null;
  if (mult < 3) return '2x';
  if (mult < 5) return '3x';
  if (mult < 7) return '5x';
  return '7x';
}

export async function playMergeSound(multiplier: number): Promise<void> {
  const tier = tierForMultiplier(multiplier);
  if (!tier) return;
  const sound = sounds[tier];
  if (!sound) return;
  try {
    await sound.replayAsync();
  } catch (e) {
    // ignore — sound effects are best-effort
  }
}
```

- [ ] **Step 3: Add asset placeholder + create the assets directory**

```bash
mkdir -p assets/sounds
touch assets/sounds/.gitkeep
```

(The actual `.m4a` files arrive in T17. T10 only commits the loader code with a `.gitkeep` so the directory exists in git.)

Add a guard in `initSfx` so missing files don't crash:

```ts
// already wrapped in try/catch above — verify it gracefully no-ops
```

- [ ] **Step 4: Run tests**

```bash
npm test -- sfx
```
Expected: tier-mapping tests pass.

- [ ] **Step 5: Wire `initSfx()` into `_layout.tsx`**

```tsx
import { initSfx } from '@/lib/audio/sfx';

useEffect(() => {
  (async () => {
    await migrateStorageKeys();
    await Promise.all([initAnalytics(), initSfx()]);
    track('app_opened', { source: 'cold_launch' });
  })();
}, []);
```

- [ ] **Step 6: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/audio/ assets/sounds/.gitkeep src/app/_layout.tsx
git commit -m "feat(audio): tier-driven merge SFX loader with TDD tests; placeholder assets"
```

---

## Task 11: Haptic module — tier-driven patterns

Phase 1's spec § 4 lays out haptic patterns per tier. Wire them.

**Files:**
- Create: `src/lib/haptics/cascade.ts`
- Test: `src/lib/haptics/cascade.test.ts` (tier-mapping only)

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/haptics/cascade.test.ts
import { describe, it, expect } from '@jest/globals';
import { hapticTierFor } from './cascade';

describe('hapticTierFor', () => {
  it.each([
    [1, 'none'],
    [2, 'light'],
    [3, 'medium'],
    [4, 'medium'],
    [5, 'heavy-double'],
    [6, 'heavy-double'],
    [7, 'heavy-triple'],
    [10, 'heavy-triple'],
  ] as [number, string][])('multiplier %i → %s', (mult, expected) => {
    expect(hapticTierFor(mult)).toBe(expected);
  });
});
```

- [ ] **Step 2: Implement `src/lib/haptics/cascade.ts`**

```ts
import * as Haptics from 'expo-haptics';

export type HapticTier = 'none' | 'light' | 'medium' | 'heavy-double' | 'heavy-triple';

export function hapticTierFor(multiplier: number): HapticTier {
  if (multiplier < 2) return 'none';
  if (multiplier < 3) return 'light';
  if (multiplier < 5) return 'medium';
  if (multiplier < 7) return 'heavy-double';
  return 'heavy-triple';
}

export async function fireMergeHaptic(multiplier: number): Promise<void> {
  const tier = hapticTierFor(multiplier);
  switch (tier) {
    case 'none':
      return;
    case 'light':
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    case 'medium':
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      return;
    case 'heavy-double':
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 80);
      return;
    case 'heavy-triple':
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 80);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 160);
      return;
  }
}
```

- [ ] **Step 3: Run tests**

```bash
npm test -- haptics/cascade
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/haptics/
git commit -m "feat(haptics): tier-driven cascade haptic patterns with TDD coverage"
```

---

## Task 12: `MergeAnimation` component — Reanimated cascade

The visual heart of the cascade. Implements the timing from spec § 4: line clear (80ms) → gem reveal (60ms) → cluster pull (280ms) → fusion (180ms) → hold (100ms). Slow-mo for 5×+ stretches the cluster-pull and fusion phases.

**Files:**
- Create: `src/components/cascade/MergeAnimation.tsx`

This is the most complex task in Phase 2. Code is long; show structurally then iterate.

- [ ] **Step 1: Define the component contract**

```tsx
// src/components/cascade/MergeAnimation.tsx
import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { AccessibilityInfo } from 'react-native';
import { colors, fontWeight, blockColors } from '@/lib/design/tokens';
import { playMergeSound } from '@/lib/audio/sfx';
import { fireMergeHaptic } from '@/lib/haptics/cascade';

export interface MergeAnimationProps {
  /** Multiplier achieved this merge. Drives audio/haptic tier and slow-mo. */
  multiplier: number;
  /** Color of the merged gem (drives the visual). */
  color: keyof typeof blockColors;
  /** Approximate position on screen — used for the burst origin. */
  origin: { x: number; y: number };
  /** Called when the cascade animation completes. */
  onComplete: () => void;
}

export function MergeAnimation({ multiplier, color, origin, onComplete }: MergeAnimationProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const counter = useSharedValue(0);

  useEffect(() => {
    let reduced = false;
    AccessibilityInfo.isReduceMotionEnabled().then((r) => { reduced = r; runCascade(reduced); });
  }, []);

  function runCascade(reduced: boolean) {
    // Tier-driven slow-mo: 5×+ stretches phases by 1/0.55 ≈ 1.82×
    const slow = !reduced && multiplier >= 5 ? 1 / 0.55 : 1;
    const phaseLineClear = 80;
    const phaseReveal = 60;
    const phasePull = 280 * slow;
    const phaseFusion = 180 * slow;
    const phaseHold = 100;

    // Reduced-motion shortcut: halve durations, no overshoot
    const durFn = reduced ? (n: number) => n / 2 : (n: number) => n;

    // Side effects (audio + haptic) fire at start, in parallel with visual
    playMergeSound(multiplier);
    fireMergeHaptic(multiplier);

    // Multiplier number ramp
    counter.value = withTiming(multiplier, {
      duration: durFn(phaseFusion),
      easing: Easing.out(Easing.cubic),
    });

    // Scale: 0 → 1.08 (overshoot) → 1.0
    scale.value = withSequence(
      withDelay(durFn(phaseLineClear + phaseReveal), withTiming(reduced ? 1 : 1.08, { duration: durFn(phasePull), easing: Easing.out(Easing.cubic) })),
      withTiming(1, { duration: durFn(phaseFusion), easing: Easing.inOut(Easing.cubic) })
    );

    // Opacity: 0 → 1 → hold → 0
    opacity.value = withSequence(
      withDelay(durFn(phaseLineClear), withTiming(1, { duration: durFn(phaseReveal + phasePull), easing: Easing.out(Easing.cubic) })),
      withDelay(durFn(phaseHold), withTiming(0, { duration: 200, easing: Easing.in(Easing.cubic) }, () => runOnJS(onComplete)()))
    );
  }

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: origin.x },
      { translateY: origin.y },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }, containerStyle]}>
      <View
        style={{
          width: 80, height: 80, borderRadius: 40,
          backgroundColor: blockColors[color].base,
          shadowColor: blockColors[color].base,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.7, shadowRadius: 24,
          elevation: 12,
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <AnimatedNumber value={counter} color="white" />
      </View>
    </Animated.View>
  );
}

function AnimatedNumber({ value, color }: { value: Animated.SharedValue<number>; color: string }) {
  const [displayValue, setDisplayValue] = React.useState(0);
  useAnimatedReaction(
    () => Math.round(value.value),
    (v) => runOnJS(setDisplayValue)(v),
  );
  return <Text style={{ color, fontSize: 28, fontWeight: fontWeight.black, letterSpacing: -1 }}>{displayValue}×</Text>;
}
```

- [ ] **Step 2: Add the missing import**

```tsx
import { useAnimatedReaction } from 'react-native-reanimated';
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

If Reanimated complains about types, ensure `tsconfig.json` includes `react-native-reanimated/plugin` (Phase 1 didn't touch this — Expo's preset should handle it, but verify with `cat babel.config.js`).

- [ ] **Step 4: Commit**

```bash
git add src/components/cascade/
git commit -m "feat(cascade): merge animation with tier-driven slow-mo + reduced-motion support"
```

---

## Task 13: Wire `MergeAnimation` into Game and Daily

The cascade should fire when a merge actually occurs in `src/app/game.tsx` and `src/app/daily.tsx`.

**Files:**
- Modify: `src/app/game.tsx`
- Modify: `src/app/daily.tsx`

- [ ] **Step 1: Find the merge-detected branch in `game.tsx`**

In `handleCellPress`, after lines clear and `mergeGems` runs, the code already detects "large gems" and sets `showGemMerge`. Replace that with rendering `<MergeAnimation />`:

```tsx
import { MergeAnimation } from '@/components/cascade/MergeAnimation';
import { resolveBlockColor } from '@/lib/design/tokens';

// State:
const [activeCascade, setActiveCascade] = useState<{
  id: number;
  multiplier: number;
  color: keyof typeof blockColors;
  origin: { x: number; y: number };
} | null>(null);

// In the merge-detected branch (where Phase 1 had setShowGemMerge):
if (largeGems.length > 0) {
  const bestGem = largeGems.reduce((best, current) =>
    sizeOrder[current.size] > sizeOrder[best.size] ? current : best, largeGems[0]
  );
  setActiveCascade({
    id: Date.now(),
    multiplier: bestGem.multiplier,
    color: resolveBlockColor(bestGem.color),
    origin: { x: 0, y: 200 }, // Phase 2 v1: center; Phase 2.1 can compute exact gem position
  });
}

// JSX overlay:
{activeCascade && (
  <MergeAnimation
    key={activeCascade.id}
    multiplier={activeCascade.multiplier}
    color={activeCascade.color}
    origin={activeCascade.origin}
    onComplete={() => setActiveCascade(null)}
  />
)}
```

The existing `<GemMergeEffect>` component can be removed/deprecated — the new cascade replaces it. Remove its import and its render block.

- [ ] **Step 2: Same wiring in `src/app/daily.tsx`**

Find the merge-detection in daily's gameplay handler. Apply the identical state + JSX pattern.

If Daily delegates gameplay to a shared component, wire there. Otherwise inline.

- [ ] **Step 3: Typecheck and visual smoke test**

```bash
npm run typecheck && npm start
```

Play either mode, get a merge with a multiplier ≥ 2, watch the cascade fire. With audio assets missing (T17 commits them), audio is a no-op; haptic should fire on a real device; visual should display the gem-circle overlay.

- [ ] **Step 4: Commit**

```bash
git add src/app/game.tsx src/app/daily.tsx
git commit -m "feat(cascade): fire MergeAnimation on multiplier-merge in game and daily"
```

---

## Task 14: Daily archive Firestore schema (ADR + module)

Subscriber-gated reads from a `puzzles` collection plus per-user archive completion records.

**Files:**
- Create: `docs/decisions/0006-archive-firestore-schema.md`
- Create: `src/lib/daily/archive.ts`
- Create: `src/lib/subscription/gate.ts`

- [ ] **Step 1: Write the schema ADR**

```markdown
<!-- docs/decisions/0006-archive-firestore-schema.md -->
# ADR 0006: Daily Archive Firestore Schema

**Status:** Active
**Date:** 2026-05-06

## Collections

```
puzzles/{puzzleId}                   # public, lazily populated
  date: timestamp                     # midnight UTC of the puzzle day
  seed: string                        # the deterministic seed used by clients
  topScore: number
  topPlayerName: string?              # optional public display
  playCount: number
  createdAt: timestamp

users/{uid}/archive/{puzzleId}       # private to user
  played: boolean
  score: number
  multiplier: number
  durationMs: number
  completedAt: timestamp
```

## Why two collections, not nested

Querying "what did *I* play?" is fast against `users/{uid}/archive/`. Querying "what's the all-time top score for puzzle #142?" is fast against `puzzles/{puzzleId}`. Both are O(1) lookups by document ID.

## Population

`puzzles/{puzzleId}` is lazy-created the first time a player completes that puzzle. The leaderboard logic from Phase 1 (`saveScore`) is the natural place — it already writes to Firestore. Extend it to also upsert the `puzzles` doc.

## Security rules

```
match /puzzles/{puzzleId} {
  allow read: if true;
  allow create, update: if request.auth != null
    && request.resource.data.score is int
    && request.resource.data.score < 1000000;
}
match /users/{uid}/archive/{puzzleId} {
  allow read, write: if request.auth != null && request.auth.uid == uid;
}
```

## Subscriber gate

Reading the archive list (`getArchive(uid)`) is allowed for any authenticated user. The *UX* gate is in the client: `requireSubscription()` returns false for non-subscribers and the archive UI shows the paywall.

We do not enforce subscription server-side in v1 — Phase 4 adds App Check + Cloud Functions if abuse becomes a problem. For v1, client-side gating is fine; the data is already public-ish.
```

- [ ] **Step 2: Implement the gate stub**

```ts
// src/lib/subscription/gate.ts

/**
 * Phase 2 stub — always returns false (no subscription).
 * Phase 3 replaces with a RevenueCat-backed subscription state hook.
 */
export function requireSubscription(): boolean {
  return false;
}
```

- [ ] **Step 3: Implement the archive module**

```ts
// src/lib/daily/archive.ts
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { auth } from '@/lib/firebase/config';

export interface ArchiveEntry {
  puzzleId: string;
  played: boolean;
  score: number;
  multiplier: number;
  completedAt: number | null;
}

export async function getArchive(daysBack = 30): Promise<ArchiveEntry[]> {
  if (!db || !auth?.currentUser) return [];
  const ref = collection(db, 'users', auth.currentUser.uid, 'archive');
  const q = query(ref, orderBy('completedAt', 'desc'), limit(daysBack));
  const snap = await getDocs(q);
  return snap.docs.map((doc) => {
    const data = doc.data() as Partial<ArchiveEntry>;
    return {
      puzzleId: doc.id,
      played: data.played ?? false,
      score: data.score ?? 0,
      multiplier: data.multiplier ?? 1,
      completedAt: data.completedAt ?? null,
    };
  });
}
```

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add docs/decisions/0006-archive-firestore-schema.md src/lib/daily/archive.ts src/lib/subscription/
git commit -m "feat(archive): firestore schema + read module + paywall gate stub"
```

---

## Task 15: Daily archive UI in `daily.tsx` (subscriber-gated)

Add an "Archive" button that opens a list of past puzzles. Non-subscribers see a paywall card.

**Files:**
- Modify: `src/app/daily.tsx`

- [ ] **Step 1: Add a state-driven archive panel**

```tsx
import { getArchive, ArchiveEntry } from '@/lib/daily/archive';
import { requireSubscription } from '@/lib/subscription/gate';

const [showArchive, setShowArchive] = useState(false);
const [archive, setArchive] = useState<ArchiveEntry[]>([]);

const onArchivePress = async () => {
  if (!requireSubscription()) {
    setShowPaywall(true);
    track('paywall_viewed', { source: 'archive' });
    return;
  }
  const entries = await getArchive();
  setArchive(entries);
  setShowArchive(true);
};
```

- [ ] **Step 2: Add an "Archive" pill near the hero card**

```tsx
<Pressable onPress={onArchivePress} testID="archive-button">
  <Pill variant="ink">ARCHIVE</Pill>
</Pressable>
```

- [ ] **Step 3: Render the archive list when open**

```tsx
{showArchive && (
  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.paper, padding: 18, zIndex: 10 }}>
    <Pressable onPress={() => setShowArchive(false)} testID="close-archive-button">
      <Text style={{ color: colors.inkSoft }}>← back</Text>
    </Pressable>
    <Text style={{ fontSize: 28, fontWeight: fontWeight.black, color: colors.ink, marginTop: 12 }}>Archive</Text>
    <ScrollView style={{ flex: 1, marginTop: 12 }}>
      {archive.map((e) => (
        <GlassCard key={e.puzzleId} style={{ padding: 14, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontWeight: fontWeight.heavy, color: colors.ink }}>{e.puzzleId}</Text>
          <Text style={{ color: e.played ? colors.ember : colors.inkSoft }}>
            {e.played ? `${e.score.toLocaleString()} · ×${e.multiplier}` : 'unplayed'}
          </Text>
        </GlassCard>
      ))}
    </ScrollView>
  </View>
)}
```

- [ ] **Step 4: Add a simple paywall overlay (Phase 2 stub — Phase 3 makes it real)**

```tsx
const [showPaywall, setShowPaywall] = useState(false);

{showPaywall && (
  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(22,20,15,0.9)', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 20 }}>
    <View style={{ backgroundColor: colors.paper, borderRadius: 18, padding: 24, maxWidth: 360 }}>
      <Pill variant="ember">SUBSCRIBER</Pill>
      <Text style={{ fontSize: 24, fontWeight: fontWeight.black, color: colors.ink, marginTop: 14, letterSpacing: -1 }}>
        Daily Archive
      </Text>
      <Text style={{ color: colors.inkSoft, marginTop: 6 }}>
        Every past puzzle, replayable forever. Subscribers only.
      </Text>
      <Text style={{ color: colors.inkDim, marginTop: 12, fontSize: 12 }}>
        Subscriptions land in Phase 3.
      </Text>
      <TactileButton variant="ink" style={{ marginTop: 18 }} onPress={() => { setShowPaywall(false); track('paywall_dismissed', { source: 'archive' }); }}>
        Close
      </TactileButton>
    </View>
  </View>
)}
```

- [ ] **Step 5: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 6: Commit**

```bash
git add src/app/daily.tsx
git commit -m "feat(archive): daily archive UI with subscriber gate stub + paywall view"
```

---

## Task 16: Generate the four cascade SFX files

Manual step. Per ADR 0004, generate the four `.m4a` files using ElevenLabs SFX (or equivalent) with the prompts in the ADR.

**Files:**
- Create: `assets/sounds/merge-2x.m4a`, `merge-3x.m4a`, `merge-5x.m4a`, `merge-7x.m4a`

- [ ] **Step 1: Generate each file via ElevenLabs SFX**

Use the prompts from `docs/decisions/0004-cascade-audio-source.md`. Aim for ~1.0s, mono, 44.1kHz. Save as `.m4a` (or `.wav` and convert via `ffmpeg -i in.wav -c:a aac out.m4a`).

- [ ] **Step 2: Commit**

```bash
git add assets/sounds/
git commit -m "assets(audio): commit AI-generated cascade SFX (4 tier sounds)"
```

- [ ] **Step 3: Verify the loader picks them up**

```bash
npm start
```

Run the app on a real device (audio doesn't play on simulators reliably). Trigger a merge, confirm a sound plays. Iterate the prompts in T9 ADR if any tier sounds wrong.

---

## Task 17: Phase 2 gate verification

- [ ] **Step 1: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 2: Lint**

```bash
npm run lint
```

- [ ] **Step 3: Run all unit tests**

```bash
npm test
```

Expected: all tests pass (grid, grants, sfx tier-mapping, cascade haptics).

- [ ] **Step 4: Run Maestro suite**

```bash
npm run e2e
```

Surviving flows should still pass. Daily flow needs the new no-timer assertions from T8.

- [ ] **Step 5: Real-device manual checklist**

- Welcome → Home → Daily: hero card visible, "ARCHIVE" pill present.
- Tap ARCHIVE: paywall card appears (because `requireSubscription()` returns false in stub).
- Begin daily run: piece tray uses tactile `PiecesTray` (matches Game).
- Place pieces, line clear, get a merge with multiplier ≥ 2: `MergeAnimation` overlay fires, audio plays, haptic fires.
- Merge with multiplier ≥ 5: visible slow-mo on cluster-pull/fusion phases.
- Bust the run: game-over surfaces. Daily completion record written.
- Achievements screen: unlocked badges visible.
- Share screen: actual emoji grid renders using the just-completed run.
- Tap "Copy grid": `share_grid_tapped` event fires (visible in PostHog dashboard if env vars are set).

- [ ] **Step 6: Update plan checkboxes**

Mark every task complete in this file.

- [ ] **Step 7: Tag**

```bash
git add docs/superpowers/plans/2026-05-06-phase-2-differentiator.md
git commit -m "chore(phase-2): mark plan tasks complete"
git tag phase-2-complete
```

- [ ] **Step 8: Hand off to Phase 3**

Phase 3 owns: RevenueCat integration, paywall UI replacement, monetization SKUs, theme rotation. Invoke `superpowers:writing-plans` with: "Phase 3 of Block Merge launch — see spec § Phase 3. Phase 2 complete and tagged `phase-2-complete`."

---

## Open questions tracked into Phase 3

| # | Question | Answered when |
|---|---|---|
| 1 | Soft-launch country (Canada vs NZ) | Phase 4 plan |
| 2 | RevenueCat SKU pricing — $3.99/mo + $29.99/yr (per spec) is fine, or local-pricing tier? | Phase 3 plan |
| 3 | Cosmetic theme cadence sustainability (1/month) — confirmed only after we measure art-pipeline cost | Phase 3 plan |
| 4 | Does the achievement-unlocked toast need a polished UI? Phase 2 leaves it ungated | Phase 3 plan |
| 5 | Does the cascade `origin` need real screen-position math instead of the `{x:0, y:200}` placeholder? | Phase 4 polish or live measurement after soft launch |
