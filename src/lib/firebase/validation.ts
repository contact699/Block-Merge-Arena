// Client-side score-submission validation (audit M1.3 / S1).
// Pure + unit-tested. Mirrors the server-side firestore.rules bounds so the
// client rejects garbage early and the rules reject it authoritatively.
import { z } from 'zod';

/** Max points a single move can plausibly produce.
 *  Worst case ~64 cells * 10 pts * 5x = 3200; we use a generous 5000/move
 *  ceiling to avoid false-rejecting legit high rounds. Tune from telemetry. */
export const MAX_SCORE_PER_MOVE = 5000;

/** Absolute hard ceiling when moveCount is absent/zero. */
export const HARD_SCORE_CEILING = 10_000_000;

const ALLOWED_MULTIPLIERS = [1, 2, 3, 5] as const;
const MAX_DURATION_MS = 24 * 60 * 60 * 1000;

const schema = z.object({
  score: z.number().int().min(0),
  mode: z.enum(['endless', 'tournament']),
  maxMultiplier: z.number().refine((m) => (ALLOWED_MULTIPLIERS as readonly number[]).includes(m), 'bad multiplier'),
  moveCount: z.number().int().min(0).optional(),
  duration: z.number().int().min(0).max(MAX_DURATION_MS).optional(),
});

export type ScoreSubmission = z.infer<typeof schema>;
export type ValidationResult = { valid: true } | { valid: false; reason: string };

export function validateScoreSubmission(payload: unknown): ValidationResult {
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return { valid: false, reason: parsed.error.issues[0]?.message ?? 'invalid payload' };
  }
  const { score, moveCount } = parsed.data;
  if (score > HARD_SCORE_CEILING) {
    return { valid: false, reason: `score ${score} exceeds hard ceiling ${HARD_SCORE_CEILING}` };
  }
  if (moveCount && moveCount > 0 && score > moveCount * MAX_SCORE_PER_MOVE) {
    return { valid: false, reason: `score ${score} exceeds per-move ceiling ${moveCount * MAX_SCORE_PER_MOVE}` };
  }
  return { valid: true };
}
