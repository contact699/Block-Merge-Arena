// Ranks Screen - Ranked ladder system
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  getPlayerRankData,
  getRankInfo,
  getCurrentSeason,
  getAllRanks,
  getRankProgress,
} from '@/lib/utils/ranks';
import type { PlayerRankData, RankInfo, Season } from '@/lib/types/ranks';

export default function RanksScreen() {
  const router = useRouter();
  const [rankData, setRankData] = useState<PlayerRankData | null>(null);
  const [currentRankInfo, setCurrentRankInfo] = useState<RankInfo | null>(null);
  const [season, setSeason] = useState<Season | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAllRanks, setShowAllRanks] = useState<boolean>(false);

  useEffect(() => {
    loadRankData();
  }, []);

  const loadRankData = async (): Promise<void> => {
    setLoading(true);
    try {
      const [data, currentSeason] = await Promise.all([getPlayerRankData(), getCurrentSeason()]);

      setRankData(data);
      setCurrentRankInfo(getRankInfo(data.currentRank));
      setSeason(currentSeason);
    } catch (error) {
      console.error('Error loading rank data:', error);
    }
    setLoading(false);
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysRemaining = (): number => {
    if (!season) return 0;
    const now = Date.now();
    const remaining = season.endDate - now;
    return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)));
  };

  const renderRankCard = (rankInfo: RankInfo, isCurrent: boolean = false) => (
    <View
      key={`${rankInfo.tier}-${rankInfo.division}`}
      className={`bg-gray-900/80 border rounded-xl p-4 mb-2 ${
        isCurrent ? 'border-purple-500' : 'border-gray-800'
      }`}
    >
      <View className="flex-row items-center gap-3">
        <View
          className={`w-12 h-12 rounded-full items-center justify-center ${
            isCurrent ? 'bg-purple-500/20' : 'bg-gray-800'
          }`}
          style={isCurrent ? { borderWidth: 2, borderColor: rankInfo.color } : undefined}
        >
          <Text className="text-2xl">{rankInfo.icon}</Text>
        </View>

        <View className="flex-1">
          <Text className="text-white text-lg font-bold">{rankInfo.displayName}</Text>
          {isCurrent && (
            <Text className="text-gray-400 text-xs">
              {rankInfo.pointsToNextRank
                ? `${rankInfo.pointsToNextRank} pts to ${rankInfo.nextRank}`
                : 'Max Rank!'}
            </Text>
          )}
        </View>

        {isCurrent && (
          <View className="bg-green-500 rounded-full px-3 py-1">
            <Text className="text-white text-xs font-bold">Current</Text>
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-black items-center justify-center">
        <Text className="text-purple-400 text-lg">Loading ranks...</Text>
      </SafeAreaView>
    );
  }

  if (!rankData || !currentRankInfo || !season) {
    return (
      <SafeAreaView className="flex-1 bg-black items-center justify-center">
        <Text className="text-gray-500">Failed to load rank data</Text>
      </SafeAreaView>
    );
  }

  const progress = getRankProgress(rankData.currentRank);
  const winRate = rankData.wins + rankData.losses > 0
    ? Math.round((rankData.wins / (rankData.wins + rankData.losses)) * 100)
    : 0;

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Header */}
        <View className="px-6 pt-4 pb-6 border-b border-gray-800">
          <Pressable onPress={() => router.back()}>
            <Text className="text-purple-400 text-base font-semibold">← Back</Text>
          </Pressable>

          <Text className="text-4xl font-black text-white mt-4">🏅 Ranked</Text>
          <Text className="text-gray-400 text-sm mt-1">Competitive ladder</Text>
        </View>

        {/* Season Info */}
        <View className="px-6 mt-6">
          <View className="bg-gray-900/80 border border-purple-500/50 rounded-xl p-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-white text-lg font-bold">{season.name}</Text>
              <View className="bg-red-500 rounded-full px-2 py-1">
                <Text className="text-white text-xs font-bold">{getDaysRemaining()}d left</Text>
              </View>
            </View>
            <Text className="text-gray-400 text-xs">
              Ends {formatDate(season.endDate)}
            </Text>
          </View>
        </View>

        {/* Current Rank Card */}
        <View className="px-6 mt-6">
          <View
            className="bg-gradient-to-br from-purple-900/40 to-black border-2 rounded-2xl p-6"
            style={{ borderColor: currentRankInfo.color }}
          >
            {/* Rank Badge */}
            <View className="items-center mb-4">
              <View
                className="w-24 h-24 rounded-full items-center justify-center mb-3"
                style={{ backgroundColor: `${currentRankInfo.color}20`, borderWidth: 3, borderColor: currentRankInfo.color }}
              >
                <Text className="text-5xl">{currentRankInfo.icon}</Text>
              </View>
              <Text className="text-white text-3xl font-black">{currentRankInfo.displayName}</Text>
              <Text className="text-gray-400 text-sm mt-1">
                {rankData.tournamentPoints.toLocaleString()} Tournament Points
              </Text>
            </View>

            {/* Progress Bar */}
            {currentRankInfo.nextRank && (
              <View className="mt-4">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-gray-400 text-xs">Progress to {currentRankInfo.nextRank}</Text>
                  <Text className="text-purple-400 text-xs font-bold">{progress}%</Text>
                </View>
                <View className="bg-gray-800 rounded-full h-3 overflow-hidden">
                  <View
                    className="h-full rounded-full"
                    style={{ width: `${progress}%`, backgroundColor: currentRankInfo.color }}
                  />
                </View>
                {currentRankInfo.pointsToNextRank && (
                  <Text className="text-gray-500 text-xs text-center mt-2">
                    {currentRankInfo.pointsToNextRank} rating points needed
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Stats */}
        <View className="px-6 mt-6">
          <Text className="text-gray-400 text-xs font-bold uppercase mb-3">Season Stats</Text>
          <View className="flex-row gap-3">
            {/* Wins */}
            <View className="flex-1 bg-gray-900/80 border border-gray-800 rounded-xl p-4">
              <Text className="text-green-400 text-2xl font-black">{rankData.wins}</Text>
              <Text className="text-gray-400 text-xs mt-1">Wins</Text>
            </View>

            {/* Losses */}
            <View className="flex-1 bg-gray-900/80 border border-gray-800 rounded-xl p-4">
              <Text className="text-red-400 text-2xl font-black">{rankData.losses}</Text>
              <Text className="text-gray-400 text-xs mt-1">Losses</Text>
            </View>

            {/* Win Rate */}
            <View className="flex-1 bg-gray-900/80 border border-gray-800 rounded-xl p-4">
              <Text className="text-purple-400 text-2xl font-black">{winRate}%</Text>
              <Text className="text-gray-400 text-xs mt-1">Win Rate</Text>
            </View>
          </View>
        </View>

        {/* Peak Rank */}
        <View className="px-6 mt-6">
          <View className="bg-gray-900/80 border border-yellow-600 rounded-xl p-4">
            <View className="flex-row items-center gap-3">
              <Text className="text-3xl">⭐</Text>
              <View className="flex-1">
                <Text className="text-yellow-400 text-sm font-bold uppercase">Peak Rank</Text>
                <Text className="text-white text-lg font-bold">
                  {getRankInfo(rankData.highestRank).displayName}
                </Text>
                <Text className="text-gray-400 text-xs">
                  {rankData.peakRating} Rating
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* All Ranks Button */}
        <View className="px-6 mt-6">
          <Pressable
            onPress={() => setShowAllRanks(!showAllRanks)}
            className="bg-gray-900 border border-purple-500/50 rounded-xl py-3"
          >
            <Text className="text-purple-400 text-center font-bold">
              {showAllRanks ? '🔼 Hide All Ranks' : '🔽 View All Ranks'}
            </Text>
          </Pressable>
        </View>

        {/* All Ranks List */}
        {showAllRanks && (
          <View className="px-6 mt-6">
            <Text className="text-gray-400 text-xs font-bold uppercase mb-3">All Ranks</Text>
            {getAllRanks()
              .reverse()
              .map((rank) =>
                renderRankCard(
                  rank,
                  rank.tier === currentRankInfo.tier && rank.division === currentRankInfo.division
                )
              )}
          </View>
        )}

        {/* How it Works */}
        <View className="px-6 mt-8">
          <View className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
            <Text className="text-purple-400 text-sm font-semibold mb-2">📊 How Ranking Works</Text>
            <Text className="text-gray-400 text-sm leading-5">
              • Compete in daily tournaments to earn rating points{'\n'}
              • Top 10% placement: +50 pts | Top 25%: +25 pts{'\n'}
              • Bottom 50%: -7 pts | Bottom 25%: -15 pts{'\n'}
              • Each division requires ~250 rating points{'\n'}
              • Seasons last 3 months, then soft reset (50% rating)
            </Text>
          </View>
        </View>

        {/* Rewards Info */}
        <View className="px-6 mt-4">
          <View className="bg-yellow-500/10 border border-yellow-600/30 rounded-xl p-4">
            <Text className="text-yellow-400 text-sm font-semibold mb-2">🎁 Rank Up Rewards</Text>
            <Text className="text-gray-400 text-sm leading-5">
              • Division IV: 50 coins{'\n'}
              • Division III: 100 coins{'\n'}
              • Division II: 200 coins{'\n'}
              • Division I: 300 coins + 10 gems{'\n'}
              • Tier bonuses: Silver +200c/10g, Gold +500c/25g, Platinum +1000c/50g, Diamond +2000c/100g
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
