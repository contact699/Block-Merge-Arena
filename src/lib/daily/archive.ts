// Daily archive — reads past-puzzle entries for the current authenticated user.
// Schema: docs/decisions/0006-archive-firestore-schema.md
//
// Phase 2: read-only. Writes (puzzle/archive docs on run completion) land in
// Phase 3 alongside the RevenueCat subscription work.
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';

export interface ArchiveEntry {
  puzzleId: string;
  played: boolean;
  score: number;
  multiplier: number;
  completedAt: number | null;
}

export async function getArchive(daysBack = 30): Promise<ArchiveEntry[]> {
  if (!db || !auth?.currentUser) return [];
  const ref = collection(db, 'users', auth.currentUser.uid, 'archive');
  const q = query(ref, orderBy('completedAt', 'desc'), limit(daysBack));
  const snap = await getDocs(q);
  return snap.docs.map((doc) => {
    const data = doc.data() as Partial<ArchiveEntry>;
    return {
      puzzleId: doc.id,
      played: data.played ?? false,
      score: data.score ?? 0,
      multiplier: data.multiplier ?? 1,
      completedAt: data.completedAt ?? null,
    };
  });
}
