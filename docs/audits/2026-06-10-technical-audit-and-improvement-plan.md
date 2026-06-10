# Block Merge — Technical Audit & Improvement Plan

> **Audited:** 2026-06-10
> **Scope:** ~11,900 lines of tracked source (`src/`), full config/docs/test surface. Direct verification of core game logic, Firebase layer, and both game screens. Lighter review: `patches/` internals, Maestro flow completeness, `ReplayPlayer.tsx` playback math.
> **Status of decisions:** All open questions resolved (see § Decisions at the end).

---

## Executive Summary

**Overall health grade: C+.** The project has unusually strong documentation, design-system discipline, and launch planning (the ADRs and manual checklist are better than most professional teams produce), and `tsc --noEmit` passes clean with 42/42 unit tests green. But the product's entire identity — a fair daily puzzle with a competitive leaderboard — rests on three things that are currently broken or absent: **the daily run is not actually deterministic** (gem colors use unseeded `Math.random()`, so two players making identical moves get different scores), **any client can submit any score** (no validation, no server verification), and **the core game engine has zero tests and no CI**. There is also a verified correctness bug that silently drops the final move's points from saved endless scores.

**Top 3 risks:**
1. Daily-leaderboard integrity collapse at launch (non-determinism + client-trusted scores + retry loophole).
2. Untested, duplicated game-loop logic making every fix risky.
3. ~140-package dependency surface (template residue) inflating build size and upgrade fragility.

