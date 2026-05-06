import { describe, it, expect } from '@jest/globals';
import { renderShareGrid, ShareGridInput } from './grid';

const empty = (): (null | { color: string; gem?: boolean; mult?: number })[][] =>
  Array.from({ length: 8 }, () => Array(8).fill(null));

describe('renderShareGrid', () => {
  it('formats the header line with puzzle id, score, and combo', () => {
    const out = renderShareGrid({ puzzleId: '142', score: 24180, maxMultiplier: 7, board: empty() });
    expect(out.split('\n')[0]).toBe('Block Merge #142 · 24,180 · ×7 combo');
  });

  it('omits the combo segment if maxMultiplier <= 1', () => {
    const out = renderShareGrid({ puzzleId: '5', score: 100, maxMultiplier: 1, board: empty() });
    expect(out.split('\n')[0]).toBe('Block Merge #5 · 100');
  });

  it('renders empty cells as ⬜', () => {
    const out = renderShareGrid({ puzzleId: '1', score: 0, maxMultiplier: 1, board: empty() });
    const lines = out.split('\n').slice(1, 9);
    for (const line of lines) {
      expect(line).toBe('⬜⬜⬜⬜⬜⬜⬜⬜');
    }
  });

  it('renders solid blocks as colored squares', () => {
    const board = empty();
    board[0][0] = { color: 'ember' };
    board[0][1] = { color: 'cobalt' };
    board[0][2] = { color: 'forest' };
    const out = renderShareGrid({ puzzleId: '1', score: 0, maxMultiplier: 1, board });
    expect(out.split('\n')[1].slice(0, 6)).toBe('🟧🟦🟩');
  });

  it('renders merged gems as colored circles with superscript multiplier', () => {
    const board = empty();
    board[0][0] = { color: 'ember', gem: true, mult: 5 };
    const out = renderShareGrid({ puzzleId: '1', score: 0, maxMultiplier: 5, board });
    expect(out.split('\n')[1].startsWith('🔴⁵')).toBe(true);
  });

  it('appends the url footer', () => {
    const out = renderShareGrid({ puzzleId: '1', score: 0, maxMultiplier: 1, board: empty() });
    expect(out.endsWith('blockmerge.app')).toBe(true);
  });

  it('uses comma-grouping for scores >= 1,000', () => {
    const out = renderShareGrid({ puzzleId: '1', score: 1234567, maxMultiplier: 1, board: empty() });
    expect(out.split('\n')[0]).toContain('1,234,567');
  });
});
