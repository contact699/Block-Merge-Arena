// Share Screen - View and share game highlights to social media
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  getHighlights,
  deleteHighlight,
  getRecordingConfig,
  saveRecordingConfig,
  getSocialStats,
  shareToPlatform,
  shareGeneric,
  isTikTokInstalled,
} from '@/lib/utils/social';
import type { ShareableHighlight, RecordingConfig, SocialStats, SharePlatform } from '@/lib/types/social';

export default function ShareScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [highlights, setHighlights] = useState<ShareableHighlight[]>([]);
  const [config, setConfig] = useState<RecordingConfig | null>(null);
  const [stats, setStats] = useState<SocialStats | null>(null);
  const [tikTokInstalled, setTikTokInstalled] = useState<boolean>(false);
  const [selectedHighlight, setSelectedHighlight] = useState<ShareableHighlight | null>(null);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (): Promise<void> => {
    setLoading(true);
    try {
      const [hl, cfg, sts, tikTok] = await Promise.all([
        getHighlights(),
        getRecordingConfig(),
        getSocialStats(),
        isTikTokInstalled(),
      ]);
      
      setHighlights(hl);
      setConfig(cfg);
      setStats(sts);
      setTikTokInstalled(tikTok);
    } catch (error) {
      console.error('Error loading share data:', error);
    }
    setLoading(false);
  };

  const handleShare = async (platform: SharePlatform): Promise<void> => {
    if (!selectedHighlight) return;

    const result = await shareToPlatform(platform, selectedHighlight);
    
    if (result.success && result.shared) {
      Alert.alert('Shared! 🎉', `Successfully shared to ${platform}!`, [{ text: 'OK' }]);
      setShowShareModal(false);
      setSelectedHighlight(null);
      loadData(); // Refresh stats
    } else if (!result.success) {
      Alert.alert('Error', result.error || 'Failed to share', [{ text: 'OK' }]);
    }
  };

  const handleDeleteHighlight = async (id: string): Promise<void> => {
    Alert.alert(
      'Delete Highlight',
      'Are you sure you want to delete this highlight?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteHighlight(id);
            loadData();
          },
        },
      ]
    );
  };

  const handleToggleAutoCapture = async (): Promise<void> => {
    if (!config) return;
    
    await saveRecordingConfig({ autoCapture: !config.autoCapture });
    loadData();
  };

  const handleToggleRecording = async (): Promise<void> => {
    if (!config) return;
    
    await saveRecordingConfig({ enabled: !config.enabled });
    loadData();
  };

  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getHighlightIcon = (type: ShareableHighlight['type']): string => {
    switch (type) {
      case 'combo': return '🔥';
      case 'high_score': return '🏆';
      case 'rank_up': return '📈';
      case 'achievement': return '🏅';
      case 'tournament_win': return '👑';
      default: return '🎮';
    }
  };

  const renderHeader = () => (
    <View className="mb-6">
      <View className="flex-row items-center justify-between mb-4">
        <Pressable onPress={() => router.back()} className="p-2">
          <Text className="text-2xl">←</Text>
        </Pressable>
        <Text className="text-2xl font-bold text-white">Share & TikTok</Text>
        <View className="w-10" />
      </View>

      {/* Stats */}
      {stats && (
        <View className="bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl p-4 mb-4">
          <Text className="text-white text-lg font-bold mb-2">📊 Your Sharing Stats</Text>
          <View className="flex-row justify-around">
            <View className="items-center">
              <Text className="text-white text-2xl font-bold">{stats.totalShares}</Text>
              <Text className="text-white/70 text-xs">Total Shares</Text>
            </View>
            <View className="items-center">
              <Text className="text-white text-2xl font-bold">{stats.sharesByPlatform.tiktok}</Text>
              <Text className="text-white/70 text-xs">TikTok</Text>
            </View>
            <View className="items-center">
              <Text className="text-white text-2xl font-bold">{stats.sharesByPlatform.instagram}</Text>
              <Text className="text-white/70 text-xs">Instagram</Text>
            </View>
            <View className="items-center">
              <Text className="text-white text-2xl font-bold">{highlights.length}</Text>
              <Text className="text-white/70 text-xs">Highlights</Text>
            </View>
          </View>
        </View>
      )}

      {/* Settings */}
      {config && (
        <View className="bg-gray-800 rounded-xl p-4">
          <Text className="text-white font-bold mb-3">⚙️ Capture Settings</Text>
          
          <Pressable
            onPress={handleToggleRecording}
            className="flex-row items-center justify-between py-2"
          >
            <Text className="text-gray-300">Highlight Recording</Text>
            <View className={`w-12 h-6 rounded-full ${config.enabled ? 'bg-green-500' : 'bg-gray-600'} justify-center ${config.enabled ? 'items-end' : 'items-start'} px-1`}>
              <View className="w-4 h-4 bg-white rounded-full" />
            </View>
          </Pressable>
          
          <Pressable
            onPress={handleToggleAutoCapture}
            className="flex-row items-center justify-between py-2"
          >
            <View>
              <Text className="text-gray-300">Auto-Capture Epic Moments</Text>
              <Text className="text-gray-500 text-xs">3+ combos, 3x+ multipliers</Text>
            </View>
            <View className={`w-12 h-6 rounded-full ${config.autoCapture ? 'bg-green-500' : 'bg-gray-600'} justify-center ${config.autoCapture ? 'items-end' : 'items-start'} px-1`}>
              <View className="w-4 h-4 bg-white rounded-full" />
            </View>
          </Pressable>
        </View>
      )}
    </View>
  );

  const renderHighlights = () => {
    if (highlights.length === 0) {
      return (
        <View className="items-center justify-center py-12">
          <Text className="text-6xl mb-4">📱</Text>
          <Text className="text-white text-xl font-bold mb-2">No Highlights Yet</Text>
          <Text className="text-gray-400 text-center mb-6">
            Epic moments from your games will{'\n'}appear here for easy sharing!
          </Text>
          <Pressable
            onPress={() => router.push('/game')}
            className="bg-purple-600 px-6 py-3 rounded-xl"
          >
            <Text className="text-white font-bold">Play a Game 🎮</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View className="gap-3">
        <Text className="text-gray-400 mb-2">
          {highlights.length} Highlight{highlights.length !== 1 ? 's' : ''} Ready to Share
        </Text>
        
        {highlights.map((highlight) => (
          <Pressable
            key={highlight.id}
            onPress={() => {
              setSelectedHighlight(highlight);
              setShowShareModal(true);
            }}
            className="bg-gray-800 rounded-xl p-4"
          >
            <View className="flex-row items-start justify-between">
              <View className="flex-row items-center flex-1">
                <Text className="text-3xl mr-3">{getHighlightIcon(highlight.type)}</Text>
                <View className="flex-1">
                  <Text className="text-white font-bold">{highlight.title}</Text>
                  <Text className="text-gray-400 text-sm">{highlight.description}</Text>
                  <Text className="text-gray-500 text-xs mt-1">
                    {formatTimeAgo(highlight.timestamp)}
                    {highlight.replayCode && ` • 👻 ${highlight.replayCode}`}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => handleDeleteHighlight(highlight.id)}
                className="p-2"
              >
                <Text className="text-gray-500">🗑️</Text>
              </Pressable>
            </View>
            
            {/* Quick share buttons */}
            <View className="flex-row gap-2 mt-3">
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  setSelectedHighlight(highlight);
                  handleShare('tiktok');
                }}
                className="flex-1 bg-black border border-gray-700 py-2 rounded-lg items-center flex-row justify-center"
              >
                <Text className="text-white font-semibold">🎵 TikTok</Text>
              </Pressable>
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  setSelectedHighlight(highlight);
                  handleShare('instagram');
                }}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 py-2 rounded-lg items-center"
              >
                <Text className="text-white font-semibold">📷 Insta</Text>
              </Pressable>
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  setSelectedHighlight(highlight);
                  handleShare('generic');
                }}
                className="flex-1 bg-gray-700 py-2 rounded-lg items-center"
              >
                <Text className="text-white font-semibold">📤 More</Text>
              </Pressable>
            </View>
          </Pressable>
        ))}
      </View>
    );
  };

  const renderShareModal = () => {
    if (!showShareModal || !selectedHighlight) return null;

    const platforms: { id: SharePlatform; name: string; icon: string; color: string }[] = [
      { id: 'tiktok', name: 'TikTok', icon: '🎵', color: 'bg-black border border-gray-600' },
      { id: 'instagram', name: 'Instagram', icon: '📷', color: 'bg-gradient-to-r from-purple-600 to-pink-500' },
      { id: 'twitter', name: 'Twitter/X', icon: '🐦', color: 'bg-blue-500' },
      { id: 'facebook', name: 'Facebook', icon: '👍', color: 'bg-blue-600' },
      { id: 'generic', name: 'More Options', icon: '📤', color: 'bg-gray-600' },
    ];

    return (
      <View className="absolute inset-0 bg-black/80 items-center justify-center p-4">
        <View className="bg-gray-900 rounded-2xl p-6 w-full max-w-md">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-white text-xl font-bold">Share Highlight</Text>
            <Pressable onPress={() => setShowShareModal(false)} className="p-2">
              <Text className="text-2xl text-gray-400">✕</Text>
            </Pressable>
          </View>

          {/* Highlight preview */}
          <View className="bg-gray-800 rounded-xl p-4 mb-6">
            <View className="flex-row items-center">
              <Text className="text-3xl mr-3">{getHighlightIcon(selectedHighlight.type)}</Text>
              <View>
                <Text className="text-white font-bold">{selectedHighlight.title}</Text>
                <Text className="text-gray-400 text-sm">{selectedHighlight.description}</Text>
              </View>
            </View>
          </View>

          {/* Platform buttons */}
          <View className="gap-3">
            {platforms.map((platform) => (
              <Pressable
                key={platform.id}
                onPress={() => handleShare(platform.id)}
                className={`${platform.color} py-4 rounded-xl flex-row items-center justify-center`}
              >
                <Text className="text-2xl mr-2">{platform.icon}</Text>
                <Text className="text-white font-bold text-lg">{platform.name}</Text>
                {platform.id === 'tiktok' && tikTokInstalled && (
                  <View className="bg-green-500 px-2 py-0.5 rounded-full ml-2">
                    <Text className="text-white text-xs">Installed</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>

          {/* Replay code */}
          {selectedHighlight.replayCode && (
            <View className="mt-4 p-3 bg-gray-800 rounded-xl">
              <Text className="text-gray-400 text-sm text-center">
                Replay Code: <Text className="text-purple-400 font-bold">{selectedHighlight.replayCode}</Text>
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-950">
      <ScrollView className="flex-1 px-4 pt-4">
        {renderHeader()}

        {loading ? (
          <View className="items-center justify-center py-12">
            <Text className="text-white text-lg">Loading...</Text>
          </View>
        ) : (
          renderHighlights()
        )}

        <View className="h-8" />
      </ScrollView>

      {renderShareModal()}
    </SafeAreaView>
  );
}
