// Shop Catalog - Default cosmetic items
import type { BoardTheme, BlockSkin, GemSkin, PowerUpBundle } from '@/lib/types/shop';

/**
 * Default board themes available in shop
 */
export const DEFAULT_THEMES: BoardTheme[] = [
  {
    id: 'default',
    name: 'Classic Dark',
    description: 'The default dark theme',
    colors: {
      background: '#000000',
      grid: '#1a1a1a',
      cell: '#0a0a0a',
      cellFilled: '#a855f7',
    },
    price: {},
    rarity: 'common',
    unlocked: true,
    equipped: true,
  },
  {
    id: 'neon_purple',
    name: 'Neon Purple',
    description: 'Vibrant purple glow',
    colors: {
      background: '#0a0010',
      grid: '#6b21a8',
      cell: '#1a0030',
      cellFilled: '#c026d3',
    },
    price: { coins: 500 },
    rarity: 'common',
    unlocked: false,
    equipped: false,
  },
  {
    id: 'cyber_blue',
    name: 'Cyber Blue',
    description: 'Electric blue aesthetic',
    colors: {
      background: '#000510',
      grid: '#1e40af',
      cell: '#001030',
      cellFilled: '#3b82f6',
    },
    price: { coins: 500 },
    rarity: 'common',
    unlocked: false,
    equipped: false,
  },
  {
    id: 'hot_pink',
    name: 'Hot Pink',
    description: 'Bold and bright',
    colors: {
      background: '#100005',
      grid: '#9f1239',
      cell: '#300010',
      cellFilled: '#ec4899',
    },
    price: { coins: 750 },
    rarity: 'rare',
    unlocked: false,
    equipped: false,
  },
  {
    id: 'toxic_green',
    name: 'Toxic Green',
    description: 'Radioactive glow',
    colors: {
      background: '#001000',
      grid: '#15803d',
      cell: '#003010',
      cellFilled: '#22c55e',
    },
    price: { coins: 750 },
    rarity: 'rare',
    unlocked: false,
    equipped: false,
  },
  {
    id: 'sunset_orange',
    name: 'Sunset Orange',
    description: 'Warm and inviting',
    colors: {
      background: '#100500',
      grid: '#c2410c',
      cell: '#301000',
      cellFilled: '#f97316',
    },
    price: { coins: 1000 },
    rarity: 'epic',
    unlocked: false,
    equipped: false,
  },
  {
    id: 'galaxy',
    name: 'Galaxy',
    description: 'Cosmic vibes',
    colors: {
      background: '#000008',
      grid: '#4c1d95',
      cell: '#0a0020',
      cellFilled: '#8b5cf6',
    },
    price: { gems: 50 },
    rarity: 'epic',
    unlocked: false,
    equipped: false,
  },
  {
    id: 'rainbow',
    name: 'Rainbow',
    description: 'All colors at once',
    colors: {
      background: '#000000',
      grid: '#404040',
      cell: '#0a0a0a',
      cellFilled: '#ec4899', // Base color (actual impl would cycle)
    },
    price: { gems: 100 },
    rarity: 'legendary',
    unlocked: false,
    equipped: false,
  },
];

/**
 * Default block skins
 */
