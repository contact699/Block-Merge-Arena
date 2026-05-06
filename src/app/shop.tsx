// Shop Screen - Buy cosmetics and power-ups
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getCurrency, formatCurrency } from '@/lib/utils/currency';
import { getInventory, purchaseItem, equipItem } from '@/lib/utils/inventory';
import { getRarityColor, getRarityBadge } from '@/lib/shop/catalog';
import type { Currency, ShopCategory, BoardTheme, BlockSkin, GemSkin } from '@/lib/types/shop';
import { colors, fontWeight, radii } from '@/lib/design/tokens';
import { useThemePalette } from '@/lib/themes/provider';
import { Pill } from '@/components/design/Pill';
import { GlassCard } from '@/components/design/GlassCard';
import { TactileButton } from '@/components/design/TactileButton';

type TabType = 'themes' | 'blocks' | 'gems';

// Accent color per tab for item stripe
const TAB_ACCENT: Record<TabType, string> = {
  themes: colors.mustard,
  blocks: colors.cobalt,
  gems: colors.plum,
};

export default function ShopScreen() {
  const router = useRouter();
  const palette = useThemePalette();
  const [activeTab, setActiveTab] = useState<TabType>('themes');
  const [currency, setCurrency] = useState<Currency>({ gems: 0, coins: 0 });
  const [themes, setThemes] = useState<BoardTheme[]>([]);
  const [blockSkins, setBlockSkins] = useState<BlockSkin[]>([]);
  const [gemSkins, setGemSkins] = useState<GemSkin[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (): Promise<void> => {
    setLoading(true);
    try {
      const [currencyData, inventory] = await Promise.all([
        getCurrency(),
        getInventory(),
      ]);

      setCurrency(currencyData);
      setThemes(inventory.themes);
      setBlockSkins(inventory.blockSkins);
      setGemSkins(inventory.gemSkins);
    } catch (error) {
      console.error('Error loading shop data:', error);
    }
    setLoading(false);
  };

  const handlePurchase = async (
    itemId: string,
    itemType: ShopCategory,
    price: { gems?: number; coins?: number }
  ): Promise<void> => {
    const result = await purchaseItem(itemId, itemType, price);

    if (result.success) {
      Alert.alert('Purchase Successful!', 'Item has been added to your inventory', [
        { text: 'OK', onPress: () => loadData() },
      ]);
    } else {
      Alert.alert('Purchase Failed', result.error || 'Unknown error', [{ text: 'OK' }]);
    }
  };

  const handleEquip = async (itemId: string, itemType: ShopCategory): Promise<void> => {
    const result = await equipItem(itemId, itemType);

    if (result.success) {
      await loadData();
    } else {
      Alert.alert('Equip Failed', result.error || 'Unknown error', [{ text: 'OK' }]);
    }
  };

  const renderThemeItem = (theme: BoardTheme) => {
    const accent = TAB_ACCENT.themes;
    return (
      <GlassCard key={theme.id} style={{ marginBottom: 12, overflow: 'hidden' }}>
        {/* Color stripe */}
        <View style={{ height: 4, backgroundColor: accent, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl }} />

        <View style={{ padding: 14 }}>
          {/* Header row */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={{ fontSize: 16, fontWeight: fontWeight.heavy, color: colors.ink }}>{theme.name}</Text>
              <Text style={{ fontSize: 12, color: colors.inkSoft, marginTop: 2 }}>{theme.description}</Text>
            </View>
            <View style={{ borderRadius: radii.sm, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: `${getRarityColor(theme.rarity)}1a` }}>
              <Text style={{ color: getRarityColor(theme.rarity), fontSize: 11, fontWeight: fontWeight.bold }}>
                {getRarityBadge(theme.rarity)}
              </Text>
            </View>
          </View>

          {/* Color preview swatches */}
          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
            <View style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: theme.colors.background, borderWidth: 1, borderColor: colors.inkRuleSoft }} />
            <View style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: theme.colors.grid, borderWidth: 1, borderColor: colors.inkRuleSoft }} />
            <View style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: theme.colors.cell, borderWidth: 1, borderColor: colors.inkRuleSoft }} />
            <View style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: theme.colors.cellFilled, borderWidth: 1, borderColor: colors.inkRuleSoft }} />
          </View>

          {/* Action */}
          {theme.unlocked ? (
            theme.equipped ? (
              <TactileButton
                variant="ink"
                fullWidth={false}
                style={{ alignSelf: 'stretch' }}
                onPress={() => {}}
              >
                Equipped
              </TactileButton>
            ) : (
              <TactileButton
                variant="cobalt"
                fullWidth={false}
                style={{ alignSelf: 'stretch' }}
                onPress={() => handleEquip(theme.id, 'themes')}
              >
                Equip
              </TactileButton>
            )
          ) : (
            <TactileButton
              variant="cobalt"
              fullWidth={false}
              style={{ alignSelf: 'stretch' }}
              onPress={() => {
                Alert.alert(
                  'Purchase Theme?',
                  `Buy ${theme.name} for ${theme.price.gems ? `${theme.price.gems} gems` : `${theme.price.coins} coins`}?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Buy', onPress: () => handlePurchase(theme.id, 'themes', theme.price) },
                  ]
                );
              }}
            >
              {theme.price.gems ? `${theme.price.gems} Gems` : `${theme.price.coins} Coins`}
            </TactileButton>
          )}
        </View>
      </GlassCard>
    );
  };

  const renderBlockSkinItem = (skin: BlockSkin) => {
    const accent = TAB_ACCENT.blocks;
    return (
      <GlassCard key={skin.id} style={{ marginBottom: 12, overflow: 'hidden' }}>
        <View style={{ height: 4, backgroundColor: accent, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl }} />

        <View style={{ padding: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={{ fontSize: 16, fontWeight: fontWeight.heavy, color: colors.ink }}>{skin.name}</Text>
              <Text style={{ fontSize: 12, color: colors.inkSoft, marginTop: 2 }}>{skin.description}</Text>
            </View>
            <View style={{ borderRadius: radii.sm, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: `${getRarityColor(skin.rarity)}1a` }}>
              <Text style={{ color: getRarityColor(skin.rarity), fontSize: 11, fontWeight: fontWeight.bold }}>
                {getRarityBadge(skin.rarity)}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
            {skin.colors.map((color: string, index: number) => (
              <View key={index} style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: color, borderWidth: 1, borderColor: colors.inkRuleSoft }} />
            ))}
          </View>

          {skin.unlocked ? (
            skin.equipped ? (
              <TactileButton variant="ink" fullWidth={false} style={{ alignSelf: 'stretch' }} onPress={() => {}}>
                Equipped
              </TactileButton>
            ) : (
              <TactileButton variant="cobalt" fullWidth={false} style={{ alignSelf: 'stretch' }} onPress={() => handleEquip(skin.id, 'blocks')}>
                Equip
              </TactileButton>
            )
          ) : (
            <TactileButton
              variant="cobalt"
              fullWidth={false}
              style={{ alignSelf: 'stretch' }}
              onPress={() => {
                Alert.alert(
                  'Purchase Block Skin?',
                  `Buy ${skin.name} for ${skin.price.gems ? `${skin.price.gems} gems` : `${skin.price.coins} coins`}?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Buy', onPress: () => handlePurchase(skin.id, 'blocks', skin.price) },
                  ]
                );
              }}
            >
              {skin.price.gems ? `${skin.price.gems} Gems` : `${skin.price.coins} Coins`}
            </TactileButton>
          )}
        </View>
      </GlassCard>
    );
  };

  const renderGemSkinItem = (skin: GemSkin) => {
    const accent = TAB_ACCENT.gems;
    return (
      <GlassCard key={skin.id} style={{ marginBottom: 12, overflow: 'hidden' }}>
        <View style={{ height: 4, backgroundColor: accent, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl }} />

        <View style={{ padding: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={{ fontSize: 16, fontWeight: fontWeight.heavy, color: colors.ink }}>{skin.name}</Text>
              <Text style={{ fontSize: 12, color: colors.inkSoft, marginTop: 2 }}>{skin.description}</Text>
            </View>
            <View style={{ borderRadius: radii.sm, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: `${getRarityColor(skin.rarity)}1a` }}>
              <Text style={{ color: getRarityColor(skin.rarity), fontSize: 11, fontWeight: fontWeight.bold }}>
                {getRarityBadge(skin.rarity)}
              </Text>
            </View>
          </View>

          <View style={{ backgroundColor: `${colors.plum}14`, borderWidth: 1, borderColor: `${colors.plum}30`, borderRadius: radii.md, paddingVertical: 8, paddingHorizontal: 12, marginBottom: 12 }}>
            <Text style={{ color: colors.plum, fontSize: 12, fontWeight: fontWeight.semibold }}>Effect: {skin.effect}</Text>
          </View>

          {skin.unlocked ? (
            skin.equipped ? (
              <TactileButton variant="ink" fullWidth={false} style={{ alignSelf: 'stretch' }} onPress={() => {}}>
                Equipped
              </TactileButton>
            ) : (
              <TactileButton variant="cobalt" fullWidth={false} style={{ alignSelf: 'stretch' }} onPress={() => handleEquip(skin.id, 'gems')}>
                Equip
              </TactileButton>
            )
          ) : (
            <TactileButton
              variant="cobalt"
              fullWidth={false}
              style={{ alignSelf: 'stretch' }}
              onPress={() => {
                Alert.alert(
                  'Purchase Gem Skin?',
                  `Buy ${skin.name} for ${skin.price.gems ? `${skin.price.gems} gems` : `${skin.price.coins} coins`}?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Buy', onPress: () => handlePurchase(skin.id, 'gems', skin.price) },
                  ]
                );
              }}
            >
              {skin.price.gems ? `${skin.price.gems} Gems` : `${skin.price.coins} Coins`}
            </TactileButton>
          )}
        </View>
      </GlassCard>
    );
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: 'themes', label: 'Themes' },
    { id: 'blocks', label: 'Blocks' },
    { id: 'gems', label: 'Gems' },
  ];

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
      <View style={{ paddingHorizontal: 18, paddingTop: 4 }}>
        <Pill variant="mustard">SHOP</Pill>
        <Text style={{ fontSize: 32, fontWeight: fontWeight.black, color: colors.ink, marginTop: 12, letterSpacing: -1 }}>
          Themes
        </Text>
        <Text style={{ fontSize: 13, color: colors.inkSoft, marginTop: 4 }}>
          Cosmetic-only. Phase 3 wires real purchases.
        </Text>

        {/* Currency display */}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14, marginBottom: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: `${colors.plum}14`, borderWidth: 1, borderColor: `${colors.plum}30`, borderRadius: radii.md, paddingHorizontal: 12, paddingVertical: 7 }}>
            <Text style={{ fontSize: 13, fontWeight: fontWeight.bold, color: colors.plum }}>
              💎 {formatCurrency(currency.gems)}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: `${colors.mustard}20`, borderWidth: 1, borderColor: `${colors.mustard}50`, borderRadius: radii.md, paddingHorizontal: 12, paddingVertical: 7 }}>
            <Text style={{ fontSize: 13, fontWeight: fontWeight.bold, color: colors.mustardDeep }}>
              🪙 {formatCurrency(currency.coins)}
            </Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={{ paddingHorizontal: 18, paddingTop: 14, paddingBottom: 6 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                testID={`${tab.id}-tab`}
                onPress={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  paddingVertical: 11,
                  borderRadius: radii.lg,
                  alignItems: 'center',
                  backgroundColor: isActive ? colors.ink : colors.paper2,
                  borderWidth: isActive ? 0 : 1,
                  borderColor: colors.inkRule,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: fontWeight.bold, color: isActive ? colors.paper : colors.inkSoft }}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Items */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 10, paddingBottom: 32 }}>
        {loading ? (
          <GlassCard style={{ padding: 40, alignItems: 'center', marginTop: 8 }}>
            <Text style={{ fontSize: 14, color: colors.inkSoft }}>Loading shop...</Text>
          </GlassCard>
        ) : (
          <View style={{ marginTop: 4 }}>
            {activeTab === 'themes' && themes.map(renderThemeItem)}
            {activeTab === 'blocks' && blockSkins.map(renderBlockSkinItem)}
            {activeTab === 'gems' && gemSkins.map(renderGemSkinItem)}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
