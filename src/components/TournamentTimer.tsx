// TournamentTimer Component - 5-minute countdown
import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { formatTimeRemaining } from '@/lib/utils/tournament';
import { cn } from '@/lib/cn';

interface TournamentTimerProps {
  timeRemaining: number; // in milliseconds
  onTick?: (newTime: number) => void;
  onTimeUp?: () => void;
  isActive: boolean;
}

export function TournamentTimer({
  timeRemaining,
  onTick,
  onTimeUp,
  isActive
}: TournamentTimerProps) {
  const [currentTime, setCurrentTime] = useState<number>(timeRemaining);

  useEffect(() => {
    setCurrentTime(timeRemaining);
  }, [timeRemaining]);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setCurrentTime((prevTime: number) => {
        const newTime = Math.max(0, prevTime - 1000);

        if (onTick) {
          onTick(newTime);
        }

        if (newTime === 0 && onTimeUp) {
          onTimeUp();
        }

        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, onTick, onTimeUp]);

  const formattedTime = formatTimeRemaining(currentTime);
  const totalSeconds = Math.floor(currentTime / 1000);
  const isLowTime = totalSeconds <= 60; // Last minute
  const isCritical = totalSeconds <= 30; // Last 30 seconds

  return (
    <View
      className={cn(
        'px-6 py-3 rounded-xl border-2',
        isCritical ? 'bg-red-500/20 border-red-500' :
        isLowTime ? 'bg-yellow-500/20 border-yellow-500' :
        'bg-purple-500/20 border-purple-500'
      )}
    >
      <View className="flex-row items-center justify-center">
        <Text className="text-gray-400 text-sm font-semibold mr-2">
          {isCritical ? '⚠️' : isLowTime ? '⏱️' : '🕐'}
        </Text>
        <Text
          className={cn(
            'text-3xl font-bold tabular-nums',
            isCritical ? 'text-red-400' :
            isLowTime ? 'text-yellow-400' :
            'text-purple-400'
          )}
        >
          {formattedTime}
        </Text>
      </View>
      <Text className="text-gray-500 text-xs text-center mt-1">
        {isCritical ? 'TIME ALMOST UP!' :
         isLowTime ? 'One minute remaining' :
         'Time remaining'}
      </Text>
    </View>
  );
}

interface TournamentInfoProps {
  date: string;
  participantCount?: number;
  rank?: number;
}

export function TournamentInfo({ date, participantCount, rank }: TournamentInfoProps) {
  return (
    <View className="bg-gray-900/80 rounded-xl p-4">
      <Text className="text-purple-400 text-xl font-bold text-center mb-3">
        🏆 Daily Tournament
      </Text>

      <View className="flex-row justify-around">
        <View className="items-center">
          <Text className="text-gray-400 text-xs uppercase tracking-wider">Date</Text>
          <Text className="text-white text-sm font-bold mt-1">{date}</Text>
        </View>

        {participantCount !== undefined && (
          <View className="items-center">
            <Text className="text-gray-400 text-xs uppercase tracking-wider">Players</Text>
            <Text className="text-white text-sm font-bold mt-1">
              {participantCount.toLocaleString()}
            </Text>
          </View>
        )}

        {rank !== undefined && (
          <View className="items-center">
            <Text className="text-gray-400 text-xs uppercase tracking-wider">Your Rank</Text>
            <Text className="text-purple-400 text-sm font-bold mt-1">
              #{rank}
            </Text>
          </View>
        )}
      </View>

      <View className="mt-4 bg-black/40 rounded-lg p-3">
        <Text className="text-gray-300 text-xs text-center">
          ⚡ Everyone gets the same 3 starting pieces!
        </Text>
        <Text className="text-gray-400 text-xs text-center mt-1">
          Compete for the highest score in 5 minutes
        </Text>
      </View>
    </View>
  );
}
