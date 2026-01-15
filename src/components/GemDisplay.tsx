// GemDisplay Component - Visual representation of gems
import React from 'react';
import { View, Text } from 'react-native';
import type { Gem } from '@/lib/types/game';
import { cn } from '@/lib/cn';

interface GemCellProps {
  color: string;
  size?: number;
  isLarge?: boolean;
}

// Color mapping for gems (brighter than blocks)
const GEM_COLOR_MAP: Record<string, { bg: string; glow: string }> = {
  red: { bg: 'bg-red-400', glow: '#ef4444' },
  blue: { bg: 'bg-blue-400', glow: '#3b82f6' },
  green: { bg: 'bg-green-400', glow: '#10b981' },
  yellow: { bg: 'bg-yellow-300', glow: '#fbbf24' },
  purple: { bg: 'bg-purple-400', glow: '#a855f7' },
  orange: { bg: 'bg-orange-400', glow: '#f97316' }
};

export function GemCell({ color, size = 30, isLarge = false }: GemCellProps) {
  const gemColors = GEM_COLOR_MAP[color] || { bg: 'bg-gray-500', glow: '#6b7280' };

  return (
    <View
      className={cn(
        'rounded-full items-center justify-center',
        gemColors.bg,
        isLarge && 'border-2 border-white'
      )}
      style={{
        width: size,
        height: size,
        shadowColor: gemColors.glow,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: isLarge ? 12 : 8
      }}
    >
      {/* Inner sparkle effect */}
      <View
        className="absolute bg-white rounded-full opacity-40"
        style={{
          width: size * 0.3,
          height: size * 0.3,
          top: size * 0.15,
          left: size * 0.2
        }}
      />
    </View>
  );
}

interface GemDisplayProps {
  gems: Gem[];
  cellSize?: number;
}

export function GemDisplay({ gems, cellSize = 30 }: GemDisplayProps) {
  return (
    <View className="flex-row flex-wrap gap-2 p-4">
      {gems.map((gem: Gem) => {
        const isLarge = gem.size === 'medium' || gem.size === 'large' || gem.size === 'mega';
        const size = gem.size === 'mega' ? cellSize * 1.5 :
                     gem.size === 'large' ? cellSize * 1.3 :
                     gem.size === 'medium' ? cellSize * 1.1 :
                     cellSize;

        return (
          <View key={gem.id} className="items-center">
            <GemCell color={gem.color} size={size} isLarge={isLarge} />
            {gem.multiplier > 1 && (
              <Text className="text-white text-xs font-bold mt-1">
                {gem.multiplier}x
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

interface GemCounterProps {
  gems: Gem[];
}

export function GemCounter({ gems }: GemCounterProps) {
  const gemsBySize = {
    small: gems.filter((g: Gem) => g.size === 'small').length,
    medium: gems.filter((g: Gem) => g.size === 'medium').length,
    large: gems.filter((g: Gem) => g.size === 'large').length,
    mega: gems.filter((g: Gem) => g.size === 'mega').length
  };

  const highestMultiplier = Math.max(...gems.map((g: Gem) => g.multiplier), 1);

  return (
    <View className="bg-gray-900/80 rounded-xl p-3">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-gray-400 text-sm font-semibold">Gems on Board</Text>
        {highestMultiplier > 1 && (
          <View className="bg-purple-500 px-2 py-1 rounded-full">
            <Text className="text-white text-xs font-bold">
              Max {highestMultiplier}x
            </Text>
          </View>
        )}
      </View>

      <View className="flex-row gap-3">
        {gemsBySize.small > 0 && (
          <View className="items-center">
            <View className="bg-gray-700 rounded-full w-6 h-6 items-center justify-center">
              <Text className="text-white text-xs font-bold">{gemsBySize.small}</Text>
            </View>
            <Text className="text-gray-500 text-xs mt-1">Small</Text>
          </View>
        )}
        {gemsBySize.medium > 0 && (
          <View className="items-center">
            <View className="bg-blue-500 rounded-full w-6 h-6 items-center justify-center">
              <Text className="text-white text-xs font-bold">{gemsBySize.medium}</Text>
            </View>
            <Text className="text-gray-500 text-xs mt-1">Med</Text>
          </View>
        )}
        {gemsBySize.large > 0 && (
          <View className="items-center">
            <View className="bg-purple-500 rounded-full w-6 h-6 items-center justify-center">
              <Text className="text-white text-xs font-bold">{gemsBySize.large}</Text>
            </View>
            <Text className="text-gray-500 text-xs mt-1">Large</Text>
          </View>
        )}
        {gemsBySize.mega > 0 && (
          <View className="items-center">
            <View className="bg-pink-500 rounded-full w-6 h-6 items-center justify-center">
              <Text className="text-white text-xs font-bold">{gemsBySize.mega}</Text>
            </View>
            <Text className="text-gray-500 text-xs mt-1">Mega</Text>
          </View>
        )}
      </View>
    </View>
  );
}
