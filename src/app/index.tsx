import { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTodayDateString } from '@/lib/utils/tournament';
import { hasCompletedWelcome } from '@/lib/utils/tutorial';

export default function HomeScreen() {
  const router = useRouter();
  const todayDate = getTodayDateString();
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    checkFirstTime();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkFirstTime = async (): Promise<void> => {
    const completedWelcome = await hasCompletedWelcome();
    if (!completedWelcome) {
      // First time user - redirect to welcome screen
      router.replace('/welcome');
    } else {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-black items-center justify-center">
        <Text className="text-purple-400 text-lg">Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView testID="home-screen" className="flex-1 bg-black">
      {/* Settings Button - Top Right */}
      <View className="absolute top-4 right-6 z-10">
        <Link href="/settings" asChild>
          <Pressable testID="settings-button" className="bg-gray-900 border border-gray-700 rounded-full p-3 active:scale-95">
            <Text className="text-2xl">⚙️</Text>
          </Pressable>
        </Link>
      </View>

      <View className="flex-1 items-center justify-center p-6">
        {/* Title */}
        <View className="items-center mb-12">
          <Text className="text-6xl font-black text-purple-400 mb-2">
            Block Merge
          </Text>
          <Text className="text-4xl font-black text-white">
            Arena
          </Text>
          <Text className="text-base text-gray-400 mt-3 tracking-widest uppercase">
            Competitive • Strategic • Addictive
          </Text>
        </View>

        {/* Main Buttons */}
        <View className="w-full max-w-sm space-y-4">
          {/* Tournament Mode */}
          <Link href="/tournament" asChild>
            <Pressable testID="tournament-button" className="bg-gradient-to-r from-purple-600 to-pink-600 p-[2px] rounded-2xl active:scale-95">
              <View className="bg-black rounded-2xl px-8 py-6">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-2xl font-bold text-white">🏆 Tournament</Text>
                  <View className="bg-red-500 px-2 py-1 rounded-full">
                    <Text className="text-white text-xs font-bold">LIVE</Text>
                  </View>
                </View>
                <Text className="text-gray-400 text-sm">
                  Compete globally • Same pieces for all
                </Text>
                <Text className="text-purple-400 text-xs mt-2">
                  Today: {todayDate}
                </Text>
              </View>
            </Pressable>
          </Link>

          {/* Endless Mode */}
          <Link href="/game" asChild>
            <Pressable testID="endless-mode-button" className="border-2 border-purple-500 rounded-2xl px-8 py-6 active:scale-95">
              <Text className="text-2xl font-bold text-white mb-2">
                🎮 Endless Mode
              </Text>
              <Text className="text-gray-400 text-sm">
                Practice • No time limit • Beat your high score
              </Text>
            </Pressable>
          </Link>

          {/* Leaderboard */}
          <Link href="/leaderboard" asChild>
            <Pressable testID="leaderboard-button" className="border border-gray-700 rounded-2xl px-8 py-4 active:scale-95">
              <View className="flex-row items-center justify-center">
                <Text className="text-xl font-bold text-gray-300 mr-2">🏅</Text>
                <Text className="text-xl font-bold text-gray-300">Leaderboard</Text>
              </View>
            </Pressable>
          </Link>

          {/* Replays */}
          <Link href="/replays" asChild>
            <Pressable testID="replays-button" className="border border-gray-700 rounded-2xl px-8 py-4 active:scale-95">
              <View className="flex-row items-center justify-center">
                <Text className="text-xl font-bold text-gray-300 mr-2">👻</Text>
                <Text className="text-xl font-bold text-gray-300">Replays</Text>
              </View>
            </Pressable>
          </Link>

          {/* Shop */}
          <Link href="/shop" asChild>
            <Pressable testID="shop-button" className="border border-gray-700 rounded-2xl px-8 py-4 active:scale-95">
              <View className="flex-row items-center justify-center">
                <Text className="text-xl font-bold text-gray-300 mr-2">🛒</Text>
                <Text className="text-xl font-bold text-gray-300">Shop</Text>
              </View>
            </Pressable>
          </Link>

          {/* Achievements */}
          <Link href="/achievements" asChild>
            <Pressable testID="achievements-button" className="border border-gray-700 rounded-2xl px-8 py-4 active:scale-95">
              <View className="flex-row items-center justify-center">
                <Text className="text-xl font-bold text-gray-300 mr-2">🏆</Text>
                <Text className="text-xl font-bold text-gray-300">Achievements</Text>
              </View>
            </Pressable>
          </Link>

          {/* Tutorials */}
          <Link href="/tutorials" asChild>
            <Pressable testID="tutorials-button" className="border border-gray-700 rounded-2xl px-8 py-4 active:scale-95">
              <View className="flex-row items-center justify-center">
                <Text className="text-xl font-bold text-gray-300 mr-2">📚</Text>
                <Text className="text-xl font-bold text-gray-300">Tutorials</Text>
              </View>
            </Pressable>
          </Link>

          {/* Ranked */}
          <Link href="/ranks" asChild>
            <Pressable testID="ranks-button" className="border border-gray-700 rounded-2xl px-8 py-4 active:scale-95">
              <View className="flex-row items-center justify-center">
                <Text className="text-xl font-bold text-gray-300 mr-2">🏅</Text>
                <Text className="text-xl font-bold text-gray-300">Ranked</Text>
              </View>
            </Pressable>
          </Link>

          {/* Battle Pass */}
          <Link href="/battlepass" asChild>
            <Pressable testID="battlepass-button" className="border border-gray-700 rounded-2xl px-8 py-4 active:scale-95">
              <View className="flex-row items-center justify-center">
                <Text className="text-xl font-bold text-gray-300 mr-2">🎫</Text>
                <Text className="text-xl font-bold text-gray-300">Battle Pass</Text>
              </View>
            </Pressable>
          </Link>

          {/* Squads */}
          <Link href="/squads" asChild>
            <Pressable testID="squads-button" className="border border-gray-700 rounded-2xl px-8 py-4 active:scale-95">
              <View className="flex-row items-center justify-center">
                <Text className="text-xl font-bold text-gray-300 mr-2">🛡️</Text>
                <Text className="text-xl font-bold text-gray-300">Squads</Text>
              </View>
            </Pressable>
          </Link>

          {/* Friends */}
          <Link href="/friends" asChild>
            <Pressable testID="friends-button" className="border border-gray-700 rounded-2xl px-8 py-4 active:scale-95">
              <View className="flex-row items-center justify-center">
                <Text className="text-xl font-bold text-gray-300 mr-2">👥</Text>
                <Text className="text-xl font-bold text-gray-300">Friends</Text>
              </View>
            </Pressable>
          </Link>

          {/* Share / TikTok */}
          <Link href="/share" asChild>
            <Pressable testID="share-button" accessibilityLabel="Share and TikTok" className="bg-gradient-to-r from-pink-600 to-purple-600 p-[2px] rounded-2xl active:scale-95">
              <View className="bg-black rounded-2xl px-8 py-4">
                <View className="flex-row items-center justify-center">
                  <Text className="text-xl font-bold text-white mr-2">🎵</Text>
                  <Text className="text-xl font-bold text-white">Share & TikTok</Text>
                </View>
              </View>
            </Pressable>
          </Link>
        </View>

        {/* Features */}
        <View className="mt-12 bg-gray-900/50 rounded-xl px-6 py-4">
          <View className="flex-row flex-wrap justify-center gap-3">
            <View className="items-center">
              <Text className="text-2xl">💎</Text>
              <Text className="text-gray-400 text-xs mt-1">Merge Gems</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl">⚡</Text>
              <Text className="text-gray-400 text-xs mt-1">Epic Combos</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl">🔥</Text>
              <Text className="text-gray-400 text-xs mt-1">Multipliers</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl">🎯</Text>
              <Text className="text-gray-400 text-xs mt-1">Daily Events</Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
