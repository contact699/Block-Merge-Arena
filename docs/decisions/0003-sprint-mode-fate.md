# ADR 0003: Delete the 5-min Sprint Mode

**Status:** Active
**Date:** 2026-05-06
**Decision:** Delete the timer-based tournament code path entirely. No "Sprint" mode for subscribers in v1.

## Context

The Phase 1 codebase preserved the 5-minute tournament timer logic in `daily.tsx` (renamed from `tournament.tsx`). The launch design committed to one-run-no-timer for the daily, but left open whether the timer code should be re-purposed as a "Sprint" mode (subscriber perk) or deleted.

Subscriber perks already include: daily archive, GIF export, monthly cosmetic theme, no-ads guarantee. That's enough value for $3.99/mo at v1.

## Decision

Delete. Reasons:

1. **Scope reduction.** Maintaining a second game mode is not free — paywall logic, separate Maestro flow, separate analytics events, separate UI surface, separate balance tuning.
2. **Different game.** A timed run plays differently from an untimed one. Pacing the same merge mechanic into 5 minutes pushes players toward speed-clears, undercutting the "patience-rewarded" positioning.
3. **Re-addable later.** If subscriber retention plateaus post-launch and we need fresh content, Sprint mode is exactly the kind of feature you can add in 2 weeks. No need to carry the code burden until then.

## Consequences

- T8 strips all timer logic from `daily.tsx`.
- T8 deletes `src/components/TournamentTimer.tsx`.
- T8 deletes timer state, `time_remaining` computations, freeze power-up logic (the freeze power-up is gone with the timer — it has no meaning).
- Power-ups in v1: Reroll, Blast, Target. (Freeze deleted.)
- ColorBomb stays — it's gameplay-affecting, not timer-affecting.

## Revisit if

Subscriber retention drops below 25% at month 3 and we need new modes to drive resubscription.
