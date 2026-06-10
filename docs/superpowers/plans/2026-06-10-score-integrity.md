# Score Integrity (Audit S1 / M1.3 / M1.4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Stop the daily leaderboard from being trivially cheatable — add client-side payload validation (zod), deployable Firestore security rules that reject implausible scores and enforce one-run-per-day server-side, thread the real move count for plausibility bounds, and persist the replay code on each tournament entry for future server-side re-simulation.

**Architecture:** Defense in two layers. (1) A pure, unit-tested validator (`src/lib/firebase/validation.ts`) gates every write at the client. (2) `firestore.rules` (new deployable artifact) enforces the same bounds server-side where it actually matters — auth.uid ownership, numeric bounds, a per-move score ceiling, and create-once on daily entries. No Cloud Function (decision D3); the persisted `replayCode` enables Phase-3 replay re-simulation without a schema change later.

**Tech Stack:** TypeScript strict, zod 4.1 (installed, currently unused), Firebase Firestore rules v2, Jest. `@firebase/rules-unit-testing` + the Firestore emulator are needed to RUN rules tests (Java + emulator) — not available headless here, so rules tests are authored and run at CI/deploy time.

**Builds on:** Plan 1 (engine now tracks `moveCount` in `EngineState`) + the audit (`docs/audits/2026-06-10-...`, decisions D3). Closes audit S1 (Critical), S2/M1.4 (one-run), and the "zod unused" note.

**Conventions:** run from repo root. `npx jest <path>`; `npm run typecheck` + `npm run lint` before each commit. Commit messages end with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

**Verified current state:**
- Path: `daily.tsx handleRunEnd → saveScore(GameScore) [leaderboard.ts:23] → submitScoreToFirebase(score, mode, maxMultiplier, moveCount, durationMs) [api.ts:33] → submitTournamentEntry [api.ts:190] + archive writes`.
- `GameScore` (leaderboard.ts:5) has optional `moveCount`/`durationMs`; the daily save call does NOT pass `moveCount` today (engine `moveCount` is available to thread).
- `TournamentEntry` (firebase/types.ts:54) has no `replayCode` field; `FirebaseScore` has an unused `verified?` field.
- NO `firestore.rules` / `firebase.json` exist. ADR 0002 has a minimal draft (flat `score < 1000000`, no per-move cap, no tournament-entry rules).
- zod installed, imported nowhere.

---

### Task 1: Pure score-submission validator (zod) + tests

**Files:**
- Create: `src/lib/firebase/validation.ts`
- Test: `src/lib/firebase/validation.test.ts`

- [ ] **Step 1: failing test** `src/lib/firebase/validation.test.ts`

```typescript
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
    const r = validateScoreSubmission({ ...ok, score: 999_999_999 });
    expect(r.valid).toBe(false);
  });
  it('rejects score exceeding the per-move ceiling', () => {
    const r = validateScoreSubmission({ ...ok, moveCount: 10, score: 10 * MAX_SCORE_PER_MOVE + 1 });
    expect(r.valid).toBe(false);
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
});
```

- [ ] **Step 2:** `npx jest src/lib/firebase/validation.test.ts` — expect FAIL.

- [ ] **Step 3: implement** `src/lib/firebase/validation.ts`

```typescript
// Client-side score-submission validation (audit M1.3 / S1).
// Pure + unit-tested. Mirrors the server-side firestore.rules bounds so the
// client rejects garbage early and the rules reject it authoritatively.
import { z } from 'zod';

/** Max points a single move can plausibly produce.
 *  Worst case: a placement clears a lot of cells at a high multiplier.
 *  64 cells * 10 pts * 5x = 3200; we use a generous 5000 ceiling per move to
 *  avoid false-rejecting legitimate high rounds. Tune from telemetry (D3). */
export const MAX_SCORE_PER_MOVE = 5000;

/** Absolute hard ceiling when moveCount is absent/zero (endless w/o count). */
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
  const ceiling = moveCount && moveCount > 0 ? moveCount * MAX_SCORE_PER_MOVE : HARD_SCORE_CEILING;
  if (score > ceiling) {
    return { valid: false, reason: `score ${score} exceeds ceiling ${ceiling}` };
  }
  return { valid: true };
}
```

- [ ] **Step 4:** `npx jest src/lib/firebase/validation.test.ts` — expect all PASS. Then full `npx jest` (+10), `npm run typecheck`, `npm run lint`.
- [ ] **Step 5: Commit** `git add src/lib/firebase/validation.ts src/lib/firebase/validation.test.ts && git commit -m "feat(firebase): zod score-submission validator with per-move ceiling (audit M1.3)"`

---

### Task 2: Thread moveCount + replayCode through the submit path

**Files:** Modify `src/lib/utils/leaderboard.ts`, `src/lib/firebase/api.ts`, `src/lib/firebase/types.ts`, `src/app/daily.tsx`, `src/app/game.tsx`

