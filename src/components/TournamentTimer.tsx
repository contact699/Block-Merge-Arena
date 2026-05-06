// TournamentInfo Component (TournamentTimer removed per ADR-0003)
import React from 'react';
import { View, Text } from 'react-native';

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
