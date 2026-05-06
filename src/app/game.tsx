// Game Screen — Tactile Console redesign.
import { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { track } from '@/lib/analytics/events';
import { GameBoard } from '@/components/GameBoard';
import { ScoreDisplay } from '@/components/ScoreDisplay';
import { ComboAnimation, LineClearEffect } from '@/components/ComboAnimation';
import { MergeAnimation } from '@/components/cascade/MergeAnimation';
import { ColorSelector } from '@/components/PowerUpButton';
import { TactileCell } from '@/components/design/TactileCell';
import { GlassCard } from '@/components/design/GlassCard';
import { Pill } from '@/components/design/Pill';
import { TactileButton } from '@/components/design/TactileButton';
import { PiecesTray } from '@/components/design/PiecesTray';
import { colors, fontWeight, radii, resolveBlockColor, blockColors } from '@/lib/design/tokens';
import { createEmptyBoard, canPlacePiece, placePiece, clearLines, hasValidMoves } from '@/lib/game/board';
import { generatePieces } from '@/lib/game/pieces';
import {
  generateGemsFromClearedCells,
  placeGemsOnBoard,
  mergeGems,
  getGemsFromBoard,
  calculateTotalMultiplier,
} from '@/lib/game/merge';
import {
  getStartingPowerUps,
  applyReroll,
  applyBlast,
  applyTarget,
  applyColorBomb,
  getColorsOnBoard,
  consumePowerUp,
  canUsePowerUp,
} from '@/lib/game/powerups';
import { saveScore } from '@/lib/utils/leaderboard';
import { checkAchievements } from '@/lib/utils/achievements';
import type {
  GameBoard as GameBoardType,
  GamePiece,
  Gem,
  PowerUp,
  BlockColor,
} from '@/lib/types/game';

// --- Power-up cards ---
const POWER_UP_META: Record<string, { icon: string; color: keyof typeof blockColors }> = {
  reroll: { icon: '↻', color: 'cobalt' },
  blast: { icon: '✺', color: 'ember' },
  target: { icon: '◎', color: 'forest' },
  colorBomb: { icon: '✦', color: 'plum' },
};

function PowerUpCards({
  powerUps,
  selectedIndex,
  onPress,
  disabled,
}: {
  powerUps: PowerUp[];
  selectedIndex: number | undefined;
  onPress: (p: PowerUp, i: number) => void;
  disabled: boolean;
}) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {powerUps.map((p, i) => {
        const meta = POWER_UP_META[p.type] ?? { icon: '?', color: 'ink' as const };
        const tone = blockColors[meta.color];
        const available = p.uses > 0 && !disabled;
        const active = selectedIndex === i;
        return (
          <Pressable
            key={`${p.type}-${i}`}
            onPress={() => available && onPress(p, i)}
            disabled={!available}
            style={{
              flex: 1,
              opacity: available ? 1 : 0.4,
            }}
          >
            <GlassCard
              style={{
                paddingVertical: 10,
                paddingHorizontal: 6,
                alignItems: 'center',
                borderColor: active ? colors.ember : 'rgba(22,20,15,0.08)',
                borderWidth: active ? 2 : 1,
              }}
            >
              <Text style={{ fontSize: 22, color: tone.base, lineHeight: 24, fontWeight: fontWeight.heavy }}>
                {meta.icon}
              </Text>
              <Text style={{ fontSize: 9, fontWeight: fontWeight.bold, letterSpacing: 1.4, color: colors.ink, marginTop: 4 }}>
                {p.name.toUpperCase()}
              </Text>
              <View
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  backgroundColor: colors.ink,
                  paddingHorizontal: 6,
                  paddingVertical: 1,
                  borderRadius: 999,
                }}
              >
                <Text style={{ color: colors.paper, fontSize: 9, fontWeight: fontWeight.heavy }}>
                  ×{p.uses}
                </Text>
              </View>
            </GlassCard>
          </Pressable>
        );
      })}
    </View>
  );
}

