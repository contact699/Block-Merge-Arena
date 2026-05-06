// Daily Screen — renamed from tournament.tsx, restyled with tactile-console aesthetic.
import { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { track } from '@/lib/analytics/events';
import { GameBoard } from '@/components/GameBoard';
import { PiecesTray } from '@/components/design/PiecesTray';
import { ScoreDisplay } from '@/components/ScoreDisplay';
import { GemCounter } from '@/components/GemDisplay';
import { ComboAnimation, LineClearEffect } from '@/components/ComboAnimation';
import { MergeAnimation } from '@/components/cascade/MergeAnimation';
import { GlassCard, DeepCard } from '@/components/design/GlassCard';
import { Pill } from '@/components/design/Pill';
import { TactileButton } from '@/components/design/TactileButton';
import { colors, fontWeight, radii, resolveBlockColor, blockColors } from '@/lib/design/tokens';
import { useThemePalette } from '@/lib/themes/provider';
import { createEmptyBoard, canPlacePiece, placePiece, clearLines, hasValidMoves } from '@/lib/game/board';
import {
  generateGemsFromClearedCells,
  placeGemsOnBoard,
  mergeGems,
  getGemsFromBoard,
  calculateTotalMultiplier
} from '@/lib/game/merge';
import {
  generateTournamentPieces,
  getDailySeed,
  getTodayDateString,
  recordDailyCompletion,
  hasCompletedDaily,
} from '@/lib/daily/seed';
import { getArchive, type ArchiveEntry } from '@/lib/daily/archive';
import { useRequireSubscription } from '@/lib/subscription/gate';
import { PaywallModal } from '@/components/paywall/PaywallModal';
import { saveScore } from '@/lib/utils/leaderboard';
import {
  getTournamentStandings,
  isConfigured as isFirebaseConfigured,
  type TournamentEntry,
  getOrCreateUser
} from '@/lib/firebase';
import { ReplayRecorder } from '@/lib/game/replay-recorder';
import { rewardCoinsForScore } from '@/lib/utils/currency';
import { checkAchievements } from '@/lib/utils/achievements';
import { showAchievementsToasts } from '@/components/feedback/AchievementToast';

import type { GameBoard as GameBoardType, GamePiece, Gem } from '@/lib/types/game';

export default function DailyScreen() {
  const router = useRouter();
  const palette = useThemePalette();
  const [board, setBoard] = useState<GameBoardType>(createEmptyBoard());
  const [pieces, setPieces] = useState<GamePiece[]>([]);
  const [selectedPieceIndex, setSelectedPieceIndex] = useState<number | undefined>(undefined);
  const [score, setScore] = useState<number>(0);
  const [multiplier, setMultiplier] = useState<number>(1);
  const [gems, setGems] = useState<Gem[]>([]);
  const [gameOver, setGameOver] = useState<boolean>(false);

  // Daily mode state
  const [tournamentStarted, setTournamentStarted] = useState<boolean>(false);
  const [tournamentDate] = useState<string>(getTodayDateString());
  const [seed] = useState<number>(getDailySeed());
  const [pieceSetIndex, setPieceSetIndex] = useState<number>(0);
  const [hasPlayedToday, setHasPlayedToday] = useState<boolean>(false);

  // Animation states
  const [showCombo, setShowCombo] = useState<{ points: number; multiplier: number } | null>(null);
  const [showLineClear, setShowLineClear] = useState<number | null>(null);
  const [activeCascade, setActiveCascade] = useState<{
    id: number;
    multiplier: number;
    color: keyof typeof blockColors;
    origin: { x: number; y: number };
  } | null>(null);

  // Tournament standings
  const [showStandings, setShowStandings] = useState<boolean>(false);
  const [standings, setStandings] = useState<TournamentEntry[]>([]);
  const [loadingStandings, setLoadingStandings] = useState<boolean>(false);
  const isFirebaseAvailable = isFirebaseConfigured();

  // Replay recording
  const [replayRecorder, setReplayRecorder] = useState<ReplayRecorder | null>(null);
  const [replayCode, setReplayCode] = useState<string | null>(null);

  // Currency rewards
  const [earnedCoins, setEarnedCoins] = useState<number>(0);

  // Achievements
  const [maxMultiplierReached, setMaxMultiplierReached] = useState<number>(1);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);

  // Archive
  const [showArchive, setShowArchive] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [archive, setArchive] = useState<ArchiveEntry[]>([]);
  const isSubscribed = useRequireSubscription();

  const onArchivePress = async (): Promise<void> => {
    if (!isSubscribed) {
      setShowPaywall(true);
      track('paywall_viewed', { source: 'archive' });
      return;
    }
    const entries = await getArchive();
    setArchive(entries);
    setShowArchive(true);
  };

  const runStartTimestampRef = useRef<number>(Date.now());

  // Initialize with tournament pieces
  useEffect(() => {
    const tournamentPieces = generateTournamentPieces(seed, 3);
    setPieces(tournamentPieces);
  }, [seed]);

  // Check whether today's puzzle has already been completed (no retries).
  useEffect(() => {
    (async () => {
      const played = await hasCompletedDaily(tournamentDate);
      setHasPlayedToday(played);
    })();
  }, [tournamentDate]);

  const startTournament = async (): Promise<void> => {
    track('daily_started', { puzzle_id: getTodayDateString() });

    setBoard(createEmptyBoard());
    const tournamentPieces = generateTournamentPieces(seed, 3);
    setPieces(tournamentPieces);
    setScore(0);
    setMultiplier(1);
    setGems([]);
    setGameOver(false);
    setSelectedPieceIndex(undefined);
    setTournamentStarted(true);
    setPieceSetIndex(0);
    runStartTimestampRef.current = Date.now();
    setReplayCode(null);
    setMaxMultiplierReached(1);
    setUnlockedAchievements([]);
    setEarnedCoins(0);

    // Initialize and start replay recording
    const userId = await getOrCreateUser();
    const recorder = new ReplayRecorder(userId, 'tournament', tournamentDate, seed);
    recorder.start();
    setReplayRecorder(recorder);
    console.log('Daily replay recording started');
  };

  const loadStandings = async (): Promise<void> => {
    if (!isFirebaseAvailable) return;

    setLoadingStandings(true);
    try {
      const response = await getTournamentStandings(tournamentDate);
      setStandings(response.entries);
    } catch (error) {
      console.error('Error loading tournament standings:', error);
    }
    setLoadingStandings(false);
  };

  const toggleStandings = (): void => {
    setShowStandings(!showStandings);
    if (!showStandings && standings.length === 0) {
      loadStandings();
    }
  };

  const handlePieceSelect = (piece: GamePiece, index: number): void => {
    setSelectedPieceIndex(index);
  };

  const handleCellPress = (row: number, col: number): void => {
    if (selectedPieceIndex === undefined || gameOver || !tournamentStarted) return;

    const selectedPiece = pieces[selectedPieceIndex];
    if (!canPlacePiece(board, selectedPiece, row, col)) {
      return;
    }

    // Place the piece
    let newBoard = placePiece(board, selectedPiece, row, col);

    // Clear any complete lines
    const { newBoard: clearedBoard, clearedCells } = clearLines(newBoard);

    let newMultiplier = multiplier;

    if (clearedCells.length > 0) {
      newBoard = clearedBoard;

      // Show line clear animation
      const linesCleared = clearedCells.length / 8;
      setShowLineClear(Math.ceil(linesCleared));

      // Generate gems from cleared cells
      const newDroppedGems = generateGemsFromClearedCells(clearedCells);
      newBoard = placeGemsOnBoard(newBoard, newDroppedGems);

      // Get all gems from board
      const allGems = getGemsFromBoard(newBoard);

      // Merge adjacent same-color gems
      const mergedGems = mergeGems(allGems);

      // Check for large merged gems
      const largeGems = mergedGems.filter((g: Gem) => g.size !== 'small');
      if (largeGems.length > 0) {
        const sizeOrder = { small: 0, medium: 1, large: 2, mega: 3 };
        const bestGem = largeGems.reduce((best: Gem, current: Gem) =>
          sizeOrder[current.size] > sizeOrder[best.size] ? current : best,
        largeGems[0]);
        setActiveCascade({
          id: Date.now(),
          multiplier: bestGem.multiplier,
          color: resolveBlockColor(bestGem.color),
          origin: { x: 0, y: 200 },
        });
      }

      // Calculate multiplier
      newMultiplier = calculateTotalMultiplier(mergedGems);

      // Track max multiplier
      if (newMultiplier > maxMultiplierReached) {
        setMaxMultiplierReached(newMultiplier);
      }

      // Calculate score
      const points = clearedCells.length * 10 * multiplier;
      setScore(score + points);

      // Show combo animation
      setShowCombo({ points, multiplier });

      setMultiplier(newMultiplier);
      setGems(mergedGems);

      newBoard = placeGemsOnBoard(newBoard, mergedGems);
    }

    setBoard(newBoard);

    // Record move in replay
    const linesCleared = clearedCells.length > 0 ? Math.ceil(clearedCells.length / 8) : 0;
    const newScore = clearedCells.length > 0 ? score + (clearedCells.length * 10 * multiplier) : score;
    if (replayRecorder && replayRecorder.isRecording()) {
      replayRecorder.recordMove(
        selectedPiece,
        { row, col },
        newScore,
        linesCleared,
        newMultiplier
      );
    }

    // Remove used piece and generate new ones
    const newPieces = pieces.filter((_: GamePiece, i: number) => i !== selectedPieceIndex);
    if (newPieces.length === 0) {
      // Generate next set of tournament pieces with offset seed
      const nextSetIndex = pieceSetIndex + 1;
      const nextSeed = seed + (nextSetIndex * 1000);
      newPieces.push(...generateTournamentPieces(nextSeed, 3));
      setPieceSetIndex(nextSetIndex);
    }
    setPieces(newPieces);
    setSelectedPieceIndex(undefined);

    // Check for game over (run ends only when no valid moves remain)
    if (!hasValidMoves(newBoard, newPieces)) {
      void handleRunEnd(newScore, newMultiplier, newBoard);
    }
  };

  const handleRunEnd = async (finalScore: number, finalMultiplier: number, finalBoard: GameBoardType): Promise<void> => {
    setGameOver(true);
    setTournamentStarted(false);

    // Stop replay recording
    if (replayRecorder && replayRecorder.isRecording()) {
      const replay = await replayRecorder.stop(finalScore, undefined, undefined, finalBoard);
      if (replay) {
        setReplayCode(replay.code || null);
        console.log('Daily replay saved:', replay.code);
      }
    }

    // Reward coins based on score
    const coins = await rewardCoinsForScore(finalScore);
    setEarnedCoins(coins);
    console.log('Earned coins:', coins);

    // Save score to leaderboard
    saveScore({
      id: `tournament-${Date.now()}`,
      score: finalScore,
      mode: 'tournament',
      date: new Date().toISOString(),
      maxMultiplier: finalMultiplier,
    });

    // Check achievements
    const puzzleId = getTodayDateString();
    const { totalPlayed, streakDays } = await recordDailyCompletion(puzzleId);
    setHasPlayedToday(true);
    const granted = await checkAchievements({
      runMode: 'daily',
      score: finalScore,
      maxMultiplier: finalMultiplier,
      durationMs: Date.now() - runStartTimestampRef.current,
      didMerge: finalMultiplier > 1,
      didDailyComplete: true,
      dailyStreakDays: streakDays,
      dailiesPlayedTotal: totalPlayed,
    });
    if (granted.length > 0) {
      setUnlockedAchievements(granted);
      showAchievementsToasts(granted);
    }

    // Load standings after game ends
    if (isFirebaseAvailable) {
      setTimeout(async () => {
        await loadStandings();
        setShowStandings(true);
      }, 2000); // Wait 2 seconds for score to propagate
    }
  };

  return (
    <SafeAreaView testID="tournament-screen" style={{ flex: 1, backgroundColor: palette.paper }}>
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
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          bottom: 100,
          left: -60,
          width: 200,
          height: 200,
          borderRadius: 100,
          backgroundColor: colors.cobalt,
          opacity: 0.10,
        }}
      />

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
        {/* Back Button */}
        <View style={{ paddingHorizontal: 18, paddingTop: 12 }}>
          <Pressable testID="back-button" onPress={() => router.back()}>
            <Text style={{ color: colors.ember, fontSize: 15, fontWeight: fontWeight.bold }}>
              {'←'} Back
            </Text>
          </Pressable>
        </View>

        {/* Hero card */}
        <View style={{ paddingHorizontal: 14, marginTop: 10 }}>
          <DeepCard style={{ padding: 20 }}>
            {/* Inner ember radial */}
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: -50,
                right: -40,
                width: 200,
                height: 200,
                borderRadius: 100,
                backgroundColor: colors.ember,
                opacity: 0.45,
              }}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Pill variant="ember">DAILY TOURNAMENT</Pill>
                <Text
                  style={{
                    marginTop: 10,
                    fontSize: 24,
                    fontWeight: fontWeight.black,
                    color: colors.paper,
                    letterSpacing: -0.8,
                  }}
                >
                  Daily Tournament
                </Text>
                <Text style={{ color: 'rgba(243,239,231,0.65)', fontSize: 12, marginTop: 3 }}>
                  Same pieces for everyone {'·'} {tournamentDate}
                </Text>
                <Pressable testID="archive-button" onPress={onArchivePress} style={{ marginTop: 8 }}>
                  <Pill variant="ink">ARCHIVE</Pill>
                </Pressable>
              </View>
            </View>
          </DeepCard>
        </View>

        {/* View Standings Button (only if Firebase is available and not playing) */}
        {isFirebaseAvailable && !tournamentStarted && (
          <View style={{ paddingHorizontal: 14, marginTop: 10 }}>
            <Pressable testID="view-standings-button" onPress={toggleStandings}>
              <GlassCard style={{ padding: 14 }}>
                <Text
                  style={{
                    color: colors.cobalt,
                    textAlign: 'center',
                    fontSize: 13,
                    fontWeight: fontWeight.bold,
                    letterSpacing: -0.2,
                  }}
                >
                  {showStandings ? 'Hide Standings' : 'View Live Standings'}
                </Text>
              </GlassCard>
            </Pressable>
          </View>
        )}

        {/* Tournament Standings */}
        {showStandings && !tournamentStarted && (
          <View style={{ paddingHorizontal: 14, marginTop: 10 }}>
            <GlassCard style={{ padding: 16 }}>
              <Text
                style={{
                  color: colors.ink,
                  fontSize: 14,
                  fontWeight: fontWeight.heavy,
                  letterSpacing: 1.4,
                  textAlign: 'center',
                  marginBottom: 12,
                }}
              >
                TODAY'S RANKINGS
              </Text>

              {loadingStandings ? (
                <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                  <Text style={{ color: colors.inkDim }}>Loading standings…</Text>
                </View>
              ) : standings.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                  <Text style={{ color: colors.inkDim, textAlign: 'center' }}>
                    No scores yet. Be the first to compete!
                  </Text>
                </View>
              ) : (
                <View>
                  {standings.slice(0, 10).map((entry: TournamentEntry, index: number) => (
                    <View
                      key={entry.userId}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 10,
                        borderBottomWidth: index < Math.min(standings.length, 10) - 1 ? 1 : 0,
                        borderBottomColor: colors.inkRuleSoft,
                      }}
                    >
                      {/* Rank */}
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: fontWeight.black,
                          width: 36,
                          color:
                            entry.rank === 1
                              ? colors.mustard
                              : entry.rank === 2
                              ? 'rgba(22,20,15,0.5)'
                              : entry.rank === 3
                              ? colors.ember
                              : colors.inkDim,
                        }}
                      >
                        {entry.rank}
                      </Text>

                      {/* Score */}
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.ink, fontSize: 16, fontWeight: fontWeight.bold }}>
                          {entry.score.toLocaleString()}
                        </Text>
                        <Text style={{ color: colors.inkDim, fontSize: 11, marginTop: 1 }}>
                          {entry.maxMultiplier}x multiplier
                        </Text>
                      </View>

                      {/* Badge for top 3 */}
                      {entry.rank && entry.rank <= 3 && (
                        <View
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 13,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor:
                              entry.rank === 1
                                ? colors.mustard
                                : entry.rank === 2
                                ? 'rgba(22,20,15,0.3)'
                                : colors.ember,
                          }}
                        >
                          <Text
                            style={{
                              color: colors.paper,
                              fontSize: 10,
                              fontWeight: fontWeight.heavy,
                            }}
                          >
                            {entry.rank}
                          </Text>
                        </View>
                      )}
                    </View>
                  ))}

                  {standings.length > 10 && (
                    <Text
                      style={{
                        color: colors.inkDim,
                        fontSize: 11,
                        textAlign: 'center',
                        marginTop: 10,
                      }}
                    >
                      Showing top 10 of {standings.length} players
                    </Text>
                  )}
                </View>
              )}
            </GlassCard>
          </View>
        )}

        {/* Score Display (during game) */}
        {tournamentStarted && (
          <View style={{ marginTop: 12 }}>
            <ScoreDisplay score={score} multiplier={multiplier} />
          </View>
        )}

        {/* Result card (after run) */}
        {gameOver && (
          <View style={{ paddingHorizontal: 14, marginTop: 10 }}>
            <GlassCard style={{ padding: 20 }}>
              <Text
                style={{
                  color: colors.inkSoft,
                  fontSize: 10,
                  fontWeight: fontWeight.bold,
                  letterSpacing: 1.6,
                  textAlign: 'center',
                }}
              >
                RUN COMPLETE
              </Text>

              {/* Score with ember glow */}
              <Text
                style={{
                  color: colors.ember,
                  fontSize: 52,
                  fontWeight: fontWeight.black,
                  textAlign: 'center',
                  marginTop: 8,
                  letterSpacing: -2,
                  shadowColor: colors.ember,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.55,
                  shadowRadius: 18,
                }}
              >
                {score.toLocaleString()}
              </Text>
              <Text
                style={{
                  color: colors.inkDim,
                  fontSize: 12,
                  textAlign: 'center',
                  marginTop: 2,
                }}
              >
                Final Score
              </Text>

              {/* Max multiplier */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginTop: 10,
                }}
              >
                <Pill variant="ember">{`×${maxMultiplierReached} MAX COMBO`}</Pill>
              </View>

              <Text
                style={{
                  color: colors.inkDim,
                  fontSize: 11,
                  textAlign: 'center',
                  marginTop: 8,
                }}
              >
                Your score will be added to the leaderboard
              </Text>

              {/* Coins Earned */}
              {earnedCoins > 0 && (
                <View
                  style={{
                    marginTop: 14,
                    paddingTop: 14,
                    borderTopWidth: 1,
                    borderTopColor: colors.inkRuleSoft,
                  }}
                >
                  <Text
                    style={{
                      color: colors.inkDim,
                      fontSize: 10,
                      letterSpacing: 1.4,
                      fontWeight: fontWeight.bold,
                      textAlign: 'center',
                      marginBottom: 8,
                    }}
                  >
                    REWARDS
                  </Text>
                  <View
                    style={{
                      backgroundColor: 'rgba(230,169,60,0.12)',
                      borderRadius: radii.md,
                      borderWidth: 1,
                      borderColor: 'rgba(230,169,60,0.3)',
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                    }}
                  >
                    <Text
                      style={{
                        color: colors.mustard,
                        fontSize: 20,
                        fontWeight: fontWeight.black,
                        textAlign: 'center',
                      }}
                    >
                      +{earnedCoins} Coins
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: colors.inkDim,
                      fontSize: 11,
                      textAlign: 'center',
                      marginTop: 6,
                    }}
                  >
                    Use coins in the Shop to buy cosmetics!
                  </Text>
                </View>
              )}

              {/* Replay Code */}
              {replayCode && (
                <View
                  style={{
                    marginTop: 14,
                    paddingTop: 14,
                    borderTopWidth: 1,
                    borderTopColor: colors.inkRuleSoft,
                  }}
                >
                  <Text
                    style={{
                      color: colors.inkDim,
                      fontSize: 10,
                      letterSpacing: 1.4,
                      fontWeight: fontWeight.bold,
                      textAlign: 'center',
                      marginBottom: 8,
                    }}
                  >
                    REPLAY CODE
                  </Text>
                  <View
                    style={{
                      backgroundColor: 'rgba(22,20,15,0.06)',
                      borderRadius: radii.md,
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                    }}
                  >
                    <Text
                      style={{
                        color: colors.ink,
                        fontSize: 28,
                        fontWeight: fontWeight.black,
                        textAlign: 'center',
                        letterSpacing: 6,
                      }}
                    >
                      {replayCode}
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: colors.inkDim,
                      fontSize: 11,
                      textAlign: 'center',
                      marginTop: 6,
                    }}
                  >
                    Share this code to let others watch your run!
                  </Text>
                </View>
              )}

              {/* Unlocked Achievements */}
              {unlockedAchievements.length > 0 && (
                <View
                  style={{
                    marginTop: 14,
                    paddingTop: 14,
                    borderTopWidth: 1,
                    borderTopColor: colors.inkRuleSoft,
                  }}
                >
                  <Text
                    style={{
                      color: colors.inkDim,
                      fontSize: 10,
                      letterSpacing: 1.4,
                      fontWeight: fontWeight.bold,
                      textAlign: 'center',
                      marginBottom: 8,
                    }}
                  >
                    ACHIEVEMENTS UNLOCKED
                  </Text>
                  {unlockedAchievements.map((id: string) => (
                    <View
                      key={id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        backgroundColor: 'rgba(255,90,54,0.06)',
                        borderRadius: radii.md,
                        borderWidth: 1,
                        borderColor: 'rgba(255,90,54,0.15)',
                        padding: 12,
                        marginBottom: 8,
                      }}
                    >
                      <Text style={{ fontSize: 28 }}>🏆</Text>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            color: colors.ink,
                            fontSize: 14,
                            fontWeight: fontWeight.heavy,
                          }}
                        >
                          Achievement Unlocked
                        </Text>
                        <Text
                          style={{
                            color: colors.inkSoft,
                            fontSize: 11,
                            marginTop: 2,
                          }}
                        >
                          {id}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Result actions */}
              <View style={{ marginTop: 18, gap: 10 }}>
                {/* Share stub — Phase 2 wires the real share grid */}
                <TactileButton variant="cobalt" onPress={() => {}}>
                  Share result
                </TactileButton>
                <TactileButton variant="plain" onPress={() => router.back()}>
                  Done
                </TactileButton>
              </View>
            </GlassCard>
          </View>
        )}

        {/* Gem Counter */}
        {gems.length > 0 && tournamentStarted && (
          <View style={{ paddingHorizontal: 14, marginTop: 10 }}>
            <GemCounter gems={gems} />
          </View>
        )}

        {/* Game Board */}
        {tournamentStarted && (
          <View style={{ alignItems: 'center', marginTop: 14, marginBottom: 8, paddingHorizontal: 16 }}>
            <View style={{ position: 'relative' }}>
              <GameBoard
                board={board}
                onCellPress={handleCellPress}
              />
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
                  <Text
                    style={{
                      color: 'white',
                      fontWeight: fontWeight.black,
                      fontSize: 14,
                    }}
                  >
                    {'×'}{multiplier}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Instructions */}
        {tournamentStarted && selectedPieceIndex === undefined && !gameOver && (
          <Text
            style={{
              color: colors.inkSoft,
              textAlign: 'center',
              fontSize: 12,
              fontWeight: fontWeight.semibold,
              marginTop: 8,
              paddingHorizontal: 14,
            }}
          >
            Select a piece below, then tap the board to place it
          </Text>
        )}

        {tournamentStarted && selectedPieceIndex !== undefined && !gameOver && (
          <Text
            style={{
              color: colors.ember,
              textAlign: 'center',
              fontSize: 12,
              fontWeight: fontWeight.semibold,
              marginTop: 8,
              paddingHorizontal: 14,
            }}
          >
            Tap the board to place your piece
          </Text>
        )}

        {/* Pieces Selector */}
        {pieces.length > 0 && tournamentStarted && !gameOver && (
          <View style={{ paddingHorizontal: 14, marginTop: 8, marginBottom: 8 }}>
            <PiecesTray
              pieces={pieces}
              selectedIndex={selectedPieceIndex}
              onSelect={handlePieceSelect}
            />
          </View>
        )}

        {/* Start Button — pre-game state. Hidden once today's puzzle is done
            (one-run-no-retries per ADR 0003 / launch design § 3). */}
        {!tournamentStarted && !hasPlayedToday && (
          <View style={{ paddingHorizontal: 14, marginTop: 16 }}>
            <TactileButton
              testID="start-tournament-button"
              variant="primary"
              onPress={startTournament}
            >
              Begin run
            </TactileButton>
          </View>
        )}

        {/* Already-played state — replaces the button when today's run is done. */}
        {!tournamentStarted && hasPlayedToday && (
          <View testID="already-played-card" style={{ paddingHorizontal: 14, marginTop: 16 }}>
            <GlassCard style={{ padding: 18, alignItems: 'center' }}>
              <Text style={{ fontSize: 14, fontWeight: fontWeight.heavy, color: colors.ink, textAlign: 'center' }}>
                Today's puzzle is done.
              </Text>
              <Text style={{ fontSize: 12, color: colors.inkSoft, marginTop: 6, textAlign: 'center' }}>
                Come back tomorrow for a new daily.
              </Text>
            </GlassCard>
          </View>
        )}
      </ScrollView>

      {/* Archive overlay */}
      {showArchive && (
        <View style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: colors.paper, padding: 18, zIndex: 10,
        }}>
          <Pressable testID="close-archive-button" onPress={() => setShowArchive(false)} style={{ paddingVertical: 8 }}>
            <Text style={{ color: colors.inkSoft, fontSize: 14, fontWeight: fontWeight.semibold }}>← back</Text>
          </Pressable>
          <Text style={{ fontSize: 28, fontWeight: fontWeight.black, color: colors.ink, marginTop: 12, letterSpacing: -1 }}>
            Archive
          </Text>
          <Text style={{ fontSize: 13, color: colors.inkSoft, marginTop: 4 }}>
            Every past daily puzzle, replayable.
          </Text>
          <ScrollView style={{ flex: 1, marginTop: 16 }}>
            {archive.length === 0 ? (
              <Text style={{ color: colors.inkSoft, padding: 32, textAlign: 'center' }}>
                No archived puzzles yet. Play more dailies to fill this list.
              </Text>
            ) : (
              archive.map((e) => (
                <GlassCard key={e.puzzleId} style={{ padding: 14, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontWeight: fontWeight.heavy, color: colors.ink }}>{e.puzzleId}</Text>
                  <Text style={{ color: e.played ? colors.ember : colors.inkSoft, fontWeight: fontWeight.semibold }}>
                    {e.played ? `${e.score.toLocaleString()} · ×${e.multiplier}` : 'unplayed'}
                  </Text>
                </GlassCard>
              ))
            )}
          </ScrollView>
        </View>
      )}

      {/* Paywall overlay — real PaywallModal renders SKUs from RevenueCat */}
      <PaywallModal
        visible={showPaywall}
        source="archive"
        onDismiss={() => setShowPaywall(false)}
      />
    </SafeAreaView>
  );
}
