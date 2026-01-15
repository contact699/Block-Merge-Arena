// Ranked Ladder System Management

import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  Rank,
  RankInfo,
  RankTier,
  RankDivision,
  Season,
  PlayerRankData,
} from '@/lib/types/ranks';
import {
  DEFAULT_RANK,
  RANK_THRESHOLDS,
  DIVISION_POINTS,
  SEASON_DURATION,
  POINTS_PER_WIN,
  POINTS_PER_LOSS,
} from '@/lib/types/ranks';
import { addCurrency } from './currency';

const RANK_DATA_KEY = '@block_merge_arena:rank_data';
const CURRENT_SEASON_KEY = '@block_merge_arena:current_season';

/**
 * Calculate rank from rating points
 */
export function calculateRankFromRating(rating: number): Rank {
  // Determine tier
  let tier: RankTier = 'bronze';
  for (const [tierName, threshold] of Object.entries(RANK_THRESHOLDS)) {
    if (rating >= threshold.minRating && rating <= threshold.maxRating) {
      tier = tierName as RankTier;
      break;
    }
  }

  // Calculate division within tier (4 = lowest, 1 = highest)
  const tierMin = RANK_THRESHOLDS[tier].minRating;
  const tierMax = RANK_THRESHOLDS[tier].maxRating;
  const tierRange = tierMax - tierMin + 1;
  const divisionSize = tierRange / 4;
  const tierProgress = rating - tierMin;
  const divisionIndex = Math.floor(tierProgress / divisionSize);
  const division = (4 - Math.min(divisionIndex, 3)) as RankDivision;

  // Calculate points within division (0-100)
  const divisionStart = tierMin + (4 - division) * divisionSize;
  const divisionProgress = rating - divisionStart;
  const points = Math.min(100, Math.round((divisionProgress / divisionSize) * 100));

  return { tier, division, points };
}

/**
 * Calculate rating from rank
 */
export function calculateRatingFromRank(rank: Rank): number {
  const tierMin = RANK_THRESHOLDS[rank.tier].minRating;
  const tierMax = RANK_THRESHOLDS[rank.tier].maxRating;
  const tierRange = tierMax - tierMin + 1;
  const divisionSize = tierRange / 4;

  const divisionStart = tierMin + (4 - rank.division) * divisionSize;
  const rating = divisionStart + (rank.points / 100) * divisionSize;

  return Math.round(rating);
}

/**
 * Get rank display info
 */
