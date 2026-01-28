# Block Merge Arena - Fix All Issues Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all 15 TypeScript errors, 5 ESLint errors, and clean up 54 warnings to make the app compile and run correctly.

**Architecture:** Work through fixes in dependency order - start with type definitions, then exports, then function signatures, then cleanup. Each fix is isolated and testable.

**Tech Stack:** TypeScript 5.8.3, React Native 0.79.6, Expo SDK 53, ESLint

---

## Phase 1: Critical Type Fixes (Unblock Compilation)

### Task 1: Export BLOCK_SHAPES from pieces.ts

**Files:**
- Modify: `src/lib/game/pieces.ts:5`

**Step 1: Add export keyword to BLOCK_SHAPES**

Change line 5 from:
```typescript
const BLOCK_SHAPES: Record<BlockShapeType, Position[]> = {
```

To:
```typescript
export const BLOCK_SHAPES: Record<BlockShapeType, Position[]> = {
```

**Step 2: Run typecheck to verify fix**

Run: `npm run typecheck 2>&1 | grep -c "BLOCK_SHAPES"`
Expected: 0 (no more BLOCK_SHAPES errors)

**Step 3: Commit**

```bash
git add src/lib/game/pieces.ts
git commit -m "fix: export BLOCK_SHAPES for ReplayPlayer import"
```

---

### Task 2: Fix Position type in replay types (x/y → row/col)

**Files:**
- Modify: `src/lib/types/replay.ts:70-76`

**Step 1: Update CompactMove interface**

Change lines 70-76 from:
```typescript
export interface CompactMove {
  t: number; // timestamp
  p: string; // pieceId
  st: string; // shapeType
  x: number; // position.x
  y: number; // position.y
  sc: number; // score
  lc: number; // linesCleared
  mp: number; // multiplier
}
```

To:
```typescript
export interface CompactMove {
  t: number; // timestamp
  p: string; // pieceId
  st: string; // shapeType
  r: number; // position.row
  c: number; // position.col
  sc: number; // score
  lc: number; // linesCleared
  mp: number; // multiplier
}
```

**Step 2: Run typecheck**

