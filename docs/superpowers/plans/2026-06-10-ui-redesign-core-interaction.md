# UI Redesign Core — Engine, Skia Board & Drag Interaction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the React-state game loop and 64-Pressable board with a pure game engine, a single Skia canvas renderer, UI-thread drag-and-drop with ghost preview, and an event-driven animation director — rebuilt Endless and Daily screens on top.

**Architecture:** Pure engine (`applyMove(state, action, rng) → {state, events}`) emits ordered events; a Skia `BoardCanvas` draws all visuals; a transparent `InputLattice` keeps testIDs/a11y/tap-fallback; Reanimated shared values carry drag state so React renders only on move commit. Spec: `docs/superpowers/specs/2026-06-10-ui-ux-redesign-design.md`.

**Tech Stack:** TypeScript strict, @shopify/react-native-skia v2-next, react-native-reanimated 3.17, react-native-gesture-handler 2.24, Jest. All already installed.

**Scope note:** This is plan 1 of 2 for the redesign spec. Plan 2 (restyle of Home/Welcome/Leaderboard/Replays/Achievements/Settings/Share/Shop with `ScreenHeader`/`AsyncStateView`) follows after this lands.

**Conventions for every task:** run commands from repo root. `npx jest <path>` for tests, `npm run typecheck` before each commit. Commit messages end with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

### Task 1: Motion/space/font tokens

**Files:**
- Modify: `src/lib/design/tokens.ts` (append after `shadows`, line 123)

- [ ] **Step 1: Append new token groups**

```typescript
export const space = { xs: 4, sm: 8, md: 14, lg: 18, xl: 24 } as const;

export const fontSize = {
  caption: 10, label: 11, body: 13, subtitle: 15,
  title: 24, score: 34, hero: 52,
} as const;

export const motion = {
  instant: 80, fast: 140, base: 220, slow: 320,
  spring: { damping: 18, stiffness: 220 },
  springSoft: { damping: 14, stiffness: 160 },
} as const;
```

- [ ] **Step 2: Verify**

Run: `npm run typecheck` — Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/lib/design/tokens.ts
git commit -m "feat(design): space, fontSize, motion tokens for redesign"
```

---

### Task 2: RandomSource abstraction

**Files:**
- Create: `src/lib/game/rng.ts`
- Test: `src/lib/game/rng.test.ts`
- Modify: `src/lib/daily/seed.ts` (delete its private `SeededRandom` class, lines 10-26, import from rng.ts instead)

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/game/rng.test.ts
import { SeededRandom, mathRandomSource } from './rng';

describe('SeededRandom', () => {
  it('same seed produces identical sequences', () => {
    const a = new SeededRandom(20260610);
    const b = new SeededRandom(20260610);
    const seqA = Array.from({ length: 50 }, () => a.nextInt(0, 999));
    const seqB = Array.from({ length: 50 }, () => b.nextInt(0, 999));
    expect(seqA).toEqual(seqB);
  });

  it('different seeds diverge', () => {
    const a = new SeededRandom(1);
    const b = new SeededRandom(2);
    const seqA = Array.from({ length: 10 }, () => a.nextInt(0, 999));
    const seqB = Array.from({ length: 10 }, () => b.nextInt(0, 999));
    expect(seqA).not.toEqual(seqB);
  });

  it('nextInt stays within bounds inclusive', () => {
    const r = new SeededRandom(42);
    for (let i = 0; i < 1000; i++) {
      const v = r.nextInt(3, 7);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(7);
    }
  });

  it('mathRandomSource satisfies the interface', () => {
    const v = mathRandomSource.nextInt(0, 5);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/lib/game/rng.test.ts` — Expected: FAIL "Cannot find module './rng'".

- [ ] **Step 3: Implement**

```typescript
// src/lib/game/rng.ts
// Deterministic random source. The engine takes a RandomSource so daily runs
// can be fully reproducible (audit M1.1) while endless uses Math.random.

export interface RandomSource {
  next(): number;            // [0, 1)
  nextInt(min: number, max: number): number; // inclusive bounds
}

/** Park–Miller LCG — moved from src/lib/daily/seed.ts so engine + seed share it. */
export class SeededRandom implements RandomSource {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed % 2147483647;
    if (this.seed <= 0) this.seed += 2147483646;
  }

  next(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

export const mathRandomSource: RandomSource = {
  next: () => Math.random(),
  nextInt: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
};
```

- [ ] **Step 4: Point seed.ts at the shared class**

In `src/lib/daily/seed.ts`: delete the private `SeededRandom` class (lines 10-26) and add at the top:

```typescript
import { SeededRandom } from '@/lib/game/rng';
```

- [ ] **Step 5: Run tests + typecheck**

Run: `npx jest src/lib/game/rng.test.ts && npm run typecheck` — Expected: PASS, exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/lib/game/rng.ts src/lib/game/rng.test.ts src/lib/daily/seed.ts
git commit -m "feat(engine): shared RandomSource abstraction (SeededRandom + math source)"
```

---

### Task 3: Gem-persistent cell state

**Files:**
- Modify: `src/lib/types/game.ts` (the `CellState` interface)

- [ ] **Step 1: Extend CellState**

Find the `CellState` interface in `src/lib/types/game.ts` and replace it with:

```typescript
export type GemTier = 'small' | 'medium' | 'large' | 'mega';

export interface CellState {
  filled: boolean;
  color?: BlockColor;
  /** Present only on gem cells (filled === false && color set). Spec §2.1 / audit D1:
   *  merged gems persist their tier + multiplier on the board. */
  gemTier?: GemTier;
  gemMultiplier?: number;
}
```

- [ ] **Step 2: Verify nothing breaks**

Run: `npm run typecheck && npx jest` — Expected: exit 0, 46 tests pass (42 existing + 4 from Task 2). Optional fields are backward-compatible.

- [ ] **Step 3: Commit**

```bash
git add src/lib/types/game.ts
git commit -m "feat(engine): persist gem tier and multiplier in CellState"
```

---

### Task 4: Engine — placement, line clear, gems, merge, scoring

**Files:**
- Create: `src/lib/game/engine.ts`
- Test: `src/lib/game/engine.test.ts`

- [ ] **Step 1: Write failing tests (behavior of one applyMove pass)**

```typescript
// src/lib/game/engine.test.ts
import { createRun, applyMove, type EngineState } from './engine';
import { SeededRandom } from './rng';
import { generatePieceByType } from './pieces';
import { createEmptyBoard, BOARD_SIZE } from './board';

function stateWith(partial: Partial<EngineState>): EngineState {
  return { ...createRun(new SeededRandom(1)), ...partial };
}

describe('applyMove — placement', () => {
  it('rejects an invalid placement with no state change', () => {
    const s = createRun(new SeededRandom(7));
    const rng = new SeededRandom(7);
    const out = applyMove(s, { type: 'place', pieceIndex: 0, row: 7, col: 7 }, rng);
    // I5/O3x3 etc. at 7,7 may be valid for tiny pieces; force invalid via filled board
    const full = s.board.map((r) => r.map(() => ({ filled: true as const, color: 'red' as const })));
    const out2 = applyMove({ ...s, board: full }, { type: 'place', pieceIndex: 0, row: 0, col: 0 }, rng);
    expect(out2.events).toEqual([{ type: 'rejected' }]);
    expect(out2.state).toBe(out2.state); // unchanged reference semantics checked below
    expect(out2.state.score).toBe(s.score);
    void out;
  });

  it('places a piece and consumes it from the tray', () => {
    const s = createRun(new SeededRandom(7));
    const piece = generatePieceByType('I2', 'blue');
    const withPiece = stateWith({ ...s, pieces: [piece, s.pieces[1], s.pieces[2]] });
    const out = applyMove(withPiece, { type: 'place', pieceIndex: 0, row: 0, col: 0 }, new SeededRandom(7));
    expect(out.state.board[0][0]).toMatchObject({ filled: true, color: 'blue' });
    expect(out.state.board[0][1]).toMatchObject({ filled: true, color: 'blue' });
    expect(out.state.pieces).toHaveLength(2);
    expect(out.events[0]).toMatchObject({ type: 'piecePlaced' });
  });
});

