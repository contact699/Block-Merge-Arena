// Battle Pass Rewards Catalog

import type { BattlePass, BattlePassLevel, BattlePassReward } from '@/lib/types/battlepass';
import { MAX_LEVEL, getXPForLevel, BATTLE_PASS_DURATION } from '@/lib/types/battlepass';

/**
 * Create default battle pass with all 30 levels
 */
export function createDefaultBattlePass(seasonNumber: number): BattlePass {
  const startDate = Date.now();
  const endDate = startDate + BATTLE_PASS_DURATION;

  const levels: BattlePassLevel[] = [];

  // Level 1
  levels.push({
    level: 1,
    xpRequired: 0,
    freeReward: { type: 'coins', amount: 100, name: '100 Coins', icon: '🪙' },
    premiumReward: { type: 'gems', amount: 25, name: '25 Gems', icon: '💎' },
  });

  // Level 2
  levels.push({
    level: 2,
    xpRequired: getXPForLevel(2),
    freeReward: { type: 'coins', amount: 150, name: '150 Coins', icon: '🪙' },
    premiumReward: { type: 'theme', id: 'bp_ocean', name: 'Ocean Theme', icon: '🌊', rarity: 'rare' },
  });

  // Level 3
  levels.push({
    level: 3,
    xpRequired: getXPForLevel(3),
    freeReward: { type: 'power_up', id: 'reroll', amount: 1, name: 'Reroll', icon: '🔄' },
    premiumReward: { type: 'coins', amount: 300, name: '300 Coins', icon: '🪙' },
  });

  // Level 4
  levels.push({
    level: 4,
    xpRequired: getXPForLevel(4),
    freeReward: { type: 'coins', amount: 200, name: '200 Coins', icon: '🪙' },
    premiumReward: { type: 'block_skin', id: 'bp_crystal', name: 'Crystal Blocks', icon: '💠', rarity: 'epic' },
  });

  // Level 5
  levels.push({
    level: 5,
    xpRequired: getXPForLevel(5),
    freeReward: { type: 'gems', amount: 10, name: '10 Gems', icon: '💎' },
    premiumReward: { type: 'gems', amount: 50, name: '50 Gems', icon: '💎' },
  });

  // Level 6
  levels.push({
    level: 6,
    xpRequired: getXPForLevel(6),
    freeReward: { type: 'coins', amount: 250, name: '250 Coins', icon: '🪙' },
    premiumReward: { type: 'gem_skin', id: 'bp_rainbow', name: 'Rainbow Gems', icon: '🌈', rarity: 'rare' },
  });

  // Level 7
  levels.push({
    level: 7,
    xpRequired: getXPForLevel(7),
    freeReward: { type: 'power_up', id: 'blast', amount: 1, name: 'Blast', icon: '💣' },
    premiumReward: { type: 'coins', amount: 400, name: '400 Coins', icon: '🪙' },
  });

  // Level 8
  levels.push({
    level: 8,
    xpRequired: getXPForLevel(8),
    freeReward: { type: 'coins', amount: 300, name: '300 Coins', icon: '🪙' },
    premiumReward: { type: 'theme', id: 'bp_sunset', name: 'Sunset Theme', icon: '🌅', rarity: 'epic' },
  });

  // Level 9
  levels.push({
    level: 9,
    xpRequired: getXPForLevel(9),
    freeReward: { type: 'coins', amount: 350, name: '350 Coins', icon: '🪙' },
    premiumReward: { type: 'gems', amount: 75, name: '75 Gems', icon: '💎' },
  });

  // Level 10 - Major milestone
  levels.push({
    level: 10,
    xpRequired: getXPForLevel(10),
    freeReward: { type: 'gems', amount: 25, name: '25 Gems', icon: '💎' },
    premiumReward: { type: 'block_skin', id: 'bp_gold', name: 'Golden Blocks', icon: '✨', rarity: 'legendary' },
  });

  // Level 11
  levels.push({
    level: 11,
    xpRequired: getXPForLevel(11),
    freeReward: { type: 'coins', amount: 400, name: '400 Coins', icon: '🪙' },
    premiumReward: { type: 'coins', amount: 500, name: '500 Coins', icon: '🪙' },
  });

  // Level 12
  levels.push({
    level: 12,
    xpRequired: getXPForLevel(12),
    freeReward: { type: 'power_up', id: 'freeze', amount: 1, name: 'Freeze', icon: '⏱️' },
    premiumReward: { type: 'gem_skin', id: 'bp_galaxy', name: 'Galaxy Gems', icon: '🌌', rarity: 'epic' },
  });

  // Level 13
  levels.push({
    level: 13,
    xpRequired: getXPForLevel(13),
    freeReward: { type: 'coins', amount: 450, name: '450 Coins', icon: '🪙' },
    premiumReward: { type: 'gems', amount: 100, name: '100 Gems', icon: '💎' },
  });

  // Level 14
  levels.push({
    level: 14,
    xpRequired: getXPForLevel(14),
    freeReward: { type: 'coins', amount: 500, name: '500 Coins', icon: '🪙' },
    premiumReward: { type: 'theme', id: 'bp_neon', name: 'Neon Theme', icon: '⚡', rarity: 'rare' },
  });

  // Level 15 - Major milestone
  levels.push({
    level: 15,
    xpRequired: getXPForLevel(15),
    freeReward: { type: 'gems', amount: 50, name: '50 Gems', icon: '💎' },
    premiumReward: { type: 'block_skin', id: 'bp_diamond', name: 'Diamond Blocks', icon: '💎', rarity: 'legendary' },
  });

  // Level 16
  levels.push({
    level: 16,
    xpRequired: getXPForLevel(16),
    freeReward: { type: 'coins', amount: 550, name: '550 Coins', icon: '🪙' },
    premiumReward: { type: 'coins', amount: 600, name: '600 Coins', icon: '🪙' },
  });

  // Level 17
  levels.push({
    level: 17,
    xpRequired: getXPForLevel(17),
    freeReward: { type: 'power_up', id: 'target', amount: 1, name: 'Target', icon: '🎯' },
    premiumReward: { type: 'gems', amount: 125, name: '125 Gems', icon: '💎' },
  });

  // Level 18
  levels.push({
    level: 18,
    xpRequired: getXPForLevel(18),
    freeReward: { type: 'coins', amount: 600, name: '600 Coins', icon: '🪙' },
    premiumReward: { type: 'gem_skin', id: 'bp_fire', name: 'Fire Gems', icon: '🔥', rarity: 'epic' },
  });

  // Level 19
  levels.push({
    level: 19,
    xpRequired: getXPForLevel(19),
    freeReward: { type: 'coins', amount: 650, name: '650 Coins', icon: '🪙' },
    premiumReward: { type: 'theme', id: 'bp_cyberpunk', name: 'Cyberpunk Theme', icon: '🤖', rarity: 'epic' },
  });

  // Level 20 - Major milestone
  levels.push({
    level: 20,
    xpRequired: getXPForLevel(20),
    freeReward: { type: 'gems', amount: 75, name: '75 Gems', icon: '💎' },
    premiumReward: { type: 'block_skin', id: 'bp_platinum', name: 'Platinum Blocks', icon: '⚪', rarity: 'legendary' },
  });

  // Level 21
  levels.push({
    level: 21,
    xpRequired: getXPForLevel(21),
    freeReward: { type: 'coins', amount: 700, name: '700 Coins', icon: '🪙' },
    premiumReward: { type: 'coins', amount: 800, name: '800 Coins', icon: '🪙' },
  });

  // Level 22
  levels.push({
    level: 22,
    xpRequired: getXPForLevel(22),
    freeReward: { type: 'power_up', id: 'color_bomb', amount: 1, name: 'Color Bomb', icon: '🌈' },
    premiumReward: { type: 'gems', amount: 150, name: '150 Gems', icon: '💎' },
  });

  // Level 23
  levels.push({
    level: 23,
    xpRequired: getXPForLevel(23),
    freeReward: { type: 'coins', amount: 750, name: '750 Coins', icon: '🪙' },
    premiumReward: { type: 'gem_skin', id: 'bp_ice', name: 'Ice Gems', icon: '❄️', rarity: 'epic' },
  });

  // Level 24
  levels.push({
    level: 24,
    xpRequired: getXPForLevel(24),
    freeReward: { type: 'coins', amount: 800, name: '800 Coins', icon: '🪙' },
    premiumReward: { type: 'theme', id: 'bp_space', name: 'Space Theme', icon: '🚀', rarity: 'legendary' },
  });

  // Level 25 - Major milestone
  levels.push({
    level: 25,
    xpRequired: getXPForLevel(25),
    freeReward: { type: 'gems', amount: 100, name: '100 Gems', icon: '💎' },
    premiumReward: { type: 'block_skin', id: 'bp_mystic', name: 'Mystic Blocks', icon: '🔮', rarity: 'legendary' },
  });

  // Level 26
  levels.push({
    level: 26,
    xpRequired: getXPForLevel(26),
    freeReward: { type: 'coins', amount: 850, name: '850 Coins', icon: '🪙' },
    premiumReward: { type: 'coins', amount: 1000, name: '1000 Coins', icon: '🪙' },
  });

  // Level 27
  levels.push({
    level: 27,
    xpRequired: getXPForLevel(27),
    freeReward: { type: 'coins', amount: 900, name: '900 Coins', icon: '🪙' },
    premiumReward: { type: 'gems', amount: 200, name: '200 Gems', icon: '💎' },
  });

  // Level 28
  levels.push({
    level: 28,
    xpRequired: getXPForLevel(28),
    freeReward: { type: 'coins', amount: 950, name: '950 Coins', icon: '🪙' },
    premiumReward: { type: 'gem_skin', id: 'bp_celestial', name: 'Celestial Gems', icon: '✨', rarity: 'legendary' },
  });

  // Level 29
  levels.push({
    level: 29,
    xpRequired: getXPForLevel(29),
    freeReward: { type: 'gems', amount: 125, name: '125 Gems', icon: '💎' },
    premiumReward: { type: 'theme', id: 'bp_ultimate', name: 'Ultimate Theme', icon: '👑', rarity: 'legendary' },
  });

  // Level 30 - Final reward
  levels.push({
    level: 30,
    xpRequired: getXPForLevel(30),
    freeReward: { type: 'gems', amount: 150, name: '150 Gems', icon: '💎' },
    premiumReward: { type: 'block_skin', id: 'bp_legendary', name: 'Legendary Blocks', icon: '👑', rarity: 'legendary' },
  });

  return {
    id: `battlepass_season_${seasonNumber}`,
    seasonNumber,
    name: `Battle Pass - Season ${seasonNumber}`,
    startDate,
    endDate,
    active: true,
    levels,
  };
}

/**
 * Get current battle pass
 */
export function getCurrentBattlePassSeason(): number {
  const now = Date.now();
  return Math.floor(now / BATTLE_PASS_DURATION);
}
