// Pure game engine — single source of game rules (spec §2.1, audit M2.1).
// No React, no I/O. Renderer and replay both consume { state, events }.
import type { GameBoard, GamePiece, BlockColor, GemTier, Position, BlockShapeType } from '@/lib/types/game';
import { BOARD_SIZE, createEmptyBoard, canPlacePiece, placePiece, findCompleteLines, hasValidMoves } from './board';
import { BLOCK_SHAPES } from './pieces';
import type { RandomSource } from './rng';

export interface EngineState {
  board: GameBoard;
  pieces: GamePiece[];
  score: number;
  multiplier: number;       // applied to the NEXT clear (existing game behavior, kept)
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
  n >= 4 ? 'mega' : n >= 3 ? 'large' : n >= 2 ? 'medium' : 'small';
const MULT_BY_TIER: Record<GemTier, number> = { small: 1, medium: 2, large: 3, mega: 5 };

function randomPiece(rng: RandomSource): GamePiece {
  const shapeTypes = Object.keys(BLOCK_SHAPES) as BlockShapeType[];
  const shapeType = shapeTypes[rng.nextInt(0, shapeTypes.length - 1)];
  const color = GEM_COLORS[rng.nextInt(0, GEM_COLORS.length - 1)];
  const shape = BLOCK_SHAPES[shapeType];
  const maxRow = Math.max(...shape.map((p) => p.row));
  const maxCol = Math.max(...shape.map((p) => p.col));
  return {
    id: `piece-${rng.nextInt(0, 2147483646)}`,  // deterministic given the seed
    shape,
    shapeType,
    color,
    width: maxCol + 1,
    height: maxRow + 1,
  };
}

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
      events.push({ type: 'gemCrushed', cell, color: c.color, lostMultiplier: c.gemMultiplier ?? 1 });
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
    for (const row of rows) for (let col = 0; col < BOARD_SIZE; col++) seen.add(`${row}:${col}`);
    for (const col of cols) for (let row = 0; row < BOARD_SIZE; row++) seen.add(`${row}:${col}`);
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
      board[d.cell.row][d.cell.col] = { filled: false, color: d.color, gemTier: 'small', gemMultiplier: 1 };
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
      const cr = cluster.reduce((s, p) => s + p.row, 0) / cluster.length;
      const cc = cluster.reduce((s, p) => s + p.col, 0) / cluster.length;
      const anchor = cluster.reduce((best, p) =>
        (p.row - cr) ** 2 + (p.col - cc) ** 2 < (best.row - cr) ** 2 + (best.col - cc) ** 2 ? p : best
      );
      const tier = TIER_BY_COUNT(cluster.length);
      const mult = MULT_BY_TIER[tier];
      for (const p of cluster) board[p.row][p.col] = { filled: false };
      board[anchor.row][anchor.col] = { filled: false, color: cell.color, gemTier: tier, gemMultiplier: mult };
      events.push({ type: 'mergeFormed', cluster, anchor, color: cell.color, tier, multiplier: mult });
    }
  }
}
