// Replay Utilities - Compression, Code Generation, Storage
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Replay, CompactReplay, CompactMove, ReplayMove } from '@/lib/types/replay';

const REPLAYS_KEY = '@block_merge_arena:replays';
const MAX_REPLAYS = 20; // Keep last 20 replays locally

/**
 * Generate a 6-character shareable code
 * Format: ABC123 (3 uppercase letters + 3 numbers)
 */
export function generateReplayCode(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';

  let code = '';
  // 3 random letters
  for (let i = 0; i < 3; i++) {
    code += letters[Math.floor(Math.random() * letters.length)];
  }
  // 3 random numbers
  for (let i = 0; i < 3; i++) {
    code += numbers[Math.floor(Math.random() * numbers.length)];
  }

  return code;
}

/**
 * Compress replay data to compact format
 */
export function compressReplay(replay: Replay): CompactReplay {
  return {
    i: replay.id,
    c: replay.code,
    u: replay.userId,
    m: replay.mode === 'endless' ? 'e' : 't',
    td: replay.tournamentDate,
    s: replay.seed,
    fs: replay.finalScore,
    mv: replay.moves.map((move: ReplayMove): CompactMove => ({
      t: move.timestamp,
      p: move.pieceId,
      st: move.shapeType,
      x: move.position.x,
      y: move.position.y,
      sc: move.score,
      lc: move.linesCleared,
      mp: move.multiplier,
    })),
    d: replay.duration,
    mm: replay.maxMultiplier,
    mc: replay.moveCount,
    sa: replay.startedAt,
    ca: replay.createdAt,
    dn: replay.displayName,
    r: replay.rank,
  };
}

/**
 * Decompress replay data from compact format
 */
export function decompressReplay(compact: CompactReplay): Replay {
  return {
    id: compact.i,
    code: compact.c,
    userId: compact.u,
    mode: compact.m === 'e' ? 'endless' : 'tournament',
    tournamentDate: compact.td,
    seed: compact.s,
    finalScore: compact.fs,
    moves: compact.mv.map((move: CompactMove): ReplayMove => ({
      timestamp: move.t,
      pieceId: move.p,
      shapeType: move.st,
      position: { x: move.x, y: move.y },
      score: move.sc,
      linesCleared: move.lc,
      multiplier: move.mp,
    })),
    duration: compact.d,
    maxMultiplier: compact.mm,
    moveCount: compact.mc,
    startedAt: compact.sa,
    createdAt: compact.ca,
    displayName: compact.dn,
    rank: compact.r,
  };
}

/**
 * Save replay to local storage
 */
export async function saveReplay(replay: Replay): Promise<void> {
  try {
    const replays = await getLocalReplays();

    // Add code if not present
    if (!replay.code) {
      replay.code = generateReplayCode();
    }

    replays.unshift(replay); // Add to beginning

    // Keep only MAX_REPLAYS most recent
    const trimmedReplays = replays.slice(0, MAX_REPLAYS);

    // Compress before saving
    const compactReplays = trimmedReplays.map(compressReplay);

    await AsyncStorage.setItem(REPLAYS_KEY, JSON.stringify(compactReplays));
    console.log('✅ Replay saved:', replay.code);
  } catch (error) {
    console.error('❌ Error saving replay:', error);
  }
}

/**
 * Get all local replays
 */
export async function getLocalReplays(): Promise<Replay[]> {
  try {
    const data = await AsyncStorage.getItem(REPLAYS_KEY);
    if (data) {
      const compactReplays: CompactReplay[] = JSON.parse(data);
      return compactReplays.map(decompressReplay);
    }
    return [];
  } catch (error) {
    console.error('❌ Error loading replays:', error);
    return [];
  }
}

/**
 * Get replay by code (local only for now)
 */
export async function getReplayByCode(code: string): Promise<Replay | null> {
  try {
    const replays = await getLocalReplays();
    const replay = replays.find((r) => r.code === code.toUpperCase());
    return replay || null;
  } catch (error) {
    console.error('❌ Error finding replay:', error);
    return null;
  }
}

/**
 * Get replay by ID
 */
export async function getReplayById(id: string): Promise<Replay | null> {
  try {
    const replays = await getLocalReplays();
    const replay = replays.find((r) => r.id === id);
    return replay || null;
  } catch (error) {
    console.error('❌ Error finding replay:', error);
    return null;
  }
}

/**
 * Get replays by mode
 */
export async function getReplaysByMode(mode: 'endless' | 'tournament'): Promise<Replay[]> {
  try {
    const replays = await getLocalReplays();
    return replays.filter((r) => r.mode === mode);
  } catch (error) {
    console.error('❌ Error filtering replays:', error);
    return [];
  }
}

/**
 * Delete replay by ID
 */
export async function deleteReplay(id: string): Promise<void> {
  try {
    const replays = await getLocalReplays();
    const filtered = replays.filter((r) => r.id !== id);

    const compactReplays = filtered.map(compressReplay);
    await AsyncStorage.setItem(REPLAYS_KEY, JSON.stringify(compactReplays));
    console.log('✅ Replay deleted:', id);
  } catch (error) {
    console.error('❌ Error deleting replay:', error);
  }
}

/**
 * Clear all replays
 */
export async function clearAllReplays(): Promise<void> {
  try {
    await AsyncStorage.removeItem(REPLAYS_KEY);
    console.log('✅ All replays cleared');
  } catch (error) {
    console.error('❌ Error clearing replays:', error);
  }
}

/**
 * Format replay duration for display
 */
export function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }

  return `${minutes}m ${seconds}s`;
}

/**
 * Calculate replay statistics
 */
export function calculateReplayStats(replay: Replay): {
  averageTimePerMove: number;
  movesPerMinute: number;
  pointsPerMove: number;
  efficiency: number; // score / moves
} {
  const averageTimePerMove = replay.moveCount > 0 ? replay.duration / replay.moveCount : 0;
  const durationMinutes = replay.duration / 60000;
  const movesPerMinute = durationMinutes > 0 ? replay.moveCount / durationMinutes : 0;
  const pointsPerMove = replay.moveCount > 0 ? replay.finalScore / replay.moveCount : 0;
  const efficiency = replay.moveCount > 0 ? replay.finalScore / replay.moveCount : 0;

  return {
    averageTimePerMove,
    movesPerMinute,
    pointsPerMove,
    efficiency,
  };
}
