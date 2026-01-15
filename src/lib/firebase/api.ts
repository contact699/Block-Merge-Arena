// Firebase API Layer - Score Submission & Leaderboards
import { db, isConfigured } from './config';
import { getOrCreateUser, getCurrentUserId } from './auth';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  increment,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import type {
  FirebaseScore,
  FirebaseUser,
  TournamentEntry,
  Tournament,
  SubmitScoreResponse,
  LeaderboardResponse,
  TournamentStandingsResponse,
} from './types';
import { getTodayDateString } from '@/lib/utils/tournament';

/**
 * Submit a game score to Firebase
 */
export async function submitScore(
  score: number,
  mode: 'endless' | 'tournament',
  maxMultiplier: number,
  moveCount?: number,
  duration?: number
): Promise<SubmitScoreResponse> {
  if (!isConfigured() || !db) {
    return {
      success: false,
      error: 'Firebase not configured',
    };
  }

  try {
    // Get or create user
    const userId = await getOrCreateUser();

    // Create score document
    const scoreId = `${userId}_${Date.now()}`;
    const dateString = getTodayDateString();

    const scoreData: FirebaseScore = {
      id: scoreId,
      userId,
      score,
      mode,
      date: Date.now(),
      dateString,
      maxMultiplier,
      moveCount,
      duration,
    };

    // Save score to Firestore
    await setDoc(doc(db, 'scores', scoreId), scoreData);

    // Update user stats
    await updateUserStats(userId, score, mode);

    // If tournament mode, also update tournament entry
    if (mode === 'tournament') {
      await submitTournamentEntry(userId, dateString, score, maxMultiplier, duration);
    }

    console.log('✅ Score submitted successfully:', scoreId);

    return {
      success: true,
      scoreId,
    };
  } catch (error) {
    console.error('❌ Error submitting score:', error);
    return {
      success: false,
      error: String(error),
    };
  }
}

/**
 * Update user statistics
 */
async function updateUserStats(
  userId: string,
  score: number,
  mode: 'endless' | 'tournament'
): Promise<void> {
  if (!db) return;

  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      // Create new user profile
      const newUser: FirebaseUser = {
        id: userId,
        createdAt: Date.now(),
        lastActiveAt: Date.now(),
        stats: {
          totalGames: 1,
          totalScore: score,
          highScore: score,
          highScoreEndless: mode === 'endless' ? score : 0,
          highScoreTournament: mode === 'tournament' ? score : 0,
          gamesWon: 0,
          averageScore: score,
        },
      };
      await setDoc(userRef, newUser);
    } else {
      // Update existing user
      const userData = userDoc.data() as FirebaseUser;
      const newTotalGames = userData.stats.totalGames + 1;
      const newTotalScore = userData.stats.totalScore + score;

      await updateDoc(userRef, {
        lastActiveAt: Date.now(),
        'stats.totalGames': increment(1),
        'stats.totalScore': increment(score),
        'stats.highScore': Math.max(userData.stats.highScore, score),
        'stats.highScoreEndless':
          mode === 'endless'
            ? Math.max(userData.stats.highScoreEndless, score)
            : userData.stats.highScoreEndless,
        'stats.highScoreTournament':
          mode === 'tournament'
            ? Math.max(userData.stats.highScoreTournament, score)
            : userData.stats.highScoreTournament,
        'stats.averageScore': Math.round(newTotalScore / newTotalGames),
      });
    }
  } catch (error) {
    console.error('❌ Error updating user stats:', error);
  }
}

/**
 * Submit tournament entry
 */
async function submitTournamentEntry(
  userId: string,
  tournamentDate: string,
  score: number,
  maxMultiplier: number,
  duration?: number
): Promise<void> {
  if (!db) return;

  try {
    // Check if user already has an entry for this tournament
    const entryRef = doc(db, 'tournaments', tournamentDate, 'entries', userId);
    const entryDoc = await getDoc(entryRef);

    const entry: TournamentEntry = {
      userId,
      tournamentDate,
      score,
      maxMultiplier,
      submittedAt: Date.now(),
      duration,
      isBestScore: true,
    };

    if (entryDoc.exists()) {
      const existingEntry = entryDoc.data() as TournamentEntry;
      // Only update if new score is higher
      if (score > existingEntry.score) {
        await updateDoc(entryRef, {
          score,
          maxMultiplier,
          submittedAt: Date.now(),
          duration,
        });
      }
    } else {
      // First entry for this tournament
      await setDoc(entryRef, entry);

      // Update tournament participant count
      const tournamentRef = doc(db, 'tournaments', tournamentDate);
      const tournamentDoc = await getDoc(tournamentRef);

      if (tournamentDoc.exists()) {
        await updateDoc(tournamentRef, {
          participantCount: increment(1),
        });
      }
    }
  } catch (error) {
    console.error('❌ Error submitting tournament entry:', error);
  }
}

