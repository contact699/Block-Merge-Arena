// PowerUpButton Component - Power-up activation buttons
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import type { PowerUp } from '@/lib/types/game';
import { cn } from '@/lib/cn';

interface PowerUpButtonProps {
  powerUp: PowerUp;
  onPress: () => void;
  disabled?: boolean;
  selected?: boolean;
}

// Power-up emoji icons
const POWER_UP_ICONS: Record<string, string> = {
  reroll: '🔄',
  blast: '💣',
  freeze: '⏱️',
  target: '🎯',
  colorBomb: '🌈'
};

// Power-up colors
const POWER_UP_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  reroll: { bg: 'bg-blue-500/20', border: 'border-blue-500', text: 'text-blue-400' },
  blast: { bg: 'bg-red-500/20', border: 'border-red-500', text: 'text-red-400' },
  freeze: { bg: 'bg-cyan-500/20', border: 'border-cyan-500', text: 'text-cyan-400' },
  target: { bg: 'bg-green-500/20', border: 'border-green-500', text: 'text-green-400' },
  colorBomb: { bg: 'bg-purple-500/20', border: 'border-purple-500', text: 'text-purple-400' }
};

export function PowerUpButton({ powerUp, onPress, disabled = false, selected = false }: PowerUpButtonProps) {
  const icon = POWER_UP_ICONS[powerUp.type] || '❓';
  const colors = POWER_UP_COLORS[powerUp.type] || { bg: 'bg-gray-500/20', border: 'border-gray-500', text: 'text-gray-400' };
  const isAvailable = powerUp.uses > 0 && !disabled;

  return (
    <Pressable
      onPress={isAvailable ? onPress : undefined}
      disabled={!isAvailable}
      className={cn(
        'rounded-xl border-2 p-3 min-w-[80px]',
        isAvailable ? colors.bg : 'bg-gray-800/50',
        isAvailable ? colors.border : 'border-gray-700',
        selected && 'ring-2 ring-white',
        !isAvailable && 'opacity-40'
      )}
      style={{
        transform: [{ scale: selected ? 1.05 : 1 }]
      }}
    >
      <View className="items-center">
        {/* Icon */}
        <Text className="text-3xl mb-1">{icon}</Text>

        {/* Name */}
        <Text
          className={cn(
            'text-xs font-bold text-center',
            isAvailable ? colors.text : 'text-gray-600'
          )}
        >
          {powerUp.name}
        </Text>

        {/* Uses remaining */}
        <View className={cn(
          'mt-2 px-2 py-0.5 rounded-full',
          powerUp.uses > 0 ? 'bg-white/20' : 'bg-gray-700'
        )}>
          <Text className={cn(
            'text-xs font-bold',
            powerUp.uses > 0 ? 'text-white' : 'text-gray-600'
          )}>
            {powerUp.uses}x
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

interface PowerUpBarProps {
  powerUps: PowerUp[];
  onPowerUpPress: (powerUp: PowerUp, index: number) => void;
  selectedIndex?: number;
  disabled?: boolean;
}

export function PowerUpBar({ powerUps, onPowerUpPress, selectedIndex, disabled = false }: PowerUpBarProps) {
  return (
    <View className="bg-gray-900/80 rounded-xl p-3">
      <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3 text-center">
        Power-ups
      </Text>
      <View className="flex-row gap-3 justify-center">
        {powerUps.map((powerUp: PowerUp, index: number) => (
          <PowerUpButton
            key={`${powerUp.type}-${index}`}
            powerUp={powerUp}
            onPress={() => onPowerUpPress(powerUp, index)}
            disabled={disabled}
            selected={selectedIndex === index}
          />
        ))}
      </View>
    </View>
  );
}

// Mode selection component for Color Bomb
interface ColorSelectorProps {
  colors: string[];
  onColorSelect: (color: string) => void;
  onCancel: () => void;
}

export function ColorSelector({ colors, onColorSelect, onCancel }: ColorSelectorProps) {
  const colorMap: Record<string, { bg: string; name: string }> = {
    red: { bg: 'bg-red-500', name: 'Red' },
    blue: { bg: 'bg-blue-500', name: 'Blue' },
    green: { bg: 'bg-green-500', name: 'Green' },
    yellow: { bg: 'bg-yellow-400', name: 'Yellow' },
    purple: { bg: 'bg-purple-500', name: 'Purple' },
    orange: { bg: 'bg-orange-500', name: 'Orange' }
  };

  return (
    <View className="absolute inset-0 bg-black/80 items-center justify-center z-50">
      <View className="bg-gray-900 rounded-2xl p-6 border-2 border-purple-500 max-w-sm">
        <Text className="text-white text-xl font-bold text-center mb-4">
          🌈 Select Color to Clear
        </Text>

        <View className="flex-row flex-wrap justify-center gap-3 mb-4">
          {colors.map((color: string) => {
            const colorInfo = colorMap[color];
            return (
              <Pressable
                key={color}
                onPress={() => onColorSelect(color)}
                className={cn(
                  'rounded-xl p-4 border-2 border-white/20 min-w-[80px]',
                  colorInfo.bg
                )}
              >
                <Text className="text-white text-sm font-bold text-center">
                  {colorInfo.name}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={onCancel}
          className="bg-gray-700 rounded-xl py-3 px-6"
        >
          <Text className="text-white text-center font-semibold">Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}
