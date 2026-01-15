// Achievements System Types

/**
 * Achievement categories
 */
export type AchievementCategory = 'score' | 'games' | 'combos' | 'tournament' | 'special';

/**
 * Achievement rarity
 */
export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

/**
 * Achievement definition
 */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  icon: string; // Emoji

  // Progress tracking
  requirement: number; // Target value
  currentProgress: number; // Current value
  completed: boolean;
  unlockedAt?: number; // Timestamp when unlocked

  // Rewards
  rewards: {
    coins?: number;
    gems?: number;
  };
}

/**
 * Achievement progress update
 */
export interface AchievementProgress {
  achievementId: string;
  progress: number;
  completed: boolean;
}

/**
 * Achievement unlock notification
 */
export interface AchievementUnlock {
  achievement: Achievement;
  timestamp: number;
}
