# Block Merge — Full UI/UX Redesign & Interaction Overhaul (Design Spec)

> **Date:** 2026-06-10
> **Status:** Approved (brainstorm with owner; visual direction and architecture chosen interactively)
> **Related:** `docs/audits/2026-06-10-technical-audit-and-improvement-plan.md` (this redesign absorbs audit task M2.1 and the Theme-5 UX items; audit decisions D1/D7 apply here)

## 1. Goals & decisions made

**Goal:** Full UI/UX redesign of all screens plus an interaction overhaul that makes movement seamless (no animation stutter, no React-state choreography) and accurate (one coordinate system; the player always sees exactly where a piece will land before committing).

Owner decisions (made during brainstorm):

| Decision | Choice |
|---|---|
| Visual direction | **A — Evolved Tactile Console.** Keep the warm paper / ink / ember identity and design tokens; refine, don't replace. |
| Scope | **Visuals + movement + core UX features.** Full reskin of all screens; drag-to-place with ghost preview; mechanic-legibility features (visible gem multipliers, crush-warning tint, line-completion highlights). Bigger product features (percentile results, streak calendar, ghost racing, share wiring) are explicitly out of scope — later phase. |
| Primary pain | **Animations stutter / feel cheap.** Root cause: 64 unmemoized Pressables re-rendering on every state change; animations sequenced through React state + `setTimeout`. |
| Input model | **Drag-and-drop with tap-tap fallback.** |
| Rendering | **Approach 2 — full Skia board.** Entire board visual (cells, blocks, gems, ghost, effects) on one Skia canvas. Mitigation for e2e/a11y: invisible input lattice (below). |

## 2. Architecture

Three layers, strictly separated:

### 2.1 Game engine (pure TS, no React) — `src/lib/game/engine.ts`
Audit task M2.1 folded in as the foundation step. `applyMove(state, action, rng) → { state, events }` where `EngineState = { board, pieces, score, multiplier, maxMultiplier, pieceSetIndex, gameOver }` and `events` is an ordered list: `piecePlaced`, `linesCleared {rows, cols, cells}`, `gemsDropped`, `mergeFormed {cluster, anchor, tier}`, `gemCrushed`, `scoreAwarded {points, multiplier}`, `runEnded`. Actions: `place`, `cashGem` (reserved, not in this scope), power-up actions (`blast`, `reroll`, `target`, `colorBomb`). Daily, Endless, and the Replay player consume the same engine. The renderer never re-derives game logic; events are the only animation triggers. Gem lifecycle follows audit Decision D1 (gems persist size/multiplier; cluster cells consumed on merge; crush allowed with warning).

### 2.2 Skia renderer — `src/components/board/BoardCanvas.tsx`
One `<Canvas>` draws everything:
- Board frame (deep gradient `boardBgTop→boardBgBottom`, 14pt radius, inner cell lattice).
- Placed blocks: vertical gradient (glow→base→deep from `blockColors`), 1pt specular top-edge highlight, 4pt radius.
- Gems: radial-gradient orbs (35%/30% highlight origin), tier-scaled (small 0.62×cell, medium 0.78×, large 0.92×, mega 1.0× with halo), soft glow shadow in gem color, multiplier badge (`×2/×3/×5`) drawn for medium+.
- Drag ghost: the piece's cells tinted at 35% opacity in piece color with 1.5pt outline when placement valid; 15% neutral gray when invalid; cells of any line the placement would complete pulse at +15% brightness; gem cells that would be crushed get an ember warning tint (Decision D1).
- Effects: line-clear sweep, merge pull-together, score pops (see § 6).

`BoardGeometry` — `src/lib/board/geometry.ts` (evolves `src/lib/cascade/origin.ts`): the **only** source of cell↔pixel math (origin, cellPitch = cellSize + gap, `cellAtPoint`, `rectForCell`). Shared by drawing, gestures, hit-testing, and the cascade origin. Unit-tested. This is where placement accuracy comes from: one coordinate system, no drift.