- [ ] **Step 1:** Add `replayCode?: string` to `GameScore` (leaderboard.ts:5) and to `TournamentEntry` (types.ts:54). Add `replayCode?: string` to `FirebaseScore` too (types.ts:32) for parity.
- [ ] **Step 2:** `saveScore` (leaderboard.ts:23): forward the new fields — change the `submitScoreToFirebase(...)` call to also pass `score.replayCode`. Update `submitScoreToFirebase`'s signature accordingly (next step).
- [ ] **Step 3:** `submitScore` (api.ts:33): add a `replayCode?: string` parameter (last). Build the `scoreData` with `replayCode` when present. Pass `replayCode` into `submitTournamentEntry`. **Validate first** (Task 3 wires the actual call — here just add the param + plumbing).
- [ ] **Step 4:** `submitTournamentEntry` (api.ts:190): add `replayCode?: string` param; include it in the `entry` object written to `tournaments/{date}/entries/{uid}`.
- [ ] **Step 5:** Thread real values from the screens:
  - `src/app/daily.tsx` `handleRunEnd`: the `saveScore({...})` call — add `moveCount: final.moveCount` and `replayCode: replay?.code` (the replay code obtained from `replayRecorder.stop(...)` earlier in `handleRunEnd`; if the variable name differs, use the actual one). Confirm `final.moveCount` exists on `EngineState` (it does).
  - `src/app/game.tsx` (endless) `handlePlace` game-over `saveScore({...})`: add `moveCount: out.state.moveCount`. (Endless has no replay code — omit it.)
- [ ] **Step 6:** `npm run typecheck` (exit 0), `npx jest` (still green), `npm run lint` (clean).
- [ ] **Step 7: Commit** `git add -A && git commit -m "feat(firebase): thread moveCount + replayCode into score submission (enables M1.3 bounds + Phase-3 audit)"`

---

### Task 3: Enforce validation in submitScore

**Files:** Modify `src/lib/firebase/api.ts`

- [ ] **Step 1:** At the top of `submitScore` (after the `isConfigured()/db` guard), validate the payload and bail before any write:

```typescript
import { validateScoreSubmission } from './validation';
// ... inside submitScore, before getOrCreateUser():
const check = validateScoreSubmission({ score, mode, maxMultiplier, moveCount, duration });
if (!check.valid) {
  console.warn('Rejected implausible score submission:', check.reason);
  return { success: false, error: `Invalid score: ${check.reason}` };
}
```

- [ ] **Step 2:** Set the `verified` flag honestly: since v1 has no server re-simulation, set `verified: false` on the written `FirebaseScore` (it means "not server-verified yet" — the persisted `replayCode` lets Phase 3 flip it). Do NOT claim `verified: true`.
- [ ] **Step 3:** `npm run typecheck`, `npx jest`, `npm run lint` — all green.
- [ ] **Step 4: Commit** `git add src/lib/firebase/api.ts && git commit -m "feat(firebase): reject implausible scores in submitScore before write (audit S1)"`

---

### Task 4: Deployable firestore.rules + firebase.json + emulator tests

**Files:**
- Create: `firestore.rules`
- Create: `firebase.json`
- Create: `firestore.indexes.json` (empty/minimal — referenced by firebase.json)
- Create: `src/lib/firebase/__rules__/rules.test.ts` (emulator test — authored; runs at CI/deploy, NOT headless here)

