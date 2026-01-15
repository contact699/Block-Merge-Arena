// Ranked Ladder System Types

export type RankTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
export type RankDivision = 1 | 2 | 3 | 4; // 4 = lowest, 1 = highest

export interface Rank {
  tier: RankTier;
  division: RankDivision;
  points: number; // Rating points (0-100 within division)
}

export interface RankInfo {
  tier: RankTier;
  division: RankDivision;
  points: number;
  displayName: string; // "Bronze IV", "Diamond I", etc.
  icon: string; // Emoji icon
  color: string; // Hex color
  nextRank?: string; // Display name of next rank
  pointsToNextRank?: number; // Points needed to rank up
}

export interface Season {
  id: string;
  name: string;
  startDate: number; // Unix timestamp
  endDate: number; // Unix timestamp
  active: boolean;
}

export interface PlayerRankData {
  currentRank: Rank;
  seasonId: string;
  wins: number;
  losses: number;
  tournamentPoints: number; // Total points earned this season
  highestRank: Rank; // Highest rank achieved this season
  peakRating: number; // Peak rating this season
}

export const RANK_THRESHOLDS: Record<RankTier, { minRating: number; maxRating: number; color: string; icon: string }> = {
  bronze: { minRating: 0, maxRating: 999, color: '#CD7F32', icon: '🥉' },
  silver: { minRating: 1000, maxRating: 1999, color: '#C0C0C0', icon: '🥈' },
  gold: { minRating: 2000, maxRating: 2999, color: '#FFD700', icon: '🥇' },
  platinum: { minRating: 3000, maxRating: 3999, color: '#E5E4E2', icon: '💎' },
  diamond: { minRating: 4000, maxRating: 9999, color: '#B9F2FF', icon: '💠' },
};

export const DIVISION_POINTS = 250; // Points per division
export const POINTS_PER_WIN = 25; // Average points for a win
export const POINTS_PER_LOSS = -15; // Average points for a loss

/**
 * Default starting rank for new players
 */
export const DEFAULT_RANK: Rank = {
  tier: 'bronze',
  division: 4,
  points: 0,
};

/**
 * Season duration in milliseconds (3 months)
 */
export const SEASON_DURATION = 90 * 24 * 60 * 60 * 1000; // 90 days