### 2.3 Input layer
- `GestureDetector` (Pan + Tap, `react-native-gesture-handler`) wraps the canvas plus the tray.
- During drag, nothing touches React: finger position lives in Reanimated shared values; target cell computed in a worklet via `BoardGeometry`; Skia redraws via `useDerivedValue` — UI thread only, 60/120fps. React commits exactly once, on finger-lift, when `applyMove` runs and its events are handed to the AnimationDirector.
- **Invisible input lattice:** a transparent 8×8 grid of empty `Pressable`s overlaying the canvas, carrying `testID="cell-r-c"`, `accessibilityLabel="Row r, column c, {empty|color block|color gem ×n}"`, `accessibilityRole="button"`. They render once and never update during play (labels update only on move commit). This preserves every existing Maestro flow and adds the screen-reader support the audit flagged, at ~zero runtime cost.

## 3. Visual language (Direction A, evolved)

Palette, `blockColors`, radii, and shadows in `src/lib/design/tokens.ts` are kept. Additions/changes:

- **New token groups** in `tokens.ts`:
  - `space = { xs:4, sm:8, md:14, lg:18, xl:24 }` (today's most common literals, named).
  - `fontSize = { caption:10, label:11, body:13, subtitle:15, title:24, score:34, hero:52 }`.
  - `motion = { instant:80, fast:140, base:220, slow:320, spring: { damping:18, stiffness:220 }, springSoft: { damping:14, stiffness:160 } }` — every animation in the app uses these; no ad-hoc durations.
- **Board:** outer padding 16→12 (bigger board), cell gap stays 2, board lift shadow kept.
- **HUD simplification (game screens):** one top bar — back chevron · `DAILY · #N` label pill · animated rolling score · live multiplier pill (ember, pulses on change). Streak flame moves to Home. The current stacked hero-card + score-card + gem-counter layout collapses; `GemCounter` is removed from game screens (gem state is now legible on the board itself).
- **Cards:** `GlassCard`/`DeepCard`/`Pill`/`TactileButton` primitives kept as-is; screens stop hand-rolling card styles and use the primitives exclusively.
- **Achievements iconography:** replace 🏆 emoji rows with badge glyphs from `lucide-react-native` tinted per palette (audit H6 adjunct).

## 4. Screen-by-screen

All screens keep their routes and testIDs. Restyle = evolved tokens + shared header pattern (`ScreenHeader` component: back chevron, title, optional right action — new in `src/components/design/`).

| Screen | Changes |
|---|---|
| **Daily** (`daily.tsx`) | Rebuilt on engine + BoardCanvas. Pre-run: hero card with puzzle number, streak, Begin run. In-run: minimal HUD (§3), board, tray. Post-run: result card (score, max combo, coins, replay code, achievements) — content unchanged, restyled. Standings/archive/paywall overlays become bottom sheets (`@gorhom/bottom-sheet`, already installed). |
| **Endless** (`game.tsx`) | Same rebuild; power-up rail docked under tray; power-up targeting states (blast crosshair, color-bomb picker) drawn as canvas overlays, not modals. |
| **Home** (`index.tsx`) | Daily hero card with today's state (unplayed → Begin; played → score + standings glance); streak flame; nav grid of Pills. Restyle only. |
| **Welcome** | Restyle to tokens; one-screen, no behavior change (silent-demo onboarding stays Phase-2 product work). |
| **Leaderboard / Replays / Achievements / Settings / Share / Shop** | Restyle to tokens + `ScreenHeader` + primitives; loading/error/empty states standardized via a small `AsyncStateView` component (retry button on fetch failure — closes audit M3.3 for these screens). No functional changes, except Replays' player gets the new BoardCanvas for playback. |

## 5. Interaction system (drag anatomy)

- **Pick-up:** a pan gesture that begins on a tray slot lifts the piece: scales from tray size to full board-cell size over `motion.fast`, light haptic, tray slot dims. The lifted piece floats **72pt above the finger** (min; 1.2× piece height if larger) so the finger never occludes it.
- **Targeting:** the target cell derives from the **piece's visual top-left** (not the finger): `cellAtPoint(pieceTopLeft + cellPitch/2)`. Target changes apply 6px hysteresis past the cell midpoint to prevent ghost flicker. Ghost states per §2.2.
- **Drop (valid):** piece springs (`motion.spring`) from lifted position into the snapped cells (~160ms), settle scale-bounce 1.0→1.04→1.0, light haptic on settle; engine `applyMove` commits; AnimationDirector takes over for consequences.
- **Drop (invalid):** piece springs back to its tray slot (`motion.springSoft`, ~240ms), no haptic, no state change.
- **Tap fallback (unchanged semantics, new feedback):** tap tray piece to hold → tapping a board cell places. While holding, pressing a cell shows the ghost on press-down; release commits only if valid. Lattice carries this path.
- **Accuracy invariants:** ghost cell == committed cells, always (same `BoardGeometry` call in worklet and engine commit); drag input→ghost update latency ≤ 1 frame.

## 6. Animation & haptics (AnimationDirector)

`src/components/board/AnimationDirector.ts` — sequences engine events into Reanimated timelines on the canvas; fires existing hooks `src/lib/haptics/cascade.ts` and `src/lib/audio/sfx.ts` at named beats. No React state in the loop; `ComboAnimation`, `LineClearEffect`, and the gem parts of `GemDisplay` are deleted, `MergeAnimation`'s cascade visual is re-implemented as a canvas effect (its slow-mo + reduce-motion behavior is ported as-is).

Default sequence after a placement (each step starts as the previous ends; total worst case ≈ 900ms, skippable by starting the next drag):
1. **Settle** (80ms) — placed cells scale-settle, light haptic.
2. **Line-clear sweep** (240ms) — completed lines flash white then sweep-dissolve along the line axis, medium haptic at sweep start.
3. **Gem drop** (180ms, 20ms stagger) — gems scale-pop into cleared cells.
4. **Merge pull** (220ms) — cluster gems slide to the anchor cell with ease-in, fusion flash, tier-scaled cascade burst for medium+ (slow-mo for mega, per existing MergeAnimation), success haptic + merge sfx.
5. **Score roll** — HUD score rolls up (count animation, `motion.base`); multiplier pill pulses if changed.

**Reduce-motion** (`AccessibilityInfo.isReduceMotionEnabled`): slides/sweeps become crossfades, slow-mo disabled, durations halved — applied globally in the Director, closing the audit's gap where only `MergeAnimation` respected it.

## 7. Performance budget & verification

- 60fps on iPhone 13-class during a full cascade; ≥30fps on Pixel 5 / Galaxy A53 (ADR 0013 devices). Measured with the RN performance monitor + Sentry transaction around the cascade.
- Zero JS-thread work during drag (verify: JS FPS unchanged while dragging in perf monitor).
- Canvas redraws only when a shared value or committed state changes.

## 8. Testing

- **Engine:** unit tests per audit M0.1/M0.3 (golden-replay determinism harness) — precondition for the screen rebuild.
- **BoardGeometry:** exhaustive unit tests for cell↔pixel mapping incl. hysteresis boundaries.
- **Maestro:** existing flows stay green via the input lattice (tap fallback). One new flow: drag-place via `swipe` from tray coordinates to board coordinates on Endless.
- **Component:** AnimationDirector sequencing tested with a fake timeline (events in → ordered beats out), enabled by the jest `.tsx` fix (audit QW3).

## 9. Out of scope (explicit)

- Percentile results, streak calendar, ghost racing, bank-or-grow gem cashing (engine reserves the `cashGem` action; UI later), share-grid wiring, silent-demo onboarding — later product phases.
- Audit integrity work M1.x (deterministic RNG, score validation, one-run enforcement) — independent track; the engine here exposes the `rng` parameter M1.1 needs, but the seeded-gem change itself ships with M1.1.
- New monetization surfaces; theme system changes beyond consuming existing `useThemePalette`.

## 10. Risks

| Risk | Mitigation |
|---|---|
| Skia canvas perf on low-end Android | Single canvas, no per-cell views; effects budgeted (§7); fallback flag to disable glow layers on `expo-device` low-RAM devices |
| Maestro breakage | Input lattice preserves all existing testIDs; run full suite before merging each screen |
| Geometry drift between gesture worklet and engine | One `BoardGeometry` module, unit-tested, used by both |
| Scope creep into product features | §9 list is the contract |
