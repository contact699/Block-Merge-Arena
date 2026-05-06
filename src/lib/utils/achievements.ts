// Achievements System - Storage & Management
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Achievement, AchievementUnlock } from '@/lib/types/achievements';
import { addCurrency } from './currency';
import { evaluateGrants } from '@/lib/achievements/grants';
import type { GrantContext } from '@/lib/achievements/grants';

const ACHIEVEMENTS_KEY = '@block_merge:achievements';
const UNLOCKS_KEY = '@block_merge:achievement_unlocks';

/**
 * Slim achievements catalog — six tasteful badges.
 */
export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-merge',
    name: 'First Merge',
    description: 'Merge two gems for the first time',
    category: 'special',
    rarity: 'common',
    icon: '✨',
    requirement: 1,
    currentProgress: 0,
    completed: false,
    rewards: {},
  },
  {
    id: 'five-cluster',
    name: 'Five-Cluster',
    description: 'Land a ×5 multiplier',
    category: 'combos',
    rarity: 'rare',
    icon: '🔥',
    requirement: 5,
    currentProgress: 0,
    completed: false,
    rewards: {},
  },
  {
    id: 'first-daily',
    name: 'Daily Debut',
    description: 'Complete your first daily run',
    category: 'tournament',
    rarity: 'common',
    icon: '📅',
    requirement: 1,
    currentProgress: 0,
    completed: false,
    rewards: {},
  },
  {
    id: 'streak-7',
    name: 'A Week Steady',
    description: 'Play the daily seven days in a row',
    category: 'tournament',
    rarity: 'rare',
    icon: '🏅',
    requirement: 7,
    currentProgress: 0,
    completed: false,
    rewards: {},
  },
  {
    id: 'sub-three',
    name: 'Quick Hand',
    description: 'Finish a run in under three minutes',
    category: 'special',
    rarity: 'rare',
    icon: '⏱️',
    requirement: 1,
    currentProgress: 0,
    completed: false,
    rewards: {},
  },
  {
    id: 'centurion',
    name: 'Centurion',
    description: 'Play one hundred dailies',
    category: 'tournament',
    rarity: 'epic',
    icon: '🏆',
    requirement: 100,
    currentProgress: 0,
    completed: false,
    rewards: {},
  },
];

/**
 * Get user's achievements
 */
export async function getAchievements(): Promise<Achievement[]> {
  try {
    const data = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
    if (data) {
      return JSON.parse(data);
    }
    // Initialize with defaults
    await saveAchievements(DEFAULT_ACHIEVEMENTS);
    return DEFAULT_ACHIEVEMENTS;
  } catch (error) {
    console.error('Error loading achievements:', error);
    return DEFAULT_ACHIEVEMENTS;
  }
}

/**
 * Save achievements
 */
export async function saveAchievements(achievements: Achievement[]): Promise<void> {
  try {
    await AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(achievements));
  } catch (error) {
    console.error('Error saving achievements:', error);
  }
}

/**
 * Update achievement progress
 */
export async function updateAchievementProgress(
  achievementId: string,
  progress: number
): Promise<Achievement | null> {
  try {
    const achievements = await getAchievements();
    const achievement = achievements.find((a) => a.id === achievementId);

    if (!achievement || achievement.completed) {
      return null;
    }

    // Update progress
    achievement.currentProgress = Math.max(achievement.currentProgress, progress);

    // Check if completed
    if (achievement.currentProgress >= achievement.requirement && !achievement.completed) {
      achievement.completed = true;
      achievement.unlockedAt = Date.now();

      // Grant rewards
      if (achievement.rewards.coins || achievement.rewards.gems) {
        await addCurrency({
          coins: achievement.rewards.coins || 0,
          gems: achievement.rewards.gems || 0,
        });
      }

      // Log unlock
      await logAchievementUnlock(achievement);

      console.log('🏆 Achievement unlocked:', achievement.name);
    }

    await saveAchievements(achievements);
    return achievement.completed ? achievement : null;
  } catch (error) {
    console.error('Error updating achievement:', error);
    return null;
  }
}

/**
 * Check and grant achievements based on a completed run.
 * Returns the IDs of newly granted achievements.
 */
export async function checkAchievements(
  ctx: Omit<GrantContext, 'alreadyUnlocked'>,
): Promise<string[]> {
  try {
    const existing = await getAchievements();
    const alreadyUnlocked = new Set(
      existing.filter((a) => a.completed).map((a) => a.id),
    );
    const newlyGranted = evaluateGrants({ ...ctx, alreadyUnlocked });
    if (newlyGranted.length === 0) return [];

    const updated = existing.map((a) =>
      newlyGranted.includes(a.id)
        ? { ...a, completed: true, currentProgress: 100, unlockedAt: Date.now() }
        : a,
    );
    await AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(updated));
    return newlyGranted;
  } catch (error) {
    console.error('Error checking achievements:', error);
    return [];
  }
}

/**
 * Log achievement unlock
 */
async function logAchievementUnlock(achievement: Achievement): Promise<void> {
  try {
    const unlocks = await getAchievementUnlocks();
    unlocks.push({
      achievement,
      timestamp: Date.now(),
    });

    // Keep last 100 unlocks
    const trimmed = unlocks.slice(-100);
    await AsyncStorage.setItem(UNLOCKS_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Error logging achievement unlock:', error);
  }
}

/**
 * Get achievement unlocks history
 */
export async function getAchievementUnlocks(): Promise<AchievementUnlock[]> {
  try {
    const data = await AsyncStorage.getItem(UNLOCKS_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error loading unlocks:', error);
    return [];
  }
}

/**
 * Get achievements by category
 */
export async function getAchievementsByCategory(
  category: string
): Promise<Achievement[]> {
  const achievements = await getAchievements();
  return achievements.filter((a) => a.category === category);
}

/**
 * Get completion stats
 */
export async function getAchievementStats(): Promise<{
  total: number;
  completed: number;
  percentage: number;
}> {
  const achievements = await getAchievements();
  const completed = achievements.filter((a) => a.completed).length;
  const total = achievements.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { total, completed, percentage };
}