export function getRankInfo(rank: Rank): RankInfo {
  const romanNumerals: Record<RankDivision, string> = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV' };
  const tierName = rank.tier.charAt(0).toUpperCase() + rank.tier.slice(1);
  const displayName = `${tierName} ${romanNumerals[rank.division]}`;

  const threshold = RANK_THRESHOLDS[rank.tier];
  const currentRating = calculateRatingFromRank(rank);

  // Calculate next rank
  let nextRank: string | undefined;
  let pointsToNextRank: number | undefined;

  if (rank.division > 1) {
    // Next division in same tier
    const nextDivision = (rank.division - 1) as RankDivision;
    nextRank = `${tierName} ${romanNumerals[nextDivision]}`;
    const nextRating = calculateRatingFromRank({ ...rank, division: nextDivision, points: 0 });
    pointsToNextRank = nextRating - currentRating;
  } else if (rank.tier !== 'diamond') {
    // Next tier
    const tiers: RankTier[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    const currentTierIndex = tiers.indexOf(rank.tier);
    const nextTier = tiers[currentTierIndex + 1];
    const nextTierName = nextTier.charAt(0).toUpperCase() + nextTier.slice(1);
    nextRank = `${nextTierName} IV`;
    const nextRating = RANK_THRESHOLDS[nextTier].minRating;
    pointsToNextRank = nextRating - currentRating;
  }

  return {
    tier: rank.tier,
    division: rank.division,
    points: rank.points,
    displayName,
    icon: threshold.icon,
    color: threshold.color,
    nextRank,
    pointsToNextRank,
  };
}

/**
 * Get current season
 */
export async function getCurrentSeason(): Promise<Season> {
  try {
    const data = await AsyncStorage.getItem(CURRENT_SEASON_KEY);
    if (data) {
      const season: Season = JSON.parse(data);
      // Check if season is still active
      if (season.active && Date.now() < season.endDate) {
        return season;
      }
    }

    // Create new season
    return await createNewSeason();
  } catch (error) {
    console.error('Error loading current season:', error);
    return await createNewSeason();
  }
}

/**
 * Create new season
 */
export async function createNewSeason(): Promise<Season> {
  const startDate = Date.now();
  const endDate = startDate + SEASON_DURATION;
  const seasonNumber = Math.floor(startDate / SEASON_DURATION);

  const season: Season = {
    id: `season_${seasonNumber}`,
    name: `Season ${seasonNumber % 100}`,
    startDate,
    endDate,
    active: true,
  };

  await AsyncStorage.setItem(CURRENT_SEASON_KEY, JSON.stringify(season));
  console.log('🆕 New season created:', season.name);

  return season;
}

/**
 * Get player rank data
 */
export async function getPlayerRankData(): Promise<PlayerRankData> {
  try {
    const [data, season] = await Promise.all([
      AsyncStorage.getItem(RANK_DATA_KEY),
      getCurrentSeason(),
    ]);

    if (data) {
      const rankData: PlayerRankData = JSON.parse(data);

      // Check if season has changed
      if (rankData.seasonId !== season.id) {
        // Season reset - create new rank data
        return await resetSeasonRank(season.id);
      }

      return rankData;
    }

    // New player - create initial rank data
    const initialData: PlayerRankData = {
      currentRank: DEFAULT_RANK,
      seasonId: season.id,
      wins: 0,
      losses: 0,
      tournamentPoints: 0,
      highestRank: DEFAULT_RANK,
      peakRating: calculateRatingFromRank(DEFAULT_RANK),
    };

    await AsyncStorage.setItem(RANK_DATA_KEY, JSON.stringify(initialData));
    return initialData;
  } catch (error) {
    console.error('Error loading player rank data:', error);
    const season = await getCurrentSeason();
    return {
      currentRank: DEFAULT_RANK,
      seasonId: season.id,
      wins: 0,
      losses: 0,
      tournamentPoints: 0,
      highestRank: DEFAULT_RANK,
      peakRating: 0,
    };
  }
}

/**
 * Save player rank data
 */
export async function savePlayerRankData(data: PlayerRankData): Promise<void> {
  try {
    await AsyncStorage.setItem(RANK_DATA_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving player rank data:', error);
  }
}

/**
 * Reset rank for new season
 */
export async function resetSeasonRank(newSeasonId: string): Promise<PlayerRankData> {
  const oldData = await getPlayerRankData();

  // Soft reset: reduce rating by 50%
  const oldRating = calculateRatingFromRank(oldData.currentRank);
  const newRating = Math.floor(oldRating * 0.5);
  const newRank = calculateRankFromRating(newRating);

  const newData: PlayerRankData = {
    currentRank: newRank,
    seasonId: newSeasonId,
    wins: 0,
    losses: 0,
    tournamentPoints: 0,
    highestRank: newRank,
    peakRating: newRating,
  };

  await savePlayerRankData(newData);
  console.log('🔄 Season rank reset:', getRankInfo(newRank).displayName);

  return newData;
}

/**
 * Update rank based on tournament performance
 */
export async function updateRankAfterTournament(
  tournamentRank: number,
  totalPlayers: number,
  score: number
): Promise<{
  oldRank: RankInfo;
  newRank: RankInfo;
  ratingChange: number;
  rankUp: boolean;
  rankDown: boolean;
  rewards?: { coins?: number; gems?: number };
}> {
  const rankData = await getPlayerRankData();
  const oldRating = calculateRatingFromRank(rankData.currentRank);

  // Calculate rating change based on tournament placement
  let ratingChange = 0;
  const topPercent = (tournamentRank / totalPlayers) * 100;

  if (topPercent <= 10) {
    // Top 10% - big win
    ratingChange = POINTS_PER_WIN * 2;
  } else if (topPercent <= 25) {
    // Top 25% - win
    ratingChange = POINTS_PER_WIN;
  } else if (topPercent <= 50) {
    // Top 50% - small gain
    ratingChange = Math.floor(POINTS_PER_WIN * 0.5);
  } else if (topPercent <= 75) {
    // Bottom 50% - small loss
    ratingChange = Math.floor(POINTS_PER_LOSS * 0.5);
  } else {
    // Bottom 25% - loss
    ratingChange = POINTS_PER_LOSS;
  }

  const newRating = Math.max(0, oldRating + ratingChange);
  const newRank = calculateRankFromRating(newRating);

  // Check for rank up/down
  const oldRankInfo = getRankInfo(rankData.currentRank);
  const newRankInfo = getRankInfo(newRank);
  const rankUp =
    newRank.tier !== rankData.currentRank.tier ||
    (newRank.tier === rankData.currentRank.tier && newRank.division < rankData.currentRank.division);
  const rankDown =
    newRank.tier !== rankData.currentRank.tier ||
    (newRank.tier === rankData.currentRank.tier && newRank.division > rankData.currentRank.division);

  // Update rank data
  rankData.currentRank = newRank;
  rankData.tournamentPoints += score;

  if (tournamentRank === 1) {
    rankData.wins += 1;
  } else if (topPercent > 50) {
    rankData.losses += 1;
  }

  // Update highest rank
  if (newRating > rankData.peakRating) {
    rankData.peakRating = newRating;
    rankData.highestRank = newRank;
  }

  await savePlayerRankData(rankData);

  // Award rank-up rewards
  let rewards: { coins?: number; gems?: number } | undefined;
  if (rankUp) {
    rewards = await awardRankUpRewards(newRank);
  }

  console.log(
    `📊 Rank updated: ${oldRankInfo.displayName} → ${newRankInfo.displayName} (${ratingChange > 0 ? '+' : ''}${ratingChange})`
  );

  return {
    oldRank: oldRankInfo,
    newRank: newRankInfo,
    ratingChange,
    rankUp,
    rankDown,
    rewards,
  };
}

/**
 * Award rewards for ranking up
 */
export async function awardRankUpRewards(rank: Rank): Promise<{ coins: number; gems: number }> {
  let coins = 0;
  let gems = 0;

  // Division rewards
  switch (rank.division) {
    case 4:
      coins = 50;
      break;
    case 3:
      coins = 100;
      break;
    case 2:
      coins = 200;
      break;
    case 1:
      coins = 300;
      gems = 10;
      break;
  }

  // Tier bonus
  switch (rank.tier) {
    case 'bronze':
      break;
    case 'silver':
      coins += 200;
      gems += 10;
      break;
    case 'gold':
      coins += 500;
      gems += 25;
      break;
    case 'platinum':
      coins += 1000;
      gems += 50;
      break;
    case 'diamond':
      coins += 2000;
      gems += 100;
      break;
  }

  await addCurrency({ coins, gems });
  console.log(`🎁 Rank up rewards: ${coins} coins, ${gems} gems`);

  return { coins, gems };
}

/**
 * Get rank progress percentage within current division
 */
export function getRankProgress(rank: Rank): number {
  return rank.points;
}

/**
 * Get all ranks for display
 */
export function getAllRanks(): RankInfo[] {
  const ranks: RankInfo[] = [];
  const tiers: RankTier[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];

  for (const tier of tiers) {
    for (let division = 4; division >= 1; division--) {
      const rank: Rank = { tier, division: division as RankDivision, points: 0 };
      ranks.push(getRankInfo(rank));
    }
  }

  return ranks;
}
