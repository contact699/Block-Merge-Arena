// Replays Screen - Browse and watch saved replays
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getLocalReplays,
  getReplayByCode,
  deleteReplay,
  formatDuration,
  calculateReplayStats,
} from '@/lib/utils/replay';
import { ReplayPlayer } from '@/components/ReplayPlayer';
import type { Replay } from '@/lib/types/replay';
import { colors, fontWeight, space } from '@/lib/design/tokens';
import { useThemePalette } from '@/lib/themes/provider';
import { Pill } from '@/components/design/Pill';
import { TactileButton } from '@/components/design/TactileButton';
import { GlassCard } from '@/components/design/GlassCard';
import { ScreenHeader } from '@/components/design/ScreenHeader';
import { AsyncStateView } from '@/components/design/AsyncStateView';
import { ModeIcon } from '@/components/design/ModeIcon';

type TabType = 'all' | 'tournament' | 'endless';

// ─── Replay Row ────────────────────────────────────────────────────────────────

function ReplayRow({
  replay,
  onWatch,
  onDelete,
}: {
  replay: Replay;
  onWatch: (r: Replay) => void;
  onDelete: (id: string) => void;
}) {
  const stats = calculateReplayStats(replay);
  const dateStr = new Date(replay.createdAt).toLocaleDateString();

  return (
    <GlassCard style={{ marginBottom: 8, padding: 14 }}>
      {/* Top row: code + date + watch button */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
          {replay.code ? (
            <Pill variant="ink">{replay.code}</Pill>
          ) : null}
          <Text style={{ fontSize: 11, color: colors.inkSoft, fontWeight: fontWeight.semibold }}>
            {dateStr}
          </Text>
        </View>
        <TactileButton
          variant="cobalt"
          fullWidth={false}
          onPress={() => onWatch(replay)}
          style={{ height: 36, paddingHorizontal: 14 }}
        >
          Watch
        </TactileButton>
      </View>

      {/* Score + multiplier */}
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 14, marginTop: 10 }}>
        <Text
          style={{
            fontSize: 22,
            fontWeight: fontWeight.black,
            color: colors.ink,
            letterSpacing: -0.5,
          }}
        >
          {replay.finalScore.toLocaleString()}
        </Text>
        {replay.maxMultiplier > 1 && (
          <Text style={{ fontSize: 14, fontWeight: fontWeight.heavy, color: colors.ember }}>
            ×{replay.maxMultiplier}
          </Text>
        )}
      </View>

      {/* Secondary stats */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 8 }}>
        <View>
          <Text style={{ fontSize: 10, color: colors.inkDim, fontWeight: fontWeight.semibold }}>
            MOVES
          </Text>
          <Text style={{ fontSize: 13, color: colors.ink, fontWeight: fontWeight.bold }}>
            {replay.moveCount}
          </Text>
        </View>
        <View>
          <Text style={{ fontSize: 10, color: colors.inkDim, fontWeight: fontWeight.semibold }}>
            DURATION
          </Text>
          <Text style={{ fontSize: 13, color: colors.ink, fontWeight: fontWeight.bold }}>
            {formatDuration(replay.duration)}
          </Text>
        </View>
        <View>
          <Text style={{ fontSize: 10, color: colors.inkDim, fontWeight: fontWeight.semibold }}>
            EFFICIENCY
          </Text>
          <Text style={{ fontSize: 13, color: colors.ink, fontWeight: fontWeight.bold }}>
            {Math.round(stats.efficiency)} pts/move
          </Text>
        </View>
        <View>
          <Text style={{ fontSize: 10, color: colors.inkDim, fontWeight: fontWeight.semibold }}>
            MODE
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
            <ModeIcon mode={replay.mode} size={14} />
            <Text style={{ fontSize: 13, color: colors.ink, fontWeight: fontWeight.bold }}>
              {replay.mode}
            </Text>
          </View>
        </View>
      </View>

      {/* Delete */}
      <Pressable
        onPress={() => onDelete(replay.id)}
        style={{ position: 'absolute', top: 10, right: 10, padding: 6 }}
      >
        <Text style={{ fontSize: 13, color: colors.inkDim }}>🗑️</Text>
      </Pressable>
    </GlassCard>
  );
}

// ─── Tab Pill ──────────────────────────────────────────────────────────────────

