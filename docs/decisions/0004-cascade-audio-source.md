# ADR 0004: Cascade Audio Source

**Status:** Active
**Date:** 2026-05-06
**Decision:** AI-generated SFX for v1 (ElevenLabs SFX or equivalent), committed as static `.m4a` files in `assets/sounds/`. Revisit post-soft-launch.

## Context

The merge cascade spec (§ 4 of the launch design) specifies tier-based audio:
- 2× = warm bell strike
- 3× = layered bells
- 5× = bells + low hum sustain
- 7×+ = chord swell + sub-bass thump
- chain bonus = rising semitone per merge (deferred to a future task; v1 plays one-shot per cascade)

The launch design recommended a sound designer (~$2–4k). The Phase 1 plan called this out as an open question.

## Decision

**AI-generated SFX for v1.** Reasons:

1. **Pre-PMF risk management.** Spending $2–4k on bespoke audio before product-market-fit is validated is premature. Soft launch in Phase 4 will generate retention numbers we can decide against.
2. **Speed.** AI-generated sounds via ElevenLabs SFX or similar can be iterated in hours, not weeks. Phase 2 has fixed timing constraints.
3. **Quality bar is achievable.** Modern AI SFX is good enough for "feels different from Block Blast" without a designer. The bar is "doesn't feel cheap," not "sounds like a film."
4. **Re-do later.** If soft-launch metrics validate the game and audio is identified as a low-quality area, replacing assets is one PR — the loader is decoupled from the assets.

## Generation prompts (commit these alongside the ADR)

For each tier, generate at ~1.0s length, 44.1kHz, mono `.m4a`:

| File | Prompt |
|---|---|
| `merge-2x.m4a` | "Soft warm chime, single struck bell, glockenspiel timbre, decay 0.8s" |
| `merge-3x.m4a` | "Layered bell chord, third + fifth interval, glockenspiel + marimba undertone, decay 0.9s" |
| `merge-5x.m4a` | "Layered bells with sustained low hum underneath, weighty satisfying, 1.0s" |
| `merge-7x.m4a` | "Full bell chord swell with sub-bass thump on attack, dramatic, 1.2s" |

Place the generated files at `assets/sounds/`. Commit them as binary assets.

## Consequences

- `src/lib/audio/sfx.ts` (T10) loads these four files at boot via `expo-av`.
- Asset bundle size: ~4 × 30KB = 120KB. Negligible.
- Total audio cost for v1: $0–$30 (free tier of most AI audio services).
- Future replacement is a single-commit drop-in: regenerate, replace files, redeploy.

## Revisit if

Soft launch (Phase 4) shows D7 retention ≥ 30% AND share rate ≥ 5% — the game is working but feels low-fi. At that point, hire a designer for ~$2k to re-record the four tier sounds plus add UI + music.
