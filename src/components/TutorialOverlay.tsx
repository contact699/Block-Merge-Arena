// Tutorial Overlay Component
import { useState, useEffect } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { BlurView } from 'expo-blur';
import type { TutorialStep } from '@/lib/types/tutorial';

interface TutorialOverlayProps {
  step: TutorialStep;
  onNext: () => void;
  onSkip: () => void;
  totalSteps: number;
  currentStepIndex: number;
}

export function TutorialOverlay({
  step,
  onNext,
  onSkip,
  totalSteps,
  currentStepIndex,
}: TutorialOverlayProps) {
  const [visible, setVisible] = useState<boolean>(true);

  useEffect(() => {
    setVisible(true);
  }, [step.id]);

  const handleNext = (): void => {
    setVisible(false);
    setTimeout(() => {
      onNext();
    }, 200);
  };

  const handleSkip = (): void => {
    setVisible(false);
    setTimeout(() => {
      onSkip();
    }, 200);
  };

  const getPositionStyle = () => {
    switch (step.position) {
      case 'top':
        return { justifyContent: 'flex-start' as const, paddingTop: 80 };
      case 'bottom':
        return { justifyContent: 'flex-end' as const, paddingBottom: 80 };
      case 'left':
        return { justifyContent: 'center' as const, alignItems: 'flex-start' as const, paddingLeft: 20 };
      case 'right':
        return { justifyContent: 'center' as const, alignItems: 'flex-end' as const, paddingRight: 20 };
      case 'center':
      default:
        return { justifyContent: 'center' as const, alignItems: 'center' as const };
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      {/* Dark overlay with blur */}
      <View
        className="flex-1 bg-black/80"
        style={getPositionStyle()}
      >
        {/* Tutorial Card */}
        <View className="bg-gray-900 border-2 border-purple-500 rounded-2xl p-6 mx-6 shadow-2xl">
          {/* Progress Indicator */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row gap-1">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <View
                  key={index}
                  className={`h-1 rounded-full ${
                    index <= currentStepIndex ? 'bg-purple-500' : 'bg-gray-700'
                  }`}
                  style={{ width: 20 }}
                />
              ))}
            </View>
            <Text className="text-gray-500 text-xs font-semibold">
              {currentStepIndex + 1}/{totalSteps}
            </Text>
          </View>

          {/* Title */}
          <Text className="text-white text-2xl font-bold mb-2">
            {step.title}
          </Text>

          {/* Description */}
          <Text className="text-gray-300 text-base leading-6 mb-6">
            {step.description}
          </Text>

          {/* Action Buttons */}
          <View className="flex-row gap-3">
            {/* Skip Button */}
            {currentStepIndex === 0 && (
              <Pressable
                onPress={handleSkip}
                className="flex-1 bg-gray-800 rounded-xl py-3 active:scale-95"
              >
                <Text className="text-gray-400 text-center font-bold">
                  Skip Tutorial
                </Text>
              </Pressable>
            )}

            {/* Next/Continue Button */}
            <Pressable
              onPress={handleNext}
              className="flex-1 bg-purple-500 rounded-xl py-3 active:scale-95"
            >
              <Text className="text-white text-center font-bold">
                {step.nextStep ? 'Next' : 'Done'}
              </Text>
            </Pressable>
          </View>

          {/* Action Hint */}
          {step.action && (
            <View className="mt-4 pt-3 border-t border-gray-800">
              <Text className="text-purple-400 text-xs text-center font-semibold">
                {step.action === 'tap' && '👆 Tap to continue'}
                {step.action === 'drag' && '👉 Drag to continue'}
                {step.action === 'wait' && '⏱️ Please wait...'}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

/**
 * Tutorial Tooltip - Lightweight hint
 */
interface TutorialTooltipProps {
  text: string;
  position?: 'top' | 'bottom';
  onDismiss?: () => void;
}

export function TutorialTooltip({
  text,
  position = 'bottom',
  onDismiss,
}: TutorialTooltipProps) {
  return (
    <View
      className={`absolute left-0 right-0 ${
        position === 'top' ? 'top-20' : 'bottom-20'
      } px-6 z-50`}
    >
      <View className="bg-purple-500 rounded-xl p-3 shadow-lg">
        <View className="flex-row items-center justify-between">
          <Text className="text-white text-sm font-semibold flex-1">
            💡 {text}
          </Text>
          {onDismiss && (
            <Pressable onPress={onDismiss} className="ml-2">
              <Text className="text-white text-lg">✕</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}
