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
    expect(o.x).toBe(43); // boardX 16 + boardPadding 8 + cellSize/2 19
    expect(o.y).toBe(227); // boardY 200 + boardPadding 8 + cellSize/2 19
  });

  it('places origin in the right region for the (4,4) cell', () => {
    const o = computeCascadeOrigin({ row: 4, col: 4 }, layout);
    expect(o.x).toBeGreaterThan(layout.boardX + layout.boardPadding + 4 * layout.cellSize);
    expect(o.x).toBeLessThan(layout.boardX + layout.boardPadding + 5 * layout.cellSize);
  });

  it('keeps origin within the board for the (7,7) corner', () => {
    const o = computeCascadeOrigin({ row: 7, col: 7 }, layout);
    expect(o.x).toBeLessThan(layout.boardX + layout.boardSize);
    expect(o.y).toBeLessThan(layout.boardY + layout.boardSize);
  });

  it('uses the optional cellGap when provided', () => {
    const layoutWithGap = { ...layout, cellGap: 2 };
    const o = computeCascadeOrigin({ row: 1, col: 1 }, layoutWithGap);
    // boardX 16 + boardPadding 8 + (cellSize 38 + gap 2) + cellSize/2 19 = 83
    expect(o.x).toBe(83);
  });
});
