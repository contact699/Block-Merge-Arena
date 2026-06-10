// Share Screen - View and share game highlights to social media
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Flame, Trophy, Medal, Crown, Gamepad2, Smartphone, Trash2, X } from 'lucide-react-native';
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
import { colors, fontSize, fontWeight, radii, space } from '@/lib/design/tokens';
import { useThemePalette } from '@/lib/themes/provider';
import { Pill } from '@/components/design/Pill';
import { GlassCard } from '@/components/design/GlassCard';
import { TactileButton } from '@/components/design/TactileButton';
import { ScreenHeader } from '@/components/design/ScreenHeader';
import { AsyncStateView } from '@/components/design/AsyncStateView';
import { renderShareGrid } from '@/lib/share/grid';
import { getLastCompletedRun } from '@/lib/utils/replay';
import { track } from '@/lib/analytics/events';

export default function ShareScreen() {
  const router = useRouter();
  const palette = useThemePalette();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<ShareableHighlight[]>([]);
  const [config, setConfig] = useState<RecordingConfig | null>(null);
  const [stats, setStats] = useState<SocialStats | null>(null);
  const [tikTokInstalled, setTikTokInstalled] = useState<boolean>(false);
  const [selectedHighlight, setSelectedHighlight] = useState<ShareableHighlight | null>(null);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);

  // Daily grid state
  const [grid, setGrid] = useState<string | null>(null);
  const [gridScore, setGridScore] = useState<number>(0);

  useEffect(() => {
    loadData();
    loadGrid();
  }, []);

  const loadGrid = async (): Promise<void> => {
    const run = await getLastCompletedRun();
    if (!run) return;
    setGridScore(run.score);
    setGrid(renderShareGrid(run));
  };

  const onCopyGrid = async (): Promise<void> => {
    if (!grid) return;
    await Clipboard.setStringAsync(grid);
    track('share_grid_tapped', { source: 'daily', score: gridScore });
    Alert.alert('Copied!', 'Grid copied to clipboard.', [{ text: 'OK' }]);
  };

  const loadData = async (): Promise<void> => {
    setLoading(true);
    setError(null);
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
    } catch (err) {
      console.error('Error loading share data:', err);
      setError("Couldn't load your share data.");
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

  const getHighlightIcon = (type: ShareableHighlight['type']): React.ReactElement => {
    const iconProps = { size: 28, strokeWidth: 2 } as const;
    switch (type) {
      case 'combo': return <Flame {...iconProps} color={colors.ember} />;
      case 'high_score': return <Trophy {...iconProps} color={colors.mustard} />;
      case 'achievement': return <Medal {...iconProps} color={colors.forest} />;
      case 'tournament_win': return <Crown {...iconProps} color={colors.mustard} />;
      default: return <Gamepad2 {...iconProps} color={colors.inkSoft} />;
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
          <View style={{ marginBottom: space.md }}>
            <Smartphone size={48} color={colors.inkDim} strokeWidth={1.5} />
          </View>
          <Text style={{ fontSize: fontSize.subtitle, fontWeight: fontWeight.bold, color: colors.ink, marginBottom: space.sm }}>No Highlights Yet</Text>
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
                  <View style={{ marginRight: space.md }}>{getHighlightIcon(highlight.type)}</View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: fontWeight.bold, color: colors.ink }}>{highlight.title}</Text>
                    <Text style={{ fontSize: 13, color: colors.inkSoft, marginTop: 2 }}>{highlight.description}</Text>
                    <Text style={{ fontSize: 11, color: colors.inkDim, marginTop: 4 }}>
                      {formatTimeAgo(highlight.timestamp)}
                      {highlight.replayCode && ` · ${highlight.replayCode}`}
                    </Text>
                  </View>
                </View>
                <Pressable onPress={() => handleDeleteHighlight(highlight.id)} style={{ padding: space.sm }} hitSlop={6}>
                  <Trash2 size={18} color={colors.inkDim} strokeWidth={2} />
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
            <Pressable onPress={() => setShowShareModal(false)} style={{ padding: space.sm }} hitSlop={6}>
              <X size={20} color={colors.inkSoft} strokeWidth={2} />
            </Pressable>
          </View>

          {/* Highlight preview */}
          <View style={{ backgroundColor: colors.paper2, borderRadius: radii.lg, padding: space.md, marginBottom: space.lg, flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ marginRight: space.md }}>{getHighlightIcon(selectedHighlight.type)}</View>
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
    <SafeAreaView testID="share-screen" style={{ flex: 1, backgroundColor: palette.paper }}>
      {/* Decorative orb */}
      <View
        pointerEvents="none"
        style={{ position: 'absolute', top: -80, right: -60, width: 240, height: 240, borderRadius: 120, backgroundColor: colors.ember, opacity: 0.14 }}
      />

      <ScreenHeader title="Share" />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: space.xl }}>
        {/* Sub-header */}
        <Pill variant="ember">HIGHLIGHTS</Pill>
        <Text style={{ fontSize: 32, fontWeight: fontWeight.black, color: colors.ink, marginTop: space.md, letterSpacing: -1 }}>
          Your highlights
        </Text>
        <Text style={{ fontSize: fontSize.body, color: colors.inkSoft, marginTop: space.sm, lineHeight: 19 }}>
          Epic moments from your games, ready to share.
        </Text>

        {/* Daily grid section */}
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontSize: 12, fontWeight: fontWeight.bold, color: colors.inkSoft, letterSpacing: 0.8, marginBottom: 10 }}>
            YOUR DAILY GRID
          </Text>
          <Text style={{ fontSize: 12, color: colors.inkDim, marginBottom: 12, lineHeight: 18 }}>
            Your annotated emoji grid from your last run — copy and paste anywhere.
          </Text>
          {grid ? (
            <GlassCard style={{ padding: 20, width: '100%', maxWidth: 360 }}>
              <Text style={{ fontFamily: 'Courier', fontSize: 12, color: colors.ink, lineHeight: 16 }}>
                {grid}
              </Text>
            </GlassCard>
          ) : (
            <Text style={{ color: colors.inkSoft, padding: 24, textAlign: 'center' }}>
              Finish a run to generate your grid.
            </Text>
          )}
          <TactileButton
            testID="copy-grid-button"
            variant="primary"
            onPress={grid ? onCopyGrid : undefined}
            style={{ marginTop: 18, maxWidth: 360, opacity: grid ? 1 : 0.4 }}
          >
            Copy grid
          </TactileButton>
        </View>

        <AsyncStateView
          loading={loading}
          error={error}
          isEmpty={!loading && !error && highlights.length === 0 && stats === null}
          emptyMessage="No share data yet — finish a run to get started."
          onRetry={loadData}
        >
          {renderStats()}
          {renderSettings()}
          {renderHighlights()}
        </AsyncStateView>
      </ScrollView>

      {renderShareModal()}
    </SafeAreaView>
  );
}
