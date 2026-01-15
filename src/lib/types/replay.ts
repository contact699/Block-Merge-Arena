// Replay System Types
import type { GamePiece, Position } from './game';

/**
 * A single move in a replay
 */
export interface ReplayMove {
  timestamp: number; // milliseconds from start
  pieceId: string;
  shapeType: string;
  position: Position; // where the piece was placed
  rotation?: number; // future: piece rotation
  score: number; // score after this move
  linesCleared: number; // lines cleared by this move
  multiplier: number; // current multiplier
}

/**
 * Complete replay data
 */
export interface Replay {
  id: string; // unique replay ID
  code?: string; // 6-character shareable code
  userId: string;
  mode: 'endless' | 'tournament';
  tournamentDate?: string; // YYYY-MM-DD for tournament mode
  seed?: number; // tournament seed (for verification)

  // Game metadata
  finalScore: number;
  moves: ReplayMove[];
  duration: number; // milliseconds
  maxMultiplier: number;
  moveCount: number;

  // Timestamps
  startedAt: number; // Unix timestamp
  createdAt: number; // Unix timestamp

  // User info (optional, for display)
  displayName?: string;
  rank?: number; // tournament rank if applicable
}

/**
 * Compact replay format for storage/sharing
 * Uses shorter keys and data compression
 */
export interface CompactReplay {
  i: string; // id
  c?: string; // code
  u: string; // userId
  m: 'e' | 't'; // mode (endless/tournament)
  td?: string; // tournamentDate
  s?: number; // seed
  fs: number; // finalScore
  mv: CompactMove[]; // moves
  d: number; // duration
  mm: number; // maxMultiplier
  mc: number; // moveCount
  sa: number; // startedAt
  ca: number; // createdAt
  dn?: string; // displayName
  r?: number; // rank
}

/**
 * Compact move format
 */
export interface CompactMove {
  t: number; // timestamp
  p: string; // pieceId
  st: string; // shapeType
  x: number; // position.x
  y: number; // position.y
  sc: number; // score
  lc: number; // linesCleared
  mp: number; // multiplier
}

/**
 * Replay playback state
 */
export interface ReplayPlaybackState {
  currentMoveIndex: number;
  isPlaying: boolean;
  isPaused: boolean;
  playbackSpeed: number; // 1x, 2x, 4x, etc.
  currentTime: number; // milliseconds
  totalTime: number; // milliseconds
}

/**
 * Ghost overlay data for visualization
 */
export interface GhostPiece {
  position: Position;
  shapeType: string;
  color: string;
  opacity: number; // 0.0 to 1.0
  timestamp: number;
}
