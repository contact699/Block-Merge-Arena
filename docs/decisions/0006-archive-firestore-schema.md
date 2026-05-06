# ADR 0006: Daily Archive Firestore Schema

**Status:** Active
**Date:** 2026-05-06

## Collections

```
puzzles/{puzzleId}                   # public, lazily populated
  date: timestamp                     # midnight UTC of the puzzle day
  seed: string                        # the deterministic seed used by clients
  topScore: number
  topPlayerName: string?              # optional public display
  playCount: number
  createdAt: timestamp

users/{uid}/archive/{puzzleId}       # private to user
  played: boolean
  score: number
  multiplier: number
  durationMs: number
  completedAt: timestamp
```

`puzzleId` follows the same convention as the live daily — `YYYY-MM-DD`.

## Why two collections, not nested

Querying "what did *I* play?" is fast against `users/{uid}/archive/`. Querying "what's the all-time top score for puzzle 2026-05-06?" is fast against `puzzles/{puzzleId}`. Both are O(1) lookups by document ID.

## Population

`puzzles/{puzzleId}` is lazy-created the first time a player completes that puzzle. The leaderboard logic from Phase 1 (`saveScore` in `src/lib/firebase/api.ts`) is the natural place — it already writes to Firestore. Phase 3 will extend it to also upsert the `puzzles` doc and the per-user archive entry.

For Phase 2, the read module (`src/lib/daily/archive.ts`) reads from `users/{uid}/archive/` only. Writes from completion are deferred to Phase 3 alongside the RevenueCat work — pre-subscription, there's no real archive for non-subscribers to populate.

## Security rules

```
match /puzzles/{puzzleId} {
  allow read: if true;
  allow create, update: if request.auth != null
    && request.resource.data.score is int
    && request.resource.data.score < 1000000;
}
match /users/{uid}/archive/{puzzleId} {
  allow read, write: if request.auth != null && request.auth.uid == uid;
}
```

Add these rules to ADR 0002's existing rules block when populating Firebase production credentials.

## Subscriber gate

Reading the archive list (`getArchive(uid)`) is allowed for any authenticated user. The *UX* gate is in the client: `requireSubscription()` returns `false` for non-subscribers and the archive UI shows the paywall.

We do not enforce subscription server-side in v1 — Phase 4 adds App Check + Cloud Functions if abuse becomes a problem. For v1, client-side gating is fine; the data is already public-ish.

## Out of scope for Phase 2

- Writing puzzle/archive docs on completion (Phase 3 — alongside RevenueCat)
- App Check (Phase 4)
- Cloud Functions for daily-puzzle generation (deferred indefinitely; deterministic client-side seeding is sufficient)