- [ ] **Step 1:** Create `firestore.rules` (v2). Cover every collection the app writes (read the writes in `api.ts`: `scores`, `users`, `tournaments/{date}`, `tournaments/{date}/entries/{uid}`, `puzzles/{id}`, `users/{uid}/archive/{id}`; plus `replays` per ADR 0002). Encode the same bounds as the client validator + ownership + create-once on daily entries:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function authed() { return request.auth != null; }
    function isOwner(uid) { return authed() && request.auth.uid == uid; }
    // Mirror MAX_SCORE_PER_MOVE (5000) and HARD_SCORE_CEILING (10,000,000)
    // from src/lib/firebase/validation.ts. Keep these in sync.
    function scoreInBounds(score, moveCount) {
      return score is int && score >= 0 &&
        ( (moveCount is int && moveCount > 0 && score <= moveCount * 5000)
          || score <= 10000000 );
    }
    function multOk(m) { return m is int && (m == 1 || m == 2 || m == 3 || m == 5); }

    match /scores/{scoreId} {
      allow read: if true;
      allow create: if isOwner(request.resource.data.userId)
        && scoreInBounds(request.resource.data.score, request.resource.data.get('moveCount', 0))
        && multOk(request.resource.data.maxMultiplier);
      allow update, delete: if false;
    }

    match /users/{userId} {
      allow read: if true;
      allow write: if isOwner(userId);
      // per-user archive — owner only
      match /archive/{puzzleId} {
        allow read: if true;
        allow write: if isOwner(userId);
      }
    }

    match /tournaments/{date} {
      allow read: if true;
      // tournament metadata: participantCount increments + create by any authed user
      allow create, update: if authed();

      match /entries/{userId} {
        allow read: if true;
        // ONE run per day: create-once, no overwrite (audit M1.4).
        allow create: if isOwner(userId)
          && request.resource.data.userId == userId
          && scoreInBounds(request.resource.data.score, request.resource.data.get('moveCount', 0))
          && multOk(request.resource.data.maxMultiplier);
        allow update, delete: if false;
      }
    }

    match /puzzles/{puzzleId} {
      allow read: if true;
      allow create, update: if authed(); // topScore transaction + playCount increment
    }

    match /replays/{replayId} {
      allow read: if true;
      allow create: if isOwner(request.resource.data.userId);
      allow update, delete: if false;
    }
  }
}
```

NOTE: the entry write currently does NOT include `moveCount` — Task 2 adds `replayCode` but the entry may lack `moveCount`. Either add `moveCount` to the entry write in `submitTournamentEntry` (preferred, so `scoreInBounds` can use it) OR rely on the hard ceiling. PREFER adding `moveCount` to the entry object in Task 2/this task so the per-move cap applies to daily entries. Update Task 2's entry object to include `moveCount` if you take this path — note it in your report.

IMPORTANT consequence of create-once: the existing `submitTournamentEntry` "update if higher score" path (api.ts ~214) will be DENIED by these rules. For a true one-run-per-day that's correct, but make the client resilient: the `updateDoc` call will throw and is already inside a try/catch that logs — acceptable. Optionally short-circuit: if the entry already exists, skip the update entirely (it's one-run; the local `hasCompletedDaily` flag already prevents replays). Note what you chose.

- [ ] **Step 2:** Create `firebase.json`:
```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "emulators": {
    "firestore": { "port": 8080 },
    "ui": { "enabled": false }
  }
}
```
and `firestore.indexes.json`:
```json
{ "indexes": [], "fieldOverrides": [] }
```

- [ ] **Step 3:** Author `src/lib/firebase/__rules__/rules.test.ts` using `@firebase/rules-unit-testing` (initializeTestEnvironment, assertFails/assertSucceeds) covering: owner can create own score in bounds; cannot create with another uid; 999999999 rejected; per-move-ceiling rejected; second create on the same daily entry path FAILS (create-once); read is public. Add a top comment: this requires the Firestore emulator (`firebase emulators:exec --only firestore "npx jest src/lib/firebase/__rules__"`) and Java — it is NOT part of the default `npm test` run and won't run headless without the emulator. Do NOT wire it into the default jest `testMatch` (keep `__rules__` out of the default run, or guard with an env check) so `npm test` stays green without the emulator.

- [ ] **Step 4:** Verify the DEFAULT suite is unaffected: `npx jest` (same count as after Task 1–3, the rules test excluded), `npm run typecheck`, `npm run lint`. Confirm `firestore.rules` syntax by eye (and `firebase deploy --only firestore:rules --dry-run` only if the Firebase CLI is available — likely not; skip if absent).
- [ ] **Step 5: Commit** `git add firestore.rules firebase.json firestore.indexes.json src/lib/firebase/__rules__/rules.test.ts && git commit -m "feat(firebase): deployable security rules — score bounds, ownership, one-run-per-day (audit S1/M1.4)"`

---

### Task 5: Update ADR 0002 + decisions

**Files:** Modify `docs/decisions/0002-firebase-production-setup.md`

- [ ] **Step 1:** Replace the inline draft rules block with a pointer to the real `firestore.rules` file, and add the deploy step: `firebase deploy --only firestore:rules` (and that rules tests run via the emulator in CI). Note that the client validator (`src/lib/firebase/validation.ts`) and the rules share the same bounds (`MAX_SCORE_PER_MOVE`, `HARD_SCORE_CEILING`) and MUST be kept in sync. Record that one-run-per-day is enforced by create-once entry rules (M1.4) and that `replayCode` is persisted per entry to enable Phase-3 server-side replay re-simulation (decision D3).
- [ ] **Step 2: Commit** `git add docs/decisions/0002-firebase-production-setup.md && git commit -m "docs(adr): point ADR 0002 at real firestore.rules + score-integrity notes"`

---

## Self-review (done at write time)

- **Coverage:** S1 (client validator T1+T3 + rules T4); M1.3 per-move ceiling (T1 validator + T4 rules, shared constants); M1.4 one-run create-once (T4 rules); replay-code persistence for D3 (T2); zod-unused note (T1). Threading real moveCount (T2) makes the per-move cap meaningful for daily.
- **Verifiability:** T1 fully unit-tested. T2/T3 typecheck + existing suite. T4 rules are emulator-tested (authored; run at CI/deploy — Java+emulator not headless here). This is stated explicitly, not hidden.
- **Known judgment points (flagged):** MAX_SCORE_PER_MOVE=5000 is a generous, tunable bound (over-tight bounds that reject real players are worse than slightly loose ones); whether to add `moveCount` to the entry write (preferred) vs rely on hard ceiling (T4 Step 1); whether to drop the now-rule-denied client update path (T4 Step 1).
- **Constants-in-sync risk:** the per-move ceiling lives in BOTH validation.ts and firestore.rules (rules can't import TS). T5 documents the sync requirement; a future improvement could codegen the rules, out of scope here.
- **No placeholders.** T1 has complete code+tests; T4 has complete rules; T2/T3/T5 are precise edits against verified line numbers.
