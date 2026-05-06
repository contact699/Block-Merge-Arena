import { describe, it, expect } from '@jest/globals';
import { evaluateGrants, GrantContext } from './grants';

describe('evaluateGrants', () => {
  const baseCtx: GrantContext = {
    runMode: 'endless',
    score: 0,
    maxMultiplier: 1,
    durationMs: 0,
    didMerge: false,
    didDailyComplete: false,
    dailyStreakDays: 0,
    dailiesPlayedTotal: 0,
    alreadyUnlocked: new Set<string>(),
  };

  it('grants first-merge when player merged any gem', () => {
    expect(evaluateGrants({ ...baseCtx, didMerge: true })).toContain('first-merge');
  });

  it('does not re-grant first-merge if already unlocked', () => {
    expect(evaluateGrants({ ...baseCtx, didMerge: true, alreadyUnlocked: new Set(['first-merge']) })).not.toContain('first-merge');
  });

  it('grants five-cluster when maxMultiplier >= 5', () => {
    expect(evaluateGrants({ ...baseCtx, maxMultiplier: 5 })).toContain('five-cluster');
    expect(evaluateGrants({ ...baseCtx, maxMultiplier: 4 })).not.toContain('five-cluster');
  });

  it('grants first-daily on first daily completion', () => {
    expect(evaluateGrants({ ...baseCtx, runMode: 'daily', didDailyComplete: true, dailiesPlayedTotal: 1 })).toContain('first-daily');
  });

  it('grants streak-7 when streak hits 7', () => {
    expect(evaluateGrants({ ...baseCtx, runMode: 'daily', didDailyComplete: true, dailyStreakDays: 7 })).toContain('streak-7');
    expect(evaluateGrants({ ...baseCtx, runMode: 'daily', didDailyComplete: true, dailyStreakDays: 6 })).not.toContain('streak-7');
  });

  it('grants sub-three when run was under 3 minutes', () => {
    expect(evaluateGrants({ ...baseCtx, durationMs: 179_000 })).toContain('sub-three');
    expect(evaluateGrants({ ...baseCtx, durationMs: 180_001 })).not.toContain('sub-three');
  });

  it('grants centurion at 100 dailies', () => {
    expect(evaluateGrants({ ...baseCtx, runMode: 'daily', didDailyComplete: true, dailiesPlayedTotal: 100 })).toContain('centurion');
    expect(evaluateGrants({ ...baseCtx, runMode: 'daily', didDailyComplete: true, dailiesPlayedTotal: 99 })).not.toContain('centurion');
  });
});
