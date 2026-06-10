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
