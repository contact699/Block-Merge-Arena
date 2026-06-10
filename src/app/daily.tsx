// Daily Screen — rebuilt on seeded engine + GameSurface (Task 13).
// Determinism guarantee: one SeededRandom instance per run, passed to both
// createRun and every applyMove call, so gem colors are derived from the same
// stream as piece shapes — two players making identical moves get identical boards.
import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trophy } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { track } from '@/lib/analytics/events';
import { ScoreDisplay } from '@/components/ScoreDisplay';
import { ComboAnimation, LineClearEffect } from '@/components/ComboAnimation';
import { GlassCard, DeepCard } from '@/components/design/GlassCard';
import { Pill } from '@/components/design/Pill';
import { TactileButton } from '@/components/design/TactileButton';
import { colors, fontWeight, radii } from '@/lib/design/tokens';
import { useThemePalette } from '@/lib/themes/provider';
import { createRun, applyMove, type EngineState, type EngineEvent } from '@/lib/game/engine';
import type { GamePiece } from '@/lib/types/game';
import { SeededRandom } from '@/lib/game/rng';
import { buildTimeline, playTimeline, isReduceMotion } from '@/components/board/AnimationDirector';
import { GameSurface } from '@/components/board/GameSurface';
import {
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
  getOrCreateUser,
} from '@/lib/firebase';
import { ReplayRecorder } from '@/lib/game/replay-recorder';
import { rewardCoinsForScore } from '@/lib/utils/currency';
import { checkAchievements } from '@/lib/utils/achievements';
import { showAchievementsToasts } from '@/components/feedback/AchievementToast';

