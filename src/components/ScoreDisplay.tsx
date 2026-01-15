// ScoreDisplay Component
import React from 'react';
import { View, Text } from 'react-native';
import { cn } from '@/lib/cn';

interface ScoreDisplayProps {
  score: number;
  highScore?: number;
  multiplier?: number;
}

export function ScoreDisplay({ score, highScore, multiplier = 1 }: ScoreDisplayProps) {
  return (
    <View className="flex-row justify-between items-center px-6 py-4">
      {/* Current Score */}
      <View className="items-center">
        <Text className="text-gray-400 text-sm font-medium uppercase tracking-wider">
          Score
        </Text>
        <Text className="text-white text-4xl font-bold mt-1">
          {score.toLocaleString()}
        </Text>
        {multiplier > 1 && (
          <View className="mt-2 bg-purple-500 px-3 py-1 rounded-full">
            <Text className="text-white text-sm font-bold">
              {multiplier}x COMBO
            </Text>
          </View>
        )}
      </View>

      {/* High Score */}
      {highScore !== undefined && highScore > 0 && (
        <View className="items-center">
          <Text className="text-gray-400 text-sm font-medium uppercase tracking-wider">
            Best
          </Text>
          <Text className="text-purple-400 text-2xl font-bold mt-1">
            {highScore.toLocaleString()}
          </Text>
        </View>
      )}
    </View>
  );
}
