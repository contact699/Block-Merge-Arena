import * as Haptics from 'expo-haptics';

export type HapticTier = 'none' | 'light' | 'medium' | 'heavy-double' | 'heavy-triple';

export function hapticTierFor(multiplier: number): HapticTier {
  if (multiplier < 2) return 'none';
  if (multiplier < 3) return 'light';
  if (multiplier < 5) return 'medium';
  if (multiplier < 7) return 'heavy-double';
  return 'heavy-triple';
}

export async function fireMergeHaptic(multiplier: number): Promise<void> {
  const tier = hapticTierFor(multiplier);
  switch (tier) {
    case 'none':
      return;
    case 'light':
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    case 'medium':
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      return;
    case 'heavy-double':
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 80);
      return;
    case 'heavy-triple':
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 80);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 160);
      return;
  }
}
