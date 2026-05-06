# ADR 0010: Minimum-Viable Theming

**Status:** Active
**Date:** 2026-05-06
**Decision:** For Phase 3, only the paper background and the primary accent color are theme-aware. Other tokens (block colors, ink, mustard, plum, etc.) stay constant across themes. Full per-token theming is deferred.

## Context

The launch spec mentions "monthly cosmetic theme" as a subscriber perk. The natural full implementation is a `ThemeProvider` + `useColors()` hook that every component uses instead of importing `colors` from `tokens.ts`. That refactor touches ~30 files and roughly two days of work.

For Phase 3, we have a different question: what's the minimum theme swap that *feels* meaningfully different to a subscriber paying $3.99/month?

## Decision

A **two-token swap**: each theme overrides:
- `paper` (the cream/sage/black background)
- `accent` (the ember/teal/grey/cyan primary accent)

Block colors stay constant — they're load-bearing for gameplay legibility. Ink stays constant — it's the body type color.

Implementation:
- A `ThemeProvider` supplies an active palette via React context.
- A `useThemePalette()` hook returns `{ paper, accent }`.
- The home, daily, game, leaderboard, replays, achievements, settings, share, shop screens migrate their `SafeAreaView backgroundColor` to use `paper` from the hook. Primary `TactileButton` and `Pill variant="ember"` references migrate to use `accent`.
- Other token usages (`colors.ink`, `colors.mustard`, `colors.cobalt`, etc.) remain on the static import.

## Consequences

- Theme swap is visible without a 30-file refactor.
- Subscribers paying for "Cool Sage" see a sage background and teal CTAs everywhere — meaningful change.
- The block colors are the same in every theme, so gameplay screenshots remain comparable across themes (good for share grids).
- Block Merge feels less customizable than a full skin system. That's fine for v1.

## Revisit if

Subscriber feedback flags "themes don't feel different enough" OR we ship a theme that requires changing block colors (e.g., a "Dark Mode" theme inverts the gameboard) — at that point, the full refactor is justified.
