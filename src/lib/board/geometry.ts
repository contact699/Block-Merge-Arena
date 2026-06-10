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
