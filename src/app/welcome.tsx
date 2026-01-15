// Welcome Screen - First-time user onboarding
import { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { TutorialOverlay } from '@/components/TutorialOverlay';
import { WELCOME_TUTORIAL } from '@/lib/tutorial/catalog';
import {
  completeStep,
  completeTutorial,
  skipTutorial,
  getTutorialProgress,
} from '@/lib/utils/tutorial';
import type { TutorialStep } from '@/lib/types/tutorial';

export default function WelcomeScreen() {
  const router = useRouter();
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [showRewards, setShowRewards] = useState<boolean>(false);
  const [earnedCoins, setEarnedCoins] = useState<number>(0);
  const [earnedGems, setEarnedGems] = useState<number>(0);

  const currentStep = WELCOME_TUTORIAL.steps[currentStepIndex];
  const totalSteps = WELCOME_TUTORIAL.steps.length;

  const handleNext = async (): Promise<void> => {
    const result = await completeStep(currentStep.id);

    if (result.tutorialComplete) {
      // Tutorial finished!
      setEarnedCoins(WELCOME_TUTORIAL.rewards?.coins || 0);
      setEarnedGems(WELCOME_TUTORIAL.rewards?.gems || 0);
      setShowRewards(true);
    } else if (result.nextStep) {
      // Move to next step
      const nextIndex = WELCOME_TUTORIAL.steps.findIndex((s) => s.id === result.nextStep);
      if (nextIndex !== -1) {
        setCurrentStepIndex(nextIndex);
      }
    }
  };

  const handleSkip = async (): Promise<void> => {
    await skipTutorial(WELCOME_TUTORIAL.id);
    router.replace('/');
  };

  const handleFinish = (): void => {
    router.replace('/');
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-1 items-center justify-center p-6">
        {/* Logo/Branding */}
        <View className="items-center mb-8">
          <Text className="text-6xl font-black text-purple-400 mb-2">Block Merge</Text>
          <Text className="text-4xl font-black text-white">Arena</Text>
          <Text className="text-gray-400 text-sm mt-3">
            Competitive Block Puzzle • Merge • Dominate
          </Text>
        </View>

        {/* Feature Highlights */}
        <View className="w-full max-w-md bg-gray-900/50 rounded-2xl p-6 gap-4">
          <View className="flex-row items-center gap-3">
            <Text className="text-3xl">🎮</Text>
            <View className="flex-1">
              <Text className="text-white font-bold">Strategic Gameplay</Text>
              <Text className="text-gray-400 text-xs">Place blocks, clear lines, earn points</Text>
            </View>
          </View>

          <View className="flex-row items-center gap-3">
            <Text className="text-3xl">💎</Text>
            <View className="flex-1">
              <Text className="text-white font-bold">Merge for Multipliers</Text>
              <Text className="text-gray-400 text-xs">
                Combine gems for 5x score bonuses
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-3">
            <Text className="text-3xl">🏆</Text>
            <View className="flex-1">
              <Text className="text-white font-bold">Daily Tournaments</Text>
              <Text className="text-gray-400 text-xs">
                Compete globally with fair matchmaking
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-3">
            <Text className="text-3xl">🎯</Text>
            <View className="flex-1">
              <Text className="text-white font-bold">Power-Ups & Strategy</Text>
              <Text className="text-gray-400 text-xs">Master tactics to climb ranks</Text>
            </View>
          </View>
        </View>

        {/* CTA Message */}
        <View className="mt-8">
          <Text className="text-purple-400 text-center text-lg font-bold">
            Ready to begin your journey?
          </Text>
        </View>
      </View>

      {/* Tutorial Overlay */}
      {!showRewards && (
        <TutorialOverlay
          step={currentStep}
          onNext={handleNext}
          onSkip={handleSkip}
          totalSteps={totalSteps}
          currentStepIndex={currentStepIndex}
        />
      )}

      {/* Rewards Modal */}
      {showRewards && (
        <View className="absolute inset-0 bg-black/90 items-center justify-center p-6">
          <View className="bg-gray-900 border-2 border-purple-500 rounded-2xl p-6 max-w-md w-full">
            <Text className="text-center text-4xl mb-4">🎉</Text>
            <Text className="text-white text-2xl font-bold text-center mb-2">
              Welcome Complete!
            </Text>
            <Text className="text-gray-400 text-center mb-6">
              Here's a starter bonus to get you started on your journey to the top!
            </Text>

            {/* Rewards */}
            <View className="bg-black/40 rounded-xl p-4 mb-6">
              <Text className="text-gray-400 text-xs text-center mb-3">🎁 Starter Rewards</Text>
              <View className="flex-row justify-center gap-6">
                {earnedCoins > 0 && (
                  <View className="items-center">
                    <Text className="text-yellow-400 text-3xl font-black">{earnedCoins}</Text>
                    <Text className="text-yellow-400 text-xs mt-1">🪙 Coins</Text>
                  </View>
                )}
                {earnedGems > 0 && (
                  <View className="items-center">
                    <Text className="text-purple-400 text-3xl font-black">{earnedGems}</Text>
                    <Text className="text-purple-400 text-xs mt-1">💎 Gems</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Finish Button */}
            <Pressable
              onPress={handleFinish}
              className="bg-purple-500 rounded-xl py-4 active:scale-95"
            >
              <Text className="text-white text-center text-lg font-bold">
                Let's Play! 🚀
              </Text>
            </Pressable>

            {/* Next Steps Hint */}
            <Text className="text-gray-500 text-xs text-center mt-4">
              💡 Check out more tutorials to master advanced strategies
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
