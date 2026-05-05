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
6. Set Firestore security rules. Minimum viable for v1:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /scores/{scoreId} {
         allow read: if true;
         allow create: if request.auth != null
           && request.resource.data.userId == request.auth.uid
           && request.resource.data.score is int
           && request.resource.data.score >= 0
           && request.resource.data.score < 1000000;
       }
       match /users/{userId} {
         allow read: if true;
         allow write: if request.auth != null && request.auth.uid == userId;
       }
       match /replays/{replayId} {
         allow read: if true;
         allow create: if request.auth != null
           && request.resource.data.userId == request.auth.uid;
       }
     }
   }
   ```

7. For Android builds, download `google-services.json` from project settings → place at repo root (already gitignored — verify with `cat .gitignore | grep google-services`).
8. For iOS builds, download `GoogleService-Info.plist` → place at repo root.

## Validation

Run the app on a real device (not simulator). Watch the Metro logs for `✅ Firebase initialized successfully`. Then open Firestore in the console → confirm a document appears under `users/` after the first launch (anonymous auth creates a profile).

## Out of scope for v1

- App Check (Phase 4)
- Cloud Functions for daily-puzzle generation (Phase 2 if needed; Phase 1 keeps deterministic seeding client-side)
- Multi-region Firestore (Phase 4 if international launch needs it)
