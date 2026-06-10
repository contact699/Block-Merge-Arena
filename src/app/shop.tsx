// Shop Screen — themes-only (Phase 3)
import { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontWeight, fontSize, space } from '@/lib/design/tokens';
import { useThemePalette, useThemeControls } from '@/lib/themes/provider';
import { useRequireSubscription } from '@/lib/subscription/gate';
import { PaywallModal } from '@/components/paywall/PaywallModal';
import type { ThemeId } from '@/lib/themes/catalog';
import { Pill } from '@/components/design/Pill';
import { GlassCard } from '@/components/design/GlassCard';
import { TactileButton } from '@/components/design/TactileButton';
import { ScreenHeader } from '@/components/design/ScreenHeader';

export default function ShopScreen() {
  const palette = useThemePalette();
  const { available, activeId, setActive } = useThemeControls();
  const isSubscribed = useRequireSubscription();
  const [showPaywall, setShowPaywall] = useState(false);

  const onApplyTheme = async (id: ThemeId) => {
    const ok = await setActive(id);
    if (!ok) setShowPaywall(true);
  };

  return (
    <SafeAreaView testID="shop-screen" style={{ flex: 1, backgroundColor: palette.paper }}>
      {/* Decorative orb */}
      <View
        pointerEvents="none"
        style={{ position: 'absolute', top: -80, right: -60, width: 240, height: 240, borderRadius: 120, backgroundColor: colors.mustard, opacity: 0.14 }}
      />

      {/* Header — ScreenHeader provides back-button testID */}
      <ScreenHeader title="Shop" />

      {/* Sub-header */}
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.xs, paddingBottom: space.sm }}>
        <Pill variant="mustard">THEMES</Pill>
        <Text style={{ fontSize: fontSize.title, fontWeight: fontWeight.black, color: colors.ink, marginTop: space.sm, letterSpacing: -1 }}>
          Themes
        </Text>
      </View>

      {/* Theme cards */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: space.md }}>
        <Text style={{ fontSize: fontSize.body, color: colors.inkSoft, marginBottom: space.md }}>
          Block Merge+ unlocks all themes. Fresh looks added regularly.
        </Text>
        {available.map((t) => {
          const isActive = t.id === activeId;
          const buttonLabel = isActive ? 'Active' : (t.locked && !isSubscribed ? 'Unlock' : 'Apply');
          const buttonVariant = isActive ? 'ink' : 'cobalt';
          return (
            <GlassCard key={t.id} style={{ padding: space.md, marginBottom: space.sm + 2, flexDirection: 'row', alignItems: 'center', gap: space.sm + 4 }}>
              <View style={{ flexDirection: 'row' }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: t.paper, borderWidth: 1, borderColor: 'rgba(22,20,15,0.1)' }} />
                <View style={{ width: 12, height: 28, marginLeft: -8, marginTop: 8, borderRadius: 6, backgroundColor: t.accent }} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fontSize.subtitle + 1, fontWeight: fontWeight.heavy, color: colors.ink }}>{t.name}</Text>
                <Text style={{ fontSize: fontSize.label + 1, color: colors.inkSoft, marginTop: 2 }}>
                  {t.locked ? 'Subscriber theme' : 'Default · free'}
                </Text>
              </View>
              <TactileButton
                testID={`shop-apply-${t.id}`}
                variant={buttonVariant}
                fullWidth={false}
                onPress={() => { void onApplyTheme(t.id); }}
                style={{ paddingHorizontal: space.lg - 2, height: 36 }}
              >
                {buttonLabel}
              </TactileButton>
            </GlassCard>
          );
        })}
      </ScrollView>

      <PaywallModal
        visible={showPaywall}
        source="theme_apply"
        onDismiss={() => setShowPaywall(false)}
      />
    </SafeAreaView>
  );
}
