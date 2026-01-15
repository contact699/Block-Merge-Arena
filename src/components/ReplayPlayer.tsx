// Replay Player Component - Plays back recorded replays with ghost visualization
import { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable } from 'react-native';
import type { Replay, ReplayMove, ReplayPlaybackState } from '@/lib/types/replay';
import { GameBoard } from './GameBoard';
import { ScoreDisplay } from './ScoreDisplay';
import { createEmptyBoard, placePiece } from '@/lib/game/board';
import { BLOCK_SHAPES } from '@/lib/game/pieces';
import type { GameBoard as GameBoardType, GamePiece } from '@/lib/types/game';

interface ReplayPlayerProps {
  replay: Replay;
  onComplete?: () => void;
  onClose?: () => void;
  autoPlay?: boolean;
}

export function ReplayPlayer({
  replay,
  onComplete,
  onClose,
  autoPlay = true,
}: ReplayPlayerProps) {
  const [board, setBoard] = useState<GameBoardType>(createEmptyBoard());
  const [playbackState, setPlaybackState] = useState<ReplayPlaybackState>({
    currentMoveIndex: 0,
    isPlaying: autoPlay,
    isPaused: !autoPlay,
    playbackSpeed: 1,
    currentTime: 0,
    totalTime: replay.duration,
  });
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Playback loop
  useEffect(() => {
    if (playbackState.isPlaying && !playbackState.isPaused) {
      intervalRef.current = setInterval(() => {
        playNextMove();
      }, 1000 / playbackState.playbackSpeed); // Adjust speed

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [playbackState.isPlaying, playbackState.isPaused, playbackState.currentMoveIndex, playbackState.playbackSpeed]);

  const playNextMove = (): void => {
    const { currentMoveIndex } = playbackState;

    if (currentMoveIndex >= replay.moves.length) {
      // Replay finished
      setPlaybackState((prev: ReplayPlaybackState) => ({
        ...prev,
        isPlaying: false,
        isPaused: true,
      }));
      onComplete?.();
      return;
    }

    const move: ReplayMove = replay.moves[currentMoveIndex];

    // Create piece from move data
    const shape = BLOCK_SHAPES[move.shapeType as keyof typeof BLOCK_SHAPES];
    if (!shape) {
      console.error('Unknown shape type:', move.shapeType);
      return;
    }

    const piece: GamePiece = {
      id: move.pieceId,
      shape,
      shapeType: move.shapeType as any,
      color: 'purple', // Ghost color
      width: 0,
      height: 0,
    };

    // Place piece on board
    const newBoard = placePiece(board, piece, move.position);
    setBoard(newBoard);
    setCurrentScore(move.score);
    setCurrentMultiplier(move.multiplier);

    // Update playback state
    setPlaybackState((prev: ReplayPlaybackState) => ({
      ...prev,
      currentMoveIndex: currentMoveIndex + 1,
      currentTime: move.timestamp,
    }));
  };

  const handlePlayPause = (): void => {
    setPlaybackState((prev: ReplayPlaybackState) => ({
      ...prev,
      isPlaying: !prev.isPaused,
      isPaused: !prev.isPaused,
    }));
  };

  const handleRestart = (): void => {
    setBoard(createEmptyBoard());
    setCurrentScore(0);
    setCurrentMultiplier(1);
    setPlaybackState({
      currentMoveIndex: 0,
      isPlaying: true,
      isPaused: false,
      playbackSpeed: playbackState.playbackSpeed,
      currentTime: 0,
      totalTime: replay.duration,
    });
  };

  const handleSpeedChange = (): void => {
    const speeds = [1, 2, 4, 8];
    const currentSpeedIndex = speeds.indexOf(playbackState.playbackSpeed);
    const nextSpeed = speeds[(currentSpeedIndex + 1) % speeds.length];

    setPlaybackState((prev: ReplayPlaybackState) => ({
      ...prev,
      playbackSpeed: nextSpeed,
    }));
  };

  const progress = replay.moves.length > 0
    ? (playbackState.currentMoveIndex / replay.moves.length) * 100
    : 0;

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <View className="flex-1 bg-black">
      {/* Header */}
      <View className="px-6 pt-4 pb-2">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white text-2xl font-bold">👻 Replay</Text>
            <Text className="text-gray-400 text-sm">
              Code: {replay.code || 'N/A'} • {replay.mode === 'tournament' ? '🏆 Tournament' : '🎮 Endless'}
            </Text>
          </View>
          {onClose && (
            <Pressable onPress={onClose}>
              <Text className="text-purple-400 text-base font-semibold">✕ Close</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Score Display */}
      <View className="mt-2">
        <ScoreDisplay score={currentScore} multiplier={currentMultiplier} />
      </View>

      {/* Game Board */}
      <View className="items-center mt-6 mb-6">
        <GameBoard board={board} />
      </View>

      {/* Progress Bar */}
      <View className="px-6 mb-4">
        <View className="bg-gray-800 rounded-full h-2 overflow-hidden">
          <View
            className="bg-purple-500 h-full rounded-full"
            style={{ width: `${progress}%` }}
          />
        </View>
        <View className="flex-row justify-between mt-2">
          <Text className="text-gray-500 text-xs">
            {formatTime(playbackState.currentTime)}
          </Text>
          <Text className="text-gray-500 text-xs">
            Move {playbackState.currentMoveIndex} / {replay.moves.length}
          </Text>
          <Text className="text-gray-500 text-xs">
            {formatTime(replay.duration)}
          </Text>
        </View>
      </View>

      {/* Playback Controls */}
      <View className="px-6 pb-6">
        <View className="flex-row gap-3">
          {/* Restart Button */}
          <Pressable
            onPress={handleRestart}
            className="bg-gray-800 rounded-xl py-3 px-4 flex-1"
          >
            <Text className="text-white text-center font-semibold">🔄 Restart</Text>
          </Pressable>

          {/* Play/Pause Button */}
          <Pressable
            onPress={handlePlayPause}
            className="bg-purple-500 rounded-xl py-3 px-6 flex-1"
          >
            <Text className="text-white text-center font-bold text-lg">
              {playbackState.isPaused ? '▶️ Play' : '⏸ Pause'}
            </Text>
          </Pressable>

          {/* Speed Button */}
          <Pressable
            onPress={handleSpeedChange}
            className="bg-gray-800 rounded-xl py-3 px-4 flex-1"
          >
            <Text className="text-white text-center font-semibold">
              {playbackState.playbackSpeed}x
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Replay Info */}
      <View className="px-6 pb-6">
        <View className="bg-gray-900/50 rounded-xl p-4">
          <Text className="text-gray-400 text-xs uppercase font-semibold mb-2">
            Replay Stats
          </Text>
          <View className="flex-row flex-wrap gap-4">
            <View>
              <Text className="text-white text-lg font-bold">
                {replay.finalScore.toLocaleString()}
              </Text>
              <Text className="text-gray-500 text-xs">Final Score</Text>
            </View>
            <View>
              <Text className="text-white text-lg font-bold">{replay.moveCount}</Text>
              <Text className="text-gray-500 text-xs">Moves</Text>
            </View>
            <View>
              <Text className="text-white text-lg font-bold">{replay.maxMultiplier}x</Text>
              <Text className="text-gray-500 text-xs">Max Multiplier</Text>
            </View>
            <View>
              <Text className="text-white text-lg font-bold">
                {Math.round(replay.finalScore / replay.moveCount)}
              </Text>
              <Text className="text-gray-500 text-xs">Pts/Move</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
