# ADR 0002: Firebase Production Setup

**Status:** Active
**Date:** 2026-05-05

## Context

`src/lib/firebase/config.ts` reads from `EXPO_PUBLIC_FIREBASE_*` env vars. These are unset on a fresh checkout, which causes the app to fall back to local-only mode (auth state in AsyncStorage, no global leaderboard, no cloud replay sync). This is the only hard launch blocker for Phase 1.

## Required steps (manual — user action)

1. Create a new Firebase project at https://console.firebase.google.com.
2. Enable **Authentication** → **Anonymous sign-in**.
3. Create a **Firestore database** in production mode, region `us-central` (default).
4. Add a **Web app** to the project (the keys are the same on iOS/Android via the Expo config).
5. Copy the config values into a `.env.local` file at the repo root:
   - `apiKey` → `EXPO_PUBLIC_FIREBASE_API_KEY`
   - `authDomain` → `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `projectId` → `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
   - `storageBucket` → `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `messagingSenderId` → `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `appId` → `EXPO_PUBLIC_FIREBASE_APP_ID`
6. Set Firestore security rules via the deployable **`firestore.rules`** at the repo root (paired with `firebase.json` and `firestore.indexes.json`). Deploy with:
   ```bash
   firebase deploy --only firestore:rules
   ```
   Rules unit tests live in `src/lib/firebase/__rules__/rules.test.ts` and run against the Firestore emulator:
   ```bash
   firebase emulators:exec --only firestore "npx jest src/lib/firebase/__rules__"
   ```
   These tests require Java + the emulator and the `@firebase/rules-unit-testing` dev dependency, so they are NOT part of the default `npm test` run.

7. For Android builds, download `google-services.json` from project settings → place at repo root (already gitignored — verify with `cat .gitignore | grep google-services`).
8. For iOS builds, download `GoogleService-Info.plist` → place at repo root.

## Validation

Run the app on a real device (not simulator). Watch the Metro logs for `✅ Firebase initialized successfully`. Then open Firestore in the console → confirm a document appears under `users/` after the first launch (anonymous auth creates a profile).

## Score integrity (audit S1/M1.3/M1.4)

Client-side validation lives in `src/lib/firebase/validation.ts` (`validateScoreSubmission`), called by `submitScore` before any write. The rules and the validator share the same bounds:
- `MAX_SCORE_PER_MOVE = 5000`
- `HARD_SCORE_CEILING = 10,000,000`

The enforcement boundary is: `score <= hard ceiling AND (moveCount <= 0 OR score <= moveCount * 5000)`. **These constants are duplicated in `firestore.rules` (rules cannot import TypeScript) and MUST be kept in sync.**

One-run-per-day is enforced by create-once rules on `tournaments/{date}/entries/{uid}` (`allow update, delete: if false`).

Each tournament entry persists its `replayCode`; this enables a future Phase-3 server-side replay re-simulation job to set `verified: true` (currently always `false`). No Cloud Function in v1 (decision D3).

## Out of scope for v1

- App Check (Phase 4)
- Cloud Functions for daily-puzzle generation (Phase 2 if needed; Phase 1 keeps deterministic seeding client-side)
- Multi-region Firestore (Phase 4 if international launch needs it)
