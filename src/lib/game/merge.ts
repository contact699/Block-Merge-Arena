// Gem Merge Logic
import type { GameBoard, CellState, Gem, BlockColor, Position } from '@/lib/types/game';

/**
 * Generate gems from cleared cells
 * Each cleared cell drops a gem with a random color
 */
export function generateGemsFromClearedCells(clearedCells: Position[]): Gem[] {
  const colors: BlockColor[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

  return clearedCells.map((pos: Position) => ({
    id: `gem-${Date.now()}-${Math.random()}`,
    color: colors[Math.floor(Math.random() * colors.length)],
    position: pos,
    size: 'small' as const,
    multiplier: 1
  }));
}

/**
 * Place gems on the board
 */
export function placeGemsOnBoard(board: GameBoard, gems: Gem[]): GameBoard {
  const newBoard = board.map((row: CellState[]) =>
    row.map((cell: CellState) => ({ ...cell }))
  );

  for (const gem of gems) {
    const { row, col } = gem.position;
    if (row >= 0 && row < newBoard.length && col >= 0 && col < newBoard[0].length) {
      newBoard[row][col] = { filled: false, color: gem.color };
    }
  }

  return newBoard;
}

/**
 * Find adjacent gems of the same color
 */
function findAdjacentGems(
  gems: Gem[],
  startGem: Gem,
  visited: Set<string>
): Gem[] {
  const cluster: Gem[] = [startGem];
  visited.add(startGem.id);

  const queue: Gem[] = [startGem];

  while (queue.length > 0) {
    const current = queue.shift()!;

    // Check all 4 directions (up, down, left, right)
    const neighbors = gems.filter((gem: Gem) => {
      if (visited.has(gem.id)) return false;
      if (gem.color !== startGem.color) return false;

      const rowDiff = Math.abs(gem.position.row - current.position.row);
      const colDiff = Math.abs(gem.position.col - current.position.col);

      // Adjacent if one step away in one direction only
      return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    });

    for (const neighbor of neighbors) {
      visited.add(neighbor.id);
      cluster.push(neighbor);
      queue.push(neighbor);
    }
  }

  return cluster;
}

/**
 * Determine gem size based on cluster count
 */
function getGemSize(count: number): 'small' | 'medium' | 'large' | 'mega' {
  if (count >= 5) return 'mega';
  if (count >= 4) return 'large';
  if (count >= 3) return 'medium';
  return 'small';
}

/**
 * Get multiplier based on gem size
 */
export function getGemMultiplier(size: 'small' | 'medium' | 'large' | 'mega'): number {
  const multipliers = {
    small: 1,
    medium: 2,
    large: 3,
    mega: 5
  };
  return multipliers[size];
}

/**
 * Merge adjacent gems of the same color
 */
export function mergeGems(gems: Gem[]): Gem[] {
  if (gems.length === 0) return [];

  const visited = new Set<string>();
  const mergedGems: Gem[] = [];

  for (const gem of gems) {
    if (visited.has(gem.id)) continue;

    const cluster = findAdjacentGems(gems, gem, visited);

    if (cluster.length >= 2) {
      // Merge into one larger gem
      // Position is the center of the cluster
      const avgRow = Math.round(
        cluster.reduce((sum: number, g: Gem) => sum + g.position.row, 0) / cluster.length
      );
      const avgCol = Math.round(
        cluster.reduce((sum: number, g: Gem) => sum + g.position.col, 0) / cluster.length
      );

      const size = getGemSize(cluster.length);
      const multiplier = getGemMultiplier(size);

      mergedGems.push({
        id: `merged-${Date.now()}-${Math.random()}`,
        color: gem.color,
        position: { row: avgRow, col: avgCol },
        size,
        multiplier
      });
    } else {
      // Keep as single gem
      mergedGems.push(gem);
    }
  }

  return mergedGems;
}

/**
 * Get all gems currently on the board
 */
export function getGemsFromBoard(board: GameBoard): Gem[] {
  const gems: Gem[] = [];

  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      const cell = board[row][col];
      // If cell has a color but is not filled (block), it's a gem
      if (!cell.filled && cell.color) {
        gems.push({
          id: `gem-${row}-${col}`,
          color: cell.color,
          position: { row, col },
          size: 'small',
          multiplier: 1
        });
      }
    }
  }

  return gems;
}

/**
 * Calculate total multiplier from all gems
 */
export function calculateTotalMultiplier(gems: Gem[]): number {
  if (gems.length === 0) return 1;

  // Find the highest multiplier gem
  const maxMultiplier = Math.max(...gems.map((g: Gem) => g.multiplier));
  return maxMultiplier;
}

/**
 * Remove gems from specific positions on the board
 */
export function removeGemsFromBoard(board: GameBoard, positions: Position[]): GameBoard {
  const newBoard = board.map((row: CellState[]) =>
    row.map((cell: CellState) => ({ ...cell }))
  );

  for (const pos of positions) {
    const { row, col } = pos;
    if (row >= 0 && row < newBoard.length && col >= 0 && col < newBoard[0].length) {
      // Only remove if it's a gem (not filled but has color)
      if (!newBoard[row][col].filled && newBoard[row][col].color) {
        newBoard[row][col] = { filled: false };
      }
    }
  }

  return newBoard;
}
