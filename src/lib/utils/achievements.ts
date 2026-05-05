// Achievements System - Storage & Management
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Achievement, AchievementUnlock } from '@/lib/types/achievements';
import { addCurrency } from './currency';

const ACHIEVEMENTS_KEY = '@block_merge_arena:achievements';
const UNLOCKS_KEY = '@block_merge_arena:achievement_unlocks';

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
 * Check and update multiple achievements
 */
export async function checkAchievements(data: {
  score?: number;
  gamesPlayed?: number;
  multiplier?: number;
  tournamentRank?: number;
  perfectClear?: boolean;
}): Promise<Achievement[]> {
  const unlockedAchievements: Achievement[] = [];

  // TODO(phase-2): rewrite achievement grants for the slim catalog
  // The old grants below referenced IDs that no longer exist and have been
  // commented out. Wire new grant logic once Phase 2 defines the events.

  // // Score achievements
  // if (data.score !== undefined) {
  //   const scoreAchievements = ['score_1k', 'score_5k', 'score_10k', 'score_25k', 'score_50k'];
  //   for (const id of scoreAchievements) {
  //     const unlocked = await updateAchievementProgress(id, data.score);
  //     if (unlocked) unlockedAchievements.push(unlocked);
  //   }
  // }

  // // Games played
  // if (data.gamesPlayed !== undefined) {
  //   const gamesAchievements = ['games_10', 'games_50', 'games_100', 'first_game'];
  //   for (const id of gamesAchievements) {
  //     const unlocked = await updateAchievementProgress(id, data.gamesPlayed);
  //     if (unlocked) unlockedAchievements.push(unlocked);
  //   }
  // }

  // // Multiplier/Combo
  // if (data.multiplier !== undefined) {
  //   const comboAchievements = ['combo_5x', 'combo_10x'];
  //   for (const id of comboAchievements) {
  //     const unlocked = await updateAchievementProgress(id, data.multiplier);
  //     if (unlocked) unlockedAchievements.push(unlocked);
  //   }
  // }

  // // Tournament rank
  // if (data.tournamentRank !== undefined) {
  //   if (data.tournamentRank === 1) {
  //     const unlocked = await updateAchievementProgress('tournament_win', 1);
  //     if (unlocked) unlockedAchievements.push(unlocked);
  //   }
  //   if (data.tournamentRank <= 10) {
  //     const unlocked = await updateAchievementProgress('tournament_top10', 1);
  //     if (unlocked) unlockedAchievements.push(unlocked);
  //   }
  // }

  // // Perfect clear
  // if (data.perfectClear) {
  //   const unlocked = await updateAchievementProgress('perfect_clear', 1);
  //   if (unlocked) unlockedAchievements.push(unlocked);
  // }

  return unlockedAchievements;
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
