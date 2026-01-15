// Tutorials Screen - Browse and start tutorials
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ALL_TUTORIALS } from '@/lib/tutorial/catalog';
import {
  getTutorialProgress,
  startTutorial,
  getTutorialStats,
  resetTutorialProgress,
} from '@/lib/utils/tutorial';
import type { TutorialFlow } from '@/lib/types/tutorial';
import type { TutorialProgress } from '@/lib/types/tutorial';

export default function TutorialsScreen() {
  const router = useRouter();
  const [progress, setProgress] = useState<TutorialProgress | null>(null);
  const [stats, setStats] = useState({ total: 0, completed: 0, remaining: 0, percentage: 0 });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async (): Promise<void> => {
    setLoading(true);
    try {
      const [progressData, statsData] = await Promise.all([
        getTutorialProgress(),
        getTutorialStats(),
      ]);
      setProgress(progressData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading tutorial progress:', error);
    }
    setLoading(false);
  };

  const handleStartTutorial = async (tutorialId: string): Promise<void> => {
    try {
      await startTutorial(tutorialId);
      // Navigate to appropriate screen based on tutorial
      switch (tutorialId) {
        case 'welcome':
          // Show welcome tutorial inline
          break;
        case 'basic_gameplay':
        case 'gem_merge':
          router.push('/game');
          break;
        case 'powerups':
          // Navigate to power-ups screen (when implemented)
          break;
        case 'tournament':
          router.push('/tournament');
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error starting tutorial:', error);
    }
  };

  const handleResetProgress = async (): Promise<void> => {
    try {
      await resetTutorialProgress();
      await loadProgress();
      console.log('Tutorial progress reset!');
    } catch (error) {
      console.error('Error resetting progress:', error);
    }
  };

  const isTutorialCompleted = (tutorialId: string): boolean => {
    return progress?.completedTutorials.includes(tutorialId) || false;
  };

  const renderTutorialCard = (tutorial: TutorialFlow) => {
    const completed = isTutorialCompleted(tutorial.id);

    return (
      <Pressable
        key={tutorial.id}
        onPress={() => !completed && handleStartTutorial(tutorial.id)}
        disabled={completed}
        className={`bg-gray-900/80 border rounded-xl p-4 mb-3 ${
          completed ? 'border-green-500/50' : 'border-gray-800'
        }`}
      >
        <View className="flex-row items-center gap-4">
          {/* Icon */}
          <View
            className={`w-16 h-16 rounded-xl items-center justify-center ${
              completed ? 'bg-green-500/20' : 'bg-purple-500/20'
            }`}
          >
            <Text className="text-4xl">{tutorial.icon}</Text>
          </View>

          {/* Info */}
          <View className="flex-1">
            <View className="flex-row items-center gap-2 mb-1">
              <Text className="text-white text-lg font-bold">{tutorial.name}</Text>
              {completed && (
                <View className="bg-green-500 rounded-full w-6 h-6 items-center justify-center">
                  <Text className="text-white text-xs font-bold">✓</Text>
                </View>
              )}
            </View>

            <Text className="text-gray-400 text-sm mb-2">
              {tutorial.description}
            </Text>

            <View className="flex-row items-center gap-2">
              <Text className="text-purple-400 text-xs font-semibold">
                {tutorial.steps.length} steps
              </Text>

              {/* Rewards */}
              {tutorial.rewards && (
                <>
                  {tutorial.rewards.coins && (
                    <Text className="text-yellow-400 text-xs font-semibold">
                      • {tutorial.rewards.coins} 🪙
                    </Text>
                  )}
                  {tutorial.rewards.gems && (
                    <Text className="text-purple-400 text-xs font-semibold">
                      • {tutorial.rewards.gems} 💎
                    </Text>
                  )}
                </>
              )}
            </View>
          </View>

          {/* Status */}
          {!completed && (
            <View className="items-end">
              <View className="bg-purple-500 rounded-lg px-3 py-1">
                <Text className="text-white text-xs font-bold">Start</Text>
              </View>
            </View>
          )}
        </View>
      </Pressable>
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

          <Text className="text-4xl font-black text-white mt-4">📚 Tutorials</Text>
          <Text className="text-gray-400 text-sm mt-1">Learn how to dominate</Text>
        </View>

        {/* Progress Stats */}
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
              {stats.completed} of {stats.total} tutorials completed
            </Text>
          </View>
        </View>

        {/* Tutorials List */}
        <View className="px-6 mt-6">
          <Text className="text-gray-400 text-xs font-bold uppercase mb-3">
            Available Tutorials
          </Text>

          {loading ? (
            <View className="items-center py-12">
              <Text className="text-gray-500">Loading tutorials...</Text>
            </View>
          ) : (
            <View>{ALL_TUTORIALS.map(renderTutorialCard)}</View>
          )}
        </View>

        {/* Reset Button (for development/testing) */}
        {__DEV__ && stats.completed > 0 && (
          <View className="px-6 mt-6">
            <Pressable
              onPress={handleResetProgress}
              className="bg-red-500/20 border border-red-500 rounded-xl py-3"
            >
              <Text className="text-red-400 text-center font-bold">
                🔄 Reset Tutorial Progress (Dev Only)
              </Text>
            </Pressable>
          </View>
        )}

        {/* Tips */}
        <View className="px-6 mt-8">
          <View className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
            <Text className="text-purple-400 text-sm font-semibold mb-2">💡 Pro Tip</Text>
            <Text className="text-gray-400 text-sm">
              Complete all tutorials to master the game and earn bonus rewards! Each tutorial
              teaches you essential strategies to climb the leaderboards.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
