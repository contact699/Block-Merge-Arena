// Leaderboard Screen - Local & Global high scores
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  getTopScores,
  getTopScoresByMode,
  getRecentGames,
  getGameStats,
  formatDate,
  type GameScore
} from '@/lib/utils/leaderboard';
import {
  getGlobalLeaderboard,
  isConfigured as isFirebaseConfigured,
  type LeaderboardEntry
} from '@/lib/firebase';

type TabType = 'all' | 'endless' | 'tournament' | 'recent';
type LeaderboardMode = 'local' | 'global';

export default function LeaderboardScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [leaderboardMode, setLeaderboardMode] = useState<LeaderboardMode>('local');
  const [scores, setScores] = useState<GameScore[]>([]);
  const [globalScores, setGlobalScores] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState({
    totalGames: 0,
    averageScore: 0,
    highScore: 0,
    gamesThisWeek: 0
  });
  const [loading, setLoading] = useState<boolean>(true);
  const isFirebaseAvailable = isFirebaseConfigured();

  useEffect(() => {
    loadData();
  }, [activeTab, leaderboardMode]);

  const loadData = async (): Promise<void> => {
    setLoading(true);
    try {
      // Always load local stats
      const gameStats = await getGameStats();
      setStats(gameStats);

      if (leaderboardMode === 'global' && isFirebaseAvailable) {
        // Load global leaderboard from Firebase
        const mode = activeTab === 'recent' ? 'all' : activeTab; // recent not supported in global
        const response = await getGlobalLeaderboard(mode, 100);
        setGlobalScores(response.entries);
      } else {
        // Load local scores
        let loadedScores: GameScore[] = [];
        if (activeTab === 'all') {
          loadedScores = await getTopScores(20);
        } else if (activeTab === 'endless') {
          loadedScores = await getTopScoresByMode('endless', 20);
        } else if (activeTab === 'tournament') {
          loadedScores = await getTopScoresByMode('tournament', 20);
        } else if (activeTab === 'recent') {
          loadedScores = await getRecentGames(20);
        }
        setScores(loadedScores);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
    setLoading(false);
  };

  const getModeIcon = (mode: string): string => {
    return mode === 'tournament' ? '🏆' : '🎮';
  };

  const getModeColor = (mode: string): string => {
    return mode === 'tournament' ? 'text-purple-400' : 'text-blue-400';
  };

  const getRankColor = (rank: number): string => {
    if (rank === 1) return 'text-yellow-400';
    if (rank === 2) return 'text-gray-300';
    if (rank === 3) return 'text-orange-400';
    return 'text-gray-500';
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Header */}
        <View className="px-6 pt-4 pb-6">
          <Pressable onPress={() => router.back()}>
            <Text className="text-purple-400 text-base font-semibold">← Back</Text>
          </Pressable>

          <Text className="text-4xl font-black text-white mt-4">
            🏅 Leaderboard
          </Text>
          <Text className="text-gray-400 text-sm mt-1">
            {leaderboardMode === 'global' ? 'Compete with players worldwide' : 'Your best scores and achievements'}
          </Text>
        </View>

        {/* Local/Global Toggle (only show if Firebase is configured) */}
        {isFirebaseAvailable && (
          <View className="px-6 mb-4">
            <View className="flex-row bg-gray-900 rounded-xl p-1">
              <Pressable
                onPress={() => setLeaderboardMode('local')}
                className={`flex-1 py-3 rounded-lg ${
                  leaderboardMode === 'local' ? 'bg-purple-500' : 'bg-transparent'
                }`}
              >
                <Text className={`text-center font-bold ${
                  leaderboardMode === 'local' ? 'text-white' : 'text-gray-500'
                }`}>
                  📱 My Scores
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setLeaderboardMode('global')}
                className={`flex-1 py-3 rounded-lg ${
                  leaderboardMode === 'global' ? 'bg-purple-500' : 'bg-transparent'
                }`}
              >
                <Text className={`text-center font-bold ${
                  leaderboardMode === 'global' ? 'text-white' : 'text-gray-500'
                }`}>
                  🌍 Global
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Stats Cards */}
        <View className="px-6 mb-6">
          <View className="flex-row gap-3">
            <View className="flex-1 bg-purple-500/20 border border-purple-500 rounded-xl p-4">
              <Text className="text-purple-400 text-xs uppercase font-semibold">High Score</Text>
              <Text className="text-white text-2xl font-bold mt-1">
                {stats.highScore.toLocaleString()}
              </Text>
            </View>

            <View className="flex-1 bg-blue-500/20 border border-blue-500 rounded-xl p-4">
              <Text className="text-blue-400 text-xs uppercase font-semibold">Total Games</Text>
              <Text className="text-white text-2xl font-bold mt-1">
                {stats.totalGames}
              </Text>
            </View>
          </View>

          <View className="flex-row gap-3 mt-3">
            <View className="flex-1 bg-green-500/20 border border-green-500 rounded-xl p-4">
              <Text className="text-green-400 text-xs uppercase font-semibold">Average</Text>
              <Text className="text-white text-2xl font-bold mt-1">
                {stats.averageScore.toLocaleString()}
              </Text>
            </View>

            <View className="flex-1 bg-orange-500/20 border border-orange-500 rounded-xl p-4">
              <Text className="text-orange-400 text-xs uppercase font-semibold">This Week</Text>
              <Text className="text-white text-2xl font-bold mt-1">
                {stats.gamesThisWeek}
              </Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View className="px-6 mb-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-full ${
                  activeTab === 'all' ? 'bg-purple-500' : 'bg-gray-800'
                }`}
              >
                <Text className={`font-semibold ${
                  activeTab === 'all' ? 'text-white' : 'text-gray-400'
                }`}>
                  All Time
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setActiveTab('endless')}
                className={`px-4 py-2 rounded-full ${
                  activeTab === 'endless' ? 'bg-purple-500' : 'bg-gray-800'
                }`}
              >
                <Text className={`font-semibold ${
                  activeTab === 'endless' ? 'text-white' : 'text-gray-400'
                }`}>
                  🎮 Endless
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setActiveTab('tournament')}
                className={`px-4 py-2 rounded-full ${
                  activeTab === 'tournament' ? 'bg-purple-500' : 'bg-gray-800'
                }`}
              >
                <Text className={`font-semibold ${
                  activeTab === 'tournament' ? 'text-white' : 'text-gray-400'
                }`}>
                  🏆 Tournament
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setActiveTab('recent')}
                className={`px-4 py-2 rounded-full ${
                  activeTab === 'recent' ? 'bg-purple-500' : 'bg-gray-800'
                }`}
              >
                <Text className={`font-semibold ${
                  activeTab === 'recent' ? 'text-white' : 'text-gray-400'
                }`}>
                  🕐 Recent
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>

        {/* Scores List */}
        <View className="px-6">
          {loading ? (
            <View className="items-center py-12">
              <Text className="text-gray-500">Loading...</Text>
            </View>
          ) : leaderboardMode === 'global' ? (
            // Global Leaderboard
            globalScores.length === 0 ? (
              <View className="items-center py-12 bg-gray-900/50 rounded-xl">
                <Text className="text-gray-500 text-lg font-semibold">No global scores yet</Text>
                <Text className="text-gray-600 text-sm mt-2">Be the first to compete!</Text>
              </View>
            ) : (
              <View className="bg-gray-900/50 rounded-xl overflow-hidden">
                {globalScores.map((entry: LeaderboardEntry, index: number) => (
                  <View
                    key={`${entry.userId}-${index}`}
                    className={`flex-row items-center px-4 py-4 border-b border-gray-800 ${
                      entry.isCurrentUser ? 'bg-purple-500/10' : ''
                    }`}
                  >
                    {/* Rank */}
                    <Text className={`text-2xl font-bold w-12 ${getRankColor(entry.rank)}`}>
                      {entry.rank}
                    </Text>

                    {/* Mode Icon (if not "all") */}
                    {activeTab !== 'all' && (
                      <Text className="text-2xl mx-2">
                        {getModeIcon(entry.mode)}
                      </Text>
                    )}

                    {/* Score Details */}
                    <View className="flex-1">
                      <Text className="text-white text-xl font-bold">
                        {entry.score.toLocaleString()}
                      </Text>
                      <Text className="text-gray-500 text-xs">
                        {entry.displayName}
                        {entry.maxMultiplier > 1 && (
                          <Text className="text-purple-400"> • {entry.maxMultiplier}x max</Text>
                        )}
                        {entry.isCurrentUser && (
                          <Text className="text-green-400"> • You</Text>
                        )}
                      </Text>
                    </View>

                    {/* Badge for top 3 */}
                    {entry.rank <= 3 && (
                      <View className={`w-8 h-8 rounded-full items-center justify-center ${
                        entry.rank === 1 ? 'bg-yellow-500' :
                        entry.rank === 2 ? 'bg-gray-400' :
                        'bg-orange-500'
                      }`}>
                        <Text className="text-white text-sm font-bold">{entry.rank}</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )
          ) : (
            // Local Scores
            scores.length === 0 ? (
              <View className="items-center py-12 bg-gray-900/50 rounded-xl">
                <Text className="text-gray-500 text-lg font-semibold">No scores yet</Text>
                <Text className="text-gray-600 text-sm mt-2">Play a game to get started!</Text>
              </View>
            ) : (
              <View className="bg-gray-900/50 rounded-xl overflow-hidden">
                {scores.map((scoreEntry: GameScore, index: number) => (
                  <View
                    key={scoreEntry.id}
                    className="flex-row items-center px-4 py-4 border-b border-gray-800"
                  >
                    {/* Rank */}
                    <Text className={`text-2xl font-bold w-12 ${getRankColor(index + 1)}`}>
                      {index + 1}
                    </Text>

                    {/* Mode Icon */}
                    <Text className="text-2xl mx-2">
                      {getModeIcon(scoreEntry.mode)}
                    </Text>

                    {/* Score Details */}
                    <View className="flex-1">
                      <Text className="text-white text-xl font-bold">
                        {scoreEntry.score.toLocaleString()}
                      </Text>
                      <Text className="text-gray-500 text-xs">
                        {formatDate(scoreEntry.date)}
                        {scoreEntry.maxMultiplier && scoreEntry.maxMultiplier > 1 && (
                          <Text className="text-purple-400"> • {scoreEntry.maxMultiplier}x max</Text>
                        )}
                      </Text>
                    </View>

                    {/* Badge for top 3 */}
                    {index < 3 && (
                      <View className={`w-8 h-8 rounded-full items-center justify-center ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        'bg-orange-500'
                      }`}>
                        <Text className="text-white text-sm font-bold">{index + 1}</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
