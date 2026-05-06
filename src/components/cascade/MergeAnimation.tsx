import React, { useEffect, useState } from 'react';
import { View, Text, AccessibilityInfo } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { fontWeight, blockColors } from '@/lib/design/tokens';
import { playMergeSound } from '@/lib/audio/sfx';
import { fireMergeHaptic } from '@/lib/haptics/cascade';

export interface MergeAnimationProps {
  /** Multiplier achieved this merge. Drives audio/haptic tier and slow-mo. */
  multiplier: number;
  /** Color of the merged gem. Drives visual color. */
  color: keyof typeof blockColors;
  /** Approximate position on screen for the burst origin. */
  origin: { x: number; y: number };
  /** Called when the cascade completes. */
  onComplete: () => void;
}

export function MergeAnimation({ multiplier, color, origin, onComplete }: MergeAnimationProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const counter = useSharedValue(0);
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((r) => {
      if (!cancelled) setReduceMotion(r);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (reduceMotion === null) return;
    runCascade(reduceMotion);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);

  function runCascade(reduced: boolean) {
    // Slow-mo for 5x+: stretches phases by 1/0.55 ≈ 1.82x
    const slow = !reduced && multiplier >= 5 ? 1 / 0.55 : 1;
    const dur = (n: number) => (reduced ? n / 2 : n);

    const phaseLineClear = 80;
    const phaseReveal = 60;
    const phasePull = 280 * slow;
    const phaseFusion = 180 * slow;
    const phaseHold = 100;

    // Side effects fire at start, in parallel with visual
    playMergeSound(multiplier);
    fireMergeHaptic(multiplier);

    // Multiplier number ramps up over the fusion phase
    counter.value = withTiming(multiplier, {
      duration: dur(phaseFusion),
      easing: Easing.out(Easing.cubic),
    });

    // Scale: 0 → overshoot 1.08 → settle 1.0
    scale.value = withSequence(
      withDelay(
        dur(phaseLineClear + phaseReveal),
        withTiming(reduced ? 1 : 1.08, {
          duration: dur(phasePull),
          easing: Easing.out(Easing.cubic),
        })
      ),
      withTiming(1, { duration: dur(phaseFusion), easing: Easing.inOut(Easing.cubic) })
    );

    // Opacity: 0 → 1 → hold → 0 (and onComplete fires when fade-out ends)
    opacity.value = withSequence(
      withDelay(
        dur(phaseLineClear),
        withTiming(1, {
          duration: dur(phaseReveal + phasePull),
          easing: Easing.out(Easing.cubic),
        })
      ),
      withDelay(
        dur(phaseHold),
        withTiming(0, { duration: 200, easing: Easing.in(Easing.cubic) }, (finished) => {
          'worklet';
          if (finished) runOnJS(onComplete)();
        })
      )
    );
  }

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: origin.x },
      { translateY: origin.y },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          alignItems: 'center',
          justifyContent: 'center',
          top: 0,
          left: 0,
        },
        containerStyle,
      ]}
    >
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: blockColors[color].base,
          shadowColor: blockColors[color].base,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.7,
          shadowRadius: 24,
          elevation: 12,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AnimatedNumber value={counter} />
      </View>
    </Animated.View>
  );
}

function AnimatedNumber({ value }: { value: SharedValue<number> }) {
  const [displayValue, setDisplayValue] = useState(0);
  useAnimatedReaction(
    () => Math.round(value.value),
    (v) => {
      runOnJS(setDisplayValue)(v);
    }
  );
  return (
    <Text
      style={{
        color: 'white',
        fontSize: 28,
        fontWeight: fontWeight.black,
        letterSpacing: -1,
      }}
    >
      {displayValue}×
    </Text>
  );
}
