// Battle Pass Types

export type BattlePassTier = 'free' | 'premium';

export interface BattlePassReward {
  type: 'coins' | 'gems' | 'theme' | 'block_skin' | 'gem_skin' | 'power_up';
  id?: string; // For cosmetic items
  amount?: number; // For currency
  name: string;
  icon: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface BattlePassLevel {
  level: number;
  xpRequired: number; // Cumulative XP to reach this level
  freeReward?: BattlePassReward;
  premiumReward?: BattlePassReward;
}

export interface BattlePass {
  id: string;
  seasonNumber: number;
  name: string;
  startDate: number; // Unix timestamp
  endDate: number; // Unix timestamp
  active: boolean;
  levels: BattlePassLevel[];
}

export interface PlayerBattlePassData {
  battlePassId: string;
  currentLevel: number;
  currentXP: number;
  hasPremium: boolean;
  claimedFreeRewards: number[]; // List of claimed level numbers
  claimedPremiumRewards: number[]; // List of claimed level numbers
}

/**
 * XP earning rates
 */
export const XP_RATES = {
  tournamentComplete: 100, // Base XP for completing a tournament
  per1000Score: 50, // 50 XP per 1000 points scored
  dailyBonus: 200, // First game of the day bonus
  combo5x: 25, // Bonus for 5x+ combo
  perfectClear: 100, // Bonus for clearing entire board
};

/**
 * Battle pass constants
 */
export const MAX_LEVEL = 30;
export const PREMIUM_PRICE = 499; // 499 gems = $4.99
export const BATTLE_PASS_DURATION = 90 * 24 * 60 * 60 * 1000; // 90 days

/**
 * XP required per level (cumulative)
 */
export function getXPForLevel(level: number): number {
  if (level === 1) return 0;
  // Progressive XP: starts at 500, increases by 100 per level
  const baseXP = 500;
  const increment = 100;
  return Array.from({ length: level - 1 })
    .reduce((total, _, index) => total + baseXP + (index * increment), 0);
}

/**
 * Calculate level from XP
 */
export function calculateLevelFromXP(xp: number): number {
  let level = 1;
  while (level < MAX_LEVEL && xp >= getXPForLevel(level + 1)) {
    level++;
  }
  return level;
}
