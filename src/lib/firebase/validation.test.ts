import { validateScoreSubmission, MAX_SCORE_PER_MOVE } from './validation';

const ok = { score: 2400, mode: 'tournament' as const, maxMultiplier: 3, moveCount: 40, duration: 60000 };

describe('validateScoreSubmission', () => {
  it('accepts a plausible submission', () => {
    expect(validateScoreSubmission(ok)).toEqual({ valid: true });
  });
  it('rejects a negative score', () => {
    expect(validateScoreSubmission({ ...ok, score: -1 }).valid).toBe(false);
  });
  it('rejects a non-integer score', () => {
    expect(validateScoreSubmission({ ...ok, score: 12.5 }).valid).toBe(false);
  });
  it('rejects an absurd score (the 999999999 attack)', () => {
    expect(validateScoreSubmission({ ...ok, score: 999_999_999 }).valid).toBe(false);
  });
  it('rejects score exceeding the per-move ceiling', () => {
    expect(validateScoreSubmission({ ...ok, moveCount: 10, score: 10 * MAX_SCORE_PER_MOVE + 1 }).valid).toBe(false);
  });
  it('accepts score exactly at the per-move ceiling', () => {
    expect(validateScoreSubmission({ ...ok, moveCount: 10, score: 10 * MAX_SCORE_PER_MOVE }).valid).toBe(true);
  });
  it('rejects an invalid multiplier', () => {
    expect(validateScoreSubmission({ ...ok, maxMultiplier: 7 }).valid).toBe(false);
  });
  it('rejects an impossible duration (> 24h)', () => {
    expect(validateScoreSubmission({ ...ok, duration: 25 * 60 * 60 * 1000 }).valid).toBe(false);
  });
  it('when moveCount is missing, still rejects scores over the hard ceiling', () => {
    expect(validateScoreSubmission({ score: 50_000_000, mode: 'endless', maxMultiplier: 5 }).valid).toBe(false);
  });
  it('when moveCount is missing, accepts a normal score', () => {
    expect(validateScoreSubmission({ score: 5000, mode: 'endless', maxMultiplier: 2 }).valid).toBe(true);
  });
  it('rejects a sub-10M score that still exceeds the per-move cap (the OR-bug case)', () => {
    // moveCount 1 → per-move ceiling 5000; 9,999,999 is under 10M but must still be rejected
    expect(validateScoreSubmission({ score: 9_999_999, mode: 'tournament', maxMultiplier: 3, moveCount: 1 }).valid).toBe(false);
  });
  it('rejects an inflated moveCount used to lift the ceiling past the hard cap', () => {
    // moveCount 1,000,000 would imply a 5e9 per-move ceiling, but the hard cap (10M) still binds
    expect(validateScoreSubmission({ score: 20_000_000, mode: 'endless', maxMultiplier: 5, moveCount: 1_000_000 }).valid).toBe(false);
  });
});