export default function DailyScreen() {
  const router = useRouter();
  const palette = useThemePalette();

  // ---------------------------------------------------------------------------
  // Engine state — single source of truth for board, pieces, score, multiplier, gameOver.
  // Initial createRun uses a throwaway seed; the real run starts in startTournament.
  // ---------------------------------------------------------------------------
  const rngRef = useRef<SeededRandom>(new SeededRandom(getDailySeed()));
  const [engine, setEngine] = useState<EngineState>(() => createRun(new SeededRandom(getDailySeed())));
  const [selectedPieceIndex, setSelectedPieceIndex] = useState<number | undefined>(undefined);

  // Daily mode meta-state
  const [tournamentStarted, setTournamentStarted] = useState<boolean>(false);
  const [tournamentDate] = useState<string>(getTodayDateString());
  const [hasPlayedToday, setHasPlayedToday] = useState<boolean>(false);

  // UI-only animation state
  const [showCombo, setShowCombo] = useState<{ points: number; multiplier: number } | null>(null);
  const [showLineClear, setShowLineClear] = useState<number | null>(null);

  // Cascade burst state — driven by mergeFormed events from the engine.
  const [cascade, setCascade] = useState<{ id: number; anchor: { row: number; col: number }; multiplier: number; color: string } | null>(null);
  const cascadeIdRef = useRef(0);

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
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);

  // Archive
  const [showArchive, setShowArchive] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [archive, setArchive] = useState<ArchiveEntry[]>([]);
  const isSubscribed = useRequireSubscription();

  // Run timing
  const runStartTimestampRef = useRef<number>(Date.now());

  // Timeouts ref — ALL timeouts (animation + standings delay) captured here,
  // cleared on unmount to prevent setState-after-unmount (fixes audit P2).
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Clear pending timeouts on unmount.
  useEffect(() => () => { timeoutsRef.current.forEach(clearTimeout); }, []);

  // Check whether today's puzzle has already been completed (no retries).
  useEffect(() => {
    (async () => {
      const played = await hasCompletedDaily(tournamentDate);
      setHasPlayedToday(played);
    })();
  }, [tournamentDate]);

  // ---------------------------------------------------------------------------
  // Archive / paywall
  // ---------------------------------------------------------------------------

  const onArchivePress = async (): Promise<void> => {
    if (!isSubscribed) {
      setShowPaywall(true);
      return;
    }
    const entries = await getArchive();
    setArchive(entries);
    setShowArchive(true);
  };

  // ---------------------------------------------------------------------------
  // Standings
  // ---------------------------------------------------------------------------

  const loadStandings = useCallback(async (): Promise<void> => {
    if (!isFirebaseAvailable) return;
    setLoadingStandings(true);
    try {
      const response = await getTournamentStandings(tournamentDate);
      setStandings(response.entries);
    } catch (error) {
      console.error('Error loading tournament standings:', error);
    }
    setLoadingStandings(false);
  }, [isFirebaseAvailable, tournamentDate]);

  const toggleStandings = (): void => {
    setShowStandings(!showStandings);
    if (!showStandings && standings.length === 0) {
      void loadStandings();
    }
  };

  // Memoized piece-selection handler — avoids recreating the lambda every render.
  const handleSelectPiece = useCallback((_piece: GamePiece, i: number) => setSelectedPieceIndex(i), []);

  // ---------------------------------------------------------------------------
  // startTournament — reset to a fresh seeded run
  // ---------------------------------------------------------------------------

  const startTournament = async (): Promise<void> => {
    track('daily_started', { puzzle_id: getTodayDateString() });

    // Clear any pending timeouts from prior runs.
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    // SINGLE seeded rng instance for the whole run — createRun consumes it first,
    // then every applyMove call continues consuming from the same stream.
    const rng = new SeededRandom(getDailySeed());
    rngRef.current = rng;
    setEngine(createRun(rng));
    setSelectedPieceIndex(undefined);
    setShowCombo(null);
    setShowLineClear(null);
    setCascade(null);
    runStartTimestampRef.current = Date.now();
    setReplayCode(null);
    setUnlockedAchievements([]);
    setEarnedCoins(0);

    // Initialize and start replay recording BEFORE making the board interactive.
    // If setTournamentStarted(true) ran first, a fast tap could fire handlePlace
    // before replayRecorder is set, silently dropping move #1 from the replay.
    const userId = await getOrCreateUser();
    const recorder = new ReplayRecorder(userId, 'tournament', tournamentDate, getDailySeed());
    recorder.start();
    setReplayRecorder(recorder);

    // Board becomes interactive only after recorder is ready.
    setTournamentStarted(true);
  };

  // ---------------------------------------------------------------------------
  // handleRunEnd — called with the FINAL EngineState (not stale React state)
  // ---------------------------------------------------------------------------

  const handleRunEnd = useCallback(async (final: EngineState): Promise<void> => {
    setTournamentStarted(false);

    // Stop replay recording with final board state.
    let capturedReplayCode: string | null = null;
    if (replayRecorder && replayRecorder.isRecording()) {
      const replay = await replayRecorder.stop(final.score, undefined, undefined, final.board);
      if (replay) {
        capturedReplayCode = replay.code || null;
        setReplayCode(capturedReplayCode);
      }
    }

    // Reward coins based on score.
    const coins = await rewardCoinsForScore(final.score);
    setEarnedCoins(coins);

    // Save score to leaderboard.
    saveScore({
      id: `tournament-${Date.now()}`,
      score: final.score,
      mode: 'tournament',
      date: new Date().toISOString(),
      maxMultiplier: final.maxMultiplier,
      durationMs: Date.now() - runStartTimestampRef.current,
      moveCount: final.moveCount,
      ...(capturedReplayCode ? { replayCode: capturedReplayCode } : {}),
    });

    // Record daily completion + check achievements.
    const puzzleId = getTodayDateString();
    const { totalPlayed, streakDays } = await recordDailyCompletion(puzzleId);
    setHasPlayedToday(true);
    const granted = await checkAchievements({
      runMode: 'daily',
      score: final.score,
      maxMultiplier: final.maxMultiplier,
      durationMs: Date.now() - runStartTimestampRef.current,
      didMerge: final.maxMultiplier > 1,
      didDailyComplete: true,
      dailyStreakDays: streakDays,
      dailiesPlayedTotal: totalPlayed,
    });
    if (granted.length > 0) {
      setUnlockedAchievements(granted);
      showAchievementsToasts(granted);
    }

    // Load standings after a short delay (wait for score to propagate).
    // IMPORTANT: captured into timeoutsRef so it's cleared on unmount (audit P2).
    if (isFirebaseAvailable) {
      const tid = setTimeout(async () => {
        await loadStandings();
        setShowStandings(true);
      }, 2000);
      timeoutsRef.current.push(tid);
    }
  }, [replayRecorder, isFirebaseAvailable, loadStandings]);

  // ---------------------------------------------------------------------------
  // handlePlace — main placement handler (mirrors Endless + replay recording)
  // ---------------------------------------------------------------------------

  const handlePlace = useCallback(async (pieceIndex: number, row: number, col: number) => {
    // Capture piece BEFORE applyMove (the piece list may change after).
    const piece = engine.pieces[pieceIndex];
    const out = applyMove(engine, { type: 'place', pieceIndex, row, col }, rngRef.current);
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

    // Replay: record move with correct linesCleared count.
    if (replayRecorder?.isRecording()) {
      const clearedEv = out.events.find((e) => e.type === 'linesCleared');
      const linesCleared =
        clearedEv && clearedEv.type === 'linesCleared'
          ? clearedEv.rows.length + clearedEv.cols.length
          : 0;
      replayRecorder.recordMove(piece, { row, col }, out.state.score, linesCleared, out.state.multiplier);
    }

    // Drive animation + haptics via AnimationDirector.
    const beats = buildTimeline(out.events, { reduceMotion: await isReduceMotion() });
    if (beats.length > 0) {
      const { timeouts } = playTimeline(beats, () => {});
      timeoutsRef.current.push(...timeouts);
    }

    // UI feedback from events.
    const scoreEvent = out.events.find((e) => e.type === 'scoreAwarded');
    if (scoreEvent && scoreEvent.type === 'scoreAwarded') {
      setShowCombo({ points: scoreEvent.points, multiplier: scoreEvent.multiplier });
    }
    const linesClearedEvent = out.events.find((e) => e.type === 'linesCleared');
    if (linesClearedEvent && linesClearedEvent.type === 'linesCleared') {
      const linesCount = linesClearedEvent.rows.length + linesClearedEvent.cols.length;
      setShowLineClear(linesCount);
    }

    // Game over — pass final EngineState to handleRunEnd (no stale reads).
    if (out.state.gameOver) {
      void handleRunEnd(out.state);
    }
  }, [engine, replayRecorder, handleRunEnd]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

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

      {/* Animation overlays */}
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
            <ScoreDisplay score={engine.score} multiplier={engine.multiplier} />
          </View>
        )}

        {/* Result card (after run) */}
        {engine.gameOver && (
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
                {engine.score.toLocaleString()}
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
                <Pill variant="ember">{`×${engine.maxMultiplier} MAX COMBO`}</Pill>
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
                      <Trophy size={26} color={colors.mustard} strokeWidth={2.25} />
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

        {/* Board + pieces tray (GameSurface owns both) — shown during active run */}
        {tournamentStarted && (
          <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 8 }}>
            <GameSurface
              board={engine.board}
              pieces={engine.pieces}
              selectedPieceIndex={selectedPieceIndex}
              onSelectPiece={handleSelectPiece}
              onPlace={handlePlace}
              cascade={cascade}
              onCascadeComplete={() => setCascade(null)}
            />
          </View>
        )}

        {/* Hint text (mirrors Endless) */}
        {tournamentStarted && !engine.gameOver && (
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
        )}

        {/* Start Button — pre-game state. Hidden once today's puzzle is done. */}
        {!tournamentStarted && !hasPlayedToday && !engine.gameOver && (
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
        {!tournamentStarted && hasPlayedToday && !engine.gameOver && (
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

      {/* Paywall overlay */}
      <PaywallModal
        visible={showPaywall}
        source="archive"
        onDismiss={() => setShowPaywall(false)}
      />
    </SafeAreaView>
  );
}
