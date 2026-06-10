// Achievements Screen — tactile-console restyle, slim 6-badge catalog.
import { useState, useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sparkles, Layers, Calendar, Flame, Zap, Target } from 'lucide-react-native';
import { GlassCard } from '@/components/design/GlassCard';
import { Pill } from '@/components/design/Pill';
import { ScreenHeader } from '@/components/design/ScreenHeader';
import { colors, fontWeight, space, fontSize } from '@/lib/design/tokens';
import { useThemePalette } from '@/lib/themes/provider';
import { DEFAULT_ACHIEVEMENTS, getAchievements } from '@/lib/utils/achievements';
import type { Achievement } from '@/lib/types/achievements';

type AchievementEntry = (typeof DEFAULT_ACHIEVEMENTS)[number];

const ICON_BY_ID: Record<string, React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>> = {
  'first-merge': Sparkles,
  'five-cluster': Layers,
  'first-daily': Calendar,
  'streak-7': Flame,
  'sub-three': Zap,
  centurion: Target,
};

function AchievementBadge({
  achievement,
  unlocked,
}: {
  achievement: AchievementEntry;
  unlocked: boolean;
}) {
  const Icon = ICON_BY_ID[achievement.id] ?? Target;
  return (
    <GlassCard style={{ marginBottom: space.sm, padding: 0, opacity: unlocked ? 1 : 0.35, overflow: 'hidden' }}>
      {unlocked && (
        <View style={{ height: 3, backgroundColor: colors.ember }} />
      )}
      <View style={{ padding: space.md, flexDirection: 'row', alignItems: 'center', gap: space.md }}>
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
          <Icon size={22} color={unlocked ? colors.ember : colors.inkDim} strokeWidth={2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: fontSize.subtitle,
              fontWeight: fontWeight.heavy,
              color: colors.ink,
              letterSpacing: -0.3,
            }}
          >
            {achievement.name}
          </Text>
          <Text style={{ fontSize: fontSize.body, color: colors.inkSoft, marginTop: 2 }}>
            {achievement.description}
          </Text>
        </View>
      </View>
    </GlassCard>
  );
}

export default function AchievementsScreen() {
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

      {/* Header — back-button testID is provided by ScreenHeader */}
      <ScreenHeader title="Achievements" />

      {/* Sub-header copy */}
      <View style={{ paddingHorizontal: space.lg, paddingBottom: space.sm }}>
        <Pill variant="ember">ACHIEVEMENTS</Pill>
        <Text
          style={{
            fontSize: fontSize.title,
            fontWeight: fontWeight.black,
            color: colors.ink,
            marginTop: space.sm,
            letterSpacing: -1,
          }}
        >
          Six tasteful badges
        </Text>
        <Text style={{ fontSize: fontSize.body, color: colors.inkSoft, marginTop: space.xs }}>
          Status, not currency. Earned, not bought.
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: space.md }}>
        {DEFAULT_ACHIEVEMENTS.map((a) => (
          <AchievementBadge key={a.id} achievement={a} unlocked={isUnlocked(a.id)} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
