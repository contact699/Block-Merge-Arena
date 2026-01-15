// Virtual Currency Management
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Currency, Reward } from '@/lib/types/shop';

const CURRENCY_KEY = '@block_merge_arena:currency';
const TRANSACTIONS_KEY = '@block_merge_arena:transactions';

/**
 * Get user's current currency balance
 */
export async function getCurrency(): Promise<Currency> {
  try {
    const data = await AsyncStorage.getItem(CURRENCY_KEY);
    if (data) {
      return JSON.parse(data);
    }
    // Default starting currency
    return { gems: 0, coins: 100 };
  } catch (error) {
    console.error('Error loading currency:', error);
    return { gems: 0, coins: 100 };
  }
}

/**
 * Update currency balance
 */
export async function setCurrency(currency: Currency): Promise<void> {
  try {
    await AsyncStorage.setItem(CURRENCY_KEY, JSON.stringify(currency));
  } catch (error) {
    console.error('Error saving currency:', error);
  }
}

/**
 * Add currency (from rewards, purchases, etc.)
 */
export async function addCurrency(amount: { gems?: number; coins?: number }): Promise<Currency> {
  try {
    const current = await getCurrency();
    const updated: Currency = {
      gems: current.gems + (amount.gems || 0),
      coins: current.coins + (amount.coins || 0),
    };
    await setCurrency(updated);
    console.log('✅ Currency added:', amount, '→ New balance:', updated);
    return updated;
  } catch (error) {
    console.error('Error adding currency:', error);
    return await getCurrency();
  }
}

/**
 * Spend currency (for purchases)
 */
export async function spendCurrency(amount: { gems?: number; coins?: number }): Promise<{
  success: boolean;
  newBalance?: Currency;
  error?: string;
}> {
  try {
    const current = await getCurrency();

    // Check if user has enough
    if (amount.gems && current.gems < amount.gems) {
      return {
        success: false,
        error: `Not enough gems. Need ${amount.gems}, have ${current.gems}`,
      };
    }

    if (amount.coins && current.coins < amount.coins) {
      return {
        success: false,
        error: `Not enough coins. Need ${amount.coins}, have ${current.coins}`,
      };
    }

    // Deduct currency
    const updated: Currency = {
      gems: current.gems - (amount.gems || 0),
      coins: current.coins - (amount.coins || 0),
    };

    await setCurrency(updated);
    console.log('✅ Currency spent:', amount, '→ New balance:', updated);

    return {
      success: true,
      newBalance: updated,
    };
  } catch (error) {
    console.error('Error spending currency:', error);
    return {
      success: false,
      error: String(error),
    };
  }
}

/**
 * Grant reward (from ads, achievements, etc.)
 */
export async function grantReward(reward: Reward): Promise<Currency> {
  const currency = await addCurrency({
    gems: reward.gems || 0,
    coins: reward.coins || 0,
  });

  // TODO: Grant items if reward includes them

  return currency;
}

/**
 * Calculate coins earned from score
 */
export function calculateCoinsFromScore(score: number): number {
  // 1 coin per 100 points
  return Math.floor(score / 100);
}

/**
 * Reward coins after game
 */
export async function rewardCoinsForScore(score: number): Promise<number> {
  const coins = calculateCoinsFromScore(score);
  if (coins > 0) {
    await addCurrency({ coins });
  }
  return coins;
}

/**
 * Get transaction history (for debugging/analytics)
 */
export async function getTransactions(): Promise<any[]> {
  try {
    const data = await AsyncStorage.getItem(TRANSACTIONS_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error loading transactions:', error);
    return [];
  }
}

/**
 * Log transaction (for audit trail)
 */
export async function logTransaction(transaction: any): Promise<void> {
  try {
    const transactions = await getTransactions();
    transactions.push({
      ...transaction,
      timestamp: Date.now(),
    });

    // Keep last 100 transactions
    const trimmed = transactions.slice(-100);
    await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Error logging transaction:', error);
  }
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K`;
  }
  return amount.toString();
}
