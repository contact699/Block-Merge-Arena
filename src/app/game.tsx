// Game Screen — Tactile Console redesign. Engine-driven endless mode.
import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { track } from '@/lib/analytics/events';
import { ScoreDisplay } from '@/components/ScoreDisplay';
import { ComboAnimation, LineClearEffect } from '@/components/ComboAnimation';
import { ColorSelector } from '@/components/PowerUpButton';
import { GlassCard } from '@/components/design/GlassCard';
import { Pill } from '@/components/design/Pill';
import { TactileButton } from '@/components/design/TactileButton';
import { colors, fontWeight, radii, blockColors } from '@/lib/design/tokens';
import { useThemePalette } from '@/lib/themes/provider';
import { createRun, applyMove, type EngineState, type EngineEvent } from '@/lib/game/engine';
import { mathRandomSource } from '@/lib/game/rng';
import { buildTimeline, playTimeline, isReduceMotion } from '@/components/board/AnimationDirector';
import { GameSurface } from '@/components/board/GameSurface';
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
import { showAchievementsToasts } from '@/components/feedback/AchievementToast';
import type { PowerUp, BlockColor } from '@/lib/types/game';

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
  const palette = useThemePalette();

  // Engine state — single source of truth for board, pieces, score, multiplier, gameOver.
  const [engine, setEngine] = useState<EngineState>(() => createRun(mathRandomSource));
  const [selectedPieceIndex, setSelectedPieceIndex] = useState<number | undefined>(undefined);

  // Power-up state — lives outside the engine (power-ups bypass the merge/clear pipeline).
  const [powerUps, setPowerUps] = useState<PowerUp[]>(getStartingPowerUps());
  const [activePowerUp, setActivePowerUp] = useState<{ type: string; index: number } | null>(null);
  const [showColorSelector, setShowColorSelector] = useState<boolean>(false);

  // UI-only animation/display state.
  const [highScore, setHighScore] = useState<number>(0);
  const [recentPoints, setRecentPoints] = useState<number>(0);
  const [comboCount, setComboCount] = useState<number>(0);
  const [showCombo, setShowCombo] = useState<{ points: number; multiplier: number } | null>(null);
  const [showLineClear, setShowLineClear] = useState<number | null>(null);

  // Cascade burst state — driven by mergeFormed events from the engine.
  const [cascade, setCascade] = useState<{ id: number; anchor: { row: number; col: number }; multiplier: number; color: string } | null>(null);
  const cascadeIdRef = useRef(0);

  // Timeouts ref — cleared on unmount to prevent setState-after-unmount.
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const runStartRef = useRef<number>(Date.now());

  // Clear pending timeouts on unmount.
  useEffect(() => () => { timeoutsRef.current.forEach(clearTimeout); }, []);

  // Track game start on mount.
  useEffect(() => {
    track('endless_started', {});
  }, []);

  const startNewGame = useCallback((): void => {
    // Clear any pending animation timeouts from the previous run.
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    setEngine(createRun(mathRandomSource));
    setSelectedPieceIndex(undefined);
    setPowerUps(getStartingPowerUps());
    setActivePowerUp(null);
    setRecentPoints(0);
    setComboCount(0);
    setShowCombo(null);
    setShowLineClear(null);
    setCascade(null);
    runStartRef.current = Date.now();
    track('endless_started', {});
  }, []);

  // Main placement handler — called by GameSurface on tap or drag-commit.
  const handlePlace = useCallback(async (pieceIndex: number, row: number, col: number) => {
    const out = applyMove(engine, { type: 'place', pieceIndex, row, col }, mathRandomSource);
    if (out.events[0]?.type === 'rejected') return;

    setEngine(out.state);
    setSelectedPieceIndex(undefined);

    // Fire cascade burst for the highest-multiplier merge this move.
    const mergeEvents = out.events.filter(
      (e): e is Extract<EngineEvent, { type: 'mergeFormed' }> => e.type === 'mergeFormed'
    );
    if (mergeEvents.length > 0) {
      const best = mergeEvents.reduce((a, b) => (b.multiplier > a.multiplier ? b : a));
      cascadeIdRef.current += 1;
      setCascade({ id: cascadeIdRef.current, anchor: best.anchor, multiplier: best.multiplier, color: best.color });
    }

    // Drive animation + haptics via AnimationDirector.
    const beats = buildTimeline(out.events, { reduceMotion: await isReduceMotion() });
    if (beats.length > 0) {
      const { timeouts } = playTimeline(beats, () => {});
      timeoutsRef.current.push(...timeouts);
    }

    // Update UI display stats from events.
    const scoreEvent = out.events.find((e) => e.type === 'scoreAwarded');
    if (scoreEvent && scoreEvent.type === 'scoreAwarded') {
      setRecentPoints(scoreEvent.points);
      setShowCombo({ points: scoreEvent.points, multiplier: scoreEvent.multiplier });
    }
    const linesClearedEvent = out.events.find((e) => e.type === 'linesCleared');
    if (linesClearedEvent && linesClearedEvent.type === 'linesCleared') {
      const linesCount = linesClearedEvent.rows.length + linesClearedEvent.cols.length;
      setComboCount(linesCount);
      setShowLineClear(linesCount);
    } else {
      setComboCount(0);
    }

    // Game over — save score using FINAL engine state values (fixes stale-score bug C2).
    if (out.state.gameOver) {
      if (out.state.score > highScore) setHighScore(out.state.score);
      saveScore({
        id: `game-${Date.now()}`,
        score: out.state.score,
        mode: 'endless',
        date: new Date().toISOString(),
        maxMultiplier: out.state.maxMultiplier,
        durationMs: Date.now() - runStartRef.current,
        moveCount: out.state.moveCount,
      });
      void checkAchievements({
        runMode: 'endless',
        score: out.state.score,
        maxMultiplier: out.state.maxMultiplier,
        durationMs: Date.now() - runStartRef.current,
        didMerge: out.state.maxMultiplier > 1,
        didDailyComplete: false,
        dailyStreakDays: 0,
        dailiesPlayedTotal: 0,
      }).then((granted) => {
        if (granted.length > 0) showAchievementsToasts(granted);
      }).catch((e) => console.warn('achievements check failed', e));
    }
  }, [engine, highScore]);

  // Power-up: cell tap interceptor (blast / target).
  // Returns true if the power-up consumed the tap (suppresses normal placement).
  const handlePowerUpCellTap = useCallback((row: number, col: number): boolean => {
    if (!activePowerUp) return false;

    if (activePowerUp.type === 'blast') {
      const { newBoard, clearedCells } = applyBlast(engine.board, row, col);
      const points = clearedCells.length * 10;
      setEngine((prev) => ({ ...prev, board: newBoard, score: prev.score + points }));
      if (points > 0) {
        setRecentPoints(points);
        setShowCombo({ points, multiplier: 1 });
      }
      const next = [...powerUps];
      next[activePowerUp.index] = consumePowerUp(powerUps[activePowerUp.index]);
      setPowerUps(next);
      setActivePowerUp(null);
      return true;
    }

    if (activePowerUp.type === 'target') {
      if (selectedPieceIndex === undefined) return false;
      const best = applyTarget(engine.board, engine.pieces[selectedPieceIndex]);
      const next = [...powerUps];
      next[activePowerUp.index] = consumePowerUp(powerUps[activePowerUp.index]);
      setPowerUps(next);
      setActivePowerUp(null);
      if (best) {
        // Trigger placement at the suggested cell; handlePlace is async but we
        // fire-and-forget here (same pattern as tap-to-place).
        void handlePlace(selectedPieceIndex, best.row, best.col);
      }
      return true;
    }

    return false;
  }, [activePowerUp, engine, powerUps, selectedPieceIndex, handlePlace]);

  // Power-up: rail button press (reroll / colorBomb / blast / target activation).
  const handlePowerUpPress = useCallback((powerUp: PowerUp, index: number): void => {
    if (!canUsePowerUp(powerUp) || engine.gameOver) return;

    if (powerUp.type === 'colorBomb') {
      setActivePowerUp({ type: powerUp.type, index });
      setShowColorSelector(true);
    } else if (powerUp.type === 'reroll') {
      if (selectedPieceIndex !== undefined) {
        const newPiece = applyReroll(engine.pieces[selectedPieceIndex]);
        const newPieces = [...engine.pieces];
        newPieces[selectedPieceIndex] = newPiece;
        setEngine((prev) => ({ ...prev, pieces: newPieces }));
        const next = [...powerUps];
        next[index] = consumePowerUp(powerUp);
        setPowerUps(next);
      }
    } else {
      // blast / target: activate and wait for cell tap via handlePowerUpCellTap.
      setActivePowerUp({ type: powerUp.type, index });
    }
  }, [engine, powerUps, selectedPieceIndex]);

  // Power-up: color bomb color selection.
  const handleColorSelect = useCallback((color: BlockColor): void => {
    if (!activePowerUp) return;
    const { newBoard, clearedCells } = applyColorBomb(engine.board, color);
    const points = clearedCells.length * 10;
    setEngine((prev) => ({ ...prev, board: newBoard, score: prev.score + points }));
    if (points > 0) {
      setRecentPoints(points);
      setShowCombo({ points, multiplier: 1 });
    }
    const next = [...powerUps];
    next[activePowerUp.index] = consumePowerUp(powerUps[activePowerUp.index]);
    setPowerUps(next);
    setShowColorSelector(false);
    setActivePowerUp(null);
  }, [activePowerUp, engine, powerUps]);

  return (
    <SafeAreaView testID="game-screen" style={{ flex: 1, backgroundColor: palette.paper }}>
      {/* Ambient blob */}
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

      {/* Animation overlays */}
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
          <Pill variant="ink">ENDLESS</Pill>
          <View style={{ flex: 1 }}>
            <ScoreDisplay score={engine.score} highScore={highScore} multiplier={engine.multiplier} />
          </View>
          {engine.multiplier > 1 && (
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                backgroundColor: colors.ember,
                borderRadius: 999,
                borderWidth: 1.5,
                borderColor: 'white',
                shadowColor: colors.ember,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.5,
                shadowRadius: 10,
                elevation: 6,
              }}
            >
              <Text style={{ color: 'white', fontWeight: fontWeight.black, fontSize: 13 }}>×{engine.multiplier}</Text>
            </View>
          )}
        </View>

        {/* Combo theater */}
        <View style={{ paddingHorizontal: 14, paddingTop: 4 }}>
          <ComboTheater multiplier={engine.multiplier} recentPoints={recentPoints} comboCount={comboCount} />
        </View>

        {/* Board + pieces tray (GameSurface owns both) */}
        <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 8 }}>
          <GameSurface
            board={engine.board}
            pieces={engine.pieces}
            selectedPieceIndex={selectedPieceIndex}
            onSelectPiece={(_piece, i) => setSelectedPieceIndex(i)}
            onPlace={handlePlace}
            onCellTap={handlePowerUpCellTap}
            cascade={cascade}
            onCascadeComplete={() => setCascade(null)}
          />
        </View>

        {/* Game-over result card */}
        {engine.gameOver && (
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
                No more valid moves. Final score {engine.score.toLocaleString()}.
              </Text>
            </View>
            <TactileButton testID="new-game-button" onPress={startNewGame} variant="primary">
              New game
            </TactileButton>
          </View>
        )}

        {/* Hint */}
        {!engine.gameOver && (
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
              ? activePowerUp
                ? activePowerUp.type === 'target'
                  ? 'Tap the board to use Target'
                  : 'Tap the board to use Blast'
                : 'Tap the board to place your piece'
              : 'Select a piece, then tap the board'}
          </Text>
        )}

        {/* Power-up rail */}
        {!engine.gameOver && (
          <View style={{ paddingHorizontal: 14, marginTop: 12 }}>
            <PowerUpCards
              powerUps={powerUps}
              selectedIndex={activePowerUp?.index}
              onPress={handlePowerUpPress}
              disabled={engine.gameOver}
            />
          </View>
        )}

        {/* Color bomb selector */}
        {showColorSelector && (
          <ColorSelector
            colors={getColorsOnBoard(engine.board)}
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
