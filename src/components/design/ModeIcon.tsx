// Run-mode icon — replaces the 🏆/🎮 emoji used across leaderboard/replays/share.
import React from 'react';
import { Trophy, Gamepad2 } from 'lucide-react-native';
import { colors } from '@/lib/design/tokens';

export function ModeIcon({
  mode,
  size = 16,
  color,
}: {
  mode: 'tournament' | 'endless' | string;
  size?: number;
  color?: string;
}) {
  const Icon = mode === 'tournament' ? Trophy : Gamepad2;
  return <Icon size={size} color={color ?? colors.inkSoft} strokeWidth={2.25} />;
}
