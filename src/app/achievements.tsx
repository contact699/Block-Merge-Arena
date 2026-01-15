// Achievements Screen
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getAchievements, getAchievementStats } from '@/lib/utils/achievements';
import { getRarityColor } from '@/lib/shop/catalog';
import type { Achievement, AchievementCategory } from '@/lib/types/achievements';

type TabType = 'all' | AchievementCategory;

export default function AchievementsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [filteredAchievements, setFilteredAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, percentage: 0 });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadAchievements();
  }, []);

  useEffect(() => {
    filterAchievements();
  }, [activeTab, achievements]);

  const loadAchievements = async (): Promise<void> => {
    setLoading(true);
    try {
      const [loadedAchievements, achievementStats] = await Promise.all([
        getAchievements(),
        getAchievementStats(),
      ]);

      setAchievements(loadedAchievements);
      setStats(achievementStats);
    } catch (error) {
      console.error('Error loading achievements:', error);
    }
    setLoading(false);
  };

  const filterAchievements = (): void => {
    if (activeTab === 'all') {
      setFilteredAchievements(achievements);
    } else {
      setFilteredAchievements(achievements.filter((a: Achievement) => a.category === activeTab));
    }
  };

  const getProgressPercentage = (achievement: Achievement): number => {
    return Math.min(100, Math.round((achievement.currentProgress / achievement.requirement) * 100));
  };

  const renderAchievement = (achievement: Achievement) => {
    const progress = getProgressPercentage(achievement);
    const rarityColor = getRarityColor(achievement.rarity);

    return (
      <View
        key={achievement.id}
        className={`bg-gray-900/80 border rounded-xl p-4 mb-3 ${
          achievement.completed ? 'border-purple-500' : 'border-gray-800'
        }`}
      >
        {/* Header */}
        <View className="flex-row items-center mb-3">
          {/* Icon */}
          <View
            className={`w-16 h-16 rounded-xl items-center justify-center mr-4 ${
              achievement.completed ? 'bg-purple-500/20' : 'bg-gray-800'
            }`}
            style={
              achievement.completed
                ? { borderWidth: 2, borderColor: rarityColor }
                : undefined
            }
          >
            <Text className="text-4xl">{achievement.icon}</Text>
          </View>

          {/* Info */}
          <View className="flex-1">
            <View className="flex-row items-center gap-2 mb-1">
              <Text className="text-white text-lg font-bold">{achievement.name}</Text>
              {achievement.completed && (
                <View className="bg-green-500 rounded-full w-6 h-6 items-center justify-center">
                  <Text className="text-white text-xs font-bold">✓</Text>
                </View>
              )}
            </View>

            <Text className="text-gray-400 text-sm">{achievement.description}</Text>

            {/* Rarity Badge */}
            <View
              className="mt-2 self-start px-2 py-1 rounded"
              style={{ backgroundColor: `${rarityColor}20` }}
            >
              <Text style={{ color: rarityColor }} className="text-xs font-bold uppercase">
                {achievement.rarity}
              </Text>
            </View>
          </View>
        </View>

        {/* Progress Bar */}
        {!achievement.completed && (
          <View className="mb-3">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-gray-500 text-xs">Progress</Text>
              <Text className="text-gray-400 text-xs font-semibold">
                {achievement.currentProgress} / {achievement.requirement}
              </Text>
            </View>
            <View className="bg-gray-800 rounded-full h-2 overflow-hidden">
              <View
                className="bg-purple-500 h-full rounded-full"
                style={{ width: `${progress}%` }}
              />
            </View>
          </View>
        )}

        {/* Rewards */}
        <View className="flex-row items-center gap-4 pt-3 border-t border-gray-800">
          <Text className="text-gray-500 text-xs">Rewards:</Text>
          {achievement.rewards.coins && (
            <View className="flex-row items-center gap-1">
              <Text className="text-yellow-400 text-sm">🪙</Text>
              <Text className="text-yellow-400 text-sm font-semibold">
                {achievement.rewards.coins}
              </Text>
            </View>
          )}
          {achievement.rewards.gems && (
            <View className="flex-row items-center gap-1">
              <Text className="text-purple-400 text-sm">💎</Text>
              <Text className="text-purple-400 text-sm font-semibold">
                {achievement.rewards.gems}
              </Text>
            </View>
          )}
        </View>

        {/* Unlocked Date */}
        {achievement.completed && achievement.unlockedAt && (
          <Text className="text-gray-600 text-xs mt-2">
            Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
          </Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Header */}
        <View className="px-6 pt-4 pb-6 border-b border-gray-800">
          <Pressable onPress={() => router.back()}>
            <Text className="text-purple-400 text-base font-semibold">← Back</Text>
          </Pressable>

          <Text className="text-4xl font-black text-white mt-4">🏆 Achievements</Text>
          <Text className="text-gray-400 text-sm mt-1">Track your progress</Text>
        </View>

        {/* Stats */}
        <View className="px-6 mt-6">
          <View className="bg-gray-900/80 border border-purple-500 rounded-xl p-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-white text-lg font-bold">Your Progress</Text>
              <Text className="text-purple-400 text-3xl font-black">{stats.percentage}%</Text>
            </View>

            <View className="bg-gray-800 rounded-full h-3 overflow-hidden mb-3">
              <View
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full"
                style={{ width: `${stats.percentage}%` }}
              />
            </View>

            <Text className="text-gray-400 text-sm text-center">
              {stats.completed} of {stats.total} achievements unlocked
            </Text>
          </View>
        </View>

        {/* Tabs */}
        <View className="px-6 mt-6">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-full ${
                  activeTab === 'all' ? 'bg-purple-500' : 'bg-gray-800'
                }`}
              >
                <Text
                  className={`font-semibold ${
                    activeTab === 'all' ? 'text-white' : 'text-gray-400'
                  }`}
                >
                  All
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setActiveTab('score')}
                className={`px-4 py-2 rounded-full ${
                  activeTab === 'score' ? 'bg-purple-500' : 'bg-gray-800'
                }`}
              >
                <Text
                  className={`font-semibold ${
                    activeTab === 'score' ? 'text-white' : 'text-gray-400'
                  }`}
                >
                  🎯 Score
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setActiveTab('games')}
                className={`px-4 py-2 rounded-full ${
                  activeTab === 'games' ? 'bg-purple-500' : 'bg-gray-800'
                }`}
              >
                <Text
                  className={`font-semibold ${
                    activeTab === 'games' ? 'text-white' : 'text-gray-400'
                  }`}
                >
                  🎮 Games
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setActiveTab('combos')}
                className={`px-4 py-2 rounded-full ${
                  activeTab === 'combos' ? 'bg-purple-500' : 'bg-gray-800'
                }`}
              >
                <Text
                  className={`font-semibold ${
                    activeTab === 'combos' ? 'text-white' : 'text-gray-400'
                  }`}
                >
                  🔥 Combos
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setActiveTab('tournament')}
                className={`px-4 py-2 rounded-full ${
                  activeTab === 'tournament' ? 'bg-purple-500' : 'bg-gray-800'
                }`}
              >
                <Text
                  className={`font-semibold ${
                    activeTab === 'tournament' ? 'text-white' : 'text-gray-400'
                  }`}
                >
                  🏆 Tournament
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setActiveTab('special')}
                className={`px-4 py-2 rounded-full ${
                  activeTab === 'special' ? 'bg-purple-500' : 'bg-gray-800'
                }`}
              >
                <Text
                  className={`font-semibold ${
                    activeTab === 'special' ? 'text-white' : 'text-gray-400'
                  }`}
                >
                  ✨ Special
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>

        {/* Achievements List */}
        <View className="px-6 mt-6">
          {loading ? (
            <View className="items-center py-12">
              <Text className="text-gray-500">Loading achievements...</Text>
            </View>
          ) : filteredAchievements.length === 0 ? (
            <View className="items-center py-12 bg-gray-900/50 rounded-xl">
              <Text className="text-gray-500 text-lg font-semibold">No achievements yet</Text>
              <Text className="text-gray-600 text-sm mt-2">Start playing to unlock them!</Text>
            </View>
          ) : (
            <View>{filteredAchievements.map(renderAchievement)}</View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
