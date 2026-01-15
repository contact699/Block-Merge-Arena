// Daily Tournament System - Seeded Piece Generation
import type { GamePiece, BlockShapeType } from '@/lib/types/game';
import { generatePieceByType, getAllShapeTypes } from '@/lib/game/pieces';

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
 * Generate tournament pieces using a seeded random generator
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
 * Generate all pieces for a tournament (multiple sets)
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

/**
 * Tournament state interface
 */
export interface TournamentState {
  id: string;
  date: string;
  seed: number;
  startingPieces: GamePiece[];
  timeLimit: number; // in milliseconds (5 minutes = 300000)
  playerScore: number;
  isActive: boolean;
  timeRemaining: number;
}

/**
 * Create a new daily tournament
 */
export function createDailyTournament(): TournamentState {
  const dateString = getTodayDateString();
  const seed = getDailySeed();
  const pieces = generateTournamentPieces(seed, 3);

  return {
    id: `tournament-${dateString}`,
    date: dateString,
    seed,
    startingPieces: pieces,
    timeLimit: 5 * 60 * 1000, // 5 minutes
    playerScore: 0,
    isActive: false,
    timeRemaining: 5 * 60 * 1000
  };
}

/**
 * Check if a tournament is still valid (same day)
 */
export function isTournamentValid(tournament: TournamentState): boolean {
  return tournament.date === getTodayDateString();
}

/**
 * Get formatted time remaining
 */
export function formatTimeRemaining(milliseconds: number): string {
  const totalSeconds = Math.ceil(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
