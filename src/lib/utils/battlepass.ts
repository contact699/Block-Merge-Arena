// Battle Pass Management

import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  BattlePass,
  PlayerBattlePassData,
  BattlePassReward,
} from '@/lib/types/battlepass';
import {
  calculateLevelFromXP,
  getXPForLevel,
  XP_RATES,
  MAX_LEVEL,
  PREMIUM_PRICE,
} from '@/lib/types/battlepass';
import { createDefaultBattlePass, getCurrentBattlePassSeason } from '@/lib/battlepass/catalog';
import { getCurrency, spendCurrency, addCurrency } from './currency';

const BATTLE_PASS_KEY = '@block_merge_arena:battle_pass';
const PLAYER_BP_DATA_KEY = '@block_merge_arena:player_bp_data';
const LAST_DAILY_XP_KEY = '@block_merge_arena:last_daily_xp';

/**
 * Get current battle pass
 */
export async function getCurrentBattlePass(): Promise<BattlePass> {
  try {
    const data = await AsyncStorage.getItem(BATTLE_PASS_KEY);
    if (data) {
      const battlePass: BattlePass = JSON.parse(data);
      // Check if battle pass is still active
      if (battlePass.active && Date.now() < battlePass.endDate) {
        return battlePass;
      }
    }

    // Create new battle pass
    const seasonNumber = getCurrentBattlePassSeason();
    const newBattlePass = createDefaultBattlePass(seasonNumber);
    await AsyncStorage.setItem(BATTLE_PASS_KEY, JSON.stringify(newBattlePass));
    console.log('🎫 New Battle Pass created:', newBattlePass.name);

    return newBattlePass;
  } catch (error) {
    console.error('Error loading battle pass:', error);
    const seasonNumber = getCurrentBattlePassSeason();
    return createDefaultBattlePass(seasonNumber);
  }
}

/**
 * Get player battle pass data
 */
export async function getPlayerBattlePassData(): Promise<PlayerBattlePassData> {
  try {
    const [data, battlePass] = await Promise.all([
      AsyncStorage.getItem(PLAYER_BP_DATA_KEY),
      getCurrentBattlePass(),
    ]);

    if (data) {
      const playerData: PlayerBattlePassData = JSON.parse(data);

      // Check if battle pass has changed (new season)
      if (playerData.battlePassId !== battlePass.id) {
        // Reset for new season
        return await resetBattlePassProgress(battlePass.id);
      }

      return playerData;
    }

    // New player - create initial data
    const initialData: PlayerBattlePassData = {
      battlePassId: battlePass.id,
      currentLevel: 1,
      currentXP: 0,
      hasPremium: false,
      claimedFreeRewards: [],
      claimedPremiumRewards: [],
    };

    await AsyncStorage.setItem(PLAYER_BP_DATA_KEY, JSON.stringify(initialData));
    return initialData;
  } catch (error) {
    console.error('Error loading player battle pass data:', error);
    const battlePass = await getCurrentBattlePass();
    return {
      battlePassId: battlePass.id,
      currentLevel: 1,
      currentXP: 0,
      hasPremium: false,
      claimedFreeRewards: [],
      claimedPremiumRewards: [],
    };
  }
}

/**
 * Save player battle pass data
 */
