// User Inventory Management
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserInventory, BoardTheme, BlockSkin, GemSkin, ShopCategory } from '@/lib/types/shop';
import { DEFAULT_THEMES, DEFAULT_BLOCK_SKINS, DEFAULT_GEM_SKINS } from '@/lib/shop/catalog';
import { spendCurrency, logTransaction } from './currency';

const INVENTORY_KEY = '@block_merge_arena:inventory';

/**
 * Get user's inventory
 */
export async function getInventory(): Promise<UserInventory> {
  try {
    const data = await AsyncStorage.getItem(INVENTORY_KEY);
    if (data) {
      return JSON.parse(data);
    }

    // Default inventory with starting items
    const defaultInventory: UserInventory = {
      currency: { gems: 0, coins: 100 },
      themes: [...DEFAULT_THEMES],
      blockSkins: [...DEFAULT_BLOCK_SKINS],
      gemSkins: [...DEFAULT_GEM_SKINS],
      powerUpBundles: [],
      equippedTheme: 'default',
      equippedBlockSkin: 'default',
      equippedGemSkin: 'default',
    };

    await saveInventory(defaultInventory);
    return defaultInventory;
  } catch (error) {
    console.error('Error loading inventory:', error);
    return {
      currency: { gems: 0, coins: 100 },
      themes: [...DEFAULT_THEMES],
      blockSkins: [...DEFAULT_BLOCK_SKINS],
      gemSkins: [...DEFAULT_GEM_SKINS],
      powerUpBundles: [],
      equippedTheme: 'default',
      equippedBlockSkin: 'default',
      equippedGemSkin: 'default',
    };
  }
}

/**
 * Save inventory
 */
export async function saveInventory(inventory: UserInventory): Promise<void> {
  try {
    await AsyncStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
  } catch (error) {
    console.error('Error saving inventory:', error);
  }
}

/**
 * Purchase an item
 */
export async function purchaseItem(
  itemId: string,
  itemType: ShopCategory,
  price: { gems?: number; coins?: number }
): Promise<{
  success: boolean;
  error?: string;
  inventory?: UserInventory;
}> {
  try {
    // Check if user can afford it
    const spendResult = await spendCurrency(price);
    if (!spendResult.success) {
      return {
        success: false,
        error: spendResult.error,
      };
    }

    // Get current inventory
    const inventory = await getInventory();

    // Unlock the item based on type
    let itemFound = false;

    if (itemType === 'themes') {
      const themeIndex = inventory.themes.findIndex((t: BoardTheme) => t.id === itemId);
      if (themeIndex !== -1) {
        inventory.themes[themeIndex].unlocked = true;
        itemFound = true;
      }
    } else if (itemType === 'blocks') {
      const skinIndex = inventory.blockSkins.findIndex((s: BlockSkin) => s.id === itemId);
      if (skinIndex !== -1) {
        inventory.blockSkins[skinIndex].unlocked = true;
        itemFound = true;
      }
    } else if (itemType === 'gems') {
      const skinIndex = inventory.gemSkins.findIndex((s: GemSkin) => s.id === itemId);
      if (skinIndex !== -1) {
        inventory.gemSkins[skinIndex].unlocked = true;
        itemFound = true;
      }
    }

    if (!itemFound) {
      return {
        success: false,
        error: 'Item not found in catalog',
      };
    }

    // Save updated inventory
    await saveInventory(inventory);

    // Log transaction
    await logTransaction({
      type: 'purchase',
      itemId,
      itemType,
      price,
    });

    console.log('✅ Item purchased:', itemId);

    return {
      success: true,
      inventory,
    };
  } catch (error) {
    console.error('Error purchasing item:', error);
    return {
      success: false,
      error: String(error),
    };
  }
}

/**
 * Equip an item
 */
export async function equipItem(
  itemId: string,
  itemType: ShopCategory
): Promise<{
  success: boolean;
  error?: string;
  inventory?: UserInventory;
}> {
  try {
    const inventory = await getInventory();

    // Check if item is unlocked and equip it
    if (itemType === 'themes') {
      const theme = inventory.themes.find((t: BoardTheme) => t.id === itemId);
      if (!theme) {
        return { success: false, error: 'Theme not found' };
      }
      if (!theme.unlocked) {
        return { success: false, error: 'Theme not unlocked' };
      }

      // Unequip current and equip new
      inventory.themes.forEach((t: BoardTheme) => {
        t.equipped = t.id === itemId;
      });
      inventory.equippedTheme = itemId;
    } else if (itemType === 'blocks') {
      const skin = inventory.blockSkins.find((s: BlockSkin) => s.id === itemId);
      if (!skin) {
        return { success: false, error: 'Skin not found' };
      }
      if (!skin.unlocked) {
        return { success: false, error: 'Skin not unlocked' };
      }

      inventory.blockSkins.forEach((s: BlockSkin) => {
        s.equipped = s.id === itemId;
      });
      inventory.equippedBlockSkin = itemId;
    } else if (itemType === 'gems') {
      const skin = inventory.gemSkins.find((s: GemSkin) => s.id === itemId);
      if (!skin) {
        return { success: false, error: 'Gem skin not found' };
      }
      if (!skin.unlocked) {
        return { success: false, error: 'Gem skin not unlocked' };
      }

      inventory.gemSkins.forEach((s: GemSkin) => {
        s.equipped = s.id === itemId;
      });
      inventory.equippedGemSkin = itemId;
    }

    await saveInventory(inventory);
    console.log('✅ Item equipped:', itemId);

    return {
      success: true,
      inventory,
    };
  } catch (error) {
    console.error('Error equipping item:', error);
    return {
      success: false,
      error: String(error),
    };
  }
}

/**
 * Check if item is owned
 */
export async function isItemOwned(itemId: string, itemType: ShopCategory): Promise<boolean> {
  const inventory = await getInventory();

  if (itemType === 'themes') {
    return inventory.themes.some((t: BoardTheme) => t.id === itemId && t.unlocked);
  } else if (itemType === 'blocks') {
    return inventory.blockSkins.some((s: BlockSkin) => s.id === itemId && s.unlocked);
  } else if (itemType === 'gems') {
    return inventory.gemSkins.some((s: GemSkin) => s.id === itemId && s.unlocked);
  }

  return false;
}

/**
 * Get equipped items
 */
export async function getEquippedItems(): Promise<{
  theme: BoardTheme | null;
  blockSkin: BlockSkin | null;
  gemSkin: GemSkin | null;
}> {
  const inventory = await getInventory();

  const theme = inventory.themes.find((t: BoardTheme) => t.id === inventory.equippedTheme) || null;
  const blockSkin = inventory.blockSkins.find((s: BlockSkin) => s.id === inventory.equippedBlockSkin) || null;
  const gemSkin = inventory.gemSkins.find((s: GemSkin) => s.id === inventory.equippedGemSkin) || null;

  return { theme, blockSkin, gemSkin };
}
