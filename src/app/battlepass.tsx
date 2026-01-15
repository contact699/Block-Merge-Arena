// Battle Pass Screen
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  getCurrentBattlePass,
  getPlayerBattlePassData,
  getXPProgressToNextLevel,
  getDaysRemaining,
  claimReward,
  purchasePremiumBattlePass,
} from '@/lib/utils/battlepass';
import { getCurrency } from '@/lib/utils/currency';
import { PREMIUM_PRICE } from '@/lib/types/battlepass';
import type { BattlePass, PlayerBattlePassData, BattlePassLevel, BattlePassReward, BattlePassTier } from '@/lib/types/battlepass';
import type { Currency } from '@/lib/types/shop';

export default function BattlePassScreen() {
  const router = useRouter();
  const [battlePass, setBattlePass] = useState<BattlePass | null>(null);
  const [playerData, setPlayerData] = useState<PlayerBattlePassData | null>(null);
  const [currency, setCurrency] = useState<Currency>({ gems: 0, coins: 0 });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadBattlePassData();
  }, []);

  const loadBattlePassData = async (): Promise<void> => {
    setLoading(true);
    try {
      const [bp, pd, curr] = await Promise.all([
        getCurrentBattlePass(),
        getPlayerBattlePassData(),
        getCurrency(),
      ]);

      setBattlePass(bp);
      setPlayerData(pd);
      setCurrency(curr);
    } catch (error) {
      console.error('Error loading battle pass:', error);
    }
    setLoading(false);
  };

  const handleClaimReward = async (level: number, tier: BattlePassTier): Promise<void> => {
    const result = await claimReward(level, tier);

    if (result.success) {
      Alert.alert(
        '🎁 Reward Claimed!',
        `You received: ${result.reward?.icon} ${result.reward?.name}`,
        [{ text: 'OK' }]
      );
      await loadBattlePassData();
    } else {
      Alert.alert('Failed to Claim', result.error || 'Unknown error', [{ text: 'OK' }]);
    }
  };

  const handlePurchasePremium = async (): Promise<void> => {
    Alert.alert(
      '💎 Purchase Premium Battle Pass?',
      `Unlock all premium rewards for ${PREMIUM_PRICE} gems!\n\n• 30 exclusive premium rewards\n• Legendary skins and themes\n• Extra gems and coins\n• Premium cosmetics`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Buy (${PREMIUM_PRICE} 💎)`,
          onPress: async () => {
            const result = await purchasePremiumBattlePass();
            if (result.success) {
              Alert.alert('🎉 Premium Unlocked!', 'You can now claim all premium rewards!', [
                { text: 'Awesome!' },
              ]);
              await loadBattlePassData();
            } else {
              Alert.alert('Purchase Failed', result.error || 'Unknown error', [{ text: 'OK' }]);
            }
          },
        },
      ]
    );
  };

  const renderRewardBox = (
    reward: BattlePassReward | undefined,
    level: number,
    tier: BattlePassTier,
    isUnlocked: boolean,
    isClaimed: boolean
  ) => {
    if (!reward) {
      return (
        <View className="w-20 h-20 bg-gray-900 rounded-lg items-center justify-center">
          <Text className="text-gray-600 text-xs">-</Text>
        </View>
      );
    }

    const canClaim = isUnlocked && !isClaimed;
    const isPremiumLocked = tier === 'premium' && !playerData?.hasPremium;

    return (
      <Pressable
        onPress={() => canClaim && !isPremiumLocked && handleClaimReward(level, tier)}
        disabled={!canClaim || isPremiumLocked}
        className={`w-20 h-20 rounded-lg items-center justify-center border-2 ${
          isClaimed
            ? 'bg-green-500/20 border-green-500'
            : canClaim && !isPremiumLocked
            ? 'bg-purple-500/20 border-purple-500'
            : 'bg-gray-900 border-gray-700'
        }`}
      >
        {isPremiumLocked && (
          <View className="absolute inset-0 bg-black/60 rounded-lg items-center justify-center z-10">
            <Text className="text-2xl">🔒</Text>
          </View>
        )}

        <Text className="text-2xl mb-1">{reward.icon}</Text>
        <Text className="text-white text-xs font-bold text-center" numberOfLines={1}>
          {reward.type === 'coins' || reward.type === 'gems' ? reward.amount : ''}
        </Text>

        {isClaimed && (
          <View className="absolute -top-1 -right-1 bg-green-500 rounded-full w-5 h-5 items-center justify-center">
            <Text className="text-white text-xs font-bold">✓</Text>
          </View>
        )}

        {canClaim && !isPremiumLocked && (
          <View className="absolute -top-1 -right-1 bg-purple-500 rounded-full w-5 h-5 items-center justify-center">
            <Text className="text-white text-xs font-bold">!</Text>
          </View>
        )}
      </Pressable>
    );
  };

  const renderLevel = (levelData: BattlePassLevel) => {
    if (!playerData) return null;

    const isUnlocked = levelData.level <= playerData.currentLevel;
    const freeClaimed = playerData.claimedFreeRewards.includes(levelData.level);
    const premiumClaimed = playerData.claimedPremiumRewards.includes(levelData.level);

    return (
      <View key={levelData.level} className="mb-4">
        <View className="flex-row items-center gap-3">
          {/* Level Number */}
          <View
            className={`w-12 h-12 rounded-full items-center justify-center border-2 ${
              isUnlocked ? 'bg-purple-500/20 border-purple-500' : 'bg-gray-900 border-gray-700'
            }`}
          >
            <Text className={`font-bold ${isUnlocked ? 'text-purple-400' : 'text-gray-600'}`}>
              {levelData.level}
            </Text>
          </View>

          {/* Free Reward */}
          {renderRewardBox(levelData.freeReward, levelData.level, 'free', isUnlocked, freeClaimed)}

          {/* Premium Reward */}
          {renderRewardBox(
            levelData.premiumReward,
            levelData.level,
            'premium',
            isUnlocked,
            premiumClaimed
          )}

          {/* Reward Names */}
          <View className="flex-1">
            {levelData.freeReward && (
              <Text className="text-gray-400 text-xs">{levelData.freeReward.name}</Text>
            )}
            {levelData.premiumReward && (
              <Text className="text-purple-400 text-xs">{levelData.premiumReward.name}</Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-black items-center justify-center">
        <Text className="text-purple-400 text-lg">Loading Battle Pass...</Text>
      </SafeAreaView>
    );
  }

  if (!battlePass || !playerData) {
    return (
      <SafeAreaView className="flex-1 bg-black items-center justify-center">
        <Text className="text-gray-500">Failed to load Battle Pass</Text>
      </SafeAreaView>
    );
  }

  const xpProgress = getXPProgressToNextLevel(playerData.currentXP, playerData.currentLevel);
  const daysLeft = getDaysRemaining(battlePass);

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Header */}
        <View className="px-6 pt-4 pb-6 border-b border-gray-800">
          <Pressable onPress={() => router.back()}>
            <Text className="text-purple-400 text-base font-semibold">← Back</Text>
          </Pressable>

          <Text className="text-4xl font-black text-white mt-4">🎫 Battle Pass</Text>
          <Text className="text-gray-400 text-sm mt-1">{battlePass.name}</Text>
        </View>

        {/* Season Info */}
        <View className="px-6 mt-6">
          <View className="bg-gray-900/80 border border-purple-500/50 rounded-xl p-4">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-white text-lg font-bold">Season {battlePass.seasonNumber}</Text>
                <Text className="text-gray-400 text-xs mt-1">{daysLeft} days remaining</Text>
              </View>

              <View className="bg-red-500 rounded-full px-3 py-1">
                <Text className="text-white text-xs font-bold">ACTIVE</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Level Progress */}
        <View className="px-6 mt-6">
          <View className="bg-gradient-to-br from-purple-900/40 to-black border-2 border-purple-500 rounded-2xl p-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-white text-2xl font-black">Level {playerData.currentLevel}</Text>
              <Text className="text-purple-400 text-sm">
                {playerData.currentXP.toLocaleString()} XP
              </Text>
            </View>

            {/* XP Progress Bar */}
            {playerData.currentLevel < 30 && (
              <>
                <View className="bg-gray-800 rounded-full h-3 overflow-hidden mb-2">
                  <View
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full"
                    style={{ width: `${xpProgress.percentage}%` }}
                  />
                </View>
                <Text className="text-gray-400 text-xs text-center">
                  {xpProgress.xpNeeded.toLocaleString()} XP to Level {playerData.currentLevel + 1}
                </Text>
              </>
            )}

            {playerData.currentLevel === 30 && (
              <View className="bg-yellow-500/20 border border-yellow-600 rounded-lg py-2 px-3 mt-2">
                <Text className="text-yellow-400 text-sm font-bold text-center">
                  🎉 MAX LEVEL REACHED!
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Premium Upgrade Button */}
        {!playerData.hasPremium && (
          <View className="px-6 mt-6">
            <Pressable
              onPress={handlePurchasePremium}
              className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-xl py-4 active:scale-95"
            >
              <Text className="text-white text-center text-lg font-black">
                ⭐ UNLOCK PREMIUM - {PREMIUM_PRICE} 💎
              </Text>
              <Text className="text-yellow-200 text-center text-xs mt-1">
                Get 30 exclusive premium rewards!
              </Text>
            </Pressable>
          </View>
        )}

        {playerData.hasPremium && (
          <View className="px-6 mt-6">
            <View className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border-2 border-yellow-600 rounded-xl py-3 px-4">
              <Text className="text-yellow-400 text-center text-sm font-bold">
                ⭐ PREMIUM ACTIVE ⭐
              </Text>
            </View>
          </View>
        )}

        {/* Legend */}
        <View className="px-6 mt-6">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <View className="flex-row items-center gap-2 mb-2">
                <View className="w-4 h-4 bg-green-500/20 border border-green-500 rounded" />
                <Text className="text-gray-400 text-xs">Free Track</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <View className="w-4 h-4 bg-purple-500/20 border border-purple-500 rounded" />
                <Text className="text-gray-400 text-xs">Premium Track</Text>
              </View>
            </View>

            <Text className="text-gray-500 text-xs">
              {playerData.claimedFreeRewards.length + playerData.claimedPremiumRewards.length} / 60 claimed
            </Text>
          </View>
        </View>

        {/* Rewards List */}
        <View className="px-6 mt-6">
          <Text className="text-gray-400 text-xs font-bold uppercase mb-4">All Levels</Text>
          {battlePass.levels.map(renderLevel)}
        </View>

        {/* How to Earn XP */}
        <View className="px-6 mt-8">
          <View className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
            <Text className="text-purple-400 text-sm font-semibold mb-2">📊 How to Earn XP</Text>
            <Text className="text-gray-400 text-sm leading-5">
              • Complete tournaments: +100 XP{'\n'}
              • Score points: +50 XP per 1000 points{'\n'}
              • 5x+ combo: +25 XP{'\n'}
              • First game daily: +200 XP bonus{'\n'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