**Top 3 opportunities:**
1. Make the merge mechanic *legible and strategic* on the board (it's currently invisible state).
2. Extract a single tested game engine shared by Daily/Endless/Replay.
3. Ship the daily share grid + ghost replays as the differentiator no Block Blast clone has.

---

## Repo Map

**Purpose:** "Block Merge" — daily block puzzle (8×8, tap-to-place) where cleared lines drop colored gems that merge into score multipliers. Target: adult Wordle/NYT-Games crossover audience. Mid-launch (Phase 1–4 plan in `docs/superpowers/plans/`), maturity: **pre-launch production candidate**.

**Stack:** Expo SDK 53 / React Native 0.79.6 / TypeScript 5.8 strict / Expo Router 5 / NativeWind 4 / Firebase (Auth + Firestore) / RevenueCat / Sentry / PostHog / AsyncStorage. NPM with `legacy-peer-deps`. Jest (node env) + Maestro e2e. No CI.

**Architecture & flow:**

```
index.ts → expo-router → src/app/* (screens)
  daily.tsx / game.tsx  ── own ALL game state (useState) ──→ src/lib/game/* (pure logic)
       │                                                      board.ts, merge.ts, pieces.ts, powerups.ts
       ├─→ lib/daily/seed.ts (seeded pieces + streak)
       ├─→ lib/game/replay-recorder.ts → lib/utils/replay.ts (AsyncStorage)
       ├─→ lib/utils/leaderboard.ts → lib/firebase/api.ts (Firestore scores/tournaments)
       └─→ lib/utils/{currency,achievements}.ts (AsyncStorage)
components/ (GameBoard, PiecesTray, design primitives) — presentational
```

**Key directories:**

| Path | Role |
|---|---|
| `src/app/` | 11 Expo Router screens; `daily.tsx` (1,031 lines) and `game.tsx` (598) are the hot core |
| `src/lib/game/` | Pure game logic — board, merge, pieces, powerups, replay recorder |
| `src/lib/firebase/` | Config (env-driven, graceful no-op), API, anonymous auth |
| `src/lib/utils/` | AsyncStorage-backed persistence (currency, achievements, replays, social) |
| `src/components/design/` | Tactile-console primitives (TactileCell, Pill, GlassCard…) |
| `docs/decisions/` | 17 ADRs, well-maintained |
| `.maestro/` | 10 e2e flows with testIDs |

**Surprises found during mapping:**
- A 3.6 MB UUID-named **zip file committed at repo root** (`019b948a-…zip`) despite `*.zip` in `.gitignore` (committed before the rule). Verified contents: a Vibecode template export of the repo, **including a `.env`** — all API keys inside are placeholders (suffixed `-n0tr3al`) and the Supabase anon key is publishable-by-design, so plain `git rm` suffices; no history rewrite needed.
- `package.json` lists **~140 dependencies**, including `react-native-webrtc`, `react-native-vision-camera`, `react-native-maps`, `react-native-gifted-chat`, `victory-native`, `@supabase/supabase-js` — none used by the game. Residue from a Vibecode app template (`@vibecodeapp/sdk`, `withVibecodeMetro` in `metro.config.js`).
- `zustand` and `zod` are in deps but **never imported** anywhere in `src/`.
- `check-storage.js` at root is a one-off Supabase diagnostic script unrelated to the Firebase architecture.

---

## Audit Report

Severity legend: 🔴 Critical · 🟠 High · 🟡 Medium · ⚪ Low. **[F]** = verified fact, **[J]** = judgment.

### Correctness & Architecture

**🔴 C1 — The daily run is not deterministic; the core product promise is false.** [F]
- Piece sequence is correctly seeded (`src/lib/daily/seed.ts:57-74`, used at `src/app/daily.tsx:121,137,277`). But gem colors — which drive merges → multipliers → score — come from unseeded `Math.random()` in `generateGemsFromClearedCells` (`src/lib/game/merge.ts:9-17`), called from the daily loop at `daily.tsx:208`.
- Consequence: two players (or the same player, in a replay) making identical moves get different gem colors, different multipliers, and different scores. The UI says "Same pieces for everyone" (`daily.tsx:443`) and the leaderboard ranks players on this. It also means **replays cannot faithfully reproduce a run** (`ReplayRecorder` stores moves, not gem outcomes — `src/lib/game/replay-recorder.ts:61-69`).
- This is the single most important fix in the codebase.

**🔴 C2 — Endless mode saves the wrong final score.** [F]
- `src/app/game.tsx:388-398`: on game over, `saveScore({ score, … })` reads the *stale* `score` state — the final move's points were applied via `setScore(score + points)` at `game.tsx:371` but the closure variable is unchanged. Any run ending on a line-clear under-reports the saved/leaderboard score.
- Same block saves `maxMultiplier: multiplier` — the *current* multiplier, not the max reached (daily mode tracks `maxMultiplierReached` correctly at `daily.tsx:240-242`; endless doesn't track it at all). Achievements gated on `maxMultiplier` (Five-Cluster) can be missed in endless.

**🟠 C3 — Gem lifecycle on the board is ambiguous/lossy.** [F for mechanics, J for severity]
- Gems are stored as `{ filled: false, color }` cells; `placeGemsOnBoard` discards size/multiplier (`src/lib/game/merge.ts:31`), and `getGemsFromBoard` re-derives every gem as `size: 'small', multiplier: 1` (`merge.ts:153-159`), so merged-gem identity never persists between moves.
- `mergeGems` places the merged gem at the cluster's *average* position (`merge.ts:116-131`) but the original cluster cells are never removed from the board (`removeGemsFromBoard` exists at `merge.ts:181` and is **never called** anywhere in `src/app/`).
- `canPlacePiece` only checks `filled` (`src/lib/game/board.ts:40`), so placing a piece silently **overwrites gems**, destroying multipliers with no feedback.
- Consequence: the game's signature mechanic has undefined rules — what the player sees doesn't match board state, and gems vanish under pieces. Both a correctness and a UX problem.

**🟠 C4 — ~110 lines of game-loop logic duplicated between `daily.tsx:184-288` and `game.tsx:302-412`.** [F]
- Place → clear → gem-drop → merge → cascade → score → game-over is implemented twice with small drift (C2 exists only in `game.tsx`; replay recording only in `daily.tsx`). Every engine fix must be made twice; drift is already producing bugs.

**🟠 C5 — Both game screens are god components.** [F/J]
- `daily.tsx`: 1,031 lines, ~20 `useState` hooks mixing engine state, replay recording, standings fetching, achievements, currency, archive, paywall, and ~600 lines of JSX. `zustand` sits unused in `package.json:163`. Works today; will resist every Phase 2 feature (timer-removal migration, share grid, cascade polish all land in this file).

**🟡 C6 — Daily seed uses device-local date.** [F]
- `getDailySeed`/`getTodayDateString` use local timezone (`src/lib/daily/seed.ts:32-51`). Players cross into "tomorrow's puzzle" at different wall-clock moments; a traveler can play the same date twice or skip one. The design spec says global date.

**🟡 C7 — Line-count derivation is fragile.** [F]
- `linesCleared = clearedCells.length / 8` (`daily.tsx:204`, `game.tsx:342`) miscounts when a row and column clear simultaneously (15 unique cells, not 16). `Math.ceil` masks most cases; it's still wrong input to replays and the line-clear animation.

### Security & Integrity

**🔴 S1 — Score submission is fully client-trusted.** [F]
- `submitScore` (`src/lib/firebase/api.ts:33-127`) writes whatever `score`, `maxMultiplier`, `duration` the client sends. No range checks, no replay upload, no server-side verification; the `verified` field in `src/lib/firebase/types.ts:43` is never set or read. Firestore rules (ADR 0002) gate *who* can write, not *what*.
- Consequence: the daily leaderboard — the product's retention engine — is trivially poisoned by one person with a REST client.

**🟠 S2 — One-run-per-day is client-side and has a retry loophole.** [F]
- Enforcement is an AsyncStorage flag checked to hide the start button (`seed.ts:133-136`, `daily.tsx:962`). Clearing app data resets it. Worse: `recordDailyCompletion` runs only at game over (`daily.tsx:320`), so **abandoning a bad run mid-game (kill the app) grants unlimited retries**.

**🟡 S3 — Global leaderboard isn't deduped per user.** [F]
- `getGlobalLeaderboard` queries raw `scores` docs (`api.ts:259-280`); one prolific player can occupy all 100 rows. Tournament standings dedupe correctly (per-user entry doc, `api.ts:201`).

**⚪ S4 — Secrets hygiene is good.** [F] No tracked `.env`, no hardcoded keys, `EXPO_PUBLIC_*` pattern used correctly, `google-services.json` ignored. (Exception: the `.env` inside the tracked template zip — placeholder keys only; see Repo Map.)

### Testing

**🔴 T1 — Core game logic has zero tests; the test script can't fail.** [F]
- 7 test files / 42 tests exist (all pass — verified by running them) and they assert real behavior (`grants.test.ts`, `grid.test.ts` are good tests). But `board.ts` (187 lines), `merge.ts` (197), `pieces.ts` (147), `daily/seed.ts` (143), `firebase/api.ts` (413) have **no tests at all** — that's the 80% core.
- `package.json:15` runs `jest --passWithNoTests`: a green checkmark even with no tests. `jest.config.js` uses `testEnvironment: 'node'` and `testMatch: ['**/*.test.ts']` — component tests (`.tsx`) are impossible in the current setup.
- C1 and C2 would both have been caught by a 20-line determinism test and a game-over scoring test respectively.

**🟠 T2 — No CI of any kind.** [F] No `.github/workflows/`. Typecheck/lint/tests run only when someone remembers. The Maestro flows (10 flows, well-built with testIDs and conditional steps) have no automated runner either.

### Performance

**🟡 P1 — Board renders 64 unmemoized Pressables with per-render closures** (`src/components/GameBoard.tsx:62-79`); every score/multiplier change re-renders all cells. On mid-range Android (Pixel 5 / Galaxy A53 per `docs/launch/manual-checklist.md`) this competes with the cascade animation's 60fps budget (ADR 0013). [F for code, J for impact — profile before optimizing further.]

**🟡 P2 — `setTimeout` at `daily.tsx:339-343` with no cleanup**; navigating away within 2s of game over triggers setState-on-unmounted. Several `void promise` calls lack `.catch()` (`daily.tsx:286`, `game.tsx:399`). [F]

**🟡 P3 — AsyncStorage read-modify-write races** in `currency.ts:58-101` (double-spend window), `social.ts:481-497`, `replay.ts:99-121`. Low practical likelihood single-user, but currency is purchase-adjacent. `viralHighlights` array grows unbounded (`social.ts:490`). [F]

### Dependencies

**🟠 D1 — ~100 unused packages, many with native modules.** [F]
- Unused (no imports in `src/`): `react-native-webrtc`, `react-native-vision-camera`, `react-native-maps`, `react-native-gifted-chat`, `react-native-calendars`, `victory-native`, `@supabase/supabase-js`, `expo-camera`, `expo-location`, `expo-contacts`, `expo-calendar`, `expo-sqlite`, `zustand`, `zod`, and dozens more. Each native module adds app size, build time, App Store privacy-declaration surface, and upgrade risk (3 patches already maintained in `patches/`).
- `expo-av` is used but deprecated (warning suppressed at `index.ts:6`) — migrate to `expo-audio`/`expo-video` before SDK 54 forces it.

### Dead code & repo hygiene

- **🟡 H1** — `src/lib/utils/social.ts`: 16 of 24 exports never imported (TikTok auto-capture etc. — cut features). [F]
- **🟡 H2** — 3.6 MB template-export zip tracked at root. [F]
- **⚪ H3** — `changelog.txt` is an agent-timestamp log duplicating `CHANGELOG.md`. [F]
- **⚪ H4** — `public/image*.png` orphaned; `check-storage.js` orphaned Supabase script. [F]
- **⚪ H5** — duplicate Android permissions in `app.json:30-36`. [F]
- **⚪ H6** — sign-out is `console.warn('not implemented')` (`settings.tsx:365`); Share button is a no-op stub pending Phase 2 (`daily.tsx:843`). [F]

### DevEx, Docs, Accessibility

- Docs are a genuine strength — one gap: no testing-strategy or architecture doc, and `CLAUDE.md`'s tree still names `tournament.tsx` though the file is `daily.tsx`. ⚪
- Accessibility: board cells and tray pieces lack `accessibilityLabel`/`role` (`GameBoard.tsx:62`, `PiecesTray.tsx:81`); `MergeAnimation` respects reduce-motion (`MergeAnimation.tsx:33-43`) but `ComboAnimation`/`LineClearEffect` don't. The 6-color gem palette includes red/green — no colorblind mode. 🟡

### Strengths (preserve these)

1. **ADR + launch-doc discipline** — 17 current ADRs, a launch design spec the code actually follows, a real manual launch checklist with device matrix and metric gates.
2. **Graceful degradation everywhere** — Firebase, RevenueCat, Sentry, PostHog all no-op cleanly without keys (`firebase/config.ts:30-42`, `revenuecat.ts:35-50`). The app runs fully offline-local.
3. **Strict TS, clean typecheck, production console-stripping** (`babel.config.js:29-31`), patch-package managed, `.env` hygiene, transaction-protected `topScore` writes (`api.ts:101-111`).
4. **Design-token discipline** — screens consistently use `tokens.ts`; the tactile-console primitives are a real component library.
5. **Existing tests are good tests** — behavior assertions, not smoke tests. The culture is right; the coverage isn't.

---

## Improvement Strategy

### Theme 1: The daily's competitive integrity is the product — and it's built on sand
Covers C1, S1, S2, S3, C6. **Target state:** a daily run is *reproducible* (one seeded RNG drives pieces AND gems), *bounded* (server rejects impossible scores), and *single-attempt* (run-start is recorded, not just run-end). **Principle:** for a leaderboard game, fairness is a feature with a launch deadline, not infrastructure.
**Trade-off — NOT building now:** full server-authoritative replay re-simulation (Cloud Function replays every submitted run). Right long-term answer, wrong pre-launch scope. Ship deterministic seeds + plausibility validation + Firestore rules; persist the replay code in the entry doc so verification can be added in Phase 3 without schema change.

### Theme 2: One game engine, tested, owned by nobody's screen
Covers C2, C3, C4, C5, C7, T1. **Target state:** a pure `applyMove(state, action, rng) → state` engine in `src/lib/game/engine.ts` with the gem lifecycle *formally defined*, consumed by Daily, Endless, and ReplayPlayer; engine covered by unit tests including a golden-replay determinism test. **Principle:** the rules of the game should exist in exactly one place that a test can hold still.
**Trade-off:** no zustand migration as part of this — a reducer is enough; adopt zustand only if cross-screen game state appears (e.g., resume-run). Only the two game screens get decomposed.

### Theme 3: A safety net before anything else moves
Covers T1, T2. **Target state:** GitHub Actions running typecheck + lint + jest on every PR; `--passWithNoTests` removed; jest configured so `.tsx` tests are possible; engine coverage ≥ 80%. **Principle:** every fix in Themes 1–2 touches scoring math — refactoring without tests here is gambling with launch.
**Trade-off:** skip Maestro-in-CI (device farms are expensive and flaky); e2e stays a documented manual pre-release gate.

### Theme 4: Shed the template skin
Covers D1, H1–H5. **Target state:** dependencies reflect what the app imports; repo contains only project files. **Principle:** every dependency is a liability renewed at each Expo SDK upgrade.
**Trade-off:** one dedicated PR with full native rebuild + Maestro pass, not gradual. Keep `zod` (used for Firestore payload validation in Theme 1); delete `zustand`.

### Theme 5: Make the mechanic visible (UI/UX)
Covers C3's UX face, P1, accessibility. See the UI/UX plan section below.

### What "done" looks like (measurable)
- CI red on lint/type/test failure; engine coverage ≥ 80%; zero `--passWithNoTests`.
- A scripted bot replaying the same daily seed twice produces byte-identical score traces.
- Firestore rejects a score > theoretical-max-per-move-count (emulator rule test proves it).
- `npx expo-doctor` clean; dependency count < 60; release AAB measurably smaller.
- Zero Critical findings open.

---

## Task Plan

### Quick wins (do immediately, all S effort, minimal risk)

| # | Task | Files |
|---|---|---|
| QW1 | Fix endless final-score bug: thread `newScore`/max-multiplier into game-over save (mirror `daily.tsx` pattern) | `game.tsx:388-398` |
| QW2 | `git rm` the 3.6 MB zip, `changelog.txt`, `check-storage.js`, `public/image*.png`; dedupe `app.json` Android permissions | root, `app.json` |
| QW3 | Remove `--passWithNoTests`; fix `testMatch` to include `.tsx` | `package.json:15`, `jest.config.js` |
| QW4 | Delete 16 dead exports from `social.ts`; drop `zustand` | `src/lib/utils/social.ts`, `package.json` |
| QW5 | Wrap `daily.tsx:339` timeout in a ref with cleanup; add `.catch()` to the two un-handled `void` promises | `daily.tsx`, `game.tsx` |
| QW6 | Fix `CLAUDE.md` stale `tournament.tsx` reference | `CLAUDE.md` |

### Milestone 0 — Safety net (≈ 2–3 days)

| Task | Description | Acceptance | Effort | Risk | Deps |
|---|---|---|---|---|---|
| **M0.1 Engine unit tests** | Characterization tests for `board.ts`, `merge.ts`, `pieces.ts`, `seed.ts` as they behave **today** (placement, line detection incl. row+col intersection, cluster merge, seeded piece reproducibility, streak math incl. the 36-h window in `seed.ts:138-143`) | ≥ 80% line coverage on the 4 modules; tests document current quirks | L | None (read-only) | QW3 |
| **M0.2 CI pipeline** | GitHub Actions: install (legacy-peer-deps) → typecheck → lint → jest, on PR + main | A PR with a type error goes red | S | None | — |
| **M0.3 Golden-replay harness** | Test utility that drives the engine through a scripted move list and snapshots the score trace — the regression net for M1/M2 | Same seed + moves ⇒ identical snapshot, twice | M | None | M0.1 |

### Milestone 1 — Critical fixes: integrity & correctness (≈ 1 week)

| Task | Description | Acceptance | Effort | Risk | Deps |
|---|---|---|---|---|---|
| **M1.1 Deterministic daily RNG** | Thread a `SeededRandom` instance through the whole run: gem colors in `generateGemsFromClearedCells`, piece refills, everything. Endless passes a `Math.random`-backed source | Golden-replay test: two simulated runs of same seed + moves produce identical scores; daily replays reproduce exact board states | M | **Medium** — changes scoring outcomes; must land before launch, after M0.3 | M0.3 |
| **M1.2 Formalize gem lifecycle** | Per Decision D1: gems persist size/multiplier in cell state; merged cluster cells are consumed; merged gem occupies one anchor cell (nearest legal empty cell to centroid); pieces MAY crush gems but UI shows an explicit warning tint on threatened cells before placement | Engine tests for each rule; `removeGemsFromBoard` either used or deleted | L | Medium — gameplay-visible change | M0.1 |
| **M1.3 Score plausibility validation** | Client: zod-validate payloads. Server: Firestore rules cap score by `moveCount` (≤ moveCount × 800 ceiling, tune from telemetry), require duration > moveCount × minMoveTime, require entry doc matches auth uid; make `moveCount`/`durationMs` required on tournament entries; persist replay code in the entry doc for Phase-3 auditing | Emulator rule tests: legit score accepted, 999999999 rejected | M | Low | — |
| **M1.4 One-run enforcement** | Write a `runStarted` marker (local + `users/{uid}/archive/{puzzleId}` with `merge:true`) at run start; abandoned started run counts as consumed; rules forbid second entry-doc create for dailies | Kill-app-mid-run ⇒ no retry | M | Low | M1.3 |
| **M1.5 UTC daily rollover** | Per Decision D2: switch `getDailySeed`/`getTodayDateString` to UTC; migrate streak comparison accordingly | Unit test across timezone fixtures; one puzzle ID per calendar day globally | S | Low — changes today's puzzle ID once | M0.1 |

### Milestone 2 — High-leverage structure (≈ 1–1.5 weeks)

| Task | Description | Acceptance | Effort | Risk | Deps |
|---|---|---|---|---|---|
| **M2.1 Extract shared game engine** | Pure reducer `applyMove(state, {piece, row, col}, rng)` in `lib/game/engine.ts`; thin `useGameLoop` hook with callbacks (`onReplayMove`, `onRunEnd`); Daily, Endless, ReplayPlayer consume it; fixes C7 properly (count cleared rows/cols, not cells/8); power-ups become engine actions | Both screens < 450 lines; zero duplicated engine logic; golden-replay snapshots unchanged vs post-M1 baseline | XL → break down: engine (L), daily migration (M), game migration (M), replay player (M) | Medium — mitigated by M0.3 | M1.1, M1.2 |
| **M2.2 Dependency purge** | Remove all unused packages; full prebuild + EAS dev build + Maestro suite; migrate `expo-av` → `expo-audio` while touching deps | `expo-doctor` clean; app boots on iOS+Android; AAB size reduction recorded | L | **High** (native graph changes) — single PR, easy revert | M0.2, e2e pass |
| **M2.3 Decompose daily.tsx** | Split out `StandingsPanel`, `RunResultCard`, `ArchiveOverlay` as presentational components | `daily.tsx` ≤ 400 lines; Maestro daily flow passes | M | Low | M2.1 |

### Milestone 3 — Quality & polish

| Task | Description | Effort | Risk |
|---|---|---|---|
| M3.1 | Memoize board hot path: `React.memo` cells, stable `onCellPress` via `useCallback` | S | Low |
| M3.2 | Accessibility: labels/roles on cells + tray, reduce-motion in `ComboAnimation`/`LineClearEffect`, colorblind palette option (ships as the free theme tier — see UI/UX plan) | M | Low |
| M3.3 | Error/loading states: user-facing retry on standings/leaderboard fetch failure | S | Low |
| M3.4 | `getStorageJSON`/`setStorageJSON` helper + serialized writes for currency; cap `viralHighlights` | M | Low |
| M3.5 | Dedupe global leaderboard per user | M | Low |
| M3.6 | Docs: testing-strategy page; delete stale plan docs (`docs/plans/2026-01-28`) | S | None |

### Implementation sketches — top 3

**M1.1 Deterministic daily RNG.** Promote `SeededRandom` out of `seed.ts` into `lib/game/rng.ts` with interface `{ next(): number; nextInt(a,b): number }`. Give the engine an explicit `rng` parameter everywhere randomness occurs: `generateGemsFromClearedCells(cells, rng)`, piece refills. Daily constructs `new SeededRandom(seed)` **once per run**; the same instance flows through every move. Gotchas: don't re-seed per move-set (keep `seed + i*1000` for piece-refill parity if desired, but gem colors must come from the run-scoped stream); replay playback must construct the identical rng and consume it in identical order, so no rng calls inside conditional animation code. Store `rngVersion: 1` in the replay so future balance changes don't corrupt old replays.

**M2.1 Engine extraction.** Define `EngineState = { board, pieces, score, multiplier, maxMultiplier, pieceSetIndex, gameOver }` and `applyMove(state, move, rng): { state, events }` where `events` (`linesCleared`, `gemsDropped`, `mergeHappened`, `bestGem`) drive animations/haptics/replay from the screen layer — engine stays pure, cascade presentation decoupled. Port `daily.tsx:184-288` first (the more correct copy), snapshot with M0.3, then port `game.tsx` and diff behavior: the diffs found *are* bugs C2/C7 being fixed. Gotcha: `setX(x + …)` stale-closure patterns disappear because the reducer owns sequencing — but audit every one during the port.

**M1.3 + M1.4 Integrity pass.** Firestore rules (extend ADR 0002's draft): on `tournaments/{date}/entries/{uid}` — `request.auth.uid == uid`, create-only-once for dailies, numeric bounds `score is int && score >= 0 && score <= request.resource.data.moveCount * 800`. Test with the Firestore emulator in CI (`@firebase/rules-unit-testing`). Gotcha: rules can't do cross-document math — keep validation per-doc; the replay-re-simulation Cloud Function is the Phase-3 upgrade path, enabled by persisting the replay code in the entry doc now.

---

## UI/UX & Product Improvement Plan (differentiation vs. Block Blast)

The codebase already has the right *visual* identity (tactile-console, paper/ember/cobalt palette — distinctive and adult). The gaps are in *legibility of the mechanic* and *the daily ritual*. Ordered by leverage:

**1. Make the merge mechanic visible and strategic (this IS the differentiator).**
Today gems are flat colored cells; merged size/multiplier isn't persisted (C3) and pieces silently destroy gems. After M1.2: render gems as physically distinct objects (Skia is already a dependency) with size tiers and an on-gem multiplier numeral; animate the merge pull-together; when a selected piece would crush a gem, show a red warning tint on those cells. Then add the strategic verb Block Blast doesn't have: **"bank or grow"** — tap a merged gem to *cash it* (score × multiplier, gem leaves the board, frees space) versus leave it to grow toward ×5 while it eats real estate. That converts the multiplier from passive luck into the visible risk/reward decision the design spec promises.

**2. Modernize placement interaction.**
Tap-piece-then-tap-board (`daily.tsx:180-188`) is two-step and error-prone with no preview. Implement drag-to-place with a **ghost preview** snapped to the grid (valid = theme tint, invalid = dimmed), plus highlight rows/columns the placement would complete. `react-native-gesture-handler` + `reanimated` are already installed. Keep tap-to-place as the accessibility fallback. Biggest feel upgrade per hour invested.

**3. Build the daily ritual (Wordle's actual retention engine).**
- **Percentile result, not just rank:** "You beat 73% of today's players" — shareable pride for non-top-10 players, who are 99% of users.
- **Par/medal tiers** per daily (bronze/silver/gold thresholds from a bot-simulated baseline — nearly free once the engine is pure after M2.1).
- **Streak calendar** on Home (data already exists in `seed.ts` streak keys); the archive screen becomes the calendar's detail view.
- Wire the share button (`daily.tsx:843` is a no-op) to the existing, *already-tested* share-grid generator (`src/lib/share/grid.ts`) — shockingly close to done; the annotated emoji grid with multiplier circles is genuinely novel share content.

**4. Ghost replays as a social mode, not a viewer.**
The replay system (codes, recorder, player) is built but buried. After M1.1 makes replays deterministic: race a friend's ghost on *today's* board — their pieces appear translucently as you play the same seed. No other block puzzle has this; it's "friends-watching-friends" with zero server cost.

**5. Tone & economy coherence for the adult audience.**
Battle passes were cut for being "juvenile-coded" but a dual coins+gems economy remains — same signal. Collapse to one cosmetic currency (Decision D5: coins only, cosmetics only). Replace the 🏆-emoji achievement rows (`daily.tsx:814`) with the badge iconography the design system deserves. Fix sign-out (`settings.tsx:365`) before review — Apple tests account flows.

**6. Complete the unfinished surfaces (priority order):** share grid wiring (nearly free) → welcome silent-demo onboarding teaching the merge in one interaction (current welcome is a stub) → colorblind-safe palettes as the *free* theme tier (turns an a11y fix into shop content) → daily archive playback for subscribers (paywall exists, content doesn't — don't monetize before M1.1, since archived puzzles need determinism).

---

## Decisions (resolved 2026-06-10)

| # | Question | Decision |
|---|---|---|
| D1 | Gem lifecycle rules | Pieces **may crush gems, with an explicit visual warning** before placement (preserves player agency, avoids soft-locks, creates the risk/reward tension). Merged gem occupies **one anchor cell** — the nearest legal empty cell to the cluster centroid. Cluster cells are **consumed** on merge. Gems persist size/multiplier in cell state. |
| D2 | Daily rollover policy | **UTC midnight.** One global puzzle moment, matches the spec's "global date," simplest to reason about and prevents timezone hopping. |
| D3 | Anti-cheat appetite | **Rules-only validation for v1** (no Blaze plan / Cloud Functions yet). Persist the replay code in each tournament entry doc now, enabling Cloud Function replay re-simulation in Phase 3 without schema change. |
| D4 | Dependency purge | **Approved** — one dedicated PR with full native rebuild + complete Maestro pass. |
| D5 | Economy | **Collapse to a single currency (coins), cosmetics only.** Remove gems as a currency; aligns with the adult positioning that motivated cutting the battle pass. |
| D6 | The mystery zip | Contents verified: Vibecode template export including a `.env` whose API keys are all placeholders (`-n0tr3al` suffix) and a publishable Supabase anon key. **Plain `git rm` is sufficient; no history rewrite needed.** |
| D7 | Performance baseline | No device profiling has been done. **Proceed with the cheap memoization (M3.1) now**; defer deeper optimization until the ADR 0013 device-profiling pass in Phase 4 produces measured numbers. |
