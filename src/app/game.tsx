import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GameBoard } from '@/components/GameBoard';
import { PiecesSelector } from '@/components/BlockPiece';
import { ScoreDisplay } from '@/components/ScoreDisplay';
import { GemCounter } from '@/components/GemDisplay';
import { ComboAnimation, LineClearEffect, GemMergeEffect } from '@/components/ComboAnimation';
import { PowerUpBar, ColorSelector } from '@/components/PowerUpButton';
import { createEmptyBoard, canPlacePiece, placePiece, clearLines, hasValidMoves } from '@/lib/game/board';
import { generatePieces } from '@/lib/game/pieces';
import {
  generateGemsFromClearedCells,
  placeGemsOnBoard,
  mergeGems,
  getGemsFromBoard,
  calculateTotalMultiplier
} from '@/lib/game/merge';
import {
  getStartingPowerUps,
  applyReroll,
  applyBlast,
  applyTarget,
  applyColorBomb,
  getColorsOnBoard,
  usePowerUp,
  canUsePowerUp
} from '@/lib/game/powerups';
import { saveScore } from '@/lib/utils/leaderboard';
import type { GameBoard as GameBoardType, GamePiece, Gem, PowerUp, BlockColor } from '@/lib/types/game';

export default function GameScreen() {
  const [board, setBoard] = useState<GameBoardType>(createEmptyBoard());
  const [pieces, setPieces] = useState<GamePiece[]>([]);
  const [selectedPieceIndex, setSelectedPieceIndex] = useState<number | undefined>(undefined);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [multiplier, setMultiplier] = useState<number>(1);
  const [gems, setGems] = useState<Gem[]>([]);
  const [gameOver, setGameOver] = useState<boolean>(false);

  // Animation states
  const [showCombo, setShowCombo] = useState<{ points: number; multiplier: number } | null>(null);
  const [showLineClear, setShowLineClear] = useState<number | null>(null);
  const [showGemMerge, setShowGemMerge] = useState<{ count: number; size: 'small' | 'medium' | 'large' | 'mega'; color: string } | null>(null);

  // Power-up states
  const [powerUps, setPowerUps] = useState<PowerUp[]>(getStartingPowerUps());
  const [activePowerUp, setActivePowerUp] = useState<{ type: string; index: number } | null>(null);
  const [showColorSelector, setShowColorSelector] = useState<boolean>(false);

  // Initialize game
  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = (): void => {
    setBoard(createEmptyBoard());
    setPieces(generatePieces(3));
    setScore(0);
    setMultiplier(1);
    setGems([]);
    setGameOver(false);
    setSelectedPieceIndex(undefined);
    setPowerUps(getStartingPowerUps());
    setActivePowerUp(null);
  };

  const handlePieceSelect = (piece: GamePiece, index: number): void => {
    setSelectedPieceIndex(index);
  };

  const handlePowerUpPress = (powerUp: PowerUp, index: number): void => {
    if (!canUsePowerUp(powerUp) || gameOver) return;

    if (powerUp.type === 'colorBomb') {
      // Color Bomb requires color selection
      setActivePowerUp({ type: powerUp.type, index });
      setShowColorSelector(true);
    } else if (powerUp.type === 'reroll') {
      // Reroll requires piece selection
      if (selectedPieceIndex !== undefined) {
        const newPiece = applyReroll(pieces[selectedPieceIndex]);
        const newPieces = [...pieces];
        newPieces[selectedPieceIndex] = newPiece;
        setPieces(newPieces);

        // Use power-up
        const newPowerUps = [...powerUps];
        newPowerUps[index] = usePowerUp(powerUp);
        setPowerUps(newPowerUps);
      }
    } else {
      // Other power-ups (Blast, Target) require board interaction
      setActivePowerUp({ type: powerUp.type, index });
    }
  };

  const handleColorSelect = (color: BlockColor): void => {
    if (!activePowerUp) return;

    const { newBoard, clearedCells } = applyColorBomb(board, color);
    setBoard(newBoard);

    if (clearedCells.length > 0) {
      const points = clearedCells.length * 10;
      setScore(score + points);
      setShowCombo({ points, multiplier: 1 });
    }

    // Use power-up
    const newPowerUps = [...powerUps];
    newPowerUps[activePowerUp.index] = usePowerUp(powerUps[activePowerUp.index]);
    setPowerUps(newPowerUps);

    setShowColorSelector(false);
    setActivePowerUp(null);
  };

  const handleCellPress = (row: number, col: number): void => {
    // Handle power-up activation on board
    if (activePowerUp && activePowerUp.type === 'blast') {
      const { newBoard, clearedCells } = applyBlast(board, row, col);
      setBoard(newBoard);

      if (clearedCells.length > 0) {
        const points = clearedCells.length * 10;
        setScore(score + points);
        setShowCombo({ points, multiplier: 1 });
      }

      // Use power-up
      const newPowerUps = [...powerUps];
      newPowerUps[activePowerUp.index] = usePowerUp(powerUps[activePowerUp.index]);
      setPowerUps(newPowerUps);

      setActivePowerUp(null);
      return;
    }

    if (selectedPieceIndex === undefined || gameOver) return;

    const selectedPiece = pieces[selectedPieceIndex];

    // Target power-up suggests best placement
    if (activePowerUp && activePowerUp.type === 'target') {
      const bestPlacement = applyTarget(board, selectedPiece);
      if (bestPlacement) {
        row = bestPlacement.row;
        col = bestPlacement.col;
      }

      // Use power-up
      const newPowerUps = [...powerUps];
      newPowerUps[activePowerUp.index] = usePowerUp(powerUps[activePowerUp.index]);
      setPowerUps(newPowerUps);

      setActivePowerUp(null);
    }

    if (!canPlacePiece(board, selectedPiece, row, col)) {
      return;
    }

    // Place the piece
    let newBoard = placePiece(board, selectedPiece, row, col);

    // Clear any complete lines
    const { newBoard: clearedBoard, clearedCells } = clearLines(newBoard);

    let newGems = gems;
    let newMultiplier = multiplier;

    if (clearedCells.length > 0) {
      newBoard = clearedBoard;

      // Show line clear animation
      const linesCleared = clearedCells.length / 8; // Approximate number of lines
      setShowLineClear(Math.ceil(linesCleared));

      // Generate gems from cleared cells
      const newDroppedGems = generateGemsFromClearedCells(clearedCells);

      // Place gems on board
      newBoard = placeGemsOnBoard(newBoard, newDroppedGems);

      // Get all gems from board (including existing ones)
      const allGems = getGemsFromBoard(newBoard);

      // Merge adjacent same-color gems
      const mergedGems = mergeGems(allGems);
      newGems = mergedGems;

      // Check for large merged gems and show animation
      const largeGems = mergedGems.filter((g: Gem) => g.size !== 'small');
      if (largeGems.length > 0) {
        const bestGem = largeGems.reduce((best: Gem, current: Gem) => {
          const sizeOrder = { small: 0, medium: 1, large: 2, mega: 3 };
          return sizeOrder[current.size] > sizeOrder[best.size] ? current : best;
        }, largeGems[0]);

        setShowGemMerge({
          count: bestGem.multiplier,
          size: bestGem.size,
          color: bestGem.color
        });
      }

      // Calculate multiplier from merged gems
      newMultiplier = calculateTotalMultiplier(mergedGems);

      // Calculate score with current multiplier (before applying new multiplier)
      const points = clearedCells.length * 10 * multiplier;
      setScore(score + points);

      // Show combo animation
      setShowCombo({ points, multiplier });

      // Set new multiplier for next move
      setMultiplier(newMultiplier);
      setGems(mergedGems);

      // Update board with merged gems
      newBoard = placeGemsOnBoard(newBoard, mergedGems);
    }

    setBoard(newBoard);

    // Remove used piece and generate new ones if all pieces are used
    const newPieces = pieces.filter((_: GamePiece, i: number) => i !== selectedPieceIndex);
    if (newPieces.length === 0) {
      newPieces.push(...generatePieces(3));
    }
    setPieces(newPieces);
    setSelectedPieceIndex(undefined);

    // Check for game over
    if (!hasValidMoves(newBoard, newPieces)) {
      setGameOver(true);
      if (score > highScore) {
        setHighScore(score);
      }

      // Save score to leaderboard
      saveScore({
        id: `game-${Date.now()}`,
        score,
        mode: 'endless',
        date: new Date().toISOString(),
        maxMultiplier: multiplier
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Animations Overlay */}
      {showCombo && (
        <ComboAnimation
          points={showCombo.points}
          multiplier={showCombo.multiplier}
          onComplete={() => setShowCombo(null)}
        />
      )}
      {showLineClear && (
        <LineClearEffect
          linesCleared={showLineClear}
          onComplete={() => setShowLineClear(null)}
        />
      )}
      {showGemMerge && (
        <GemMergeEffect
          gemCount={showGemMerge.count}
          gemSize={showGemMerge.size}
          color={showGemMerge.color}
          onComplete={() => setShowGemMerge(null)}
        />
      )}

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Score Display */}
        <ScoreDisplay score={score} highScore={highScore} multiplier={multiplier} />

        {/* Game Status */}
        <View className="px-6 mb-4">
          <Text className="text-center text-2xl font-bold text-purple-400">
            Block Merge Arena
          </Text>
          {gameOver && (
            <View className="mt-4 bg-red-500/20 border border-red-500 rounded-xl p-4">
              <Text className="text-red-400 text-center text-lg font-bold">
                Game Over!
              </Text>
              <Text className="text-gray-300 text-center mt-2">
                No more valid moves
              </Text>
            </View>
          )}
        </View>

        {/* Gem Counter */}
        {gems.length > 0 && (
          <View className="px-6 mb-4">
            <GemCounter gems={gems} />
          </View>
        )}

        {/* Game Board */}
        <View className="items-center mb-6">
          <GameBoard
            board={board}
            onCellPress={handleCellPress}
          />
        </View>

        {/* Instructions */}
        {selectedPieceIndex === undefined && !gameOver && (
          <Text className="text-gray-400 text-center text-sm px-6 mb-4">
            Select a piece below, then tap the board to place it
          </Text>
        )}

        {selectedPieceIndex !== undefined && !gameOver && (
          <Text className="text-purple-400 text-center text-sm px-6 mb-4 font-semibold">
            Tap the board to place your piece
          </Text>
        )}

        {/* Pieces Selector */}
        {pieces.length > 0 && (
          <View className="px-6 mb-6">
            <PiecesSelector
              pieces={pieces}
              onPieceSelect={handlePieceSelect}
              selectedIndex={selectedPieceIndex}
            />
          </View>
        )}

        {/* Power-ups Bar */}
        {!gameOver && (
          <View className="px-6 mb-6">
            <PowerUpBar
              powerUps={powerUps}
              onPowerUpPress={handlePowerUpPress}
              selectedIndex={activePowerUp?.index}
              disabled={gameOver}
            />
          </View>
        )}

        {/* Color Selector Overlay for Color Bomb */}
        {showColorSelector && (
          <ColorSelector
            colors={getColorsOnBoard(board)}
            onColorSelect={handleColorSelect}
            onCancel={() => {
              setShowColorSelector(false);
              setActivePowerUp(null);
            }}
          />
        )}

        {/* New Game Button */}
        {gameOver && (
          <View className="px-6">
            <Pressable
              onPress={startNewGame}
              className="bg-purple-500 rounded-xl py-4 px-8"
            >
              <Text className="text-white text-center text-lg font-bold">
                New Game
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
