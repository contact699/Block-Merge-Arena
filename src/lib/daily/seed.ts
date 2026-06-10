// Daily Mode — Seeded Piece Generation & Streak Tracking
import type { GamePiece } from '@/lib/types/game';
import { generatePieceByType, getAllShapeTypes } from '@/lib/game/pieces';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SeededRandom } from '@/lib/game/rng';

/**
 * Generate a daily seed based on the date
 * Same date = same seed for all players globally
 */
export function getDailySeed(date?: Date): number {
  const today = date || new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const day = today.getDate();

  // Combine date components into a unique seed
  return year * 10000 + month * 100 + day;
}

/**
 * Get today's date string in YYYY-MM-DD format
 */
export function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Generate daily pieces using a seeded random generator
 * All players get the same 3 starting pieces on the same day
 */
export function generateTournamentPieces(seed: number, count: number = 3): GamePiece[] {
  const rng = new SeededRandom(seed);
  const pieces: GamePiece[] = [];
  const shapeTypes = getAllShapeTypes();
  const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

  for (let i = 0; i < count; i++) {
    const shapeIndex = rng.nextInt(0, shapeTypes.length - 1);
    const colorIndex = rng.nextInt(0, colors.length - 1);

    const shapeType = shapeTypes[shapeIndex];
    const color = colors[colorIndex] as any;

    pieces.push(generatePieceByType(shapeType, color));
  }

  return pieces;
}

/**
 * Generate all pieces for a daily run (multiple sets)
 * Used for testing to ensure fair piece distribution
 */
export function generateTournamentPieceSets(seed: number, sets: number = 10): GamePiece[][] {
  const allPieces: GamePiece[][] = [];

  for (let i = 0; i < sets; i++) {
    // Each set gets a different seed offset
    const setSeed = seed + (i * 1000);
    allPieces.push(generateTournamentPieces(setSeed, 3));
  }

  return allPieces;
}

// ---------------------------------------------------------------------------
// Streak & completion tracking (moved from daily.tsx per T8)
// ---------------------------------------------------------------------------

const DAILIES_PLAYED_KEY = '@block_merge:dailies_played_total';
const DAILY_LAST_PLAYED_KEY = '@block_merge:daily_last_played';
const DAILY_STREAK_KEY = '@block_merge:daily_streak';

export async function recordDailyCompletion(puzzleId: string): Promise<{ totalPlayed: number; streakDays: number }> {
  const lastPlayed = await AsyncStorage.getItem(DAILY_LAST_PLAYED_KEY);
  const prevTotalRaw = await AsyncStorage.getItem(DAILIES_PLAYED_KEY);
  const prevTotal = prevTotalRaw ? parseInt(prevTotalRaw, 10) : 0;
  const prevStreakRaw = await AsyncStorage.getItem(DAILY_STREAK_KEY);
  const prevStreak = prevStreakRaw ? parseInt(prevStreakRaw, 10) : 0;

  // Same-puzzle replays (same-day OR returning to today's puzzle later)
  // must not inflate totalPlayed or alter streak.
  const sameAsLast = lastPlayed === puzzleId;
  const totalPlayed = sameAsLast ? prevTotal : prevTotal + 1;

  let streakDays: number;
  if (sameAsLast) {
    streakDays = prevStreak;
  } else if (lastPlayed && isYesterday(lastPlayed, puzzleId)) {
    streakDays = prevStreak + 1;
  } else {
    streakDays = 1;
  }

  if (!sameAsLast) {
    await AsyncStorage.setItem(DAILIES_PLAYED_KEY, String(totalPlayed));
  }
  await AsyncStorage.setItem(DAILY_LAST_PLAYED_KEY, puzzleId);
  await AsyncStorage.setItem(DAILY_STREAK_KEY, String(streakDays));
  return { totalPlayed, streakDays };
}

/**
 * Returns true if the player has already completed a run on the given puzzle.
 * Used to enforce the one-run-per-day rule (no retries until tomorrow).
 */
export async function hasCompletedDaily(puzzleId: string): Promise<boolean> {
  const lastPlayed = await AsyncStorage.getItem(DAILY_LAST_PLAYED_KEY);
  return lastPlayed === puzzleId;
}

function isYesterday(prevId: string, todayId: string): boolean {
  const prev = new Date(prevId + 'T00:00:00Z').getTime();
  const today = new Date(todayId + 'T00:00:00Z').getTime();
  const diff = today - prev;
  return diff > 0 && diff <= 36 * 60 * 60 * 1000;
}
