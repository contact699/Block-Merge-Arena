// Share Screen - View and share game highlights to social media
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  getHighlights,
  deleteHighlight,
  getRecordingConfig,
  saveRecordingConfig,
  getSocialStats,
  shareToPlatform,
  isTikTokInstalled,
} from '@/lib/utils/social';
import type { ShareableHighlight, RecordingConfig, SocialStats, SharePlatform } from '@/lib/types/social';
import { colors, fontWeight, radii } from '@/lib/design/tokens';
import { Pill } from '@/components/design/Pill';
import { GlassCard } from '@/components/design/GlassCard';
import { TactileButton } from '@/components/design/TactileButton';

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
      Alert.alert('Shared!', `Successfully shared to ${platform}!`, [{ text: 'OK' }]);
      setShowShareModal(false);
      setSelectedHighlight(null);
      loadData();
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

  const renderStats = () => {
    if (!stats) return null;
    return (
      <GlassCard style={{ marginTop: 16, padding: 16 }}>
        <Text style={{ fontSize: 12, fontWeight: fontWeight.bold, color: colors.inkSoft, letterSpacing: 0.8, marginBottom: 12 }}>
          SHARING STATS
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: fontWeight.black, color: colors.ink }}>{stats.totalShares}</Text>
            <Text style={{ fontSize: 11, color: colors.inkDim, marginTop: 2 }}>Total Shares</Text>
          </View>
          <View style={{ width: 1, backgroundColor: colors.inkRule }} />
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: fontWeight.black, color: colors.ink }}>{stats.sharesByPlatform.tiktok}</Text>
            <Text style={{ fontSize: 11, color: colors.inkDim, marginTop: 2 }}>TikTok</Text>
          </View>
          <View style={{ width: 1, backgroundColor: colors.inkRule }} />
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: fontWeight.black, color: colors.ink }}>{stats.sharesByPlatform.instagram}</Text>
            <Text style={{ fontSize: 11, color: colors.inkDim, marginTop: 2 }}>Instagram</Text>
          </View>
          <View style={{ width: 1, backgroundColor: colors.inkRule }} />
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: fontWeight.black, color: colors.ink }}>{highlights.length}</Text>
            <Text style={{ fontSize: 11, color: colors.inkDim, marginTop: 2 }}>Highlights</Text>
          </View>
        </View>
      </GlassCard>
    );
  };

  const renderSettings = () => {
    if (!config) return null;
    return (
      <GlassCard style={{ marginTop: 12, padding: 16 }}>
        <Text style={{ fontSize: 12, fontWeight: fontWeight.bold, color: colors.inkSoft, letterSpacing: 0.8, marginBottom: 12 }}>
          CAPTURE SETTINGS
        </Text>

        <Pressable
          onPress={handleToggleRecording}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 }}
        >
          <Text style={{ fontSize: 14, color: colors.ink, fontWeight: fontWeight.medium }}>Highlight Recording</Text>
          <View style={{
            width: 44, height: 24, borderRadius: 12,
            backgroundColor: config.enabled ? colors.forest : colors.inkRule,
            justifyContent: 'center',
            alignItems: config.enabled ? 'flex-end' : 'flex-start',
            paddingHorizontal: 3,
          }}>
            <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: colors.paper }} />
          </View>
        </Pressable>

        <View style={{ height: 1, backgroundColor: colors.inkRuleSoft }} />

        <Pressable
          onPress={handleToggleAutoCapture}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 }}
        >
          <View>
            <Text style={{ fontSize: 14, color: colors.ink, fontWeight: fontWeight.medium }}>Auto-Capture Epic Moments</Text>
            <Text style={{ fontSize: 11, color: colors.inkDim, marginTop: 2 }}>3+ combos, 3x+ multipliers</Text>
          </View>
          <View style={{
            width: 44, height: 24, borderRadius: 12,
            backgroundColor: config.autoCapture ? colors.forest : colors.inkRule,
            justifyContent: 'center',
            alignItems: config.autoCapture ? 'flex-end' : 'flex-start',
            paddingHorizontal: 3,
          }}>
            <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: colors.paper }} />
          </View>
        </Pressable>
      </GlassCard>
    );
  };

  const renderHighlights = () => {
    if (highlights.length === 0) {
      return (
        <GlassCard style={{ marginTop: 16, padding: 28, alignItems: 'center' }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>📱</Text>
          <Text style={{ fontSize: 18, fontWeight: fontWeight.bold, color: colors.ink, marginBottom: 6 }}>No Highlights Yet</Text>
          <Text style={{ fontSize: 13, color: colors.inkSoft, textAlign: 'center', marginBottom: 18, lineHeight: 19 }}>
            Epic moments from your games will{'\n'}appear here for easy sharing!
          </Text>
          <TactileButton
            variant="primary"
            fullWidth={false}
            style={{ paddingHorizontal: 32 }}
            onPress={() => router.push('/game')}
          >
            Play a Game
          </TactileButton>
        </GlassCard>
      );
    }

    return (
      <View style={{ gap: 10, marginTop: 16 }}>
        <Text style={{ fontSize: 12, color: colors.inkDim, fontWeight: fontWeight.medium, letterSpacing: 0.4 }}>
          {highlights.length} Highlight{highlights.length !== 1 ? 's' : ''} Ready to Share
        </Text>

        {highlights.map((highlight) => (
          <GlassCard key={highlight.id} style={{ padding: 14 }}>
            <Pressable
              onPress={() => {
                setSelectedHighlight(highlight);
                setShowShareModal(true);
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Text style={{ fontSize: 28, marginRight: 12 }}>{getHighlightIcon(highlight.type)}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: fontWeight.bold, color: colors.ink }}>{highlight.title}</Text>
                    <Text style={{ fontSize: 13, color: colors.inkSoft, marginTop: 2 }}>{highlight.description}</Text>
                    <Text style={{ fontSize: 11, color: colors.inkDim, marginTop: 4 }}>
                      {formatTimeAgo(highlight.timestamp)}
                      {highlight.replayCode && ` · ${highlight.replayCode}`}
                    </Text>
                  </View>
                </View>
                <Pressable onPress={() => handleDeleteHighlight(highlight.id)} style={{ padding: 6 }}>
                  <Text style={{ fontSize: 16, color: colors.inkDim }}>🗑️</Text>
                </Pressable>
              </View>

              {/* Quick share buttons */}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    setSelectedHighlight(highlight);
                    handleShare('tiktok');
                  }}
                  style={{ flex: 1, backgroundColor: colors.ink, borderRadius: radii.md, paddingVertical: 9, alignItems: 'center' }}
                >
                  <Text style={{ fontSize: 13, fontWeight: fontWeight.semibold, color: colors.paper }}>🎵 TikTok</Text>
                </Pressable>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    setSelectedHighlight(highlight);
                    handleShare('instagram');
                  }}
                  style={{ flex: 1, backgroundColor: colors.plum, borderRadius: radii.md, paddingVertical: 9, alignItems: 'center' }}
                >
                  <Text style={{ fontSize: 13, fontWeight: fontWeight.semibold, color: colors.paper }}>📷 Insta</Text>
                </Pressable>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    setSelectedHighlight(highlight);
                    handleShare('generic');
                  }}
                  style={{ flex: 1, backgroundColor: colors.paper3, borderRadius: radii.md, paddingVertical: 9, alignItems: 'center', borderWidth: 1, borderColor: colors.inkRule }}
                >
                  <Text style={{ fontSize: 13, fontWeight: fontWeight.semibold, color: colors.ink }}>📤 More</Text>
                </Pressable>
              </View>
            </Pressable>
          </GlassCard>
        ))}
      </View>
    );
  };

  const renderShareModal = () => {
    if (!showShareModal || !selectedHighlight) return null;

    const platforms: { id: SharePlatform; name: string; icon: string; bg: string; textColor: string }[] = [
      { id: 'tiktok', name: 'TikTok', icon: '🎵', bg: colors.ink, textColor: colors.paper },
      { id: 'instagram', name: 'Instagram', icon: '📷', bg: colors.plum, textColor: colors.paper },
      { id: 'twitter', name: 'Twitter/X', icon: '🐦', bg: colors.cobalt, textColor: colors.paper },
      { id: 'facebook', name: 'Facebook', icon: '👍', bg: colors.cobaltDeep, textColor: colors.paper },
      { id: 'generic', name: 'More Options', icon: '📤', bg: colors.paper3, textColor: colors.ink },
    ];

    return (
      <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(22,20,15,0.7)', alignItems: 'center', justifyContent: 'center', padding: 16 } as any}>
        <GlassCard style={{ padding: 20, width: '100%', maxWidth: 400 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: fontWeight.bold, color: colors.ink }}>Share Highlight</Text>
            <Pressable onPress={() => setShowShareModal(false)} style={{ padding: 6 }}>
              <Text style={{ fontSize: 18, color: colors.inkSoft }}>✕</Text>
            </Pressable>
          </View>

          {/* Highlight preview */}
          <View style={{ backgroundColor: colors.paper2, borderRadius: radii.lg, padding: 14, marginBottom: 16, flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 28, marginRight: 12 }}>{getHighlightIcon(selectedHighlight.type)}</Text>
            <View>
              <Text style={{ fontSize: 15, fontWeight: fontWeight.bold, color: colors.ink }}>{selectedHighlight.title}</Text>
              <Text style={{ fontSize: 12, color: colors.inkSoft, marginTop: 2 }}>{selectedHighlight.description}</Text>
            </View>
          </View>

          {/* Platform buttons */}
          <View style={{ gap: 8 }}>
            {platforms.map((platform) => (
              <Pressable
                key={platform.id}
                onPress={() => handleShare(platform.id)}
                style={{ backgroundColor: platform.bg, borderRadius: radii.lg, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: platform.id === 'generic' ? 1 : 0, borderColor: colors.inkRule }}
              >
                <Text style={{ fontSize: 20, marginRight: 8 }}>{platform.icon}</Text>
                <Text style={{ fontSize: 15, fontWeight: fontWeight.bold, color: platform.textColor }}>{platform.name}</Text>
                {platform.id === 'tiktok' && tikTokInstalled && (
                  <View style={{ backgroundColor: colors.forest, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, marginLeft: 8 }}>
                    <Text style={{ color: colors.paper, fontSize: 10, fontWeight: fontWeight.bold }}>Installed</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>

          {selectedHighlight.replayCode && (
            <View style={{ marginTop: 14, padding: 12, backgroundColor: colors.paper2, borderRadius: radii.md }}>
              <Text style={{ fontSize: 12, color: colors.inkSoft, textAlign: 'center' }}>
                Replay Code:{' '}
                <Text style={{ color: colors.cobalt, fontWeight: fontWeight.bold }}>{selectedHighlight.replayCode}</Text>
              </Text>
            </View>
          )}
        </GlassCard>
      </View>
    );
  };

  return (
    <SafeAreaView testID="share-screen" style={{ flex: 1, backgroundColor: colors.paper }}>
      {/* Decorative orb */}
      <View
        pointerEvents="none"
        style={{ position: 'absolute', top: -80, right: -60, width: 240, height: 240, borderRadius: 120, backgroundColor: colors.ember, opacity: 0.14 }}
      />

      {/* Back button */}
      <View style={{ paddingHorizontal: 18, paddingTop: 8 }}>
        <Pressable testID="back-button" onPress={() => router.back()} style={{ alignSelf: 'flex-start', paddingVertical: 6, paddingRight: 12 }}>
          <Text style={{ fontSize: 22, color: colors.ink }}>←</Text>
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 32 }}>
        {/* Header */}
        <Pill variant="ember">SHARE</Pill>
        <Text style={{ fontSize: 32, fontWeight: fontWeight.black, color: colors.ink, marginTop: 12, letterSpacing: -1 }}>
          Your highlights
        </Text>
        <Text style={{ fontSize: 13, color: colors.inkSoft, marginTop: 6, lineHeight: 19 }}>
          Epic moments from your games, ready to share.
        </Text>

        {renderStats()}
        {renderSettings()}

        {loading ? (
          <GlassCard style={{ marginTop: 16, padding: 40, alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: colors.inkSoft }}>Loading...</Text>
          </GlassCard>
        ) : (
          renderHighlights()
        )}
      </ScrollView>

      {renderShareModal()}
    </SafeAreaView>
  );
}
