# ADR 0005: AsyncStorage Prefix Unification

**Status:** Active
**Date:** 2026-05-06
**Decision:** Unify all AsyncStorage keys under `@block_merge:*` prefix.

## Context

Phase 1's rename left three different conventions: `@block_merge_arena:*` (most utils), `@block_merge:*` (social.ts post-rename), `block-merge:*` (tutorial.ts). Pre-launch we have no real users, but TestFlight/internal testers have data on disk under the old prefixes.

## Decision

Unify under `@block_merge:*`. Migrate existing tester data with a one-time copy on first launch after this change ships.

## Migration

`src/lib/storage/migrate.ts` runs once at cold start, copies any `@block_merge_arena:*` or `block-merge:*` key it finds to its `@block_merge:*` equivalent (only if the new key doesn't already exist), and writes a marker `@block_merge:_migrated_v1=1` so the migration is idempotent.

Old keys are NOT deleted — they sit dormant. A future cleanup task can drop them once we're confident the migration ran for everyone.

## Consequences

- All `*_KEY` constants in `src/lib/utils/*.ts` and `src/lib/firebase/auth.ts` must use `@block_merge:` prefix.
- `_layout.tsx` calls the migrator before any persistence-dependent code runs.
- Future modules MUST use the same prefix; consider extracting a `storageKey(name: string): string` helper later.
