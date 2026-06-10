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
    const nearEdge = { x: center0.x + 19.5 + 3, y: center0.y };
    expect(snapTarget(g, nearEdge, { row: 0, col: 0 })).toEqual({ row: 0, col: 0 });
    const pastEdge = { x: center0.x + 19.5 + 10, y: center0.y };
    expect(snapTarget(g, pastEdge, { row: 0, col: 0 })).toEqual({ row: 0, col: 1 });
    expect(snapTarget(g, center0, null)).toEqual({ row: 0, col: 0 });
  });
});
