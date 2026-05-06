// Shop Screen — themes-only (Phase 3)
import { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, fontWeight } from '@/lib/design/tokens';
import { useThemePalette, useThemeControls } from '@/lib/themes/provider';
import { useRequireSubscription } from '@/lib/subscription/gate';
import { PaywallModal } from '@/components/paywall/PaywallModal';
import type { ThemeId } from '@/lib/themes/catalog';
import { Pill } from '@/components/design/Pill';
import { GlassCard } from '@/components/design/GlassCard';
import { TactileButton } from '@/components/design/TactileButton';

export default function ShopScreen() {
  const router = useRouter();
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

      {/* Back button */}
      <View style={{ paddingHorizontal: 18, paddingTop: 8 }}>
        <Pressable testID="back-button" onPress={() => router.back()} style={{ alignSelf: 'flex-start', paddingVertical: 6, paddingRight: 12 }}>
          <Text style={{ fontSize: 22, color: colors.ink }}>←</Text>
        </Pressable>
      </View>

      {/* Header */}
      <View style={{ paddingHorizontal: 18, paddingTop: 4, paddingBottom: 8 }}>
        <Pill variant="mustard">SHOP</Pill>
        <Text style={{ fontSize: 32, fontWeight: fontWeight.black, color: colors.ink, marginTop: 12, letterSpacing: -1 }}>
          Themes
        </Text>
      </View>

      {/* Theme cards */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 14 }}>
        <Text style={{ fontSize: 13, color: colors.inkSoft, marginBottom: 14 }}>
          Block Merge+ unlocks all themes. Fresh looks added regularly.
        </Text>
        {available.map((t) => {
          const isActive = t.id === activeId;
          const buttonLabel = isActive ? 'Active' : (t.locked && !isSubscribed ? 'Unlock' : 'Apply');
          const buttonVariant = isActive ? 'ink' : 'cobalt';
          return (
            <GlassCard key={t.id} style={{ padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flexDirection: 'row' }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: t.paper, borderWidth: 1, borderColor: 'rgba(22,20,15,0.1)' }} />
                <View style={{ width: 12, height: 28, marginLeft: -8, marginTop: 8, borderRadius: 6, backgroundColor: t.accent }} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: fontWeight.heavy, color: colors.ink }}>{t.name}</Text>
                <Text style={{ fontSize: 12, color: colors.inkSoft, marginTop: 2 }}>
                  {t.locked ? 'Subscriber theme' : 'Default · free'}
                </Text>
              </View>
              <TactileButton
                testID={`shop-apply-${t.id}`}
                variant={buttonVariant}
                fullWidth={false}
                onPress={() => { void onApplyTheme(t.id); }}
                style={{ paddingHorizontal: 16, height: 36 }}
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
