// Tournament Screen - 5-minute competitive mode
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { GameBoard } from '@/components/GameBoard';
import { PiecesSelector } from '@/components/BlockPiece';
import { ScoreDisplay } from '@/components/ScoreDisplay';
import { GemCounter } from '@/components/GemDisplay';
import { ComboAnimation, LineClearEffect, GemMergeEffect } from '@/components/ComboAnimation';
import { TournamentTimer, TournamentInfo } from '@/components/TournamentTimer';
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
  createDailyTournament,
  generateTournamentPieces,
  getDailySeed,
  getTodayDateString
} from '@/lib/utils/tournament';
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
import { getGameStats } from '@/lib/utils/leaderboard';
import { updateRankAfterTournament, getRankInfo } from '@/lib/utils/ranks';
import { awardTournamentXP } from '@/lib/utils/battlepass';
import { getPlayerSquadData, updateMemberScore } from '@/lib/utils/squad';
import type { GameBoard as GameBoardType, GamePiece, Gem } from '@/lib/types/game';
import type { Achievement } from '@/lib/types/achievements';
import type { RankInfo } from '@/lib/types/ranks';

export default function TournamentScreen() {
  const router = useRouter();
  const [board, setBoard] = useState<GameBoardType>(createEmptyBoard());
  const [pieces, setPieces] = useState<GamePiece[]>([]);
  const [selectedPieceIndex, setSelectedPieceIndex] = useState<number | undefined>(undefined);
  const [score, setScore] = useState<number>(0);
  const [multiplier, setMultiplier] = useState<number>(1);
  const [gems, setGems] = useState<Gem[]>([]);
  const [gameOver, setGameOver] = useState<boolean>(false);

  // Tournament specific
  const [tournamentStarted, setTournamentStarted] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(5 * 60 * 1000);
  const [tournamentDate] = useState<string>(getTodayDateString());
  const [seed] = useState<number>(getDailySeed());
  const [pieceSetIndex, setPieceSetIndex] = useState<number>(0);

  // Animation states
  const [showCombo, setShowCombo] = useState<{ points: number; multiplier: number } | null>(null);
  const [showLineClear, setShowLineClear] = useState<number | null>(null);
  const [showGemMerge, setShowGemMerge] = useState<{ count: number; size: 'small' | 'medium' | 'large' | 'mega'; color: string } | null>(null);

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
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);

  // Rank tracking
  const [rankChange, setRankChange] = useState<{
    oldRank: RankInfo;
    newRank: RankInfo;
    ratingChange: number;
    rankUp: boolean;
    rankDown: boolean;
    rewards?: { coins?: number; gems?: number };
  } | null>(null);

  // Battle Pass XP
  const [bpXPEarned, setBpXPEarned] = useState<{
    totalXP: number;
    baseXP: number;
    scoreXP: number;
    comboXP: number;
    dailyXP: number;
    oldLevel: number;
    newLevel: number;
    leveledUp: boolean;
  } | null>(null);

  // Initialize with tournament pieces
  useEffect(() => {
    const tournamentPieces = generateTournamentPieces(seed, 3);
    setPieces(tournamentPieces);
  }, [seed]);

  const startTournament = async (): Promise<void> => {
    setBoard(createEmptyBoard());
    const tournamentPieces = generateTournamentPieces(seed, 3);
    setPieces(tournamentPieces);
    setScore(0);
    setMultiplier(1);
    setGems([]);
    setGameOver(false);
    setSelectedPieceIndex(undefined);
    setTournamentStarted(true);
    setTimeRemaining(5 * 60 * 1000);
    setPieceSetIndex(0);
    setReplayCode(null);
    setMaxMultiplierReached(1);
    setUnlockedAchievements([]);
    setEarnedCoins(0);
    setRankChange(null);
    setBpXPEarned(null);

    // Initialize and start replay recording
    const userId = await getOrCreateUser();
    const recorder = new ReplayRecorder(userId, 'tournament', tournamentDate, seed);
    recorder.start();
    setReplayRecorder(recorder);
    console.log('🎥 Tournament replay recording started');
  };

  const handleTimeUp = async (): Promise<void> => {
    setGameOver(true);
    setTournamentStarted(false);

    // Stop replay recording
    if (replayRecorder && replayRecorder.isRecording()) {
      const replay = await replayRecorder.stop(score);
      if (replay) {
        setReplayCode(replay.code || null);
        console.log('🎥 Tournament replay saved:', replay.code);
      }
    }

    // Reward coins based on score
    const coins = await rewardCoinsForScore(score);
    setEarnedCoins(coins);
    console.log('🪙 Earned coins:', coins);

    // Save tournament score to leaderboard
    saveScore({
      id: `tournament-${Date.now()}`,
      score,
      mode: 'tournament',
      date: new Date().toISOString(),
      maxMultiplier: maxMultiplierReached
    });

    // Check achievements
    const stats = await getGameStats();
    const achievementsUnlocked = await checkAchievements({
      score,
      gamesPlayed: stats.totalGames,
      multiplier: maxMultiplierReached,
    });

    if (achievementsUnlocked.length > 0) {
      setUnlockedAchievements(achievementsUnlocked);
      console.log('🏆 Achievements unlocked:', achievementsUnlocked.map((a: Achievement) => a.name).join(', '));
    }

    // Award Battle Pass XP
    const bpXP = await awardTournamentXP(score, maxMultiplierReached);
    setBpXPEarned({
      totalXP: bpXP.totalXP,
      baseXP: bpXP.baseXP,
      scoreXP: bpXP.scoreXP,
      comboXP: bpXP.comboXP,
      dailyXP: bpXP.dailyXP,
      oldLevel: bpXP.levelProgress.oldLevel,
      newLevel: bpXP.levelProgress.newLevel,
      leveledUp: bpXP.levelProgress.leveledUp,
    });
    console.log(`🎫 Battle Pass XP earned: ${bpXP.totalXP}`);

    // Update squad score
    const userId = await getOrCreateUser();
    const playerSquadData = await getPlayerSquadData(userId);
    if (playerSquadData.currentSquadId) {
      await updateMemberScore(userId, playerSquadData.currentSquadId, score);
      console.log('🛡️ Squad score updated:', score);
    }

    // Load standings after game ends
    if (isFirebaseAvailable) {
      setTimeout(async () => {
        await loadStandings();
        setShowStandings(true);

        // Check tournament rank achievements and update rank after standings load
        const currentUserId = await getOrCreateUser();
        const userEntry = standings.find((e: TournamentEntry) => e.userId === currentUserId);
        if (userEntry && userEntry.rank) {
          // Update rank based on tournament performance
          const rankResult = await updateRankAfterTournament(
            userEntry.rank,
            standings.length,
            score
          );
          setRankChange(rankResult);
          console.log(`📊 Rank ${rankResult.rankUp ? 'UP' : rankResult.rankDown ? 'DOWN' : 'updated'}: ${rankResult.oldRank.displayName} → ${rankResult.newRank.displayName}`);

          // Check tournament rank achievements
          const rankAchievements = await checkAchievements({
            tournamentRank: userEntry.rank,
          });
          if (rankAchievements.length > 0) {
            setUnlockedAchievements((prev: Achievement[]) => [...prev, ...rankAchievements]);
            console.log('🏆 Rank achievements unlocked:', rankAchievements.map((a: Achievement) => a.name).join(', '));
          }
        }
      }, 2000); // Wait 2 seconds for score to propagate
    }
  };

  const handleTimerTick = (newTime: number): void => {
    setTimeRemaining(newTime);
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

    let newGems = gems;
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
      newGems = mergedGems;

      // Check for large merged gems
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
        { x: col, y: row },
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

    // Check for game over
    if (!hasValidMoves(newBoard, newPieces)) {
      setGameOver(true);
      setTournamentStarted(false);

      // Stop replay recording
      if (replayRecorder && replayRecorder.isRecording()) {
        replayRecorder.stop(newScore).then((replay) => {
          if (replay) {
            setReplayCode(replay.code || null);
            console.log('🎥 Tournament replay saved:', replay.code);
          }
        });
      }

      // Reward coins based on score
      rewardCoinsForScore(newScore).then((coins: number) => {
        setEarnedCoins(coins);
        console.log('🪙 Earned coins:', coins);
      });

      // Save tournament score to leaderboard
      saveScore({
        id: `tournament-${Date.now()}`,
        score: newScore,
        mode: 'tournament',
        date: new Date().toISOString(),
        maxMultiplier: newMultiplier
      });

      // Check achievements
      getGameStats().then(async (stats) => {
        const achievementsUnlocked = await checkAchievements({
          score: newScore,
          gamesPlayed: stats.totalGames,
          multiplier: maxMultiplierReached,
        });

        if (achievementsUnlocked.length > 0) {
          setUnlockedAchievements(achievementsUnlocked);
          console.log('🏆 Achievements unlocked:', achievementsUnlocked.map((a: Achievement) => a.name).join(', '));
        }
      });

      // Load standings after game ends
      if (isFirebaseAvailable) {
        setTimeout(async () => {
          await loadStandings();
          setShowStandings(true);

          // Check tournament rank achievements and update rank after standings load
          const currentUserId = await getOrCreateUser();
          const userEntry = standings.find((e: TournamentEntry) => e.userId === currentUserId);
          if (userEntry && userEntry.rank) {
            // Update rank based on tournament performance
            const rankResult = await updateRankAfterTournament(
              userEntry.rank,
              standings.length,
              newScore
            );
            setRankChange(rankResult);
            console.log(`📊 Rank ${rankResult.rankUp ? 'UP' : rankResult.rankDown ? 'DOWN' : 'updated'}: ${rankResult.oldRank.displayName} → ${rankResult.newRank.displayName}`);

            // Check tournament rank achievements
            const rankAchievements = await checkAchievements({
              tournamentRank: userEntry.rank,
            });
            if (rankAchievements.length > 0) {
              setUnlockedAchievements((prev: Achievement[]) => [...prev, ...rankAchievements]);
              console.log('🏆 Rank achievements unlocked:', rankAchievements.map((a: Achievement) => a.name).join(', '));
            }
          }
        }, 2000); // Wait 2 seconds for score to propagate
      }
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
        {/* Back Button */}
        <View className="px-6 pt-4">
          <Pressable onPress={() => router.back()}>
            <Text className="text-purple-400 text-base font-semibold">← Back</Text>
          </Pressable>
        </View>

        {/* Tournament Info */}
        <View className="px-6 mt-4">
          <TournamentInfo date={tournamentDate} />
        </View>

        {/* View Standings Button (only if Firebase is available) */}
        {isFirebaseAvailable && !tournamentStarted && (
          <View className="px-6 mt-4">
            <Pressable
              onPress={toggleStandings}
              className="bg-gray-900 border border-purple-500 rounded-xl py-3 px-4"
            >
              <Text className="text-purple-400 text-center text-sm font-semibold">
                {showStandings ? '📊 Hide Standings' : '📊 View Live Standings'}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Tournament Standings */}
        {showStandings && !tournamentStarted && (
          <View className="px-6 mt-4">
            <View className="bg-gray-900/80 border border-purple-500/30 rounded-xl p-4">
              <Text className="text-purple-400 text-xl font-bold text-center mb-3">
                🏆 Today's Rankings
              </Text>

              {loadingStandings ? (
                <View className="items-center py-6">
                  <Text className="text-gray-500">Loading standings...</Text>
                </View>
              ) : standings.length === 0 ? (
                <View className="items-center py-6">
                  <Text className="text-gray-500 text-center">
                    No scores yet. Be the first to compete!
                  </Text>
                </View>
              ) : (
                <View>
                  {standings.slice(0, 10).map((entry: TournamentEntry, index: number) => (
                    <View
                      key={entry.userId}
                      className={`flex-row items-center py-3 border-b border-gray-800 ${
                        index < standings.length - 1 ? '' : 'border-b-0'
                      }`}
                    >
                      {/* Rank */}
                      <Text className={`text-xl font-bold w-10 ${
                        entry.rank === 1 ? 'text-yellow-400' :
                        entry.rank === 2 ? 'text-gray-300' :
                        entry.rank === 3 ? 'text-orange-400' :
                        'text-gray-500'
                      }`}>
                        {entry.rank}
                      </Text>

                      {/* Score */}
                      <View className="flex-1">
                        <Text className="text-white text-lg font-bold">
                          {entry.score.toLocaleString()}
                        </Text>
                        <Text className="text-gray-500 text-xs">
                          {entry.maxMultiplier}x multiplier
                        </Text>
                      </View>

                      {/* Badge for top 3 */}
                      {entry.rank && entry.rank <= 3 && (
                        <View className={`w-7 h-7 rounded-full items-center justify-center ${
                          entry.rank === 1 ? 'bg-yellow-500' :
                          entry.rank === 2 ? 'bg-gray-400' :
                          'bg-orange-500'
                        }`}>
                          <Text className="text-white text-xs font-bold">{entry.rank}</Text>
                        </View>
                      )}
                    </View>
                  ))}

                  {standings.length > 10 && (
                    <Text className="text-gray-500 text-xs text-center mt-3">
                      Showing top 10 of {standings.length} players
                    </Text>
                  )}
                </View>
              )}
            </View>
          </View>
        )}

        {/* Timer */}
        {tournamentStarted && (
          <View className="px-6 mt-4">
            <TournamentTimer
              timeRemaining={timeRemaining}
              onTick={handleTimerTick}
              onTimeUp={handleTimeUp}
              isActive={tournamentStarted && !gameOver}
            />
          </View>
        )}

        {/* Score Display */}
        {tournamentStarted && (
          <View className="mt-4">
            <ScoreDisplay score={score} multiplier={multiplier} />
          </View>
        )}

        {/* Game Over Message */}
        {gameOver && (
          <View className="px-6 mt-4">
            <View className="bg-purple-500/20 border border-purple-500 rounded-xl p-4">
              <Text className="text-purple-400 text-center text-2xl font-bold">
                Tournament Complete!
              </Text>
              <Text className="text-white text-center text-4xl font-bold mt-3">
                {score.toLocaleString()}
              </Text>
              <Text className="text-gray-300 text-center text-sm mt-2">
                Final Score
              </Text>
              <Text className="text-gray-400 text-center text-xs mt-3">
                Your score will be added to the leaderboard
              </Text>

              {/* Coins Earned */}
              {earnedCoins > 0 && (
                <View className="mt-4 pt-3 border-t border-purple-500/30">
                  <Text className="text-gray-400 text-center text-xs mb-2">
                    💰 Rewards
                  </Text>
                  <View className="bg-yellow-500/20 border border-yellow-600 rounded-lg py-2 px-4">
                    <Text className="text-yellow-400 text-center text-xl font-bold">
                      +{earnedCoins} Coins
                    </Text>
                  </View>
                  <Text className="text-gray-500 text-center text-xs mt-2">
                    Use coins in the Shop to buy cosmetics!
                  </Text>
                </View>
              )}

              {/* Replay Code */}
              {replayCode && (
                <View className="mt-4 pt-3 border-t border-purple-500/30">
                  <Text className="text-gray-400 text-center text-xs mb-2">
                    👻 Replay Code
                  </Text>
                  <View className="bg-black/40 rounded-lg py-2 px-4">
                    <Text className="text-white text-center text-2xl font-bold tracking-wider">
                      {replayCode}
                    </Text>
                  </View>
                  <Text className="text-gray-500 text-center text-xs mt-2">
                    Share this code to let others watch your run!
                  </Text>
                </View>
              )}

              {/* Rank Change */}
              {rankChange && (
                <View className="mt-4 pt-3 border-t border-purple-500/30">
                  <Text className="text-gray-400 text-center text-xs mb-2">
                    📊 Rank Update
                  </Text>
                  <View
                    className={`rounded-lg p-3 border ${
                      rankChange.rankUp
                        ? 'bg-green-500/20 border-green-500'
                        : rankChange.rankDown
                        ? 'bg-red-500/20 border-red-500'
                        : 'bg-gray-800 border-gray-700'
                    }`}
                  >
                    <View className="flex-row items-center justify-center gap-2 mb-2">
                      <View className="items-center">
                        <Text className="text-2xl">{rankChange.oldRank.icon}</Text>
                        <Text className="text-white text-xs font-bold mt-1">
                          {rankChange.oldRank.displayName}
                        </Text>
                      </View>

                      <Text className="text-white text-xl mx-2">→</Text>

                      <View className="items-center">
                        <Text className="text-2xl">{rankChange.newRank.icon}</Text>
                        <Text className="text-white text-xs font-bold mt-1">
                          {rankChange.newRank.displayName}
                        </Text>
                      </View>
                    </View>

                    <Text
                      className={`text-center text-sm font-bold ${
                        rankChange.ratingChange > 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {rankChange.ratingChange > 0 ? '+' : ''}
                      {rankChange.ratingChange} Rating
                    </Text>

                    {rankChange.rewards && (rankChange.rewards.coins || rankChange.rewards.gems) && (
                      <View className="flex-row items-center justify-center gap-3 mt-2 pt-2 border-t border-gray-700">
                        <Text className="text-gray-400 text-xs">Rank Up Rewards:</Text>
                        {rankChange.rewards.coins && (
                          <Text className="text-yellow-400 text-xs font-semibold">
                            +{rankChange.rewards.coins} 🪙
                          </Text>
                        )}
                        {rankChange.rewards.gems && (
                          <Text className="text-purple-400 text-xs font-semibold">
                            +{rankChange.rewards.gems} 💎
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Battle Pass XP */}
              {bpXPEarned && (
                <View className="mt-4 pt-3 border-t border-purple-500/30">
                  <Text className="text-gray-400 text-center text-xs mb-2">
                    🎫 Battle Pass XP
                  </Text>
                  <View className="bg-blue-500/20 border border-blue-500 rounded-lg p-3">
                    <View className="items-center mb-2">
                      <Text className="text-blue-400 text-2xl font-black">
                        +{bpXPEarned.totalXP} XP
                      </Text>
                      {bpXPEarned.leveledUp && (
                        <View className="bg-yellow-500/20 border border-yellow-600 rounded-full px-3 py-1 mt-2">
                          <Text className="text-yellow-400 text-xs font-bold">
                            🎉 Level {bpXPEarned.oldLevel} → {bpXPEarned.newLevel}!
                          </Text>
                        </View>
                      )}
                      {!bpXPEarned.leveledUp && (
                        <Text className="text-gray-400 text-xs mt-1">
                          Battle Pass Level {bpXPEarned.newLevel}
                        </Text>
                      )}
                    </View>

                    <View className="flex-row items-center justify-center gap-2 flex-wrap">
                      <Text className="text-gray-400 text-xs">
                        Base: +{bpXPEarned.baseXP}
                      </Text>
                      <Text className="text-gray-500">•</Text>
                      <Text className="text-gray-400 text-xs">
                        Score: +{bpXPEarned.scoreXP}
                      </Text>
                      {bpXPEarned.comboXP > 0 && (
                        <>
                          <Text className="text-gray-500">•</Text>
                          <Text className="text-blue-400 text-xs font-semibold">
                            Combo: +{bpXPEarned.comboXP}
                          </Text>
                        </>
                      )}
                      {bpXPEarned.dailyXP > 0 && (
                        <>
                          <Text className="text-gray-500">•</Text>
                          <Text className="text-yellow-400 text-xs font-semibold">
                            Daily: +{bpXPEarned.dailyXP}
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                </View>
              )}

              {/* Unlocked Achievements */}
              {unlockedAchievements.length > 0 && (
                <View className="mt-4 pt-3 border-t border-purple-500/30">
                  <Text className="text-gray-400 text-center text-xs mb-2">
                    🏆 Achievements Unlocked
                  </Text>
                  <View className="gap-2">
                    {unlockedAchievements.map((achievement: Achievement) => (
                      <View
                        key={achievement.id}
                        className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500 rounded-lg p-3"
                      >
                        <View className="flex-row items-center gap-3">
                          <Text className="text-3xl">{achievement.icon}</Text>
                          <View className="flex-1">
                            <Text className="text-white text-base font-bold">
                              {achievement.name}
                            </Text>
                            <Text className="text-gray-400 text-xs mt-1">
                              {achievement.description}
                            </Text>
                            {(achievement.rewards.coins || achievement.rewards.gems) && (
                              <View className="flex-row items-center gap-2 mt-2">
                                {achievement.rewards.coins && (
                                  <Text className="text-yellow-400 text-xs font-semibold">
                                    +{achievement.rewards.coins} 🪙
                                  </Text>
                                )}
                                {achievement.rewards.gems && (
                                  <Text className="text-purple-400 text-xs font-semibold">
                                    +{achievement.rewards.gems} 💎
                                  </Text>
                                )}
                              </View>
                            )}
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Gem Counter */}
        {gems.length > 0 && tournamentStarted && (
          <View className="px-6 mt-4">
            <GemCounter gems={gems} />
          </View>
        )}

        {/* Game Board */}
        {tournamentStarted && (
          <View className="items-center mt-6 mb-6">
            <GameBoard
              board={board}
              onCellPress={handleCellPress}
            />
          </View>
        )}

        {/* Instructions */}
        {tournamentStarted && selectedPieceIndex === undefined && !gameOver && (
          <Text className="text-gray-400 text-center text-sm px-6 mb-4">
            Select a piece below, then tap the board to place it
          </Text>
        )}

        {tournamentStarted && selectedPieceIndex !== undefined && !gameOver && (
          <Text className="text-purple-400 text-center text-sm px-6 mb-4 font-semibold">
            Tap the board to place your piece
          </Text>
        )}

        {/* Pieces Selector */}
        {pieces.length > 0 && tournamentStarted && !gameOver && (
          <View className="px-6 mb-6">
            <PiecesSelector
              pieces={pieces}
              onPieceSelect={handlePieceSelect}
              selectedIndex={selectedPieceIndex}
            />
          </View>
        )}

        {/* Start/Restart Button */}
        {!tournamentStarted && (
          <View className="px-6 mt-6">
            <Pressable
              onPress={startTournament}
              className="bg-purple-500 rounded-xl py-4 px-8"
            >
              <Text className="text-white text-center text-lg font-bold">
                {gameOver ? '🔄 Play Again' : '🏁 Start Tournament'}
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