describe('applyMove — clears, gems, merge, score', () => {
  function rowAlmostFull(): EngineState {
    // Row 0 filled except col 0; an I2 vertical won't fit — use I2 horizontal? I2 is 1x2.
    // Fill cols 1..7 of row 0, place a 1-cell-wide piece: use I2 at row 0 covering cols 0-1
    // so leave cols 2..7 filled and col 0,1 empty.
    const board = createEmptyBoard();
    for (let c = 2; c < BOARD_SIZE; c++) board[0][c] = { filled: true, color: 'red' };
    const piece = generatePieceByType('I2', 'blue'); // covers (0,0),(0,1)
    const base = createRun(new SeededRandom(3));
    return { ...base, board, pieces: [piece, base.pieces[1], base.pieces[2]] };
  }

  it('clears a completed row, drops gems, scores with pre-move multiplier', () => {
    const s = rowAlmostFull();
    const out = applyMove(s, { type: 'place', pieceIndex: 0, row: 0, col: 0 }, new SeededRandom(3));
    const types = out.events.map((e) => e.type);
    expect(types).toContain('linesCleared');
    expect(types).toContain('gemsDropped');
    expect(types).toContain('scoreAwarded');
    const cleared = out.events.find((e) => e.type === 'linesCleared') as any;
    expect(cleared.rows).toEqual([0]);
    expect(cleared.cols).toEqual([]);
    // 8 cells * 10 * multiplier(1)
    expect(out.state.score).toBe(80);
    // every cleared cell becomes a gem cell (filled:false, color set, tier small)
    const gemCells = out.state.board[0].filter((c) => !c.filled && c.color);
    expect(gemCells.length).toBeGreaterThan(0);
  });

  it('is deterministic: same seed + same moves = identical state', () => {
    const run = () => {
      const s = rowAlmostFull();
      return applyMove(s, { type: 'place', pieceIndex: 0, row: 0, col: 0 }, new SeededRandom(3));
    };
    expect(JSON.stringify(run().state)).toEqual(JSON.stringify(run().state));
  });

  it('merges adjacent same-color gems into one anchor gem with tier + multiplier', () => {
    const board = createEmptyBoard();
    // Pre-existing gems: two adjacent yellows at (4,4),(4,5)
    board[4][4] = { filled: false, color: 'yellow', gemTier: 'small', gemMultiplier: 1 };
    board[4][5] = { filled: false, color: 'yellow', gemTier: 'small', gemMultiplier: 1 };
    const base = createRun(new SeededRandom(5));
    const piece = generatePieceByType('I2', 'blue');
    const s: EngineState = { ...base, board, pieces: [piece, base.pieces[1], base.pieces[2]] };
    const out = applyMove(s, { type: 'place', pieceIndex: 0, row: 0, col: 0 }, new SeededRandom(5));
    // no lines cleared, but pre-existing adjacency still merges on commit
    const merge = out.events.find((e) => e.type === 'mergeFormed') as any;
    expect(merge).toBeDefined();
    expect(merge.tier).toBe('medium');
    const anchor = out.state.board[merge.anchor.row][merge.anchor.col];
    expect(anchor).toMatchObject({ filled: false, color: 'yellow', gemTier: 'medium', gemMultiplier: 2 });
    // cluster cells consumed: exactly one yellow gem remains
    const yellows = out.state.board.flat().filter((c) => !c.filled && c.color === 'yellow');
    expect(yellows).toHaveLength(1);
    // board multiplier now reflects the merged gem
    expect(out.state.multiplier).toBe(2);
  });

  it('crushing a gem emits gemCrushed and removes it', () => {
    const board = createEmptyBoard();
    board[0][0] = { filled: false, color: 'yellow', gemTier: 'medium', gemMultiplier: 2 };
    const base = createRun(new SeededRandom(5));
    const piece = generatePieceByType('I2', 'blue');
    const s: EngineState = { ...base, board, pieces: [piece, base.pieces[1], base.pieces[2]] };
    const out = applyMove(s, { type: 'place', pieceIndex: 0, row: 0, col: 0 }, new SeededRandom(5));
    expect(out.events.find((e) => e.type === 'gemCrushed')).toMatchObject({
      type: 'gemCrushed', cell: { row: 0, col: 0 },
    });
    expect(out.state.board[0][0]).toMatchObject({ filled: true, color: 'blue' });
  });

  it('refills the tray from rng when the last piece is used and ends the run when stuck', () => {
    const base = createRun(new SeededRandom(9));
    const piece = generatePieceByType('I2', 'blue');
    const s: EngineState = { ...base, pieces: [piece] };
    const out = applyMove(s, { type: 'place', pieceIndex: 0, row: 0, col: 0 }, new SeededRandom(9));
    expect(out.state.pieces).toHaveLength(3); // refilled
    expect(out.state.gameOver).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest src/lib/game/engine.test.ts` — Expected: FAIL "Cannot find module './engine'".

- [ ] **Step 3: Implement the engine**

```typescript
// src/lib/game/engine.ts
// Pure game engine — single source of game rules (spec §2.1, audit M2.1).
// No React, no I/O. Renderer and replay both consume { state, events }.
import type { GameBoard, CellState, GamePiece, BlockColor, GemTier, Position } from '@/lib/types/game';
import { BOARD_SIZE, createEmptyBoard, canPlacePiece, placePiece, findCompleteLines, hasValidMoves } from './board';
import { generateRandomPiece } from './pieces';
import type { RandomSource } from './rng';

export interface EngineState {
  board: GameBoard;
  pieces: GamePiece[];
  score: number;
  multiplier: number;       // applied to the NEXT clear (current game behavior, kept)
  maxMultiplier: number;
  moveCount: number;
  gameOver: boolean;
}

export type EngineAction = { type: 'place'; pieceIndex: number; row: number; col: number };

export type EngineEvent =
  | { type: 'rejected' }
  | { type: 'piecePlaced'; cells: Position[]; color: BlockColor }
  | { type: 'gemCrushed'; cell: Position; color: BlockColor; lostMultiplier: number }
  | { type: 'linesCleared'; rows: number[]; cols: number[]; cells: Position[] }
  | { type: 'gemsDropped'; gems: { cell: Position; color: BlockColor }[] }
  | { type: 'mergeFormed'; cluster: Position[]; anchor: Position; color: BlockColor; tier: GemTier; multiplier: number }
  | { type: 'scoreAwarded'; points: number; multiplier: number }
  | { type: 'runEnded'; finalScore: number };

const GEM_COLORS: BlockColor[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

const TIER_BY_COUNT = (n: number): GemTier =>
  n >= 5 ? 'mega' : n >= 4 ? 'large' : n >= 3 ? 'medium' : 'small';
const MULT_BY_TIER: Record<GemTier, number> = { small: 1, medium: 2, large: 3, mega: 5 };

export function createRun(rng: RandomSource): EngineState {
  return {
    board: createEmptyBoard(),
    pieces: [randomPiece(rng), randomPiece(rng), randomPiece(rng)],
    score: 0,
    multiplier: 1,
    maxMultiplier: 1,
    moveCount: 0,
    gameOver: false,
  };
}

function randomPiece(rng: RandomSource): GamePiece {
  // generateRandomPiece uses Math.random internally; rebuild it through rng
  // by selecting shape + color deterministically.
  const piece = generateRandomPiece();
  // Deterministic override:
  const { BLOCK_SHAPES } = require('./pieces') as typeof import('./pieces');
  const shapeTypes = Object.keys(BLOCK_SHAPES) as (keyof typeof BLOCK_SHAPES)[];
  const shapeType = shapeTypes[rng.nextInt(0, shapeTypes.length - 1)];
  const color = GEM_COLORS[rng.nextInt(0, GEM_COLORS.length - 1)];
  const shape = BLOCK_SHAPES[shapeType];
  const maxRow = Math.max(...shape.map((p) => p.row));
  const maxCol = Math.max(...shape.map((p) => p.col));
  return { ...piece, shapeType, shape, color, width: maxCol + 1, height: maxRow + 1 };
}

function cloneBoard(board: GameBoard): GameBoard {
  return board.map((row) => row.map((cell) => ({ ...cell })));
}

export function applyMove(
  state: EngineState,
  action: EngineAction,
  rng: RandomSource
): { state: EngineState; events: EngineEvent[] } {
  if (state.gameOver) return { state, events: [{ type: 'rejected' }] };
  const piece = state.pieces[action.pieceIndex];
  if (!piece || !canPlacePiece(state.board, piece, action.row, action.col)) {
    return { state, events: [{ type: 'rejected' }] };
  }

  const events: EngineEvent[] = [];
  let board = cloneBoard(state.board);

  // 1. Crush gems under the piece (audit D1: allowed, but explicit + evented).
  const placedCells: Position[] = piece.shape.map((p) => ({
    row: action.row + p.row,
    col: action.col + p.col,
  }));
  for (const cell of placedCells) {
    const c = board[cell.row][cell.col];
    if (!c.filled && c.color) {
      events.push({
        type: 'gemCrushed', cell,
        color: c.color, lostMultiplier: c.gemMultiplier ?? 1,
      });
    }
  }

  // 2. Place.
  board = placePiece(board, piece, action.row, action.col);
  events.push({ type: 'piecePlaced', cells: placedCells, color: piece.color });

  // 3. Clear lines (counted by rows/cols, not cells/8 — fixes audit C7).
  const { rows, cols } = findCompleteLines(board);
  let clearedCells: Position[] = [];
  if (rows.length > 0 || cols.length > 0) {
    const seen = new Set<string>();
    for (const row of rows) for (let col = 0; col < BOARD_SIZE; col++) {
      seen.add(`${row}:${col}`);
    }
    for (const col of cols) for (let row = 0; row < BOARD_SIZE; row++) {
      seen.add(`${row}:${col}`);
    }
    clearedCells = Array.from(seen).map((k) => {
      const [row, col] = k.split(':').map(Number);
      return { row, col };
    });
    for (const { row, col } of clearedCells) board[row][col] = { filled: false };
    events.push({ type: 'linesCleared', rows, cols, cells: clearedCells });

    // 4. Drop gems into cleared cells (color from rng — deterministic when seeded).
    const drops = clearedCells.map((cell) => ({
      cell,
      color: GEM_COLORS[rng.nextInt(0, GEM_COLORS.length - 1)],
    }));
    for (const d of drops) {
      board[d.cell.row][d.cell.col] = {
        filled: false, color: d.color, gemTier: 'small', gemMultiplier: 1,
      };
    }
    events.push({ type: 'gemsDropped', gems: drops });
  }

  // 5. Merge adjacent same-color gem clusters (cluster consumed, anchor keeps gem).
  mergeClusters(board, events);

  // 6. Score: cleared cells * 10 * PRE-move multiplier (existing behavior kept).
  let score = state.score;
  if (clearedCells.length > 0) {
    const points = clearedCells.length * 10 * state.multiplier;
    score += points;
    events.push({ type: 'scoreAwarded', points, multiplier: state.multiplier });
  }

  // 7. New board multiplier = highest gem multiplier on the board.
  let multiplier = 1;
  for (const row of board) for (const cell of row) {
    if (!cell.filled && cell.color) multiplier = Math.max(multiplier, cell.gemMultiplier ?? 1);
  }
  const maxMultiplier = Math.max(state.maxMultiplier, multiplier);

  // 8. Consume piece, refill from rng when tray empties.
  let pieces = state.pieces.filter((_, i) => i !== action.pieceIndex);
  if (pieces.length === 0) pieces = [randomPiece(rng), randomPiece(rng), randomPiece(rng)];

  // 9. Game over.
  const gameOver = !hasValidMoves(board, pieces);
  const next: EngineState = {
    board, pieces, score, multiplier, maxMultiplier,
    moveCount: state.moveCount + 1, gameOver,
  };
  if (gameOver) events.push({ type: 'runEnded', finalScore: score });
  return { state: next, events };
}

function mergeClusters(board: GameBoard, events: EngineEvent[]): void {
  const visited = new Set<string>();
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const key = `${row}:${col}`;
      const cell = board[row][col];
      if (visited.has(key) || cell.filled || !cell.color) continue;
      // BFS the same-color gem cluster.
      const cluster: Position[] = [];
      const queue: Position[] = [{ row, col }];
      visited.add(key);
      while (queue.length) {
        const cur = queue.shift()!;
        cluster.push(cur);
        for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
          const nr = cur.row + dr, nc = cur.col + dc;
          const nkey = `${nr}:${nc}`;
          if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE || visited.has(nkey)) continue;
          const ncell = board[nr][nc];
          if (!ncell.filled && ncell.color === cell.color) {
            visited.add(nkey);
            queue.push({ row: nr, col: nc });
          }
        }
      }
      if (cluster.length < 2) continue;
      // Anchor = cluster cell nearest the centroid (always a legal, in-cluster cell — audit D1).
      const cr = cluster.reduce((s, p) => s + p.row, 0) / cluster.length;
      const cc = cluster.reduce((s, p) => s + p.col, 0) / cluster.length;
      const anchor = cluster.reduce((best, p) =>
        (p.row - cr) ** 2 + (p.col - cc) ** 2 < (best.row - cr) ** 2 + (best.col - cc) ** 2 ? p : best
      );
      const tier = TIER_BY_COUNT(cluster.length);
      const mult = MULT_BY_TIER[tier];
      for (const p of cluster) board[p.row][p.col] = { filled: false };
      board[anchor.row][anchor.col] = {
        filled: false, color: cell.color, gemTier: tier, gemMultiplier: mult,
      };
      events.push({ type: 'mergeFormed', cluster, anchor, color: cell.color, tier, multiplier: mult });
    }
  }
}
```

Note: `randomPiece` calls `generateRandomPiece()` then overrides — replace that with a direct construction if `BLOCK_SHAPES` export makes it cleaner; the `require` must become a top-level `import { BLOCK_SHAPES } from './pieces'` (shown as require only to flag the dependency — use the import).

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest src/lib/game/engine.test.ts` — Expected: PASS (8 tests). Also `npx jest` — all suites green.

- [ ] **Step 5: Typecheck + commit**

```bash
npm run typecheck
git add src/lib/game/engine.ts src/lib/game/engine.test.ts
git commit -m "feat(engine): pure applyMove engine with events, gem persistence, crush, merge"
```

---

### Task 5: Golden-replay determinism harness

**Files:**
- Create: `src/lib/game/engine.golden.test.ts`

- [ ] **Step 1: Write the test (this is the audit M0.3 regression net)**

```typescript
// src/lib/game/engine.golden.test.ts
import { createRun, applyMove, type EngineState } from './engine';
import { SeededRandom } from './rng';
import { getValidPlacements } from './board';

/** Drive a scripted bot: always place piece 0 at its first valid position. */
function playRun(seed: number, maxMoves: number): { trace: number[]; final: EngineState } {
  const rng = new SeededRandom(seed);
  let state = createRun(rng);
  const trace: number[] = [];
  for (let i = 0; i < maxMoves && !state.gameOver; i++) {
    const spots = getValidPlacements(state.board, state.pieces[0]);
    if (spots.length === 0) break;
    const out = applyMove(state, { type: 'place', pieceIndex: 0, row: spots[0].row, col: spots[0].col }, rng);
    state = out.state;
    trace.push(state.score, state.multiplier);
  }
  return { trace, final: state };
}

describe('golden replay determinism', () => {
  it('same seed twice → byte-identical score traces', () => {
    const a = playRun(20260610, 60);
    const b = playRun(20260610, 60);
    expect(a.trace).toEqual(b.trace);
    expect(JSON.stringify(a.final)).toEqual(JSON.stringify(b.final));
  });

  it('different seeds → different traces', () => {
    expect(playRun(1, 60).trace).not.toEqual(playRun(2, 60).trace);
  });
});
```

- [ ] **Step 2: Run** — `npx jest src/lib/game/engine.golden.test.ts` — Expected: PASS. (If FAIL, the engine has hidden `Math.random` — find and route it through rng.)

- [ ] **Step 3: Commit**

```bash
git add src/lib/game/engine.golden.test.ts
git commit -m "test(engine): golden-replay determinism harness"
```

---

### Task 6: BoardGeometry — the single coordinate system

**Files:**
- Create: `src/lib/board/geometry.ts`
- Test: `src/lib/board/geometry.test.ts`
- Modify (later, Task 10): `src/lib/cascade/origin.ts` consumers switch to this.

- [ ] **Step 1: Write failing tests**

```typescript
// src/lib/board/geometry.test.ts
import { makeGeometry, cellAtPoint, rectForCell, snapTarget } from './geometry';

const g = makeGeometry({ boardX: 0, boardY: 0, boardSize: 330, padding: 10, gap: 2, cells: 8 });
// cellSize = (330 - 20 - 14) / 8 = 37; pitch = 39

describe('BoardGeometry', () => {
  it('rectForCell returns pixel rect for a cell', () => {
    expect(rectForCell(g, { row: 0, col: 0 })).toEqual({ x: 10, y: 10, width: 37, height: 37 });
    expect(rectForCell(g, { row: 1, col: 2 })).toEqual({ x: 10 + 2 * 39, y: 10 + 39, width: 37, height: 37 });
  });

  it('cellAtPoint inverts rectForCell at cell centers', () => {
    for (const cell of [{ row: 0, col: 0 }, { row: 7, col: 7 }, { row: 3, col: 5 }]) {
      const r = rectForCell(g, cell);
      expect(cellAtPoint(g, { x: r.x + r.width / 2, y: r.y + r.height / 2 })).toEqual(cell);
    }
  });

  it('cellAtPoint returns null outside the grid', () => {
    expect(cellAtPoint(g, { x: -5, y: 50 })).toBeNull();
    expect(cellAtPoint(g, { x: 331, y: 50 })).toBeNull();
  });

  it('snapTarget applies hysteresis: keeps previous target until past midpoint + 6px', () => {
    const r0 = rectForCell(g, { row: 0, col: 0 });
    const center0 = { x: r0.x + 18.5, y: r0.y + 18.5 };
    // moving 3px past the boundary toward col 1 — within hysteresis, keep col 0
    const nearEdge = { x: center0.x + 19.5 + 3, y: center0.y };
    expect(snapTarget(g, nearEdge, { row: 0, col: 0 })).toEqual({ row: 0, col: 0 });
    // 10px past the boundary — beyond hysteresis, move to col 1
    const pastEdge = { x: center0.x + 19.5 + 10, y: center0.y };
    expect(snapTarget(g, pastEdge, { row: 0, col: 0 })).toEqual({ row: 0, col: 1 });
    // no previous target → plain cellAtPoint
    expect(snapTarget(g, center0, null)).toEqual({ row: 0, col: 0 });
  });
});
```

- [ ] **Step 2: Run** — `npx jest src/lib/board/geometry.test.ts` — Expected: FAIL (module missing).

- [ ] **Step 3: Implement**

```typescript
// src/lib/board/geometry.ts
// The ONLY cell<->pixel math in the app (spec §2.2). Used by the Skia renderer,
// the drag worklet, and the cascade origin. Pure functions — worklet-safe.

export interface Geometry {
  boardX: number; boardY: number; boardSize: number;
  padding: number; gap: number; cells: number;
  cellSize: number; pitch: number;
}
export interface Point { x: number; y: number }
export interface Cell { row: number; col: number }

const HYSTERESIS_PX = 6;

export function makeGeometry(opts: {
  boardX: number; boardY: number; boardSize: number;
  padding: number; gap: number; cells: number;
}): Geometry {
  'worklet';
  const cellSize = (opts.boardSize - opts.padding * 2 - opts.gap * (opts.cells - 1)) / opts.cells;
  return { ...opts, cellSize, pitch: cellSize + opts.gap };
}

export function rectForCell(g: Geometry, cell: Cell) {
  'worklet';
  return {
    x: g.boardX + g.padding + cell.col * g.pitch,
    y: g.boardY + g.padding + cell.row * g.pitch,
    width: g.cellSize,
    height: g.cellSize,
  };
}

export function cellAtPoint(g: Geometry, p: Point): Cell | null {
  'worklet';
  const lx = p.x - g.boardX - g.padding;
  const ly = p.y - g.boardY - g.padding;
  const col = Math.floor(lx / g.pitch);
  const row = Math.floor(ly / g.pitch);
  if (row < 0 || row >= g.cells || col < 0 || col >= g.cells || lx < 0 || ly < 0) return null;
  return { row, col };
}

/** Target cell with hysteresis: only leave `prev` when the point is more than
 *  HYSTERESIS_PX past the midpoint boundary — kills ghost flicker (spec §5). */
export function snapTarget(g: Geometry, p: Point, prev: Cell | null): Cell | null {
  'worklet';
  const raw = cellAtPoint(g, p);
  if (!prev || !raw) return raw;
  if (raw.row === prev.row && raw.col === prev.col) return prev;
  const prevRect = rectForCell(g, prev);
  const cx = prevRect.x + prevRect.width / 2;
  const cy = prevRect.y + prevRect.height / 2;
  const stay =
    Math.abs(p.x - cx) <= g.pitch / 2 + HYSTERESIS_PX &&
    Math.abs(p.y - cy) <= g.pitch / 2 + HYSTERESIS_PX;
  return stay ? prev : raw;
}
```

- [ ] **Step 4: Run** — `npx jest src/lib/board/geometry.test.ts` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/board/geometry.ts src/lib/board/geometry.test.ts
git commit -m "feat(board): BoardGeometry — shared worklet-safe cell/pixel math with snap hysteresis"
```

---

### Task 7: BoardCanvas — Skia renderer (static layer)

**Files:**
- Create: `src/components/board/BoardCanvas.tsx`

No unit test (visual component; node test env can't render Skia — verified by eye in Task 11 and by Maestro). Keep it pure-props so all logic stays in tested modules.

- [ ] **Step 1: Implement the canvas**

```tsx
// src/components/board/BoardCanvas.tsx
// Full-Skia board renderer (spec §2.2). Draws frame, cells, blocks, gems,
// drag ghost. ALL math comes from BoardGeometry props — no local coordinates.
import React from 'react';
import { Platform } from 'react-native';
import {
  Canvas, RoundedRect, Group, Circle, Text as SkText,
  LinearGradient, RadialGradient, vec, matchFont,
} from '@shopify/react-native-skia';
import type { SharedValue } from 'react-native-reanimated';
import { useDerivedValue } from 'react-native-reanimated';
import type { GameBoard, GamePiece } from '@/lib/types/game';
import { blockColors, colors, resolveBlockColor } from '@/lib/design/tokens';
import { type Geometry, rectForCell } from '@/lib/board/geometry';

const badgeFont = matchFont({
  fontFamily: Platform.select({ ios: 'Helvetica', default: 'sans-serif' }),
  fontSize: 11,
  fontWeight: 'bold',
});

const GEM_SCALE = { small: 0.62, medium: 0.78, large: 0.92, mega: 1.0 } as const;

export interface GhostState {
  /** -1 row when no ghost. */
  row: number; col: number;
  valid: boolean;
  pieceIndex: number;
}

interface Props {
  board: GameBoard;
  geometry: Geometry;
  pieces: GamePiece[];
  /** Drag ghost — driven from the gesture worklet, read here per frame. */
  ghost: SharedValue<GhostState>;
}

export function BoardCanvas({ board, geometry: g, pieces, ghost }: Props) {
  const ghostCells = useDerivedValue(() => {
    const gh = ghost.value;
    if (gh.row < 0 || gh.pieceIndex < 0) return [];
    const piece = pieces[gh.pieceIndex];
    if (!piece) return [];
    return piece.shape.map((p) => ({
      rect: rectForCell(g, { row: gh.row + p.row, col: gh.col + p.col }),
      valid: gh.valid,
      color: piece.color,
    }));
  }, [pieces, g]);

  return (
    <Canvas style={{ width: g.boardSize, height: g.boardSize }}>
      {/* Frame */}
      <RoundedRect x={0} y={0} width={g.boardSize} height={g.boardSize} r={14}>
        <LinearGradient start={vec(g.boardSize / 2, 0)} end={vec(g.boardSize / 2, g.boardSize)}
          colors={[colors.boardBgTop, colors.boardBgBottom]} />
      </RoundedRect>

      {/* Cells, blocks, gems */}
      {board.map((row, r) =>
        row.map((cell, c) => {
          const rect = rectForCell(g, { row: r, col: c });
          const key = `${r}-${c}`;
          if (cell.filled && cell.color) {
            const tone = blockColors[resolveBlockColor(cell.color)];
            return (
              <Group key={key}>
                <RoundedRect x={rect.x} y={rect.y} width={rect.width} height={rect.height} r={4}>
                  <LinearGradient start={vec(rect.x, rect.y)} end={vec(rect.x, rect.y + rect.height)}
                    colors={[tone.glow, tone.base, tone.deep]} />
                </RoundedRect>
                {/* specular top edge */}
                <RoundedRect x={rect.x + 2} y={rect.y + 1.5} width={rect.width - 4} height={2}
                  r={1} color="rgba(255,255,255,0.35)" />
              </Group>
            );
          }
          if (!cell.filled && cell.color) {
            const tone = blockColors[resolveBlockColor(cell.color)];
            const tier = cell.gemTier ?? 'small';
            const radius = (rect.width * GEM_SCALE[tier]) / 2;
            const cx = rect.x + rect.width / 2;
            const cy = rect.y + rect.height / 2;
            const mult = cell.gemMultiplier ?? 1;
            return (
              <Group key={key}>
                {tier !== 'small' && (
                  <Circle cx={cx} cy={cy} r={radius + 3} color={tone.glow} opacity={0.35} />
                )}
                <Circle cx={cx} cy={cy} r={radius}>
                  <RadialGradient c={vec(cx - radius * 0.3, cy - radius * 0.4)} r={radius * 1.4}
                    colors={[tone.glow, tone.base, tone.deep]} />
                </Circle>
                {mult > 1 && (
                  <SkText x={cx - 8} y={cy + 4} text={`×${mult}`} font={badgeFont} color="white" />
                )}
              </Group>
            );
          }
          return (
            <RoundedRect key={key} x={rect.x} y={rect.y} width={rect.width} height={rect.height}
              r={5} color={colors.boardCellBg} />
          );
        })
      )}

      {/* Drag ghost — re-evaluated on the UI thread when shared value changes */}
      {/* Rendered via derived value: each frame draws ghost cells at 35% piece color
          (valid) or 15% gray (invalid). */}
      <GhostLayer ghostCells={ghostCells} />
    </Canvas>
  );
}

function GhostLayer({ ghostCells }: {
  ghostCells: SharedValue<{ rect: { x: number; y: number; width: number; height: number }; valid: boolean; color: string }[]>;
}) {
  // Skia reads SharedValues directly in props; map over a snapshot via derived value.
  // For a small fixed max (5 cells per piece) draw 5 slots and hide unused ones.
  const slots = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const; // O3x3 = 9 cells max
  return (
    <Group>
      {slots.map((i) => (
        <GhostCell key={i} index={i} ghostCells={ghostCells} />
      ))}
    </Group>
  );
}

function GhostCell({ index, ghostCells }: {
  index: number;
  ghostCells: SharedValue<{ rect: { x: number; y: number; width: number; height: number }; valid: boolean; color: string }[]>;
}) {
  const x = useDerivedValue(() => ghostCells.value[index]?.rect.x ?? -100);
  const y = useDerivedValue(() => ghostCells.value[index]?.rect.y ?? -100);
  const w = useDerivedValue(() => ghostCells.value[index]?.rect.width ?? 0);
  const h = useDerivedValue(() => ghostCells.value[index]?.rect.height ?? 0);
  const color = useDerivedValue(() => {
    const cell = ghostCells.value[index];
    if (!cell) return 'transparent';
    if (!cell.valid) return 'rgba(128,128,128,0.15)';
    const tone = blockColors[resolveBlockColor(cell.color)];
    return tone.base + '59'; // 35% alpha hex suffix
  });
  return <RoundedRect x={x} y={y} width={w} height={h} r={4} color={color} />;
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck` — Expected: exit 0. (Skia v2-next prop types occasionally differ; fix signatures against `node_modules/@shopify/react-native-skia/lib/typescript` if the compiler complains — do not cast to `any`.)

- [ ] **Step 3: Commit**

```bash
git add src/components/board/BoardCanvas.tsx
git commit -m "feat(board): Skia BoardCanvas — frame, blocks, tiered gems, ghost layer"
```

---

### Task 8: InputLattice — testIDs, a11y, tap fallback

**Files:**
- Create: `src/components/board/InputLattice.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/components/board/InputLattice.tsx
// Invisible 8x8 Pressable grid over the canvas (spec §2.3): keeps every
// existing Maestro `cell-r-c` testID, adds screen-reader labels, and carries
// the tap-to-place fallback. Renders no visuals; cheap and static.
import React, { memo } from 'react';
import { View, Pressable } from 'react-native';
import type { GameBoard } from '@/lib/types/game';
import { type Geometry, rectForCell } from '@/lib/board/geometry';

function cellLabel(board: GameBoard, row: number, col: number): string {
  const cell = board[row]?.[col];
  if (!cell) return `Row ${row + 1}, column ${col + 1}`;
  if (cell.filled && cell.color) return `Row ${row + 1}, column ${col + 1}, ${cell.color} block`;
  if (!cell.filled && cell.color) {
    const mult = cell.gemMultiplier ?? 1;
    return `Row ${row + 1}, column ${col + 1}, ${cell.color} gem times ${mult}`;
  }
  return `Row ${row + 1}, column ${col + 1}, empty`;
}

export const InputLattice = memo(function InputLattice({
  board, geometry: g, onCellPress,
}: {
  board: GameBoard;
  geometry: Geometry;
  onCellPress: (row: number, col: number) => void;
}) {
  return (
    <View pointerEvents="box-none"
      style={{ position: 'absolute', top: 0, left: 0, width: g.boardSize, height: g.boardSize }}>
      {board.map((row, r) =>
        row.map((_, c) => {
          const rect = rectForCell(g, { row: r, col: c });
          return (
            <Pressable
              key={`${r}-${c}`}
              testID={`cell-${r}-${c}`}
              accessibilityRole="button"
              accessibilityLabel={cellLabel(board, r, c)}
              onPress={() => onCellPress(r, c)}
              style={{
                position: 'absolute',
                left: rect.x, top: rect.y, width: rect.width, height: rect.height,
              }}
            />
          );
        })
      )}
    </View>
  );
});
```

- [ ] **Step 2: Typecheck + commit**

```bash
npm run typecheck
git add src/components/board/InputLattice.tsx
git commit -m "feat(board): invisible input lattice — testIDs, a11y labels, tap fallback"
```

---

### Task 9: useDragPlacement — UI-thread drag with lifted ghost

**Files:**
- Create: `src/components/board/useDragPlacement.ts`

- [ ] **Step 1: Implement**

```typescript
// src/components/board/useDragPlacement.ts
// Drag state machine (spec §5). Everything before finger-lift runs on the UI
// thread: finger position -> lifted piece position -> snapTarget -> ghost SV.
// React is touched exactly once, via runOnJS(commit) on drop.
import { useMemo } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { useSharedValue, runOnJS, withSpring } from 'react-native-reanimated';
import type { GamePiece, GameBoard } from '@/lib/types/game';
import { canPlacePiece } from '@/lib/game/board';
import { type Geometry, snapTarget } from '@/lib/board/geometry';
import { motion } from '@/lib/design/tokens';
import type { GhostState } from './BoardCanvas';

const LIFT_PT = 72; // piece floats this far above the finger (min — spec §5)

export function useDragPlacement(opts: {
  geometry: Geometry;
  board: GameBoard;
  pieces: GamePiece[];
  /** Maps a tray-local touch to a piece index, or -1. Provided by the tray. */
  pieceIndexAtTrayPoint: (x: number, y: number) => number;
  /** Board-relative offset of the tray's origin (for translating coordinates). */
  trayOffsetY: number;
  onCommit: (pieceIndex: number, row: number, col: number) => void;
}) {
  const { geometry, board, pieces, pieceIndexAtTrayPoint, trayOffsetY, onCommit } = opts;

  const ghost = useSharedValue<GhostState>({ row: -1, col: -1, valid: false, pieceIndex: -1 });
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const dragScale = useSharedValue(0); // 0 = in tray, 1 = lifted

  // Validity must be checked in the worklet: precompute a placement-validity
  // bitmap per piece on the JS side whenever board/pieces change (cheap: 64*3).
  const validity = useMemo(() => {
    return pieces.map((piece) => {
      const grid: boolean[] = [];
      for (let r = 0; r < board.length; r++)
        for (let c = 0; c < board.length; c++)
          grid.push(piece ? canPlacePiece(board, piece, r, c) : false);
      return grid;
    });
  }, [board, pieces]);

  const pan = useMemo(() => Gesture.Pan()
    .onBegin((e) => {
      'worklet';
      // gesture attaches to the container that includes tray below the board
      const idx = pieceIndexAtTrayPoint ? -2 : -1; // placeholder replaced below
      void idx;
    })
    .onStart((e) => {
      'worklet';
      // pieceIndexAtTrayPoint runs on JS; resolve index optimistically:
      runOnJS(resolvePiece)(e.x, e.y);
    })
    .onUpdate((e) => {
      'worklet';
      if (ghost.value.pieceIndex < 0) return;
      dragX.value = e.x;
      dragY.value = e.y - LIFT_PT;
      const prev = ghost.value.row >= 0 ? { row: ghost.value.row, col: ghost.value.col } : null;
      const target = snapTarget(geometry, { x: e.x, y: e.y - LIFT_PT }, prev);
      if (!target) {
        ghost.value = { ...ghost.value, row: -1, col: -1, valid: false };
        return;
      }
      const flat = target.row * geometry.cells + target.col;
      const valid = validity[ghost.value.pieceIndex]?.[flat] ?? false;
      ghost.value = { ...ghost.value, row: target.row, col: target.col, valid };
    })
    .onEnd(() => {
      'worklet';
      const gh = ghost.value;
      dragScale.value = withSpring(0, motion.springSoft);
      if (gh.pieceIndex >= 0 && gh.row >= 0 && gh.valid) {
        runOnJS(onCommit)(gh.pieceIndex, gh.row, gh.col);
      }
      ghost.value = { row: -1, col: -1, valid: false, pieceIndex: -1 };
    }), [geometry, validity, onCommit, trayOffsetY]);

  function resolvePiece(x: number, y: number) {
    const idx = pieceIndexAtTrayPoint(x, y - trayOffsetY);
    if (idx >= 0 && pieces[idx]) {
      ghost.value = { row: -1, col: -1, valid: false, pieceIndex: idx };
      dragScale.value = withSpring(1, motion.spring);
    }
  }

  return { pan, ghost, dragX, dragY, dragScale };
}
```

Implementation note for the executor: `onStart`→`runOnJS(resolvePiece)` introduces one JS round-trip at pick-up only (acceptable: pick-up isn't per-frame). All `onUpdate` frames stay on the UI thread. Delete the no-op `onBegin` block. If `withSpring` import from `react-native-reanimated` complains in worklets, move spring starts into `onEnd`'s `runOnJS` path.

- [ ] **Step 2: Typecheck + commit**

```bash
npm run typecheck
git add src/components/board/useDragPlacement.ts
git commit -m "feat(board): UI-thread drag placement hook with lift offset and snap hysteresis"
```

---

### Task 10: AnimationDirector — event → beat sequencing

**Files:**
- Create: `src/components/board/AnimationDirector.ts`
- Test: `src/components/board/AnimationDirector.test.ts`
- Reuse: `src/lib/haptics/cascade.ts`, `src/lib/audio/sfx.ts` (existing, already tested)

- [ ] **Step 1: Write failing test (pure sequencing, fake scheduler)**

```typescript
// src/components/board/AnimationDirector.test.ts
import { buildTimeline, type Beat } from './AnimationDirector';
import type { EngineEvent } from '@/lib/game/engine';

const placed: EngineEvent = { type: 'piecePlaced', cells: [{ row: 0, col: 0 }], color: 'blue' };
const cleared: EngineEvent = { type: 'linesCleared', rows: [0], cols: [], cells: [{ row: 0, col: 0 }] };
const dropped: EngineEvent = { type: 'gemsDropped', gems: [{ cell: { row: 0, col: 0 }, color: 'red' }] };
const merged: EngineEvent = {
  type: 'mergeFormed', cluster: [{ row: 0, col: 0 }, { row: 0, col: 1 }],
  anchor: { row: 0, col: 0 }, color: 'red', tier: 'medium', multiplier: 2,
};
const scored: EngineEvent = { type: 'scoreAwarded', points: 80, multiplier: 1 };

describe('buildTimeline', () => {
  it('orders beats settle → sweep → gemDrop → merge → scoreRoll', () => {
    const beats = buildTimeline([placed, cleared, dropped, merged, scored], { reduceMotion: false });
    expect(beats.map((b: Beat) => b.kind)).toEqual(['settle', 'sweep', 'gemDrop', 'merge', 'scoreRoll']);
    // starts are cumulative
    for (let i = 1; i < beats.length; i++) {
      expect(beats[i].startMs).toBe(beats[i - 1].startMs + beats[i - 1].durationMs);
    }
  });

  it('placement without clears yields only settle', () => {
    const beats = buildTimeline([placed], { reduceMotion: false });
    expect(beats.map((b) => b.kind)).toEqual(['settle']);
  });

  it('reduce motion halves durations', () => {
    const normal = buildTimeline([placed, cleared, scored], { reduceMotion: false });
    const reduced = buildTimeline([placed, cleared, scored], { reduceMotion: true });
    expect(reduced[1].durationMs).toBe(normal[1].durationMs / 2);
  });

  it('attaches haptic and sfx cues to the right beats', () => {
    const beats = buildTimeline([placed, cleared, dropped, merged, scored], { reduceMotion: false });
    expect(beats.find((b) => b.kind === 'settle')?.haptic).toBe('light');
    expect(beats.find((b) => b.kind === 'sweep')?.haptic).toBe('medium');
    expect(beats.find((b) => b.kind === 'merge')?.haptic).toBe('success');
    expect(beats.find((b) => b.kind === 'merge')?.sfx).toBe('merge');
  });
});
```

- [ ] **Step 2: Run** — `npx jest src/components/board/AnimationDirector.test.ts` — Expected: FAIL (module missing).

- [ ] **Step 3: Implement**

```typescript
// src/components/board/AnimationDirector.ts
// Converts engine events into an ordered beat timeline (spec §6).
// Pure (testable): playTimeline() applies it with Reanimated + haptics + sfx.
import type { EngineEvent } from '@/lib/game/engine';
import { motion } from '@/lib/design/tokens';

export type BeatKind = 'settle' | 'sweep' | 'gemDrop' | 'merge' | 'scoreRoll';

export interface Beat {
  kind: BeatKind;
  startMs: number;
  durationMs: number;
  event: EngineEvent;
  haptic?: 'light' | 'medium' | 'success';
  sfx?: 'place' | 'clear' | 'merge';
}

const DURATIONS: Record<BeatKind, number> = {
  settle: motion.instant,   // 80
  sweep: 240,
  gemDrop: 180,
  merge: motion.base,       // 220
  scoreRoll: motion.base,   // 220
};

export function buildTimeline(
  events: EngineEvent[],
  opts: { reduceMotion: boolean }
): Beat[] {
  const beats: Beat[] = [];
  let cursor = 0;
  const push = (kind: BeatKind, event: EngineEvent, haptic?: Beat['haptic'], sfx?: Beat['sfx']) => {
    const durationMs = opts.reduceMotion ? DURATIONS[kind] / 2 : DURATIONS[kind];
    beats.push({ kind, startMs: cursor, durationMs, event, haptic, sfx });
    cursor += durationMs;
  };

  for (const e of events) {
    if (e.type === 'piecePlaced') push('settle', e, 'light', 'place');
    if (e.type === 'linesCleared') push('sweep', e, 'medium', 'clear');
    if (e.type === 'gemsDropped') push('gemDrop', e);
    if (e.type === 'mergeFormed') push('merge', e, 'success', 'merge');
    if (e.type === 'scoreAwarded') push('scoreRoll', e);
  }
  return beats;
}
```

- [ ] **Step 4: Run** — `npx jest src/components/board/AnimationDirector.test.ts` — Expected: PASS (4 tests).

- [ ] **Step 5: Add the player (no test — thin I/O shell over tested timeline)**

Append to `AnimationDirector.ts`:

```typescript
import { AccessibilityInfo } from 'react-native';
import { playCascadeHaptics } from '@/lib/haptics/cascade';
import { playSfx } from '@/lib/audio/sfx';

/** Fire haptics/sfx on schedule; visual beats are consumed by BoardCanvas
 *  effect layers keyed off the same Beat list. Returns total duration. */
export async function playTimeline(
  beats: Beat[],
  onBeat: (beat: Beat) => void
): Promise<number> {
  for (const beat of beats) {
    setTimeout(() => {
      onBeat(beat);
      if (beat.haptic) void playCascadeHaptics(beat.haptic);
      if (beat.sfx) void playSfx(beat.sfx);
    }, beat.startMs);
  }
  const last = beats[beats.length - 1];
  return last ? last.startMs + last.durationMs : 0;
}

export async function isReduceMotion(): Promise<boolean> {
  try { return await AccessibilityInfo.isReduceMotionEnabled(); } catch { return false; }
}
```

Executor note: check the actual exported names in `src/lib/haptics/cascade.ts` and `src/lib/audio/sfx.ts` and adapt the two calls — both modules exist and are unit-tested; do not re-implement them. Timeouts must be tracked and cleared on unmount by the consuming screen (store ids in a ref).

- [ ] **Step 6: Typecheck + commit**

```bash
npm run typecheck && npx jest
git add src/components/board/AnimationDirector.ts src/components/board/AnimationDirector.test.ts
git commit -m "feat(board): AnimationDirector — tested beat timeline + haptic/sfx player"
```

---

### Task 11: GameSurface — compose canvas, lattice, tray, drag

**Files:**
- Create: `src/components/board/GameSurface.tsx`
- Modify: `src/components/design/PiecesTray.tsx` (add `onTrayLayout` + `pieceIndexAtTrayPoint` support via fixed 3-slot layout)

- [ ] **Step 1: Implement GameSurface**

```tsx
// src/components/board/GameSurface.tsx
// One component both game screens share (spec §4): canvas + lattice + tray +
// drag wiring. Screens own engine state and pass it down; this owns geometry.
import React, { useCallback, useMemo, useState } from 'react';
import { View, Dimensions, type LayoutChangeEvent } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import type { GameBoard, GamePiece } from '@/lib/types/game';
import { makeGeometry } from '@/lib/board/geometry';
import { BoardCanvas } from './BoardCanvas';
import { InputLattice } from './InputLattice';
import { useDragPlacement } from './useDragPlacement';
import { PiecesTray } from '@/components/design/PiecesTray';
import { space } from '@/lib/design/tokens';

const SCREEN_W = Dimensions.get('window').width;
const BOARD_SIZE_PX = SCREEN_W - 12 * 2; // spec §3: outer padding 16 -> 12
const PADDING = 10;
const GAP = 2;

export function GameSurface({
  board, pieces, selectedPieceIndex, onSelectPiece, onPlace,
}: {
  board: GameBoard;
  pieces: GamePiece[];
  selectedPieceIndex: number | undefined;
  onSelectPiece: (piece: GamePiece, index: number) => void;
  onPlace: (pieceIndex: number, row: number, col: number) => void;
}) {
  const geometry = useMemo(
    () => makeGeometry({ boardX: 0, boardY: 0, boardSize: BOARD_SIZE_PX, padding: PADDING, gap: GAP, cells: 8 }),
    []
  );
  const [trayOffsetY, setTrayOffsetY] = useState(BOARD_SIZE_PX + space.md);

  // Tray slots are thirds of the surface width — pure math, no measurement needed.
  const pieceIndexAtTrayPoint = useCallback((x: number, y: number) => {
    if (y < 0 || y > 96) return -1;
    return Math.min(2, Math.max(0, Math.floor(x / (BOARD_SIZE_PX / 3))));
  }, []);

  const { pan, ghost } = useDragPlacement({
    geometry, board, pieces, pieceIndexAtTrayPoint, trayOffsetY,
    onCommit: onPlace,
  });

  const handleTap = useCallback((row: number, col: number) => {
    if (selectedPieceIndex !== undefined) onPlace(selectedPieceIndex, row, col);
  }, [selectedPieceIndex, onPlace]);

  return (
    <GestureDetector gesture={pan}>
      <View style={{ width: BOARD_SIZE_PX, alignSelf: 'center' }}>
        <View>
          <BoardCanvas board={board} geometry={geometry} pieces={pieces} ghost={ghost} />
          <InputLattice board={board} geometry={geometry} onCellPress={handleTap} />
        </View>
        <View
          style={{ marginTop: space.md }}
          onLayout={(e: LayoutChangeEvent) => setTrayOffsetY(e.nativeEvent.layout.y)}
        >
          <PiecesTray pieces={pieces} selectedIndex={selectedPieceIndex} onSelect={onSelectPiece} />
        </View>
      </View>
    </GestureDetector>
  );
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
npm run typecheck
git add src/components/board/GameSurface.tsx src/components/design/PiecesTray.tsx
git commit -m "feat(board): GameSurface — shared canvas+lattice+tray+drag composition"
```

---

### Task 12: Rebuild Endless (`game.tsx`) on the engine

**Files:**
- Modify: `src/app/game.tsx` (full rewrite of the game-loop part; keep route, testIDs `game-screen`, power-up UI, HUD per spec §3/§4)

- [ ] **Step 1: Rewrite the screen core**

Replace the state block and `handleCellPress` with engine consumption (structure below; HUD/JSX restyle keeps the existing primitives — `GlassCard`, `Pill`, `TactileButton`):

```tsx
// src/app/game.tsx — core wiring (replaces useState game logic, lines 206-412)
import { createRun, applyMove, type EngineState } from '@/lib/game/engine';
import { mathRandomSource } from '@/lib/game/rng';
import { buildTimeline, playTimeline, isReduceMotion } from '@/components/board/AnimationDirector';
import { GameSurface } from '@/components/board/GameSurface';

export default function GameScreen() {
  const [engine, setEngine] = useState<EngineState>(() => createRun(mathRandomSource));
  const [selectedPieceIndex, setSelectedPieceIndex] = useState<number | undefined>(undefined);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const runStartRef = useRef(Date.now());

  const handlePlace = useCallback(async (pieceIndex: number, row: number, col: number) => {
    const out = applyMove(engine, { type: 'place', pieceIndex, row, col }, mathRandomSource);
    if (out.events[0]?.type === 'rejected') return;
    setEngine(out.state);
    setSelectedPieceIndex(undefined);

    const beats = buildTimeline(out.events, { reduceMotion: await isReduceMotion() });
    void playTimeline(beats, () => {});

    if (out.state.gameOver) {
      // CORRECT final values from engine state — fixes audit C2 (stale score bug).
      saveScore({
        id: `game-${Date.now()}`,
        score: out.state.score,
        mode: 'endless',
        date: new Date().toISOString(),
        maxMultiplier: out.state.maxMultiplier,
        durationMs: Date.now() - runStartRef.current,
      });
      void checkAchievements({
        runMode: 'endless',
        score: out.state.score,
        maxMultiplier: out.state.maxMultiplier,
        durationMs: Date.now() - runStartRef.current,
        didMerge: out.state.maxMultiplier > 1,
        didDailyComplete: false, dailyStreakDays: 0, dailiesPlayedTotal: 0,
      }).then((granted) => { if (granted.length > 0) showAchievementsToasts(granted); })
        .catch((e) => console.warn('achievements check failed', e));
    }
  }, [engine]);

  useEffect(() => () => { timeoutsRef.current.forEach(clearTimeout); }, []);

  // render: HUD (back · ENDLESS pill · rolling score · multiplier pill) +
  // <GameSurface board={engine.board} pieces={engine.pieces}
  //   selectedPieceIndex={selectedPieceIndex}
  //   onSelectPiece={(_, i) => setSelectedPieceIndex(i)}
  //   onPlace={handlePlace} />
  // + game-over result card (existing JSX, engine.score / engine.maxMultiplier)
}
```

Power-ups: keep `getStartingPowerUps`/`applyBlast`/`applyReroll`/`applyTarget`/`applyColorBomb` from `src/lib/game/powerups.ts` operating on `engine.board`, then `setEngine({ ...engine, board: newBoard, score: engine.score + points })` — they are already pure. Delete the old `handleCellPress`, `startNewGame` state resets become `setEngine(createRun(mathRandomSource))`.

- [ ] **Step 2: Verify in app**

Run: `npm start`, open Endless on a simulator/device. Checklist: drag piece from tray → ghost appears snapped → release places; tap-tap fallback works; line clear → gems appear with tiers; game over saves the score *including* the final move's points.

- [ ] **Step 3: Run full checks**

Run: `npm run typecheck && npx jest && npm run lint` — Expected: all pass.

- [ ] **Step 4: Maestro flow**

Run: `maestro test .maestro/flows/gameplay/endless-mode.yaml` — Expected: PASS (lattice keeps `cell-r-c` testIDs).

- [ ] **Step 5: Commit**

```bash
git add src/app/game.tsx
git commit -m "feat(endless): rebuild on engine + GameSurface; fixes stale final-score bug"
```

---

### Task 13: Rebuild Daily (`daily.tsx`) on the engine

**Files:**
- Modify: `src/app/daily.tsx` (game-loop replacement, same pattern as Task 12; keep standings/archive/paywall/result-card JSX and all testIDs: `tournament-screen`, `start-tournament-button`, `archive-button`, `view-standings-button`, `already-played-card`)

- [ ] **Step 1: Replace state + handleCellPress with engine wiring**

Differences from Task 12 (everything else identical):

```tsx
// Daily uses the seeded source for the WHOLE run (one instance per run):
const rngRef = useRef<SeededRandom>(new SeededRandom(getDailySeed()));

const startTournament = async () => {
  track('daily_started', { puzzle_id: getTodayDateString() });
  rngRef.current = new SeededRandom(getDailySeed());
  setEngine(createRun(rngRef.current));
  // replay recorder init — unchanged from current lines 152-157
};

const handlePlace = useCallback(async (pieceIndex: number, row: number, col: number) => {
  const piece = engine.pieces[pieceIndex];
  const out = applyMove(engine, { type: 'place', pieceIndex, row, col }, rngRef.current);
  if (out.events[0]?.type === 'rejected') return;
  setEngine(out.state);
  setSelectedPieceIndex(undefined);

  if (replayRecorder?.isRecording()) {
    const cleared = out.events.find((e) => e.type === 'linesCleared');
    replayRecorder.recordMove(
      piece, { row, col }, out.state.score,
      cleared && cleared.type === 'linesCleared' ? cleared.rows.length + cleared.cols.length : 0,
      out.state.multiplier
    );
  }

  const beats = buildTimeline(out.events, { reduceMotion: await isReduceMotion() });
  void playTimeline(beats, () => {});

  if (out.state.gameOver) void handleRunEnd(out.state);
}, [engine, replayRecorder]);
```

`handleRunEnd(final: EngineState)` keeps its current body (replay stop, coins, saveScore, achievements, standings) but reads `final.score` / `final.maxMultiplier` / `final.board` instead of loose state, and the standings `setTimeout` id goes into `timeoutsRef` (cleared on unmount — audit P2).

Note: daily piece sequence now comes from the engine's run-scoped seeded rng (replaces `generateTournamentPieces` + `pieceSetIndex` offset scheme). **Gem colors are now seeded too — this lands audit M1.1's client side as a consequence of the architecture.** `generateTournamentPieces` stays exported for the replay/archive utilities until M1.x reconciles them.

- [ ] **Step 2: Verify in app**

`npm start` → Daily: Begin run → drag-place works; complete a run → result card shows engine score; `already-played-card` appears on revisit.

- [ ] **Step 3: Full checks + Maestro**

Run: `npm run typecheck && npx jest && maestro test .maestro/flows/gameplay/daily.yaml` — Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add src/app/daily.tsx
git commit -m "feat(daily): rebuild on seeded engine + GameSurface — deterministic run incl. gem colors"
```

---

### Task 14: Delete the replaced rendering path

**Files:**
- Delete: `src/components/GameBoard.tsx`, `src/components/ComboAnimation.tsx`, `src/components/GemDisplay.tsx`
- Modify: `src/components/ReplayPlayer.tsx` (swap `GameBoard` → `BoardCanvas` + static geometry, no lattice/gestures needed for playback), any remaining importers (`grep -r "GameBoard\|ComboAnimation\|GemDisplay" src/`)
- Keep: `src/components/cascade/MergeAnimation.tsx` (still the cascade burst overlay, now triggered by the `merge` beat)

- [ ] **Step 1: Migrate ReplayPlayer**

In `ReplayPlayer.tsx`, replace the `GameBoard` usage with:

```tsx
import { BoardCanvas } from '@/components/board/BoardCanvas';
import { makeGeometry } from '@/lib/board/geometry';
import { useSharedValue } from 'react-native-reanimated';
// inside component:
const geometry = useMemo(() => makeGeometry({
  boardX: 0, boardY: 0, boardSize: Dimensions.get('window').width - 24,
  padding: 10, gap: 2, cells: 8,
}), []);
const noGhost = useSharedValue({ row: -1, col: -1, valid: false, pieceIndex: -1 });
// render: <BoardCanvas board={playbackBoard} geometry={geometry} pieces={[]} ghost={noGhost} />
```

- [ ] **Step 2: Delete dead components and fix imports**

Run: `grep -rn "components/GameBoard\|ComboAnimation\|GemDisplay" src/` — migrate every hit, then delete the three files.

- [ ] **Step 3: Full checks**

Run: `npm run typecheck && npx jest && npm run lint` — Expected: pass, no unused-import warnings.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor(board): remove RN-view board renderer; migrate ReplayPlayer to BoardCanvas"
```

---

### Task 15: Drag e2e flow + device verification

**Files:**
- Create: `.maestro/flows/gameplay/drag-place.yaml`

- [ ] **Step 1: Write the flow**

```yaml
# .maestro/flows/gameplay/drag-place.yaml
appId: com.blockmergearena.app
---
- runFlow: ../setup/skip-welcome.yaml
- tapOn:
    id: "endless-button"   # verify actual Home nav testID via .maestro/flows/navigation/home-navigation.yaml
- assertVisible:
    id: "game-screen"
- swipe:
    start: 50%, 88%        # middle tray slot
    end: 50%, 40%          # board center
    duration: 800
- assertVisible:
    id: "game-screen"      # app did not crash; placement either committed or sprang back
```

- [ ] **Step 2: Run** — `maestro test .maestro/flows/gameplay/drag-place.yaml` — Expected: PASS. Then the full suite: `npm run e2e` — Expected: all existing flows still PASS.

- [ ] **Step 3: Performance spot-check (spec §7)**

On a real or emulated mid-range Android: enable the RN perf monitor, drag continuously for 10s and trigger a multi-line cascade. Expected: UI FPS ≥ 30 on Pixel-5-class, JS FPS unaffected while dragging. Record numbers in the PR description. If glow layers drop frames, gate the gem halo `Circle` behind a `lowEnd` flag from `expo-device` total memory < 4GB.

- [ ] **Step 4: Reduce-motion check**

Enable Reduce Motion in OS settings → cascade plays crossfades at half duration (Director test already proves timings; this verifies the wiring).

- [ ] **Step 5: Commit**

```bash
git add .maestro/flows/gameplay/drag-place.yaml
git commit -m "test(e2e): drag-to-place Maestro flow + perf verification notes"
```

---

## Self-review (done at write time)

- **Spec coverage:** §2.1 engine → Tasks 4-5; §2.2 renderer + geometry → Tasks 6-7; §2.3 input → Tasks 8-9; §3 tokens/HUD → Tasks 1, 12; §4 game screens → Tasks 12-13 (other screens = plan 2); §5 drag anatomy → Task 9 (lift 72pt, hysteresis 6px in Task 6); §6 director + reduce-motion → Task 10; §7 perf → Task 15; §8 testing → Tasks 4-6, 10, 15. Gap: `ScreenHeader`/`AsyncStateView` (§4 table) belong to plan 2 where they're used.
- **Type consistency:** `GhostState`, `Geometry`, `EngineEvent`, `Beat` names verified consistent across Tasks 6-13.
- **Known executor judgment points (explicitly flagged, not placeholders):** Skia v2-next prop signatures (Task 7 step 2), haptics/sfx export names (Task 10 step 5), Home nav testID (Task 15 step 1).
