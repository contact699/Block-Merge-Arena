// Shop & Monetization Types

/**
 * Virtual currency (earned through gameplay and watching ads)
 */
export interface Currency {
  gems: number; // Premium currency (ads, achievements)
  coins: number; // Regular currency (gameplay)
}

/**
 * Shop item categories
 */
export type ShopCategory = 'themes' | 'blocks' | 'gems' | 'powerups';

/**
 * Board theme cosmetic
 */
export interface BoardTheme {
  id: string;
  name: string;
  description: string;
  previewImage?: string;
  colors: {
    background: string;
    grid: string;
    cell: string;
    cellFilled: string;
  };
  price: {
    gems?: number;
    coins?: number;
  };
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked: boolean;
  equipped: boolean;
}

/**
 * Block skin cosmetic
 */
export interface BlockSkin {
  id: string;
  name: string;
  description: string;
  previewImage?: string;
  colors: string[]; // Array of colors for different block types
  effects?: 'glow' | 'sparkle' | 'neon' | 'shadow';
  price: {
    gems?: number;
    coins?: number;
  };
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked: boolean;
  equipped: boolean;
}

/**
 * Gem skin cosmetic
 */
export interface GemSkin {
  id: string;
  name: string;
  description: string;
  previewImage?: string;
  effect: 'default' | 'sparkle' | 'glow' | 'crystal' | 'fire' | 'ice';
  price: {
    gems?: number;
    coins?: number;
  };
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked: boolean;
  equipped: boolean;
}

/**
 * Power-up bundle for purchase
 */
export interface PowerUpBundle {
  id: string;
  name: string;
  description: string;
  powerUps: {
    type: string;
    count: number;
  }[];
  price: {
    gems?: number;
    coins?: number;
  };
  discount?: number; // percentage
}

/**
 * Shop item (union of all cosmetic types)
 */
export type ShopItem = BoardTheme | BlockSkin | GemSkin | PowerUpBundle;

/**
 * User inventory
 */
export interface UserInventory {
  currency: Currency;
  themes: BoardTheme[];
  blockSkins: BlockSkin[];
  gemSkins: GemSkin[];
  powerUpBundles: PowerUpBundle[];
  equippedTheme: string | null;
  equippedBlockSkin: string | null;
  equippedGemSkin: string | null;
}

/**
 * Purchase transaction
 */
export interface Purchase {
  id: string;
  itemId: string;
  itemType: ShopCategory;
  cost: {
    gems?: number;
    coins?: number;
  };
  timestamp: number;
  userId: string;
}

/**
 * Reward from ads or achievements
 */
export interface Reward {
  gems?: number;
  coins?: number;
  items?: {
    itemId: string;
    itemType: ShopCategory;
  }[];
}