// --- Combo theater ---
function ComboTheater({
  multiplier,
  recentPoints,
  comboCount,
}: {
  multiplier: number;
  recentPoints: number;
  comboCount: number;
}) {
  return (
    <View
      style={{
        borderRadius: radii.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,90,54,0.25)',
        padding: 14,
        backgroundColor: 'rgba(255,255,255,0.6)',
        shadowColor: colors.ember,
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.4,
        shadowRadius: 22,
        elevation: 6,
      }}
    >
      <LinearGradient
        colors={['rgba(255,90,54,0.18)', 'transparent', 'rgba(230,169,60,0.18)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Pill variant="ember">{comboCount > 1 ? `${comboCount}-LINE CLEAR` : 'READY'}</Pill>
            {multiplier > 1 && (
              <Text style={{ fontSize: 10, fontWeight: fontWeight.heavy, color: colors.ember, letterSpacing: 1.4 }}>
                ×{multiplier} COMBO
              </Text>
            )}
          </View>
          <Text style={{ fontSize: 26, fontWeight: fontWeight.black, color: colors.ember, marginTop: 4, letterSpacing: -1 }}>
            {recentPoints > 0 ? `+${recentPoints.toLocaleString()}` : 'Place a piece'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {(['ember', 'cobalt', 'mustard'] as const).map((c, i) => {
            const tone = blockColors[c];
            const m = [2, 3, 5][i];
            return (
              <View
                key={c}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  shadowColor: tone.base,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.5,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <LinearGradient
                  colors={[tone.glow, tone.base, tone.deep]}
                  start={{ x: 0.3, y: 0.2 }}
                  end={{ x: 0.7, y: 1 }}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                />
                <Text style={{ color: 'white', fontSize: 11, fontWeight: fontWeight.heavy }}>{m}×</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export default function GameScreen() {
  const [board, setBoard] = useState<GameBoardType>(createEmptyBoard());
  const [pieces, setPieces] = useState<GamePiece[]>([]);
  const [selectedPieceIndex, setSelectedPieceIndex] = useState<number | undefined>(undefined);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [multiplier, setMultiplier] = useState<number>(1);
  // gems state is set during merge; the rendered board reads gems via cell state directly.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [gems, setGems] = useState<Gem[]>([]);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [recentPoints, setRecentPoints] = useState<number>(0);
  const [comboCount, setComboCount] = useState<number>(0);

  const [showCombo, setShowCombo] = useState<{ points: number; multiplier: number } | null>(null);
  const [showLineClear, setShowLineClear] = useState<number | null>(null);
  const [activeCascade, setActiveCascade] = useState<{
    id: number;
    multiplier: number;
    color: keyof typeof blockColors;
    origin: { x: number; y: number };
  } | null>(null);

  const [powerUps, setPowerUps] = useState<PowerUp[]>(getStartingPowerUps());
  const [activePowerUp, setActivePowerUp] = useState<{ type: string; index: number } | null>(null);
  const [showColorSelector, setShowColorSelector] = useState<boolean>(false);

  const runStartTimestampRef = useRef<number>(Date.now());

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
    setRecentPoints(0);
    setComboCount(0);
    runStartTimestampRef.current = Date.now();
    track('endless_started', {});
  };

  const handlePieceSelect = (_p: GamePiece, index: number): void => {
    setSelectedPieceIndex(index);
  };

  const handlePowerUpPress = (powerUp: PowerUp, index: number): void => {
    if (!canUsePowerUp(powerUp) || gameOver) return;
    if (powerUp.type === 'colorBomb') {
      setActivePowerUp({ type: powerUp.type, index });
      setShowColorSelector(true);
    } else if (powerUp.type === 'reroll') {
      if (selectedPieceIndex !== undefined) {
        const newPiece = applyReroll(pieces[selectedPieceIndex]);
        const newPieces = [...pieces];
        newPieces[selectedPieceIndex] = newPiece;
        setPieces(newPieces);
        const next = [...powerUps];
        next[index] = consumePowerUp(powerUp);
        setPowerUps(next);
      }
    } else {
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
      setRecentPoints(points);
      setShowCombo({ points, multiplier: 1 });
    }
    const next = [...powerUps];
    next[activePowerUp.index] = consumePowerUp(powerUps[activePowerUp.index]);
    setPowerUps(next);
    setShowColorSelector(false);
    setActivePowerUp(null);
  };

  const handleCellPress = (row: number, col: number): void => {
    if (activePowerUp && activePowerUp.type === 'blast') {
      const { newBoard, clearedCells } = applyBlast(board, row, col);
      setBoard(newBoard);
      if (clearedCells.length > 0) {
        const points = clearedCells.length * 10;
        setScore(score + points);
        setRecentPoints(points);
        setShowCombo({ points, multiplier: 1 });
      }
      const next = [...powerUps];
      next[activePowerUp.index] = consumePowerUp(powerUps[activePowerUp.index]);
      setPowerUps(next);
      setActivePowerUp(null);
      return;
    }

    if (selectedPieceIndex === undefined || gameOver) return;
    const selectedPiece = pieces[selectedPieceIndex];

    if (activePowerUp && activePowerUp.type === 'target') {
      const best = applyTarget(board, selectedPiece);
      if (best) {
        row = best.row;
        col = best.col;
      }
      const next = [...powerUps];
      next[activePowerUp.index] = consumePowerUp(powerUps[activePowerUp.index]);
      setPowerUps(next);
      setActivePowerUp(null);
    }

    if (!canPlacePiece(board, selectedPiece, row, col)) return;

    let newBoard = placePiece(board, selectedPiece, row, col);
    const { newBoard: clearedBoard, clearedCells } = clearLines(newBoard);

    let newMultiplier = multiplier;
    if (clearedCells.length > 0) {
      newBoard = clearedBoard;
      const linesCleared = clearedCells.length / 8;
      setShowLineClear(Math.ceil(linesCleared));
      setComboCount(Math.ceil(linesCleared));

      const newDroppedGems = generateGemsFromClearedCells(clearedCells);
      newBoard = placeGemsOnBoard(newBoard, newDroppedGems);
      const allGems = getGemsFromBoard(newBoard);
      const mergedGems = mergeGems(allGems);

      const largeGems = mergedGems.filter((g) => g.size !== 'small');
      if (largeGems.length > 0) {
        const sizeOrder = { small: 0, medium: 1, large: 2, mega: 3 };
        const bestGem = largeGems.reduce((best, current) =>
          sizeOrder[current.size] > sizeOrder[best.size] ? current : best,
        largeGems[0]);
        setActiveCascade({
          id: Date.now(),
          multiplier: bestGem.multiplier,
          color: resolveBlockColor(bestGem.color),
          origin: { x: 0, y: 200 },
        });
      }

      newMultiplier = calculateTotalMultiplier(mergedGems);
      const points = clearedCells.length * 10 * multiplier;
      setScore(score + points);
      setRecentPoints(points);
      setShowCombo({ points, multiplier });
      setMultiplier(newMultiplier);
      setGems(mergedGems);
      newBoard = placeGemsOnBoard(newBoard, mergedGems);
    } else {
      setComboCount(0);
    }

    setBoard(newBoard);

    const newPieces = pieces.filter((_, i) => i !== selectedPieceIndex);
    if (newPieces.length === 0) newPieces.push(...generatePieces(3));
    setPieces(newPieces);
    setSelectedPieceIndex(undefined);

    if (!hasValidMoves(newBoard, newPieces)) {
      setGameOver(true);
      if (score > highScore) setHighScore(score);
      saveScore({
        id: `game-${Date.now()}`,
        score,
        mode: 'endless',
        date: new Date().toISOString(),
        maxMultiplier: multiplier,
      });
      void checkAchievements({
        runMode: 'endless',
        score,
        maxMultiplier: multiplier,
        durationMs: Date.now() - runStartTimestampRef.current,
        didMerge: multiplier > 1,
        didDailyComplete: false,
        dailyStreakDays: 0,
        dailiesPlayedTotal: 0,
      }).then((granted) => {
        if (granted.length > 0) console.log('[achievements] granted', granted);
      });
    }
  };

  return (
    <SafeAreaView testID="game-screen" style={{ flex: 1, backgroundColor: colors.paper }}>
      {/* Ambient blobs */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -80,
          right: -60,
          width: 240,
          height: 240,
          borderRadius: 120,
          backgroundColor: colors.ember,
          opacity: 0.14,
        }}
      />

      {/* Animations overlay */}
      {showCombo && (
        <ComboAnimation
          points={showCombo.points}
          multiplier={showCombo.multiplier}
          onComplete={() => setShowCombo(null)}
        />
      )}
      {showLineClear && (
        <LineClearEffect linesCleared={showLineClear} onComplete={() => setShowLineClear(null)} />
      )}
      {activeCascade && (
        <MergeAnimation
          key={activeCascade.id}
          multiplier={activeCascade.multiplier}
          color={activeCascade.color}
          origin={activeCascade.origin}
          onComplete={() => setActiveCascade(null)}
        />
      )}

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Top HUD */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingTop: 4 }}>
          <Pressable
            onPress={startNewGame}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: 'rgba(255,255,255,0.7)',
              borderWidth: 1,
              borderColor: 'rgba(22,20,15,0.1)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: fontWeight.heavy, color: colors.ink }}>⏸</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <ScoreDisplay score={score} highScore={highScore} multiplier={multiplier} />
          </View>
        </View>

        {/* Combo theater */}
        <View style={{ paddingHorizontal: 14, paddingTop: 4 }}>
          <ComboTheater multiplier={multiplier} recentPoints={recentPoints} comboCount={comboCount} />
        </View>

        {/* Board */}
        <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 8, paddingHorizontal: 16 }}>
          <View style={{ position: 'relative' }}>
            <GameBoard board={board} onCellPress={handleCellPress} />
            {multiplier > 1 && (
              <View
                style={{
                  position: 'absolute',
                  top: -12,
                  right: -12,
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  backgroundColor: colors.ember,
                  borderRadius: 999,
                  borderWidth: 1.5,
                  borderColor: 'white',
                  shadowColor: colors.ember,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.6,
                  shadowRadius: 16,
                  elevation: 8,
                }}
              >
                <Text style={{ color: 'white', fontWeight: fontWeight.black, fontSize: 14 }}>×{multiplier}</Text>
              </View>
            )}
          </View>
        </View>

        {gameOver && (
          <View style={{ paddingHorizontal: 14 }}>
            <View
              testID="game-over-banner"
              style={{
                backgroundColor: colors.ink,
                borderRadius: radii.lg,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <Text style={{ color: colors.ember, fontSize: 18, fontWeight: fontWeight.black, letterSpacing: -0.5 }}>
                Game Over
              </Text>
              <Text style={{ color: 'rgba(243,239,231,0.7)', fontSize: 13, marginTop: 4 }}>
                No more valid moves. Final score {score.toLocaleString()}.
              </Text>
            </View>
            <TactileButton testID="new-game-button" onPress={startNewGame} variant="primary">
              New game
            </TactileButton>
          </View>
        )}

        {!gameOver && (
          <>
            {/* Pieces tray */}
            <View style={{ paddingHorizontal: 14, marginTop: 6 }}>
              {pieces.length > 0 && (
                <PiecesTray pieces={pieces} selectedIndex={selectedPieceIndex} onSelect={handlePieceSelect} />
              )}
            </View>

            {/* Hint */}
            <Text
              style={{
                color: selectedPieceIndex !== undefined ? colors.ember : colors.inkSoft,
                textAlign: 'center',
                fontSize: 12,
                fontWeight: fontWeight.semibold,
                marginTop: 8,
                paddingHorizontal: 14,
              }}
            >
              {selectedPieceIndex !== undefined
                ? 'Tap the board to place your piece'
                : 'Select a piece, then tap the board'}
            </Text>

            {/* Power-ups */}
            <View style={{ paddingHorizontal: 14, marginTop: 12 }}>
              <PowerUpCards
                powerUps={powerUps}
                selectedIndex={activePowerUp?.index}
                onPress={handlePowerUpPress}
                disabled={gameOver}
              />
            </View>
          </>
        )}

        {showColorSelector && (
          <ColorSelector
            colors={getColorsOnBoard(board)}
            onColorSelect={(color: string) => handleColorSelect(color as BlockColor)}
            onCancel={() => {
              setShowColorSelector(false);
              setActivePowerUp(null);
            }}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
