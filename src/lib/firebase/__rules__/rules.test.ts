// @ts-nocheck
// Emulator-only test — requires Java + the Firestore emulator.
// Run with: firebase emulators:exec --only firestore "npx jest src/lib/firebase/__rules__"
// NOT part of the default `npm test` (no emulator headless).
// Add `@firebase/rules-unit-testing` as a dev dependency before running:
//   npm install --save-dev @firebase/rules-unit-testing --legacy-peer-deps

import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { setDoc, doc, getDoc } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

let testEnv: RulesTestEnvironment;

const RULES_PATH = path.resolve(__dirname, '../../../../firestore.rules');

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'block-merge-test',
    firestore: {
      rules: fs.readFileSync(RULES_PATH, 'utf8'),
      host: 'localhost',
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

afterEach(async () => {
  await testEnv.clearFirestore();
});

// ---------------------------------------------------------------------------
// /scores/{scoreId}
// ---------------------------------------------------------------------------

describe('scores collection', () => {
  it('owner creates an in-bounds score → succeeds', async () => {
    const alice = testEnv.authenticatedContext('alice');
    await assertSucceeds(
      setDoc(doc(alice.firestore(), 'scores', 'alice_001'), {
        userId: 'alice',
        score: 1000,
        mode: 'endless',
        maxMultiplier: 2,
        moveCount: 10,
        date: Date.now(),
        dateString: '2026-06-10',
        verified: false,
      })
    );
  });

  it('create with a different uid → fails (ownership)', async () => {
    const bob = testEnv.authenticatedContext('bob');
    await assertFails(
      setDoc(doc(bob.firestore(), 'scores', 'alice_002'), {
        userId: 'alice', // bob writing as alice
        score: 500,
        mode: 'endless',
        maxMultiplier: 1,
        moveCount: 5,
        date: Date.now(),
        dateString: '2026-06-10',
        verified: false,
      })
    );
  });

  it('score exceeds HARD_SCORE_CEILING (no moveCount) → fails', async () => {
    const alice = testEnv.authenticatedContext('alice');
    await assertFails(
      setDoc(doc(alice.firestore(), 'scores', 'alice_003'), {
        userId: 'alice',
        score: 999_999_999, // > 10,000,000
        mode: 'endless',
        maxMultiplier: 5,
        date: Date.now(),
        dateString: '2026-06-10',
        verified: false,
      })
    );
  });

  it('score exceeds per-move ceiling (moveCount present) → fails', async () => {
    const alice = testEnv.authenticatedContext('alice');
    // 5 moves * 5000 = 25,000 max; 30,000 should fail
    await assertFails(
      setDoc(doc(alice.firestore(), 'scores', 'alice_004'), {
        userId: 'alice',
        score: 30_000,
        mode: 'endless',
        maxMultiplier: 1,
        moveCount: 5,
        date: Date.now(),
        dateString: '2026-06-10',
        verified: false,
      })
    );
  });

  it('sub-10M score that exceeds per-move cap (OR-bug case) → fails', async () => {
    const alice = testEnv.authenticatedContext('alice');
    // moveCount 1 → per-move ceiling 5000; 9,999,999 is under 10M but must still be rejected
    await assertFails(
      setDoc(doc(alice.firestore(), 'scores', 'alice_005'), {
        userId: 'alice',
        score: 9_999_999,
        mode: 'tournament',
        maxMultiplier: 3,
        moveCount: 1,
        date: Date.now(),
        dateString: '2026-06-10',
        verified: false,
      })
    );
  });

  it('unauthenticated public read → succeeds', async () => {
    // First seed a doc as admin
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'scores', 'public_001'), {
        userId: 'alice',
        score: 100,
        mode: 'endless',
        maxMultiplier: 1,
        date: Date.now(),
        dateString: '2026-06-10',
        verified: false,
      });
    });

    const anon = testEnv.unauthenticatedContext();
    await assertSucceeds(getDoc(doc(anon.firestore(), 'scores', 'public_001')));
  });
});

// ---------------------------------------------------------------------------
// /tournaments/{date}/entries/{userId}  — one-run-per-day (audit M1.4)
// ---------------------------------------------------------------------------

describe('tournament entries — one-run-per-day', () => {
  const TODAY = '2026-06-10';

  it('owner creates first entry → succeeds', async () => {
    const alice = testEnv.authenticatedContext('alice');
    await assertSucceeds(
      setDoc(doc(alice.firestore(), 'tournaments', TODAY, 'entries', 'alice'), {
        userId: 'alice',
        tournamentDate: TODAY,
        score: 1500,
        maxMultiplier: 3,
        moveCount: 20,
        submittedAt: Date.now(),
        isBestScore: true,
      })
    );
  });

  it('second create on same entry → fails (create-once enforced)', async () => {
    // Seed the first entry bypassing rules
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'tournaments', TODAY, 'entries', 'alice'), {
        userId: 'alice',
        tournamentDate: TODAY,
        score: 1500,
        maxMultiplier: 3,
        moveCount: 20,
        submittedAt: Date.now(),
        isBestScore: true,
      });
    });

    const alice = testEnv.authenticatedContext('alice');
    // update is denied by rules; setDoc on existing doc is an update → fails
    await assertFails(
      setDoc(doc(alice.firestore(), 'tournaments', TODAY, 'entries', 'alice'), {
        userId: 'alice',
        tournamentDate: TODAY,
        score: 9000,
        maxMultiplier: 5,
        moveCount: 30,
        submittedAt: Date.now(),
        isBestScore: true,
      })
    );
  });

  it('entry score exceeds per-move ceiling → fails', async () => {
    const alice = testEnv.authenticatedContext('alice');
    await assertFails(
      setDoc(doc(alice.firestore(), 'tournaments', TODAY, 'entries', 'alice'), {
        userId: 'alice',
        tournamentDate: TODAY,
        score: 999_999,
        maxMultiplier: 5,
        moveCount: 10, // 10 * 5000 = 50,000 max
        submittedAt: Date.now(),
        isBestScore: true,
      })
    );
  });

  it('unauthenticated public read of entries → succeeds', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'tournaments', TODAY, 'entries', 'alice'), {
        userId: 'alice',
        tournamentDate: TODAY,
        score: 200,
        maxMultiplier: 1,
        submittedAt: Date.now(),
        isBestScore: true,
      });
    });

    const anon = testEnv.unauthenticatedContext();
    await assertSucceeds(
      getDoc(doc(anon.firestore(), 'tournaments', TODAY, 'entries', 'alice'))
    );
  });
});
