// Replay Recorder - Records gameplay moves for replay
import type { Replay, ReplayMove } from '@/lib/types/replay';
import type { GamePiece, Position } from '@/lib/types/game';
import { saveReplay, generateReplayCode } from '@/lib/utils/replay';

export class ReplayRecorder {
  private recording: boolean = false;
  private moves: ReplayMove[] = [];
  private startTime: number = 0;
  private currentScore: number = 0;
  private currentMultiplier: number = 1;
  private maxMultiplier: number = 1;

  // Replay metadata
  private replayId: string;
  private userId: string;
  private mode: 'endless' | 'tournament';
  private tournamentDate?: string;
  private seed?: number;

  constructor(
    userId: string,
    mode: 'endless' | 'tournament',
    tournamentDate?: string,
    seed?: number
  ) {
    this.replayId = `replay_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    this.userId = userId;
    this.mode = mode;
    this.tournamentDate = tournamentDate;
    this.seed = seed;
  }

  /**
   * Start recording
   */
  start(): void {
    this.recording = true;
    this.startTime = Date.now();
    this.moves = [];
    this.currentScore = 0;
    this.currentMultiplier = 1;
    this.maxMultiplier = 1;
    console.log('🎥 Replay recording started:', this.replayId);
  }

  /**
   * Record a move
   */
  recordMove(
    piece: GamePiece,
    position: Position,
    score: number,
    linesCleared: number,
    multiplier: number
  ): void {
    if (!this.recording) return;

    const timestamp = Date.now() - this.startTime;

    const move: ReplayMove = {
      timestamp,
      pieceId: piece.id,
      shapeType: piece.shapeType,
      position,
      score,
      linesCleared,
      multiplier,
    };

    this.moves.push(move);
    this.currentScore = score;
    this.currentMultiplier = multiplier;
    this.maxMultiplier = Math.max(this.maxMultiplier, multiplier);
  }

  /**
   * Stop recording and save replay
   */
  async stop(finalScore?: number, displayName?: string, rank?: number): Promise<Replay | null> {
    if (!this.recording) return null;

    this.recording = false;
    const duration = Date.now() - this.startTime;

    const replay: Replay = {
      id: this.replayId,
      code: generateReplayCode(),
      userId: this.userId,
      mode: this.mode,
      tournamentDate: this.tournamentDate,
      seed: this.seed,
      finalScore: finalScore || this.currentScore,
      moves: this.moves,
      duration,
      maxMultiplier: this.maxMultiplier,
      moveCount: this.moves.length,
      startedAt: this.startTime,
      createdAt: Date.now(),
      displayName,
      rank,
    };

    // Save to local storage
    await saveReplay(replay);

    console.log('🎥 Replay recording stopped:', replay.code);
    console.log(`   Moves: ${replay.moveCount}, Duration: ${(duration / 1000).toFixed(1)}s`);

    return replay;
  }

  /**
   * Cancel recording without saving
   */
  cancel(): void {
    this.recording = false;
    this.moves = [];
    console.log('🎥 Replay recording cancelled');
  }

  /**
   * Check if currently recording
   */
  isRecording(): boolean {
    return this.recording;
  }

  /**
   * Get current move count
   */
  getMoveCount(): number {
    return this.moves.length;
  }

  /**
   * Get recording duration
   */
  getDuration(): number {
    if (!this.recording) return 0;
    return Date.now() - this.startTime;
  }

  /**
   * Get replay ID
   */
  getReplayId(): string {
    return this.replayId;
  }
}
