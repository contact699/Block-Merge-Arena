import { buildTimeline, type Beat } from './AnimationDirector';
import type { EngineEvent } from '@/lib/game/engine';

const placed: EngineEvent = { type: 'piecePlaced', cells: [{ row: 0, col: 0 }], color: 'blue' };
const cleared: EngineEvent = { type: 'linesCleared', rows: [0], cols: [], cells: [{ row: 0, col: 0 }] };
const dropped: EngineEvent = { type: 'gemsDropped', gems: [{ cell: { row: 0, col: 0 }, color: 'red' }] };
const merged: EngineEvent = {
  type: 'mergeFormed', cluster: [{ row: 0, col: 0 }, { row: 0, col: 1 }],
  anchor: { row: 0, col: 0 }, color: 'red', tier: 'medium', multiplier: 2,
};
const scored: EngineEvent = { type: 'scoreAwarded', points: 80, multiplier: 1 };

describe('buildTimeline', () => {
  it('orders beats settle → sweep → gemDrop → merge → scoreRoll', () => {
    const beats = buildTimeline([placed, cleared, dropped, merged, scored], { reduceMotion: false });
    expect(beats.map((b: Beat) => b.kind)).toEqual(['settle', 'sweep', 'gemDrop', 'merge', 'scoreRoll']);
    for (let i = 1; i < beats.length; i++) {
      expect(beats[i].startMs).toBe(beats[i - 1].startMs + beats[i - 1].durationMs);
    }
  });

  it('placement without clears yields only settle', () => {
    const beats = buildTimeline([placed], { reduceMotion: false });
    expect(beats.map((b) => b.kind)).toEqual(['settle']);
  });

  it('reduce motion halves durations', () => {
    const normal = buildTimeline([placed, cleared, scored], { reduceMotion: false });
    const reduced = buildTimeline([placed, cleared, scored], { reduceMotion: true });
    expect(reduced[1].durationMs).toBe(normal[1].durationMs / 2);
  });

  it('attaches haptic and sfx cues to the right beats', () => {
    const beats = buildTimeline([placed, cleared, dropped, merged, scored], { reduceMotion: false });
    expect(beats.find((b) => b.kind === 'settle')?.haptic).toBe('light');
    expect(beats.find((b) => b.kind === 'sweep')?.haptic).toBe('medium');
    expect(beats.find((b) => b.kind === 'merge')?.haptic).toBe('success');
    expect(beats.find((b) => b.kind === 'merge')?.sfx).toBe('merge');
  });
});
