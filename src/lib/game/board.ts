// Game Board Logic
import type { GameBoard, CellState, GamePiece, Position } from '@/lib/types/game';

export const BOARD_SIZE = 8; // 8x8 grid (can be changed to 10 for 10x10)

/**
 * Create an empty game board
 */
export function createEmptyBoard(): GameBoard {
  const board: GameBoard = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    board[row] = [];
    for (let col = 0; col < BOARD_SIZE; col++) {
      board[row][col] = { filled: false };
    }
  }
  return board;
}

/**
 * Check if a piece can be placed at the given position
 */
export function canPlacePiece(
  board: GameBoard,
  piece: GamePiece,
  targetRow: number,
  targetCol: number
): boolean {
  // Check each cell of the piece
  for (const pos of piece.shape) {
    const boardRow = targetRow + pos.row;
    const boardCol = targetCol + pos.col;

    // Check if out of bounds
    if (boardRow < 0 || boardRow >= BOARD_SIZE || boardCol < 0 || boardCol >= BOARD_SIZE) {
      return false;
    }

    // Check if cell is already filled
    if (board[boardRow][boardCol].filled) {
      return false;
    }
  }

  return true;
}

/**
 * Place a piece on the board at the given position
 */
export function placePiece(
  board: GameBoard,
  piece: GamePiece,
  targetRow: number,
  targetCol: number
): GameBoard {
  // Create a copy of the board
  const newBoard = board.map((row: CellState[]) => row.map((cell: CellState) => ({ ...cell })));

  // Place the piece
  for (const pos of piece.shape) {
    const boardRow = targetRow + pos.row;
    const boardCol = targetCol + pos.col;
    newBoard[boardRow][boardCol] = {
      filled: true,
      color: piece.color
    };
  }

  return newBoard;
}

/**
 * Check which lines (rows or columns) are complete
 */
export function findCompleteLines(board: GameBoard): {
  rows: number[];
  cols: number[];
} {
  const completeRows: number[] = [];
  const completeCols: number[] = [];

  // Check rows
  for (let row = 0; row < BOARD_SIZE; row++) {
    if (board[row].every((cell: CellState) => cell.filled)) {
      completeRows.push(row);
    }
  }

  // Check columns
  for (let col = 0; col < BOARD_SIZE; col++) {
    const isComplete = board.every((row: CellState[]) => row[col].filled);
    if (isComplete) {
      completeCols.push(col);
    }
  }

  return { rows: completeRows, cols: completeCols };
}

/**
 * Clear complete lines from the board
 */
export function clearLines(board: GameBoard): {
  newBoard: GameBoard;
  clearedCells: Position[];
} {
  const { rows, cols } = findCompleteLines(board);
  const clearedCells: Position[] = [];
  const newBoard = board.map((row: CellState[]) => row.map((cell: CellState) => ({ ...cell })));

  // Clear complete rows
  for (const row of rows) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (newBoard[row][col].filled) {
        clearedCells.push({ row, col });
        newBoard[row][col] = { filled: false };
      }
    }
  }

  // Clear complete columns
  for (const col of cols) {
    for (let row = 0; row < BOARD_SIZE; row++) {
      if (newBoard[row][col].filled) {
        // Check if not already cleared by row
        const alreadyCleared = clearedCells.some(
          (pos: Position) => pos.row === row && pos.col === col
        );
        if (!alreadyCleared) {
          clearedCells.push({ row, col });
        }
        newBoard[row][col] = { filled: false };
      }
    }
  }

  return { newBoard, clearedCells };
}

/**
 * Check if any of the given pieces can be placed anywhere on the board
 */
export function hasValidMoves(board: GameBoard, pieces: GamePiece[]): boolean {
  for (const piece of pieces) {
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (canPlacePiece(board, piece, row, col)) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Count the number of filled cells on the board
 */
export function countFilledCells(board: GameBoard): number {
  let count = 0;
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col].filled) {
        count++;
      }
    }
  }
  return count;
}

/**
 * Get all possible placements for a piece
 */
export function getValidPlacements(board: GameBoard, piece: GamePiece): Position[] {
  const validPlacements: Position[] = [];

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (canPlacePiece(board, piece, row, col)) {
        validPlacements.push({ row, col });
      }
    }
  }

  return validPlacements;
}
