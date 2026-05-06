export type RunMode = 'endless' | 'daily';

export interface GrantContext {
  runMode: RunMode;
  score: number;
  maxMultiplier: number;
  durationMs: number;
  didMerge: boolean;
  didDailyComplete: boolean;
  dailyStreakDays: number;
  dailiesPlayedTotal: number;
  alreadyUnlocked: Set<string>;
}

const SUB_THREE_MS = 3 * 60 * 1000;

export function evaluateGrants(ctx: GrantContext): string[] {
  const granted: string[] = [];
  const grant = (id: string, when: boolean) => {
    if (when && !ctx.alreadyUnlocked.has(id)) granted.push(id);
  };

  grant('first-merge', ctx.didMerge);
  grant('five-cluster', ctx.maxMultiplier >= 5);
  grant('first-daily', ctx.runMode === 'daily' && ctx.didDailyComplete && ctx.dailiesPlayedTotal >= 1);
  grant('streak-7', ctx.runMode === 'daily' && ctx.didDailyComplete && ctx.dailyStreakDays >= 7);
  grant('sub-three', ctx.durationMs > 0 && ctx.durationMs < SUB_THREE_MS);
  grant('centurion', ctx.runMode === 'daily' && ctx.didDailyComplete && ctx.dailiesPlayedTotal >= 100);

  return granted;
}
