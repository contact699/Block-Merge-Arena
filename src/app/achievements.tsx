// Achievements Screen — tactile-console restyle, slim 6-badge catalog.
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Sparkles, Trophy, Calendar, Flame, Timer, Award } from 'lucide-react-native';
import { GlassCard } from '@/components/design/GlassCard';
import { Pill } from '@/components/design/Pill';
import { colors, fontWeight } from '@/lib/design/tokens';
import { useThemePalette } from '@/lib/themes/provider';
import { DEFAULT_ACHIEVEMENTS, getAchievements } from '@/lib/utils/achievements';
import type { Achievement } from '@/lib/types/achievements';

type AchievementEntry = (typeof DEFAULT_ACHIEVEMENTS)[number];

const ICON_BY_ID: Record<string, React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>> = {
  'first-merge': Sparkles,
  'five-cluster': Flame,
  'first-daily': Calendar,
  'streak-7': Award,
  'sub-three': Timer,
  centurion: Trophy,
};

function AchievementBadge({
  achievement,
  unlocked,
}: {
  achievement: AchievementEntry;
  unlocked: boolean;
}) {
  const Icon = ICON_BY_ID[achievement.id] ?? Trophy;
  return (
    <GlassCard style={{ marginBottom: 10, padding: 0, opacity: unlocked ? 1 : 0.45, overflow: 'hidden' }}>
      {unlocked && (
        <View style={{ height: 3, backgroundColor: colors.ember }} />
      )}
      <View style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: unlocked ? 'rgba(255,90,54,0.12)' : 'rgba(22,20,15,0.06)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={22} color={unlocked ? colors.ember : colors.inkSoft} strokeWidth={2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: fontWeight.heavy,
              color: colors.ink,
              letterSpacing: -0.3,
            }}
          >
            {achievement.name}
          </Text>
          <Text style={{ fontSize: 12, color: colors.inkSoft, marginTop: 2 }}>
            {achievement.description}
          </Text>
        </View>
      </View>
    </GlassCard>
  );
}

export default function AchievementsScreen() {
  const router = useRouter();
  const palette = useThemePalette();
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    getAchievements().then((all: Achievement[]) => {
      const ids = new Set(all.filter((a) => a.completed).map((a) => a.id));
      setUnlockedIds(ids);
    });
  }, []);

  const isUnlocked = (id: string) => unlockedIds.has(id);

  return (
    <SafeAreaView testID="achievements-screen" style={{ flex: 1, backgroundColor: palette.paper }}>
      {/* Background glow blob */}
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
      <View style={{ paddingHorizontal: 18, paddingTop: 12 }}>
        <Pressable testID="back-button" onPress={() => router.back()} style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 14, fontWeight: fontWeight.semibold, color: colors.ember }}>
            ← Back
          </Text>
        </Pressable>

        <Pill variant="ember">ACHIEVEMENTS</Pill>
        <Text
          style={{
            fontSize: 32,
            fontWeight: fontWeight.black,
            color: colors.ink,
            marginTop: 12,
            letterSpacing: -1,
          }}
        >
          Six tasteful badges
        </Text>
        <Text style={{ fontSize: 13, color: colors.inkSoft, marginTop: 4 }}>
          Status, not currency. Earned, not bought.
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 14 }}>
        {DEFAULT_ACHIEVEMENTS.map((a) => (
          <AchievementBadge key={a.id} achievement={a} unlocked={isUnlocked(a.id)} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