Run: `npm run typecheck 2>&1 | grep "replay.ts"`
Expected: Shows errors in replay.ts utils (we'll fix next)

**Step 3: Commit**

```bash
git add src/lib/types/replay.ts
git commit -m "fix: change CompactMove position from x/y to row/col"
```

---

### Task 3: Fix replay.ts utility to use row/col

**Files:**
- Modify: `src/lib/utils/replay.ts:41-50,73-81`

**Step 1: Update compressReplay function (lines 41-50)**

Change:
```typescript
    mv: replay.moves.map((move: ReplayMove): CompactMove => ({
      t: move.timestamp,
      p: move.pieceId,
      st: move.shapeType,
      x: move.position.x,
      y: move.position.y,
      sc: move.score,
      lc: move.linesCleared,
      mp: move.multiplier,
    })),
```

To:
```typescript
    mv: replay.moves.map((move: ReplayMove): CompactMove => ({
      t: move.timestamp,
      p: move.pieceId,
      st: move.shapeType,
      r: move.position.row,
      c: move.position.col,
      sc: move.score,
      lc: move.linesCleared,
      mp: move.multiplier,
    })),
```

**Step 2: Update decompressReplay function (lines 73-81)**

Change:
```typescript
    moves: compact.mv.map((move: CompactMove): ReplayMove => ({
      timestamp: move.t,
      pieceId: move.p,
      shapeType: move.st,
      position: { x: move.x, y: move.y },
      score: move.sc,
      linesCleared: move.lc,
      multiplier: move.mp,
    })),
```

To:
```typescript
    moves: compact.mv.map((move: CompactMove): ReplayMove => ({
      timestamp: move.t,
      pieceId: move.p,
      shapeType: move.st,
      position: { row: move.r, col: move.c },
      score: move.sc,
      linesCleared: move.lc,
      multiplier: move.mp,
    })),
```

**Step 3: Run typecheck**

Run: `npm run typecheck 2>&1 | grep "replay.ts"`
Expected: No errors in replay.ts

**Step 4: Commit**

```bash
git add src/lib/utils/replay.ts
git commit -m "fix: use row/col instead of x/y in replay compression"
```

---

### Task 4: Fix tournament.tsx Position usage

**Files:**
- Modify: `src/app/tournament.tsx:340`

**Step 1: Find and fix the Position object**

Search for the line creating Position with x/y and change to row/col.

Run: `grep -n "x:" src/app/tournament.tsx | head -5`

Change from:
```typescript
position: { x: col, y: row },
```

To:
```typescript
position: { row, col },
```

**Step 2: Run typecheck**

Run: `npm run typecheck 2>&1 | grep "tournament.tsx"`
Expected: No Position errors

**Step 3: Commit**

```bash
git add src/app/tournament.tsx
git commit -m "fix: use row/col for Position in tournament replay recording"
```

---

### Task 5: Fix ReplayPlayer placePiece call signature

**Files:**
- Modify: `src/components/ReplayPlayer.tsx:86`

**Step 1: Update placePiece call to pass row and col separately**

Change line 86 from:
```typescript
    const newBoard = placePiece(board, piece, move.position);
```

To:
```typescript
    const newBoard = placePiece(board, piece, move.position.row, move.position.col);
```

**Step 2: Run typecheck**

Run: `npm run typecheck 2>&1 | grep "ReplayPlayer"`
Expected: Only the Timeout type error remains

**Step 3: Commit**

```bash
git add src/components/ReplayPlayer.tsx
git commit -m "fix: pass row/col separately to placePiece in ReplayPlayer"
```

---

### Task 6: Fix ReplayPlayer Timeout type

**Files:**
- Modify: `src/components/ReplayPlayer.tsx:36,41`

**Step 1: Fix the intervalRef type**

Change line 36 from:
```typescript
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
```

To:
```typescript
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
```

**Step 2: Run typecheck**

Run: `npm run typecheck 2>&1 | grep "ReplayPlayer"`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/ReplayPlayer.tsx
git commit -m "fix: use ReturnType for interval ref type"
```

---

### Task 7: Fix tutorial catalog null → undefined

**Files:**
- Modify: `src/lib/tutorial/catalog.ts:44,94,141,205,252`

**Step 1: Replace all null with undefined for nextStep**

Run search and replace - change all occurrences of:
```typescript
      nextStep: null,
```

To:
```typescript
      nextStep: undefined,
```

There are 5 occurrences at lines 44, 94, 141, 205, 252.

**Step 2: Run typecheck**

Run: `npm run typecheck 2>&1 | grep "catalog.ts"`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/tutorial/catalog.ts
git commit -m "fix: use undefined instead of null for optional nextStep"
```

---

### Task 8: Fix battlepass.ts reduce type

**Files:**
- Modify: `src/lib/types/battlepass.ts:66-67`

**Step 1: Add type annotation to reduce**

Change lines 66-67 from:
```typescript
  return Array.from({ length: level - 1 })
    .reduce((total, _, index) => total + baseXP + (index * increment), 0);
```

To:
```typescript
  return Array.from({ length: level - 1 })
    .reduce<number>((total, _, index) => total + baseXP + (index * increment), 0);
```

**Step 2: Run typecheck**

Run: `npm run typecheck 2>&1 | grep "battlepass.ts"`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/types/battlepass.ts
git commit -m "fix: add type annotation to reduce in getXPForLevel"
```

---

### Task 9: Fix game.tsx ColorSelector callback type

**Files:**
- Modify: `src/app/game.tsx:356`

**Step 1: Find ColorSelector and fix the onSelect prop type**

First, check the ColorSelector component to understand the expected type.

The issue is that ColorSelector expects `(color: string) => void` but we pass `(color: BlockColor) => void`.

Option A: Cast the callback
Option B: Fix ColorSelector to accept BlockColor

Choose Option A (minimal change):

Find the ColorSelector usage and change:
```typescript
onSelect={handleColorSelect}
```

To:
```typescript
onSelect={(color: string) => handleColorSelect(color as BlockColor)}
```

**Step 2: Run typecheck**

Run: `npm run typecheck 2>&1 | grep "game.tsx"`
Expected: No type errors

**Step 3: Commit**

```bash
git add src/app/game.tsx
git commit -m "fix: cast ColorSelector callback to BlockColor type"
```

---

## Phase 2: ESLint Error Fixes

### Task 10: Rename usePowerUp to consumePowerUp

**Files:**
- Modify: `src/lib/game/powerups.ts:209`
- Modify: `src/app/game.tsx:26,90,113`

**Step 1: Rename function in powerups.ts**

Change line 209 from:
```typescript
export function usePowerUp(powerUp: PowerUp): PowerUp {
```

To:
```typescript
export function consumePowerUp(powerUp: PowerUp): PowerUp {
```

**Step 2: Update import in game.tsx**

Change line 26 from:
```typescript
  usePowerUp,
```

To:
```typescript
  consumePowerUp,
```

**Step 3: Update all usages in game.tsx**

Replace all `usePowerUp(` with `consumePowerUp(` in game.tsx (lines 90, 113).

**Step 4: Check for other files using usePowerUp**

Run: `grep -r "usePowerUp" src/ --include="*.tsx" --include="*.ts" | grep -v "canUsePowerUp"`

Update any other files found.

**Step 5: Run lint**

Run: `npm run lint 2>&1 | grep "rules-of-hooks"`
Expected: No hooks rules errors

**Step 6: Commit**

```bash
git add src/lib/game/powerups.ts src/app/game.tsx
git commit -m "fix: rename usePowerUp to consumePowerUp to avoid React hooks lint error"
```

---

## Phase 3: Warning Cleanup

### Task 11: Remove unused imports from all files

**Files:**
- Modify: Multiple files (12 files with unused imports)

**Step 1: Run ESLint auto-fix**

Run: `npm run lint -- --fix`

This will automatically remove many unused imports.

**Step 2: Manually fix remaining unused imports**

For each file listed in lint output with unused imports, remove the unused import.

Key files:
- `src/app/friends.tsx`: Remove `shareReplayWithFriend`, `blockUser`, `FriendRequest`, `FriendChallenge`, `SharedReplay`
- `src/app/share.tsx`: Remove `Linking`, `shareGeneric`
- `src/app/squads.tsx`: Remove `getSquadLeaderboard`, `searchSquads`
- `src/app/tournament.tsx`: Remove `generatePieces`, `createDailyTournament`, `getRankInfo`
- `src/app/welcome.tsx`: Remove `useEffect`, `completeTutorial`, `getTutorialProgress`, `TutorialStep`

**Step 3: Run lint**

Run: `npm run lint 2>&1 | grep "unused"`
Expected: Significantly fewer warnings

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove unused imports and variables"
```

---

### Task 12: Fix duplicate imports

**Files:**
- Modify: `src/app/tournament.tsx:27,37`
- Modify: `src/app/tutorials.tsx:13,14`

**Step 1: Consolidate tournament.tsx imports**

Merge the two leaderboard.ts imports into one.

**Step 2: Consolidate tutorials.tsx imports**

Merge the two tutorial.ts imports into one.

**Step 3: Run lint**

Run: `npm run lint 2>&1 | grep "imported multiple"`
Expected: No duplicate import warnings

**Step 4: Commit**

```bash
git add src/app/tournament.tsx src/app/tutorials.tsx
git commit -m "chore: consolidate duplicate imports"
```

---

### Task 13: Fix useEffect dependencies

**Files:**
- Modify: 8 files with missing useEffect dependencies

**Step 1: Fix each file by wrapping callbacks in useCallback or adding deps**

For each file, either:
- Add the missing dependency to the array
- Wrap the function in `useCallback` and add it to deps
- Use `// eslint-disable-next-line react-hooks/exhaustive-deps` if intentional

Files to fix:
1. `src/app/achievements.tsx:26` - wrap `filterAchievements` in useCallback
2. `src/app/index.tsx:15` - wrap `checkFirstTime` in useCallback
3. `src/app/leaderboard.tsx:40` - wrap `loadData` in useCallback
4. `src/app/replays.tsx:37` - wrap `filterReplays` in useCallback
5. `src/components/ComboAnimation.tsx:51,134,195` - add deps or disable lint
6. `src/components/ReplayPlayer.tsx:51` - wrap `playNextMove` in useCallback

**Step 2: Run lint**

Run: `npm run lint 2>&1 | grep "exhaustive-deps"`
Expected: No exhaustive-deps warnings

**Step 3: Commit**

```bash
git add -A
git commit -m "fix: add missing useEffect dependencies"
```

---

### Task 14: Fix Array type style

**Files:**
- Modify: `src/app/friends.tsx:40`
- Modify: `src/lib/utils/friends.ts:665`

**Step 1: Change Array<T> to T[]**

Change:
```typescript
Array<SomeType>
```

To:
```typescript
SomeType[]
```

**Step 2: Run lint**

Run: `npm run lint 2>&1 | grep "array-type"`
Expected: No array-type warnings

**Step 3: Commit**

```bash
git add src/app/friends.tsx src/lib/utils/friends.ts
git commit -m "style: use T[] instead of Array<T>"
```

---

## Phase 4: Final Verification

### Task 15: Run full typecheck and lint

**Step 1: Run typecheck**

Run: `npm run typecheck`
Expected: No errors (exit code 0)

**Step 2: Run lint**

Run: `npm run lint`
Expected: No errors, minimal warnings

**Step 3: Start the app**

Run: `npm start`
Expected: App starts without errors

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: all TypeScript and ESLint issues resolved"
```

---

## Summary

| Phase | Tasks | Fixes |
|-------|-------|-------|
| Phase 1 | Tasks 1-9 | 15 TypeScript errors |
| Phase 2 | Task 10 | 4 ESLint hook errors |
| Phase 3 | Tasks 11-14 | 54 ESLint warnings |
| Phase 4 | Task 15 | Verification |

**Total: 15 tasks, ~45-60 minutes estimated**
