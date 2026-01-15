// Power-ups Logic - Strategic abilities
import type { GameBoard, GamePiece, Position, PowerUp, BlockColor } from '@/lib/types/game';
import { generateRandomPiece } from '@/lib/game/pieces';
import { getValidPlacements } from '@/lib/game/board';

/**
 * All available power-ups with their properties
 */
export const POWER_UPS: Record<string, Omit<PowerUp, 'uses'>> = {
  reroll: {
    type: 'reroll',
    name: 'Reroll',
    description: 'Swap one piece for a different shape'
  },
  blast: {
    type: 'blast',
    name: 'Blast',
    description: 'Clear a 3x3 area on the board'
  },
  freeze: {
    type: 'freeze',
    name: 'Freeze',
    description: 'Pause the timer for 30 seconds'
  },
  target: {
    type: 'target',
    name: 'Target',
    description: 'AI suggests the best placement'
  },
  colorBomb: {
    type: 'colorBomb',
    name: 'Color Bomb',
    description: 'Clear all blocks of one color'
  }
};

/**
 * Create a power-up with specified number of uses
 */
export function createPowerUp(type: string, uses: number = 1): PowerUp {
  const powerUp = POWER_UPS[type];
  if (!powerUp) {
    throw new Error(`Unknown power-up type: ${type}`);
  }
  return { ...powerUp, uses };
}

/**
 * Get starting power-ups (2 power-ups for player loadout)
 */
export function getStartingPowerUps(): PowerUp[] {
  return [
    createPowerUp('reroll', 1),
    createPowerUp('blast', 1)
  ];
}

/**
 * Reroll Power-up: Replace a piece with a new random piece
 */
export function applyReroll(piece: GamePiece): GamePiece {
  return generateRandomPiece();
}

/**
 * Blast Power-up: Clear a 3x3 area centered on the given position
 */
export function applyBlast(
  board: GameBoard,
  centerRow: number,
  centerCol: number
): { newBoard: GameBoard; clearedCells: Position[] } {
  const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));
  const clearedCells: Position[] = [];

  // Clear 3x3 area
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const row = centerRow + dr;
      const col = centerCol + dc;

      // Check bounds
      if (row >= 0 && row < board.length && col >= 0 && col < board[0].length) {
        if (newBoard[row][col].filled) {
          clearedCells.push({ row, col });
          newBoard[row][col] = { filled: false };
        }
      }
    }
  }

  return { newBoard, clearedCells };
}

/**
 * Target Power-up: Suggest the best placement for a piece
 * Algorithm: Find placement that clears the most lines
 */
export function applyTarget(
  board: GameBoard,
  piece: GamePiece
): Position | null {
  const validPlacements = getValidPlacements(board, piece);

  if (validPlacements.length === 0) {
    return null;
  }

  let bestPlacement: Position | null = null;
  let bestScore = -1;

  // Simulate each placement and count potential lines cleared
  for (const placement of validPlacements) {
    const score = calculatePlacementScore(board, piece, placement);
    if (score > bestScore) {
      bestScore = score;
      bestPlacement = placement;
    }
  }

  return bestPlacement;
}

/**
 * Calculate score for a potential placement
 * Higher score = more lines cleared
 */
function calculatePlacementScore(
  board: GameBoard,
  piece: GamePiece,
  placement: Position
): number {
  const { row: targetRow, col: targetCol } = placement;
  let score = 0;

  // Simulate placement
  const tempBoard = board.map((r) => r.map((c) => ({ ...c })));

  for (const pos of piece.shape) {
    const boardRow = targetRow + pos.row;
    const boardCol = targetCol + pos.col;
    tempBoard[boardRow][boardCol] = { filled: true, color: piece.color };
  }

  // Count complete rows
  for (let row = 0; row < tempBoard.length; row++) {
    if (tempBoard[row].every((cell) => cell.filled)) {
      score += 10; // Each complete row is worth 10 points
    }
  }

  // Count complete columns
  for (let col = 0; col < tempBoard[0].length; col++) {
    if (tempBoard.every((row) => row[col].filled)) {
      score += 10; // Each complete column is worth 10 points
    }
  }

  // Bonus for filling more cells (tie-breaker)
  score += piece.shape.length * 0.1;

  return score;
}

/**
 * Color Bomb Power-up: Clear all blocks of a specific color
 */
export function applyColorBomb(
  board: GameBoard,
  color: BlockColor
): { newBoard: GameBoard; clearedCells: Position[] } {
  const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));
  const clearedCells: Position[] = [];

  // Clear all cells with the target color
  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      if (newBoard[row][col].filled && newBoard[row][col].color === color) {
        clearedCells.push({ row, col });
        newBoard[row][col] = { filled: false };
      }
    }
  }

  return { newBoard, clearedCells };
}

/**
 * Get all colors currently on the board
 */
export function getColorsOnBoard(board: GameBoard): BlockColor[] {
  const colors = new Set<BlockColor>();

  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      const cell = board[row][col];
      if (cell.filled && cell.color) {
        colors.add(cell.color as BlockColor);
      }
    }
  }

  return Array.from(colors);
}

/**
 * Use a power-up (decrement uses)
 */
export function usePowerUp(powerUp: PowerUp): PowerUp {
  return {
    ...powerUp,
    uses: Math.max(0, powerUp.uses - 1)
  };
}

/**
 * Check if a power-up can be used
 */
export function canUsePowerUp(powerUp: PowerUp): boolean {
  return powerUp.uses > 0;
}
