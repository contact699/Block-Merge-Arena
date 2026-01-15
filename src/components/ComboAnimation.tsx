// ComboAnimation Component - Epic visual effects for combos
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
  Easing,
  runOnJS
} from 'react-native-reanimated';
import { cn } from '@/lib/cn';

interface ComboAnimationProps {
  points: number;
  multiplier: number;
  onComplete?: () => void;
}

export function ComboAnimation({ points, multiplier, onComplete }: ComboAnimationProps) {
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);

  useEffect(() => {
    // Entrance animation - pop in
    scale.value = withSpring(1, {
      damping: 10,
      stiffness: 100
    });

    // Float up and fade out
    translateY.value = withTiming(-50, {
      duration: 1500,
      easing: Easing.out(Easing.exp)
    });

    opacity.value = withSequence(
      withTiming(1, { duration: 500 }),
      withTiming(0, { duration: 1000 }, (finished) => {
        if (finished) {
          runOnJS(setIsVisible)(false);
          if (onComplete) {
            runOnJS(onComplete)();
          }
        }
      })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    opacity: opacity.value
  }));

  if (!isVisible) return null;

  const getMessage = (): { text: string; color: string } => {
    if (multiplier >= 5) {
      return { text: '🔥 MEGA COMBO! 🔥', color: '#ec4899' }; // Pink for mega
    } else if (multiplier >= 3) {
      return { text: '⚡ HUGE COMBO! ⚡', color: '#a855f7' }; // Purple for huge
    } else if (multiplier >= 2) {
      return { text: '✨ COMBO! ✨', color: '#3b82f6' }; // Blue for combo
    } else if (points >= 100) {
      return { text: 'NICE!', color: '#10b981' }; // Green for nice
    }
    return { text: 'Good!', color: '#6b7280' }; // Gray for basic
  };

  const message = getMessage();

  return (
    <Animated.View
      style={[styles.container, animatedStyle]}
      className="absolute inset-0 items-center justify-center pointer-events-none z-50"
    >
      <View
        className="bg-black/80 px-8 py-4 rounded-2xl border-2"
        style={{ borderColor: message.color }}
      >
        <Text
          className="text-4xl font-black text-center"
          style={{ color: message.color }}
        >
          {message.text}
        </Text>
        <Text className="text-white text-2xl font-bold text-center mt-2">
          +{points} pts
        </Text>
        {multiplier > 1 && (
          <Text
            className="text-xl font-bold text-center mt-1"
            style={{ color: message.color }}
          >
            {multiplier}x Multiplier
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

interface LineClearEffectProps {
  linesCleared: number;
  onComplete?: () => void;
}

export function LineClearEffect({ linesCleared, onComplete }: LineClearEffectProps) {
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    // Spin and scale in
    scale.value = withSpring(1.2, { damping: 8 });
    rotation.value = withTiming(360, { duration: 800 });

    // Fade out
    opacity.value = withSequence(
      withTiming(1, { duration: 400 }),
      withTiming(0, { duration: 400 }, (finished) => {
        if (finished) {
          runOnJS(setIsVisible)(false);
          if (onComplete) {
            runOnJS(onComplete)();
          }
        }
      })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
    opacity: opacity.value
  }));

  if (!isVisible) return null;

  return (
    <Animated.View
      style={[styles.container, animatedStyle]}
      className="absolute inset-0 items-center justify-center pointer-events-none z-40"
    >
      <View className="items-center">
        <Text className="text-6xl">💥</Text>
        <Text className="text-white text-xl font-bold mt-2">
          {linesCleared} {linesCleared === 1 ? 'Line' : 'Lines'} Cleared!
        </Text>
      </View>
    </Animated.View>
  );
}

interface GemMergeEffectProps {
  gemCount: number;
  gemSize: 'small' | 'medium' | 'large' | 'mega';
  color: string;
  onComplete?: () => void;
}

export function GemMergeEffect({ gemCount, gemSize, color, onComplete }: GemMergeEffectProps) {
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(1);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    // Pop in with pulse
    scale.value = withSpring(1, { damping: 6, stiffness: 120 });

    // Pulse effect
    pulseScale.value = withSequence(
      withTiming(1.3, { duration: 200 }),
      withTiming(1, { duration: 200 }),
      withTiming(1.3, { duration: 200 }),
      withTiming(1, { duration: 200 })
    );

    // Fade out
    opacity.value = withSequence(
      withTiming(1, { duration: 600 }),
      withTiming(0, { duration: 400 }, (finished) => {
        if (finished) {
          runOnJS(setIsVisible)(false);
          if (onComplete) {
            runOnJS(onComplete)();
          }
        }
      })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * pulseScale.value }],
    opacity: opacity.value
  }));

  if (!isVisible) return null;

  const getGemEmoji = (): string => {
    if (gemSize === 'mega') return '💎';
    if (gemSize === 'large') return '💠';
    if (gemSize === 'medium') return '💫';
    return '✨';
  };

  const getSizeText = (): string => {
    if (gemSize === 'mega') return 'MEGA GEM!';
    if (gemSize === 'large') return 'LARGE GEM!';
    if (gemSize === 'medium') return 'MEDIUM GEM!';
    return 'GEM MERGE!';
  };

  return (
    <Animated.View
      style={[styles.container, animatedStyle]}
      className="absolute inset-0 items-center justify-center pointer-events-none z-45"
    >
      <View
        className="bg-black/70 px-6 py-3 rounded-xl"
        style={{
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 20
        }}
      >
        <Text className="text-5xl text-center">{getGemEmoji()}</Text>
        <Text className="text-white text-lg font-bold text-center mt-1">
          {getSizeText()}
        </Text>
        <Text className="text-gray-300 text-sm text-center">
          {gemCount} gems merged
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});