/**
 * Get global leaderboard
 */
export async function getGlobalLeaderboard(
  mode: 'all' | 'endless' | 'tournament',
  limitCount: number = 100
): Promise<LeaderboardResponse> {
  if (!isConfigured() || !db) {
    return {
      entries: [],
      total: 0,
    };
  }

  try {
    const scoresRef = collection(db, 'scores');
    let q = query(scoresRef, orderBy('score', 'desc'), limit(limitCount));

    // Filter by mode if specified
    if (mode !== 'all') {
      q = query(scoresRef, where('mode', '==', mode), orderBy('score', 'desc'), limit(limitCount));
    }

    const querySnapshot = await getDocs(q);
    const entries = querySnapshot.docs.map((doc, index) => {
      const data = doc.data() as FirebaseScore;
      return {
        userId: data.userId,
        displayName: `Player ${data.userId.substring(0, 8)}`,
        score: data.score,
        rank: index + 1,
        mode: mode,
        maxMultiplier: data.maxMultiplier,
        date: data.date,
        isCurrentUser: data.userId === getCurrentUserId(),
      };
    });

    return {
      entries,
      total: entries.length,
    };
  } catch (error) {
    console.error('❌ Error fetching leaderboard:', error);
    return {
      entries: [],
      total: 0,
    };
  }
}

/**
 * Get tournament standings for a specific date
 */
export async function getTournamentStandings(
  tournamentDate?: string
): Promise<TournamentStandingsResponse> {
  if (!isConfigured() || !db) {
    return {
      tournamentDate: tournamentDate || getTodayDateString(),
      entries: [],
      total: 0,
    };
  }

  const date = tournamentDate || getTodayDateString();

  try {
    const entriesRef = collection(db, 'tournaments', date, 'entries');
    const q = query(entriesRef, orderBy('score', 'desc'), limit(100));

    const querySnapshot = await getDocs(q);
    const entries = querySnapshot.docs.map((doc, index) => {
      const data = doc.data() as TournamentEntry;
      return {
        ...data,
        rank: index + 1,
      };
    });

    // Find current user's entry
    const userId = getCurrentUserId();
    const userEntry = userId ? entries.find((e) => e.userId === userId) : undefined;

    return {
      tournamentDate: date,
      entries,
      userEntry,
      total: entries.length,
    };
  } catch (error) {
    console.error('❌ Error fetching tournament standings:', error);
    return {
      tournamentDate: date,
      entries: [],
      total: 0,
    };
  }
}

/**
 * Get or create today's tournament
 */
export async function getOrCreateTournament(date?: string): Promise<Tournament | null> {
  if (!isConfigured() || !db) {
    return null;
  }

  const tournamentDate = date || getTodayDateString();

  try {
    const tournamentRef = doc(db, 'tournaments', tournamentDate);
    const tournamentDoc = await getDoc(tournamentRef);

    if (tournamentDoc.exists()) {
      return tournamentDoc.data() as Tournament;
    }

    // Create new tournament
    const newTournament: Tournament = {
      date: tournamentDate,
      seed: parseInt(tournamentDate.replace(/-/g, '')), // Simple seed from date
      startTime: new Date(tournamentDate).getTime(),
      endTime: new Date(tournamentDate).getTime() + 24 * 60 * 60 * 1000, // 24 hours
      participantCount: 0,
      topScore: 0,
      status: 'active',
    };

    await setDoc(tournamentRef, newTournament);
    return newTournament;
  } catch (error) {
    console.error('❌ Error getting/creating tournament:', error);
    return null;
  }
}

/**
 * Get user's personal best scores
 */
export async function getUserBestScores(userId?: string): Promise<{
  endless: number;
  tournament: number;
  all: number;
}> {
  if (!isConfigured() || !db) {
    return { endless: 0, tournament: 0, all: 0 };
  }

  const uid = userId || (await getOrCreateUser());

  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return { endless: 0, tournament: 0, all: 0 };
    }

    const userData = userDoc.data() as FirebaseUser;
    return {
      endless: userData.stats.highScoreEndless,
      tournament: userData.stats.highScoreTournament,
      all: userData.stats.highScore,
    };
  } catch (error) {
    console.error('❌ Error fetching user best scores:', error);
    return { endless: 0, tournament: 0, all: 0 };
  }
}
