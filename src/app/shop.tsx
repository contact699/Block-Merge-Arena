// Shop Screen - Buy cosmetics and power-ups
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getCurrency, formatCurrency } from '@/lib/utils/currency';
import { getInventory, purchaseItem, equipItem } from '@/lib/utils/inventory';
import { getRarityColor, getRarityBadge } from '@/lib/shop/catalog';
import type { Currency, ShopCategory, BoardTheme, BlockSkin, GemSkin } from '@/lib/types/shop';

type TabType = 'themes' | 'blocks' | 'gems';

export default function ShopScreen() {
  const router = useRouter();
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

  const renderThemeItem = (theme: BoardTheme) => (
    <Pressable
      key={theme.id}
      onPress={() => {
        if (theme.unlocked) {
          handleEquip(theme.id, 'themes');
        } else {
          Alert.alert(
            'Purchase Theme?',
            `Buy ${theme.name} for ${theme.price.gems ? `${theme.price.gems} gems` : `${theme.price.coins} coins`}?`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Buy',
                onPress: () => handlePurchase(theme.id, 'themes', theme.price),
              },
            ]
          );
        }
      }}
      className={`bg-gray-900/80 border rounded-xl p-4 mb-3 ${
        theme.equipped ? 'border-purple-500' : 'border-gray-800'
      }`}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-1">
          <Text className="text-white text-lg font-bold">{theme.name}</Text>
          <Text className="text-gray-400 text-xs">{theme.description}</Text>
        </View>

        {/* Rarity Badge */}
        <View
          className="rounded-lg px-2 py-1"
          style={{ backgroundColor: `${getRarityColor(theme.rarity)}20` }}
        >
          <Text style={{ color: getRarityColor(theme.rarity) }} className="text-xs font-bold">
            {getRarityBadge(theme.rarity)}
          </Text>
        </View>
      </View>

      {/* Color Preview */}
      <View className="flex-row gap-2 mb-3">
        <View
          className="w-8 h-8 rounded"
          style={{ backgroundColor: theme.colors.background }}
        />
        <View className="w-8 h-8 rounded" style={{ backgroundColor: theme.colors.grid }} />
        <View className="w-8 h-8 rounded" style={{ backgroundColor: theme.colors.cell }} />
        <View
          className="w-8 h-8 rounded"
          style={{ backgroundColor: theme.colors.cellFilled }}
        />
      </View>

      {/* Action Button */}
      {theme.unlocked ? (
        theme.equipped ? (
          <View className="bg-green-500/20 border border-green-500 rounded-lg py-2">
            <Text className="text-green-400 text-center font-semibold">✓ Equipped</Text>
          </View>
        ) : (
          <View className="bg-purple-500/20 border border-purple-500 rounded-lg py-2">
            <Text className="text-purple-400 text-center font-semibold">Tap to Equip</Text>
          </View>
        )
      ) : (
        <View className="bg-gray-800 rounded-lg py-2">
          <Text className="text-white text-center font-semibold">
            {theme.price.gems ? `💎 ${theme.price.gems}` : `🪙 ${theme.price.coins}`}
          </Text>
        </View>
      )}
    </Pressable>
  );

  const renderBlockSkinItem = (skin: BlockSkin) => (
    <Pressable
      key={skin.id}
      onPress={() => {
        if (skin.unlocked) {
          handleEquip(skin.id, 'blocks');
        } else {
          Alert.alert(
            'Purchase Block Skin?',
            `Buy ${skin.name} for ${skin.price.gems ? `${skin.price.gems} gems` : `${skin.price.coins} coins`}?`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Buy',
                onPress: () => handlePurchase(skin.id, 'blocks', skin.price),
              },
            ]
          );
        }
      }}
      className={`bg-gray-900/80 border rounded-xl p-4 mb-3 ${
        skin.equipped ? 'border-purple-500' : 'border-gray-800'
      }`}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-1">
          <Text className="text-white text-lg font-bold">{skin.name}</Text>
          <Text className="text-gray-400 text-xs">{skin.description}</Text>
        </View>

        <View
          className="rounded-lg px-2 py-1"
          style={{ backgroundColor: `${getRarityColor(skin.rarity)}20` }}
        >
          <Text style={{ color: getRarityColor(skin.rarity) }} className="text-xs font-bold">
            {getRarityBadge(skin.rarity)}
          </Text>
        </View>
      </View>

      {/* Color Preview */}
      <View className="flex-row gap-2 mb-3">
        {skin.colors.map((color: string, index: number) => (
          <View key={index} className="w-8 h-8 rounded" style={{ backgroundColor: color }} />
        ))}
      </View>

      {/* Action Button */}
      {skin.unlocked ? (
        skin.equipped ? (
          <View className="bg-green-500/20 border border-green-500 rounded-lg py-2">
            <Text className="text-green-400 text-center font-semibold">✓ Equipped</Text>
          </View>
        ) : (
          <View className="bg-purple-500/20 border border-purple-500 rounded-lg py-2">
            <Text className="text-purple-400 text-center font-semibold">Tap to Equip</Text>
          </View>
        )
      ) : (
        <View className="bg-gray-800 rounded-lg py-2">
          <Text className="text-white text-center font-semibold">
            {skin.price.gems ? `💎 ${skin.price.gems}` : `🪙 ${skin.price.coins}`}
          </Text>
        </View>
      )}
    </Pressable>
  );

  const renderGemSkinItem = (skin: GemSkin) => (
    <Pressable
      key={skin.id}
      onPress={() => {
        if (skin.unlocked) {
          handleEquip(skin.id, 'gems');
        } else {
          Alert.alert(
            'Purchase Gem Skin?',
            `Buy ${skin.name} for ${skin.price.gems ? `${skin.price.gems} gems` : `${skin.price.coins} coins`}?`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Buy',
                onPress: () => handlePurchase(skin.id, 'gems', skin.price),
              },
            ]
          );
        }
      }}
      className={`bg-gray-900/80 border rounded-xl p-4 mb-3 ${
        skin.equipped ? 'border-purple-500' : 'border-gray-800'
      }`}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-1">
          <Text className="text-white text-lg font-bold">{skin.name}</Text>
          <Text className="text-gray-400 text-xs">{skin.description}</Text>
        </View>

        <View
          className="rounded-lg px-2 py-1"
          style={{ backgroundColor: `${getRarityColor(skin.rarity)}20` }}
        >
          <Text style={{ color: getRarityColor(skin.rarity) }} className="text-xs font-bold">
            {getRarityBadge(skin.rarity)}
          </Text>
        </View>
      </View>

      {/* Effect Badge */}
      <View className="bg-purple-500/10 border border-purple-500/30 rounded-lg py-2 px-3 mb-3">
        <Text className="text-purple-300 text-xs font-semibold">Effect: {skin.effect}</Text>
      </View>

      {/* Action Button */}
      {skin.unlocked ? (
        skin.equipped ? (
          <View className="bg-green-500/20 border border-green-500 rounded-lg py-2">
            <Text className="text-green-400 text-center font-semibold">✓ Equipped</Text>
          </View>
        ) : (
          <View className="bg-purple-500/20 border border-purple-500 rounded-lg py-2">
            <Text className="text-purple-400 text-center font-semibold">Tap to Equip</Text>
          </View>
        )
      ) : (
        <View className="bg-gray-800 rounded-lg py-2">
          <Text className="text-white text-center font-semibold">
            {skin.price.gems ? `💎 ${skin.price.gems}` : `🪙 ${skin.price.coins}`}
          </Text>
        </View>
      )}
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="px-6 pt-4 pb-4 border-b border-gray-800">
        <Pressable onPress={() => router.back()}>
          <Text className="text-purple-400 text-base font-semibold">← Back</Text>
        </Pressable>

        <View className="flex-row items-center justify-between mt-4">
          <View>
            <Text className="text-4xl font-black text-white">🛒 Shop</Text>
            <Text className="text-gray-400 text-sm mt-1">Customize your experience</Text>
          </View>

          {/* Currency Display */}
          <View className="items-end">
            <View className="flex-row items-center bg-purple-500/20 border border-purple-500 rounded-lg px-3 py-2 mb-1">
              <Text className="text-purple-400 font-bold text-sm">
                💎 {formatCurrency(currency.gems)}
              </Text>
            </View>
            <View className="flex-row items-center bg-yellow-500/20 border border-yellow-600 rounded-lg px-3 py-2">
              <Text className="text-yellow-400 font-bold text-sm">
                🪙 {formatCurrency(currency.coins)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View className="px-6 pt-4 pb-2">
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => setActiveTab('themes')}
            className={`flex-1 py-3 rounded-xl ${
              activeTab === 'themes' ? 'bg-purple-500' : 'bg-gray-800'
            }`}
          >
            <Text
              className={`text-center font-bold ${
                activeTab === 'themes' ? 'text-white' : 'text-gray-400'
              }`}
            >
              Themes
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('blocks')}
            className={`flex-1 py-3 rounded-xl ${
              activeTab === 'blocks' ? 'bg-purple-500' : 'bg-gray-800'
            }`}
          >
            <Text
              className={`text-center font-bold ${
                activeTab === 'blocks' ? 'text-white' : 'text-gray-400'
              }`}
            >
              Blocks
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('gems')}
            className={`flex-1 py-3 rounded-xl ${
              activeTab === 'gems' ? 'bg-purple-500' : 'bg-gray-800'
            }`}
          >
            <Text
              className={`text-center font-bold ${
                activeTab === 'gems' ? 'text-white' : 'text-gray-400'
              }`}
            >
              Gems
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Shop Items */}
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 20 }}>
        {loading ? (
          <View className="items-center py-12">
            <Text className="text-gray-500">Loading shop...</Text>
          </View>
        ) : (
          <View className="mt-4">
            {activeTab === 'themes' && themes.map(renderThemeItem)}
            {activeTab === 'blocks' && blockSkins.map(renderBlockSkinItem)}
            {activeTab === 'gems' && gemSkins.map(renderGemSkinItem)}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
