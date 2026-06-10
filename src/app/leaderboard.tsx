// Leaderboard Screen - Local & Global high scores
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getTopScores,
  getTopScoresByMode,
  getRecentGames,
  getGameStats,
  formatDate,
  type GameScore
} from '@/lib/utils/leaderboard';
import {
  getGlobalLeaderboard,
  isConfigured as isFirebaseConfigured,
  type LeaderboardEntry
} from '@/lib/firebase';
import { colors, fontWeight } from '@/lib/design/tokens';
import { useThemePalette } from '@/lib/themes/provider';
import { Pill } from '@/components/design/Pill';
import { GlassCard } from '@/components/design/GlassCard';
import { ScreenHeader } from '@/components/design/ScreenHeader';
import { AsyncStateView } from '@/components/design/AsyncStateView';
import { ModeIcon } from '@/components/design/ModeIcon';

type TabType = 'all' | 'endless' | 'tournament' | 'recent';
type LeaderboardMode = 'local' | 'global';

// ─── TabStrip ────────────────────────────────────────────────────────────────

function TabStrip({
  active,
  onChange,
  tabs,
}: {
  active: string;
  onChange: (v: string) => void;
  tabs: { id: string; label: string }[];
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 4,
        padding: 4,
        borderRadius: 999,
        backgroundColor: 'rgba(22,20,15,0.06)',
        alignSelf: 'flex-start',
      }}
    >
      {tabs.map((t) => {
        const isActive = active === t.id;
        return (
          <Pressable
            key={t.id}
            onPress={() => onChange(t.id)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: 999,
              backgroundColor: isActive ? colors.ink : 'transparent',
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: fontWeight.heavy,
                letterSpacing: 1.2,
                color: isActive ? colors.paper : colors.inkSoft,
              }}
            >
              {t.label.toUpperCase()}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── LeaderboardRow ───────────────────────────────────────────────────────────

function LeaderboardRow({
  row,
  isPlayer,
  modeIcon,
}: {
  row: { rank: number; name: string; score: number; multiplier?: number; userId: string };
  isPlayer: boolean;
  modeIcon?: React.ReactNode;
}) {
  return (
    <GlassCard
      style={{
        marginBottom: 8,
        paddingVertical: 12,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        borderColor: isPlayer ? colors.ember : 'rgba(22,20,15,0.08)',
        borderWidth: isPlayer ? 2 : 1,
      }}
    >
      <Text
        style={{
          width: 36,
          fontSize: 14,
          fontWeight: fontWeight.heavy,
          color: isPlayer ? colors.ember : colors.inkSoft,
          fontVariant: ['tabular-nums'],
        }}
      >
        {row.rank}
      </Text>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {modeIcon}
        <Text
          style={{
            fontSize: 14,
            fontWeight: fontWeight.semibold,
            color: colors.ink,
          }}
        >
          {row.name}
        </Text>
      </View>
      {row.multiplier != null && row.multiplier > 1 && (
        <Text
          style={{
            fontSize: 12,
            fontWeight: fontWeight.bold,
            color: colors.ember,
            marginRight: 10,
          }}
        >
          ×{row.multiplier}
        </Text>
      )}
      <Text
        style={{
          fontSize: 16,
          fontWeight: fontWeight.black,
          color: isPlayer ? colors.ember : colors.ink,
          fontVariant: ['tabular-nums'],
        }}
      >
        {row.score.toLocaleString()}
      </Text>
    </GlassCard>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function LeaderboardScreen() {
  const palette = useThemePalette();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [leaderboardMode, setLeaderboardMode] = useState<LeaderboardMode>('local');
  const [scores, setScores] = useState<GameScore[]>([]);
  const [globalScores, setGlobalScores] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState({
    totalGames: 0,
    averageScore: 0,
    highScore: 0,
    gamesThisWeek: 0
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const isFirebaseAvailable = isFirebaseConfigured();

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, leaderboardMode]);

  const loadData = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      // Always load local stats
      const gameStats = await getGameStats();
      setStats(gameStats);

      if (leaderboardMode === 'global' && isFirebaseAvailable) {
        // Load global leaderboard from Firebase
        const mode = activeTab === 'recent' ? 'all' : activeTab; // recent not supported in global
        const response = await getGlobalLeaderboard(mode, 100);
        setGlobalScores(response.entries);
      } else {
        // Load local scores
        let loadedScores: GameScore[] = [];
        if (activeTab === 'all') {
          loadedScores = await getTopScores(20);
        } else if (activeTab === 'endless') {
          loadedScores = await getTopScoresByMode('endless', 20);
        } else if (activeTab === 'tournament') {
          loadedScores = await getTopScoresByMode('tournament', 20);
        } else if (activeTab === 'recent') {
          loadedScores = await getRecentGames(20);
        }
        setScores(loadedScores);
      }
    } catch (err) {
      console.error('Error loading leaderboard:', err);
      setError("Couldn't load the leaderboard.");
    }
    setLoading(false);
  };

  const TABS: { id: TabType; label: string }[] = [
    { id: 'all', label: 'All Time' },
    { id: 'endless', label: 'Endless' },
    { id: 'tournament', label: 'Tournament' },
    { id: 'recent', label: 'Recent' },
  ];

  return (
    <SafeAreaView testID="leaderboard-screen" style={{ flex: 1, backgroundColor: palette.paper }}>
      {/* Ambient ember blob top-right */}
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
      <ScreenHeader title="Leaderboard" />

      {/* Mode pill + subtitle */}
      <View style={{ paddingHorizontal: 18 }}>
        <Pill variant="ember">
          {leaderboardMode === 'global' ? 'GLOBAL · LIVE' : 'MY SCORES · LOCAL'}
        </Pill>
        <Text style={{ fontSize: 13, color: colors.inkSoft, marginTop: 4 }}>
          {leaderboardMode === 'global' ? 'Compete with players worldwide' : "Today's standings"}
        </Text>
      </View>

      {/* Local/Global Toggle (only show if Firebase is configured) */}
      {isFirebaseAvailable && (
        <View style={{ paddingHorizontal: 18, marginTop: 16 }}>
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: 'rgba(22,20,15,0.06)',
              borderRadius: 999,
              padding: 4,
              alignSelf: 'flex-start',
              gap: 4,
            }}
          >
            <Pressable
              onPress={() => setLeaderboardMode('local')}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 7,
                borderRadius: 999,
                backgroundColor: leaderboardMode === 'local' ? colors.ink : 'transparent',
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: fontWeight.heavy,
                  letterSpacing: 1.2,
                  color: leaderboardMode === 'local' ? colors.paper : colors.inkSoft,
                }}
              >
                MY SCORES
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setLeaderboardMode('global')}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 7,
                borderRadius: 999,
                backgroundColor: leaderboardMode === 'global' ? colors.ink : 'transparent',
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: fontWeight.heavy,
                  letterSpacing: 1.2,
                  color: leaderboardMode === 'global' ? colors.paper : colors.inkSoft,
                }}
              >
                GLOBAL
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Stats Cards */}
      <View style={{ paddingHorizontal: 18, marginTop: 16 }}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <GlassCard style={{ flex: 1, padding: 14 }}>
            <Text
              style={{
                fontSize: 10,
                fontWeight: fontWeight.bold,
                letterSpacing: 1.4,
                color: colors.ember,
              }}
            >
              BEST
            </Text>
            <Text
              style={{
                fontSize: 22,
                fontWeight: fontWeight.black,
                color: colors.ink,
                marginTop: 4,
                fontVariant: ['tabular-nums'],
              }}
            >
              {stats.highScore.toLocaleString()}
            </Text>
          </GlassCard>

          <GlassCard style={{ flex: 1, padding: 14 }}>
            <Text
              style={{
                fontSize: 10,
                fontWeight: fontWeight.bold,
                letterSpacing: 1.4,
                color: colors.cobalt,
              }}
            >
              GAMES
            </Text>
            <Text
              style={{
                fontSize: 22,
                fontWeight: fontWeight.black,
                color: colors.ink,
                marginTop: 4,
                fontVariant: ['tabular-nums'],
              }}
            >
              {stats.totalGames}
            </Text>
          </GlassCard>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
          <GlassCard style={{ flex: 1, padding: 14 }}>
            <Text
              style={{
                fontSize: 10,
                fontWeight: fontWeight.bold,
                letterSpacing: 1.4,
                color: colors.forest,
              }}
            >
              AVERAGE
            </Text>
            <Text
              style={{
                fontSize: 22,
                fontWeight: fontWeight.black,
                color: colors.ink,
                marginTop: 4,
                fontVariant: ['tabular-nums'],
              }}
            >
              {stats.averageScore.toLocaleString()}
            </Text>
          </GlassCard>

          <GlassCard style={{ flex: 1, padding: 14 }}>
            <Text
              style={{
                fontSize: 10,
                fontWeight: fontWeight.bold,
                letterSpacing: 1.4,
                color: colors.mustard,
              }}
            >
              THIS WEEK
            </Text>
            <Text
              style={{
                fontSize: 22,
                fontWeight: fontWeight.black,
                color: colors.ink,
                marginTop: 4,
                fontVariant: ['tabular-nums'],
              }}
            >
              {stats.gamesThisWeek}
            </Text>
          </GlassCard>
        </View>
      </View>

      {/* TabStrip */}
      <View style={{ paddingHorizontal: 18, marginTop: 16 }}>
        <TabStrip active={activeTab} onChange={(v) => setActiveTab(v as TabType)} tabs={TABS} />
      </View>

      {/* Scrollable list */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 14, paddingTop: 12 }}>
        <AsyncStateView
          loading={loading}
          error={error}
          isEmpty={(leaderboardMode === 'global' ? globalScores : scores).length === 0}
          emptyMessage="No scores yet — be the first."
          onRetry={loadData}
        >
          {leaderboardMode === 'global'
            ? globalScores.map((entry: LeaderboardEntry, index: number) => (
                <LeaderboardRow
                  key={`${entry.userId}-${index}`}
                  row={{
                    rank: entry.rank,
                    name: entry.displayName,
                    score: entry.score,
                    multiplier: entry.maxMultiplier,
                    userId: entry.userId,
                  }}
                  isPlayer={!!entry.isCurrentUser}
                />
              ))
            : scores.map((scoreEntry: GameScore, index: number) => (
                <LeaderboardRow
                  key={scoreEntry.id}
                  row={{
                    rank: index + 1,
                    name: formatDate(scoreEntry.date),
                    score: scoreEntry.score,
                    multiplier: scoreEntry.maxMultiplier,
                    userId: '',
                  }}
                  isPlayer={false}
                  modeIcon={<ModeIcon mode={scoreEntry.mode} size={14} />}
                />
              ))}
        </AsyncStateView>
      </ScrollView>
    </SafeAreaView>
  );
}
