// src/lib/cascade/origin.ts
//
// Convert a board cell (row, col) plus the GameBoard's measured layout into
// screen-space coords for the cascade animation overlay. The board renders
// with `boardPadding` of inner padding and `cellSize` per cell; cells are
// laid out top-left → bottom-right in standard 8×8 grid order.

export interface BoardLayout {
  /** Page-relative X of the GameBoard wrapper's top-left. */
  boardX: number;
  /** Page-relative Y of the GameBoard wrapper's top-left. */
  boardY: number;
  /** Width = height of the GameBoard wrapper. */
  boardSize: number;
  /** Computed pixel size of one cell. */
  cellSize: number;
  /** Inner padding between board edge and the first cell. */
  boardPadding: number;
  /** Optional: gap between cells (defaults to 0). */
  cellGap?: number;
}

export interface Cell {
  row: number;
  col: number;
}

export interface ScreenPoint {
  x: number;
  y: number;
}

export function computeCascadeOrigin(cell: Cell, layout: BoardLayout): ScreenPoint {
  const gap = layout.cellGap ?? 0;
  const half = layout.cellSize / 2;
  const x = layout.boardX + layout.boardPadding + cell.col * (layout.cellSize + gap) + half;
  const y = layout.boardY + layout.boardPadding + cell.row * (layout.cellSize + gap) + half;
  return { x, y };
}