export async function savePlayerBattlePassData(data: PlayerBattlePassData): Promise<void> {
  try {
    await AsyncStorage.setItem(PLAYER_BP_DATA_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving player battle pass data:', error);
  }
}

/**
 * Reset battle pass progress for new season
 */
export async function resetBattlePassProgress(newBattlePassId: string): Promise<PlayerBattlePassData> {
  const newData: PlayerBattlePassData = {
    battlePassId: newBattlePassId,
    currentLevel: 1,
    currentXP: 0,
    hasPremium: false,
    claimedFreeRewards: [],
    claimedPremiumRewards: [],
  };

  await savePlayerBattlePassData(newData);
  console.log('🔄 Battle Pass progress reset for new season');

  return newData;
}

/**
 * Add XP and level up
 */
export async function addBattlePassXP(xp: number): Promise<{
  oldLevel: number;
  newLevel: number;
  leveledUp: boolean;
  xpGained: number;
}> {
  const playerData = await getPlayerBattlePassData();
  const oldLevel = playerData.currentLevel;

  playerData.currentXP += xp;
  const newLevel = Math.min(MAX_LEVEL, calculateLevelFromXP(playerData.currentXP));
  const leveledUp = newLevel > oldLevel;

  playerData.currentLevel = newLevel;
  await savePlayerBattlePassData(playerData);

  if (leveledUp) {
    console.log(`🎫 Battle Pass Level Up! ${oldLevel} → ${newLevel}`);
  }

  return {
    oldLevel,
    newLevel,
    leveledUp,
    xpGained: xp,
  };
}

/**
 * Check if daily XP bonus is available
 */
export async function canClaimDailyXPBonus(): Promise<boolean> {
  try {
    const lastClaim = await AsyncStorage.getItem(LAST_DAILY_XP_KEY);
    if (!lastClaim) return true;

    const lastClaimDate = new Date(parseInt(lastClaim));
    const today = new Date();

    return (
      lastClaimDate.getDate() !== today.getDate() ||
      lastClaimDate.getMonth() !== today.getMonth() ||
      lastClaimDate.getFullYear() !== today.getFullYear()
    );
  } catch (error) {
    return true;
  }
}

/**
 * Claim daily XP bonus
 */
export async function claimDailyXPBonus(): Promise<number> {
  const canClaim = await canClaimDailyXPBonus();
  if (!canClaim) return 0;

  await AsyncStorage.setItem(LAST_DAILY_XP_KEY, Date.now().toString());
  await addBattlePassXP(XP_RATES.dailyBonus);
  console.log(`🎁 Daily XP Bonus claimed: +${XP_RATES.dailyBonus} XP`);

  return XP_RATES.dailyBonus;
}

/**
 * Award XP for tournament completion
 */
export async function awardTournamentXP(score: number, maxMultiplier: number): Promise<{
  baseXP: number;
  scoreXP: number;
  comboXP: number;
  dailyXP: number;
  totalXP: number;
  levelProgress: {
    oldLevel: number;
    newLevel: number;
    leveledUp: boolean;
  };
}> {
  const baseXP = XP_RATES.tournamentComplete;
  const scoreXP = Math.floor((score / 1000) * XP_RATES.per1000Score);
  const comboXP = maxMultiplier >= 5 ? XP_RATES.combo5x : 0;

  // Check daily bonus
  const dailyXP = (await canClaimDailyXPBonus()) ? XP_RATES.dailyBonus : 0;
  if (dailyXP > 0) {
    await AsyncStorage.setItem(LAST_DAILY_XP_KEY, Date.now().toString());
  }

  const totalXP = baseXP + scoreXP + comboXP + dailyXP;
  const levelProgress = await addBattlePassXP(totalXP);

  console.log(`🎫 Battle Pass XP earned: ${totalXP} (Base: ${baseXP}, Score: ${scoreXP}, Combo: ${comboXP}, Daily: ${dailyXP})`);

  return {
    baseXP,
    scoreXP,
    comboXP,
    dailyXP,
    totalXP,
    levelProgress,
  };
}

/**
 * Claim reward for a level
 */
export async function claimReward(
  level: number,
  tier: 'free' | 'premium'
): Promise<{
  success: boolean;
  error?: string;
  reward?: BattlePassReward;
}> {
  const [playerData, battlePass] = await Promise.all([
    getPlayerBattlePassData(),
    getCurrentBattlePass(),
  ]);

  // Check if level is unlocked
  if (level > playerData.currentLevel) {
    return { success: false, error: 'Level not unlocked yet' };
  }

  // Check if premium tier is purchased
  if (tier === 'premium' && !playerData.hasPremium) {
    return { success: false, error: 'Premium Battle Pass not purchased' };
  }

  // Check if reward already claimed
  const claimedList = tier === 'free' ? playerData.claimedFreeRewards : playerData.claimedPremiumRewards;
  if (claimedList.includes(level)) {
    return { success: false, error: 'Reward already claimed' };
  }

  // Get reward
  const levelData = battlePass.levels.find((l) => l.level === level);
  if (!levelData) {
    return { success: false, error: 'Level not found' };
  }

  const reward = tier === 'free' ? levelData.freeReward : levelData.premiumReward;
  if (!reward) {
    return { success: false, error: 'No reward available' };
  }

  // Award reward
  if (reward.type === 'coins' || reward.type === 'gems') {
    await addCurrency({
      coins: reward.type === 'coins' ? reward.amount || 0 : 0,
      gems: reward.type === 'gems' ? reward.amount || 0 : 0,
    });
  }
  // For cosmetic items, they would be added to inventory (not implemented here)

  // Mark as claimed
  if (tier === 'free') {
    playerData.claimedFreeRewards.push(level);
  } else {
    playerData.claimedPremiumRewards.push(level);
  }

  await savePlayerBattlePassData(playerData);
  console.log(`🎁 Battle Pass reward claimed: Level ${level} ${tier} - ${reward.name}`);

  return { success: true, reward };
}

/**
 * Purchase premium battle pass
 */
export async function purchasePremiumBattlePass(): Promise<{
  success: boolean;
  error?: string;
}> {
  const playerData = await getPlayerBattlePassData();

  // Check if already purchased
  if (playerData.hasPremium) {
    return { success: false, error: 'Premium Battle Pass already purchased' };
  }

  // Check if enough gems
  const currency = await getCurrency();
  if (currency.gems < PREMIUM_PRICE) {
    return {
      success: false,
      error: `Not enough gems. Need ${PREMIUM_PRICE}, have ${currency.gems}`,
    };
  }

  // Spend gems
  const spendResult = await spendCurrency({ gems: PREMIUM_PRICE });
  if (!spendResult.success) {
    return { success: false, error: spendResult.error };
  }

  // Upgrade to premium
  playerData.hasPremium = true;
  await savePlayerBattlePassData(playerData);
  console.log(`💎 Premium Battle Pass purchased!`);

  return { success: true };
}

/**
 * Get XP progress to next level
 */
export function getXPProgressToNextLevel(currentXP: number, currentLevel: number): {
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  xpProgress: number;
  xpNeeded: number;
  percentage: number;
} {
  const xpForCurrentLevel = getXPForLevel(currentLevel);
  const xpForNextLevel = currentLevel < MAX_LEVEL ? getXPForLevel(currentLevel + 1) : xpForCurrentLevel;
  const xpInLevel = currentLevel < MAX_LEVEL ? xpForNextLevel - xpForCurrentLevel : 0;
  const xpProgress = currentXP - xpForCurrentLevel;
  const xpNeeded = xpForNextLevel - currentXP;
  const percentage = xpInLevel > 0 ? Math.round((xpProgress / xpInLevel) * 100) : 100;

  return {
    xpForCurrentLevel,
    xpForNextLevel,
    xpProgress,
    xpNeeded,
    percentage,
  };
}

/**
 * Get days remaining in battle pass
 */
export function getDaysRemaining(battlePass: BattlePass): number {
  const now = Date.now();
  const remaining = battlePass.endDate - now;
  return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)));
}