function TabButton({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon?: React.ReactNode;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.xs,
        paddingHorizontal: space.md,
        paddingVertical: space.sm,
        borderRadius: 999,
        backgroundColor: active ? colors.ink : 'rgba(22,20,15,0.07)',
      }}
    >
      {icon}
      <Text
        style={{
          fontSize: 13,
          fontWeight: fontWeight.semibold,
          color: active ? colors.paper : colors.inkSoft,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function ReplaysScreen() {
  const palette = useThemePalette();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [replays, setReplays] = useState<Replay[]>([]);
  const [filteredReplays, setFilteredReplays] = useState<Replay[]>([]);
  const [selectedReplay, setSelectedReplay] = useState<Replay | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Code input modal
  const [showCodeInput, setShowCodeInput] = useState<boolean>(false);
  const [codeInput, setCodeInput] = useState<string>('');
  const [codeError, setCodeError] = useState<string>('');

  useEffect(() => {
    loadReplays();
  }, []);

  useEffect(() => {
    filterReplays();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, replays]);

  const loadReplays = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const loadedReplays = await getLocalReplays();
      setReplays(loadedReplays);
    } catch (err) {
      console.error('Error loading replays:', err);
      setError("Couldn't load replays.");
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
    await loadReplays();
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

  // If viewing a replay, show the player
  if (selectedReplay) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
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
    <SafeAreaView testID="replays-screen" style={{ flex: 1, backgroundColor: palette.paper }}>
      {/* Ambient ember blob */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -80,
          right: -60,
          width: 240,
          height: 240,
          borderRadius: 120,
          backgroundColor: colors.ember,
          opacity: 0.14,
        }}
      />

      {/* Header */}
      <ScreenHeader title="Replays" />
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.xs }}>
        <View style={{ marginTop: space.sm }}>
          <Pill variant="ember">REPLAYS</Pill>
        </View>
        <Text
          style={{
            fontSize: 32,
            fontWeight: fontWeight.black,
            color: colors.ink,
            marginTop: space.sm,
            letterSpacing: -1,
          }}
        >
          Watch ghosts
        </Text>
        <Text style={{ fontSize: 13, color: colors.inkSoft, marginTop: space.xs }}>
          Every run records a 6-character replay code. Share it with anyone.
        </Text>
      </View>

      {/* Load by Code */}
      <View style={{ paddingHorizontal: 18, marginTop: 16 }}>
        <TactileButton variant="plain" onPress={() => setShowCodeInput(true)}>
          Load Replay by Code
        </TactileButton>
      </View>

      {/* Tabs */}
      <View style={{ paddingHorizontal: 18, marginTop: 14 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TabButton label="All" active={activeTab === 'all'} onPress={() => setActiveTab('all')} />
          <TabButton
            label="Tournament"
            icon={<ModeIcon mode="tournament" size={14} color={activeTab === 'tournament' ? colors.paper : colors.inkSoft} />}
            active={activeTab === 'tournament'}
            onPress={() => setActiveTab('tournament')}
          />
          <TabButton
            label="Endless"
            icon={<ModeIcon mode="endless" size={14} color={activeTab === 'endless' ? colors.paper : colors.inkSoft} />}
            active={activeTab === 'endless'}
            onPress={() => setActiveTab('endless')}
          />
        </View>
      </View>

      {/* List */}
      <ScrollView
        style={{ flex: 1, marginTop: space.sm }}
        contentContainerStyle={{ padding: space.md, paddingBottom: space.xl * 2 }}
      >
        <AsyncStateView
          loading={loading}
          error={error}
          isEmpty={filteredReplays.length === 0}
          emptyMessage="No replays yet — play a run to record one."
          onRetry={loadReplays}
        >
          {filteredReplays.map((replay: Replay) => (
            <ReplayRow
              key={replay.id}
              replay={replay}
              onWatch={handleReplaySelect}
              onDelete={handleDeleteReplay}
            />
          ))}
        </AsyncStateView>
      </ScrollView>

      {/* Code Input Modal */}
      <Modal visible={showCodeInput} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(22,20,15,0.7)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <GlassCard style={{ width: '100%', maxWidth: 400, padding: 24 }}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: fontWeight.black,
                color: colors.ink,
                marginBottom: 6,
              }}
            >
              Load Replay
            </Text>
            <Text style={{ fontSize: 13, color: colors.inkSoft, marginBottom: 16 }}>
              Enter a 6-character replay code
            </Text>

            <TextInput
              value={codeInput}
              onChangeText={(text: string) => {
                setCodeInput(text.toUpperCase());
                setCodeError('');
              }}
              placeholder="ABC123"
              placeholderTextColor={colors.inkDim}
              maxLength={6}
              autoCapitalize="characters"
              style={{
                backgroundColor: colors.paper2,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                marginBottom: 8,
                textAlign: 'center',
                fontSize: 20,
                fontWeight: fontWeight.black,
                color: colors.ink,
                borderWidth: 1,
                borderColor: colors.inkRule,
                letterSpacing: 4,
              }}
            />

            {codeError ? (
              <Text style={{ fontSize: 12, color: colors.ember, marginBottom: 12 }}>
                {codeError}
              </Text>
            ) : null}

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
              <TactileButton
                variant="plain"
                onPress={() => {
                  setShowCodeInput(false);
                  setCodeInput('');
                  setCodeError('');
                }}
              >
                Cancel
              </TactileButton>
              <TactileButton variant="cobalt" onPress={handleLoadByCode}>
                Load
              </TactileButton>
            </View>
          </GlassCard>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
