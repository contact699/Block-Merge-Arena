// Replays Screen - Browse and watch saved replays
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  getLocalReplays,
  getReplayByCode,
  deleteReplay,
  formatDuration,
  calculateReplayStats,
} from '@/lib/utils/replay';
import { ReplayPlayer } from '@/components/ReplayPlayer';
import type { Replay } from '@/lib/types/replay';

type TabType = 'all' | 'tournament' | 'endless';

export default function ReplaysScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [replays, setReplays] = useState<Replay[]>([]);
  const [filteredReplays, setFilteredReplays] = useState<Replay[]>([]);
  const [selectedReplay, setSelectedReplay] = useState<Replay | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Code input modal
  const [showCodeInput, setShowCodeInput] = useState<boolean>(false);
  const [codeInput, setCodeInput] = useState<string>('');
  const [codeError, setCodeError] = useState<string>('');

  useEffect(() => {
    loadReplays();
  }, []);

  useEffect(() => {
    filterReplays();
  }, [activeTab, replays]);

  const loadReplays = async (): Promise<void> => {
    setLoading(true);
    try {
      const loadedReplays = await getLocalReplays();
      setReplays(loadedReplays);
    } catch (error) {
      console.error('Error loading replays:', error);
    }
    setLoading(false);
  };

  const filterReplays = (): void => {
    if (activeTab === 'all') {
      setFilteredReplays(replays);
    } else {
      setFilteredReplays(replays.filter((r: Replay) => r.mode === activeTab));
    }
  };

  const handleReplaySelect = (replay: Replay): void => {
    setSelectedReplay(replay);
  };

  const handleReplayComplete = (): void => {
    // Optionally close replay or restart
  };

  const handleReplayClose = (): void => {
    setSelectedReplay(null);
  };

  const handleDeleteReplay = async (replayId: string): Promise<void> => {
    await deleteReplay(replayId);
    await loadReplays(); // Reload list
  };

  const handleLoadByCode = async (): Promise<void> => {
    if (!codeInput.trim()) {
      setCodeError('Please enter a replay code');
      return;
    }

    const replay = await getReplayByCode(codeInput.trim());
    if (replay) {
      setShowCodeInput(false);
      setCodeInput('');
      setCodeError('');
      setSelectedReplay(replay);
    } else {
      setCodeError('Replay not found. Check the code and try again.');
    }
  };

  const getModeIcon = (mode: string): string => {
    return mode === 'tournament' ? '🏆' : '🎮';
  };

  // If viewing a replay, show the player
  if (selectedReplay) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <ReplayPlayer
          replay={selectedReplay}
          onComplete={handleReplayComplete}
          onClose={handleReplayClose}
          autoPlay={true}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Header */}
        <View className="px-6 pt-4 pb-6">
          <Pressable onPress={() => router.back()}>
            <Text className="text-purple-400 text-base font-semibold">← Back</Text>
          </Pressable>

          <Text className="text-4xl font-black text-white mt-4">👻 Replays</Text>
          <Text className="text-gray-400 text-sm mt-1">Watch your best runs</Text>
        </View>

        {/* Load by Code Button */}
        <View className="px-6 mb-4">
          <Pressable
            onPress={() => setShowCodeInput(true)}
            className="bg-purple-500 rounded-xl py-3 px-4"
          >
            <Text className="text-white text-center font-semibold">
              🔍 Load Replay by Code
            </Text>
          </Pressable>
        </View>

        {/* Tabs */}
        <View className="px-6 mb-4">
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-full ${
                activeTab === 'all' ? 'bg-purple-500' : 'bg-gray-800'
              }`}
            >
              <Text
                className={`font-semibold ${
                  activeTab === 'all' ? 'text-white' : 'text-gray-400'
                }`}
              >
                All
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('tournament')}
              className={`px-4 py-2 rounded-full ${
                activeTab === 'tournament' ? 'bg-purple-500' : 'bg-gray-800'
              }`}
            >
              <Text
                className={`font-semibold ${
                  activeTab === 'tournament' ? 'text-white' : 'text-gray-400'
                }`}
              >
                🏆 Tournament
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('endless')}
              className={`px-4 py-2 rounded-full ${
                activeTab === 'endless' ? 'bg-purple-500' : 'bg-gray-800'
              }`}
            >
              <Text
                className={`font-semibold ${
                  activeTab === 'endless' ? 'text-white' : 'text-gray-400'
                }`}
              >
                🎮 Endless
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Replays List */}
        <View className="px-6">
          {loading ? (
            <View className="items-center py-12">
              <Text className="text-gray-500">Loading replays...</Text>
            </View>
          ) : filteredReplays.length === 0 ? (
            <View className="items-center py-12 bg-gray-900/50 rounded-xl">
              <Text className="text-gray-500 text-lg font-semibold">No replays yet</Text>
              <Text className="text-gray-600 text-sm mt-2">
                Play a game to record your first replay!
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {filteredReplays.map((replay: Replay) => {
                const stats = calculateReplayStats(replay);
                return (
                  <Pressable
                    key={replay.id}
                    onPress={() => handleReplaySelect(replay)}
                    className="bg-gray-900/80 border border-gray-800 rounded-xl p-4"
                  >
                    {/* Header */}
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-2xl">{getModeIcon(replay.mode)}</Text>
                        <Text className="text-white text-lg font-bold">
                          {replay.finalScore.toLocaleString()}
                        </Text>
                      </View>
                      <View className="bg-purple-500/20 border border-purple-500 rounded-lg px-3 py-1">
                        <Text className="text-purple-400 text-xs font-bold">
                          {replay.code}
                        </Text>
                      </View>
                    </View>

                    {/* Stats */}
                    <View className="flex-row flex-wrap gap-4 mb-3">
                      <View>
                        <Text className="text-gray-500 text-xs">Moves</Text>
                        <Text className="text-white text-sm font-semibold">
                          {replay.moveCount}
                        </Text>
                      </View>
                      <View>
                        <Text className="text-gray-500 text-xs">Duration</Text>
                        <Text className="text-white text-sm font-semibold">
                          {formatDuration(replay.duration)}
                        </Text>
                      </View>
                      <View>
                        <Text className="text-gray-500 text-xs">Efficiency</Text>
                        <Text className="text-white text-sm font-semibold">
                          {Math.round(stats.efficiency)} pts/move
                        </Text>
                      </View>
                      <View>
                        <Text className="text-gray-500 text-xs">Max Mult</Text>
                        <Text className="text-white text-sm font-semibold">
                          {replay.maxMultiplier}x
                        </Text>
                      </View>
                    </View>

                    {/* Date */}
                    <Text className="text-gray-600 text-xs">
                      {new Date(replay.createdAt).toLocaleString()}
                    </Text>

                    {/* Delete Button */}
                    <Pressable
                      onPress={() => handleDeleteReplay(replay.id)}
                      className="absolute top-2 right-2 bg-red-500/20 rounded-lg p-2"
                    >
                      <Text className="text-red-400 text-xs font-semibold">🗑️</Text>
                    </Pressable>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Code Input Modal */}
      <Modal visible={showCodeInput} transparent animationType="fade">
        <View className="flex-1 bg-black/80 items-center justify-center p-6">
          <View className="bg-gray-900 border border-purple-500 rounded-xl p-6 w-full max-w-md">
            <Text className="text-white text-xl font-bold mb-2">Load Replay</Text>
            <Text className="text-gray-400 text-sm mb-4">
              Enter a 6-character replay code
            </Text>

            <TextInput
              value={codeInput}
              onChangeText={(text: string) => {
                setCodeInput(text.toUpperCase());
                setCodeError('');
              }}
              placeholder="ABC123"
              placeholderTextColor="#6b7280"
              maxLength={6}
              autoCapitalize="characters"
              className="bg-gray-800 text-white rounded-xl px-4 py-3 mb-2 text-center text-lg font-bold"
            />

            {codeError && (
              <Text className="text-red-400 text-xs mb-3">{codeError}</Text>
            )}

            <View className="flex-row gap-3">
              <Pressable
                onPress={() => {
                  setShowCodeInput(false);
                  setCodeInput('');
                  setCodeError('');
                }}
                className="flex-1 bg-gray-800 rounded-xl py-3"
              >
                <Text className="text-white text-center font-semibold">Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleLoadByCode}
                className="flex-1 bg-purple-500 rounded-xl py-3"
              >
                <Text className="text-white text-center font-semibold">Load</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