export const DEFAULT_BLOCK_SKINS: BlockSkin[] = [
  {
    id: 'default',
    name: 'Classic',
    description: 'Standard block colors',
    colors: ['#a855f7', '#3b82f6', '#ec4899', '#22c55e', '#f97316', '#eab308'],
    price: {},
    rarity: 'common',
    unlocked: true,
    equipped: true,
  },
  {
    id: 'pastel',
    name: 'Pastel',
    description: 'Soft and smooth',
    colors: ['#c4b5fd', '#93c5fd', '#fbcfe8', '#86efac', '#fdba74', '#fde047'],
    price: { coins: 300 },
    rarity: 'common',
    unlocked: false,
    equipped: false,
  },
  {
    id: 'neon_glow',
    name: 'Neon Glow',
    description: 'Bright neon with glow effect',
    colors: ['#d946ef', '#0ea5e9', '#f43f5e', '#10b981', '#f59e0b', '#eab308'],
    effects: 'glow',
    price: { coins: 600 },
    rarity: 'rare',
    unlocked: false,
    equipped: false,
  },
  {
    id: 'metallic',
    name: 'Metallic',
    description: 'Shiny metal finish',
    colors: ['#a78bfa', '#60a5fa', '#f472b6', '#4ade80', '#fb923c', '#facc15'],
    effects: 'sparkle',
    price: { coins: 900 },
    rarity: 'epic',
    unlocked: false,
    equipped: false,
  },
  {
    id: 'diamond',
    name: 'Diamond',
    description: 'Crystalline blocks',
    colors: ['#e9d5ff', '#bfdbfe', '#fce7f3', '#d1fae5', '#fed7aa', '#fef3c7'],
    effects: 'sparkle',
    price: { gems: 75 },
    rarity: 'legendary',
    unlocked: false,
    equipped: false,
  },
];

/**
 * Default gem skins
 */
export const DEFAULT_GEM_SKINS: GemSkin[] = [
  {
    id: 'default',
    name: 'Classic Gems',
    description: 'Standard gem appearance',
    effect: 'default',
    price: {},
    rarity: 'common',
    unlocked: true,
    equipped: true,
  },
  {
    id: 'sparkle',
    name: 'Sparkle Gems',
    description: 'Gems with sparkle effect',
    effect: 'sparkle',
    price: { coins: 400 },
    rarity: 'rare',
    unlocked: false,
    equipped: false,
  },
  {
    id: 'crystal',
    name: 'Crystal Gems',
    description: 'Transparent crystal look',
    effect: 'crystal',
    price: { coins: 800 },
    rarity: 'epic',
    unlocked: false,
    equipped: false,
  },
  {
    id: 'fire',
    name: 'Fire Gems',
    description: 'Burning hot flames',
    effect: 'fire',
    price: { gems: 60 },
    rarity: 'epic',
    unlocked: false,
    equipped: false,
  },
];

/**
 * Power-up bundles
 */
export const DEFAULT_POWERUP_BUNDLES: PowerUpBundle[] = [
  {
    id: 'starter_pack',
    name: 'Starter Pack',
    description: '2 of each power-up',
    powerUps: [
      { type: 'reroll', count: 2 },
      { type: 'blast', count: 2 },
      { type: 'target', count: 2 },
    ],
    price: { coins: 200 },
  },
  {
    id: 'mega_pack',
    name: 'Mega Pack',
    description: '5 of each power-up',
    powerUps: [
      { type: 'reroll', count: 5 },
      { type: 'blast', count: 5 },
      { type: 'target', count: 5 },
      { type: 'color_bomb', count: 5 },
    ],
    price: { coins: 450 },
    discount: 10,
  },
  {
    id: 'ultimate_pack',
    name: 'Ultimate Pack',
    description: '10 of each power-up',
    powerUps: [
      { type: 'reroll', count: 10 },
      { type: 'blast', count: 10 },
      { type: 'target', count: 10 },
      { type: 'color_bomb', count: 10 },
      { type: 'freeze', count: 10 },
    ],
    price: { gems: 100 },
    discount: 20,
  },
];

/**
 * Get rarity color for UI
 */
export function getRarityColor(rarity: string): string {
  switch (rarity) {
    case 'common':
      return '#9ca3af'; // gray
    case 'rare':
      return '#3b82f6'; // blue
    case 'epic':
      return '#a855f7'; // purple
    case 'legendary':
      return '#f59e0b'; // orange/gold
    default:
      return '#9ca3af';
  }
}

/**
 * Get rarity badge text
 */
export function getRarityBadge(rarity: string): string {
  switch (rarity) {
    case 'common':
      return '◆';
    case 'rare':
      return '◆◆';
    case 'epic':
      return '◆◆◆';
    case 'legendary':
      return '★';
    default:
      return '◆';
  }
}
