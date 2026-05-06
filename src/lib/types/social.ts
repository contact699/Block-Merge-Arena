// Social Sharing & TikTok Integration Types

export type SharePlatform = 'tiktok' | 'instagram' | 'twitter' | 'facebook' | 'generic';

export interface ShareableHighlight {
  id: string;
  type: 'combo' | 'high_score' | 'achievement' | 'tournament_win';
  title: string;
  description: string;
  score?: number;
  multiplier?: number;
  comboCount?: number;
  timestamp: number;
  replayCode?: string;
  thumbnailFrames?: string[]; // Base64 encoded frames for preview
  duration?: number; // Duration in milliseconds
}

export interface RecordingConfig {
  enabled: boolean;
  autoCapture: boolean; // Auto-capture epic moments
  captureThreshold: {
    minCombo: number; // Minimum combo to auto-capture
    minMultiplier: number; // Minimum multiplier to auto-capture
    minLinesCleared: number; // Minimum lines in one move
  };
  maxHighlights: number; // Maximum highlights to keep
}

export interface ShareContent {
  platform: SharePlatform;
  highlight: ShareableHighlight;
  caption: string;
  hashtags: string[];
  replayCode?: string;
  deepLink?: string;
}

export interface ShareResult {
  success: boolean;
  platform: SharePlatform;
  error?: string;
  shared?: boolean;
}

export interface SocialStats {
  totalShares: number;
  sharesByPlatform: Record<SharePlatform, number>;
  lastShareDate?: number;
  viralHighlights: string[]; // IDs of highlights that were shared
}

/**
 * Default recording config
 */
export const DEFAULT_RECORDING_CONFIG: RecordingConfig = {
  enabled: true,
  autoCapture: true,
  captureThreshold: {
    minCombo: 3,
    minMultiplier: 3,
    minLinesCleared: 3,
  },
  maxHighlights: 20,
};

/**
 * Default social stats
 */
export const DEFAULT_SOCIAL_STATS: SocialStats = {
  totalShares: 0,
  sharesByPlatform: {
    tiktok: 0,
    instagram: 0,
    twitter: 0,
    facebook: 0,
    generic: 0,
  },
  viralHighlights: [],
};

/**
 * Hashtags for different platforms
 */
export const HASHTAGS = {
  default: ['BlockMerge', 'DailyPuzzle', 'PuzzleGame'],
  combo: ['EpicCombo', 'GamingClip', 'SatisfyingGaming'],
  highScore: ['HighScore', 'NewRecord', 'PuzzleLife'],
  tournament: ['DailyChallenge', 'PuzzleGame', 'BlockMerge'],
  achievement: ['Achievement', 'PuzzleGoals', 'Unlocked'],
};

/**
 * Caption templates
 */
export const CAPTION_TEMPLATES = {
  combo: [
    '🔥 {combo}x COMBO! Can you beat this? 🎮',
    'Just pulled off a {combo}x combo in Block Merge! 💎',
    'This {multiplier}x multiplier is INSANE 🤯 #{hashtag}',
  ],
  highScore: [
    '🏆 NEW HIGH SCORE: {score} points! Who can beat it?',
    'Just hit {score} in Block Merge! 🎯 Challenge me!',
    '{score} points?! I\'m on fire! 🔥 #{hashtag}',
  ],
  tournament: [
    '🥇 Top of the daily leaderboard! #{hashtag}',
    'Just put up {score} on today\'s daily puzzle! 🏆',
    'TOP OF THE LEADERBOARD! Can you beat my {score}? 👑',
  ],
};
