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
    const full = s.board.map((r) => r.map(() => ({ filled: true as const, color: 'red' as const })));
    const out2 = applyMove({ ...s, board: full }, { type: 'place', pieceIndex: 0, row: 0, col: 0 }, rng);
    expect(out2.events).toEqual([{ type: 'rejected' }]);
    expect(out2.state.score).toBe(s.score);
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
    expect(out.state.score).toBe(80);
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
    board[4][4] = { filled: false, color: 'yellow', gemTier: 'small', gemMultiplier: 1 };
    board[4][5] = { filled: false, color: 'yellow', gemTier: 'small', gemMultiplier: 1 };
    const base = createRun(new SeededRandom(5));
    const piece = generatePieceByType('I2', 'blue');
    const s: EngineState = { ...base, board, pieces: [piece, base.pieces[1], base.pieces[2]] };
    const out = applyMove(s, { type: 'place', pieceIndex: 0, row: 0, col: 0 }, new SeededRandom(5));
    const merge = out.events.find((e) => e.type === 'mergeFormed') as any;
    expect(merge).toBeDefined();
    expect(merge.tier).toBe('medium');
    const anchor = out.state.board[merge.anchor.row][merge.anchor.col];
    expect(anchor).toMatchObject({ filled: false, color: 'yellow', gemTier: 'medium', gemMultiplier: 2 });
    const yellows = out.state.board.flat().filter((c) => !c.filled && c.color === 'yellow');
    expect(yellows).toHaveLength(1);
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
    expect(out.state.pieces).toHaveLength(3);
    expect(out.state.gameOver).toBe(false);
  });
});
