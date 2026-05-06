// Daily Mode — Seeded Piece Generation & Streak Tracking
import type { GamePiece } from '@/lib/types/game';
import { generatePieceByType, getAllShapeTypes } from '@/lib/game/pieces';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Simple seeded random number generator (LCG)
 * Same seed = same sequence of random numbers
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed % 2147483647;
    if (this.seed <= 0) this.seed += 2147483646;
  }

  next(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

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
  const totalRaw = await AsyncStorage.getItem(DAILIES_PLAYED_KEY);
  const totalPlayed = (totalRaw ? parseInt(totalRaw, 10) : 0) + 1;
  await AsyncStorage.setItem(DAILIES_PLAYED_KEY, String(totalPlayed));

  const lastPlayed = await AsyncStorage.getItem(DAILY_LAST_PLAYED_KEY);
  const prevStreakRaw = await AsyncStorage.getItem(DAILY_STREAK_KEY);
  const prevStreak = prevStreakRaw ? parseInt(prevStreakRaw, 10) : 0;
  let streakDays: number;
  if (lastPlayed === puzzleId) {
    // Same day replay — keep existing streak, don't double-count
    streakDays = prevStreak;
  } else if (lastPlayed && isYesterday(lastPlayed, puzzleId)) {
    streakDays = prevStreak + 1;
  } else {
    streakDays = 1;
  }
  await AsyncStorage.setItem(DAILY_LAST_PLAYED_KEY, puzzleId);
  await AsyncStorage.setItem(DAILY_STREAK_KEY, String(streakDays));
  return { totalPlayed, streakDays };
}

function isYesterday(prevId: string, todayId: string): boolean {
  const prev = new Date(prevId + 'T00:00:00Z').getTime();
  const today = new Date(todayId + 'T00:00:00Z').getTime();
  const diff = today - prev;
  return diff > 0 && diff <= 36 * 60 * 60 * 1000;
}
