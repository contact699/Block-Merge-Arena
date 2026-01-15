// Local Leaderboard Storage (with Firebase integration)
import AsyncStorage from '@react-native-async-storage/async-storage';
import { submitScore as submitScoreToFirebase, isConfigured } from '@/lib/firebase';

export interface GameScore {
  id: string;
  score: number;
  mode: 'endless' | 'tournament';
  date: string; // ISO string
  moveCount?: number;
  maxMultiplier?: number;
}

const LEADERBOARD_KEY = '@block_merge_arena:leaderboard';
const MAX_SCORES = 50; // Keep top 50 scores

/**
 * Save a new score to the leaderboard (local + Firebase)
 */
export async function saveScore(score: GameScore): Promise<void> {
  try {
    // Save to local storage first (always works)
    const scores = await getScores();
    scores.push(score);

    // Sort by score (descending)
    scores.sort((a: GameScore, b: GameScore) => b.score - a.score);

    // Keep only top MAX_SCORES
    const topScores = scores.slice(0, MAX_SCORES);

    await AsyncStorage.setItem(LEADERBOARD_KEY, JSON.stringify(topScores));

    // Also submit to Firebase if configured
    if (isConfigured()) {
      await submitScoreToFirebase(
        score.score,
        score.mode,
        score.maxMultiplier || 1,
        score.moveCount,
        undefined // duration - can be added later
      ).catch((err) => {
        console.warn('Failed to submit score to Firebase (using local only):', err);
      });
    }
  } catch (error) {
    console.error('Error saving score:', error);
  }
}

/**
 * Get all saved scores
 */
export async function getScores(): Promise<GameScore[]> {
  try {
    const data = await AsyncStorage.getItem(LEADERBOARD_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error loading scores:', error);
    return [];
  }
}

/**
 * Get top N scores
 */
export async function getTopScores(limit: number = 10): Promise<GameScore[]> {
  const scores = await getScores();
  return scores.slice(0, limit);
}

/**
 * Get top scores by mode
 */
export async function getTopScoresByMode(
  mode: 'endless' | 'tournament',
  limit: number = 10
): Promise<GameScore[]> {
  const scores = await getScores();
  const filtered = scores.filter((s: GameScore) => s.mode === mode);
  return filtered.slice(0, limit);
}

/**
 * Get highest score
 */
export async function getHighScore(): Promise<number> {
  const scores = await getTopScores(1);
  return scores.length > 0 ? scores[0].score : 0;
}

/**
 * Get highest score by mode
 */
export async function getHighScoreByMode(mode: 'endless' | 'tournament'): Promise<number> {
  const scores = await getTopScoresByMode(mode, 1);
  return scores.length > 0 ? scores[0].score : 0;
}

/**
 * Get recent games (last N games)
 */
export async function getRecentGames(limit: number = 10): Promise<GameScore[]> {
  const scores = await getScores();

  // Sort by date (most recent first)
  const sorted = [...scores].sort((a: GameScore, b: GameScore) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return sorted.slice(0, limit);
}

/**
 * Get game statistics
 */
export async function getGameStats(): Promise<{
  totalGames: number;
  averageScore: number;
  highScore: number;
  gamesThisWeek: number;
}> {
  const scores = await getScores();
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const gamesThisWeek = scores.filter((s: GameScore) => {
    return new Date(s.date) >= weekAgo;
  }).length;

  const totalScore = scores.reduce((sum: number, s: GameScore) => sum + s.score, 0);
  const averageScore = scores.length > 0 ? Math.round(totalScore / scores.length) : 0;
  const highScore = scores.length > 0 ? scores[0].score : 0;

  return {
    totalGames: scores.length,
    averageScore,
    highScore,
    gamesThisWeek
  };
}

/**
 * Clear all scores (for testing/reset)
 */
export async function clearLeaderboard(): Promise<void> {
  try {
    await AsyncStorage.removeItem(LEADERBOARD_KEY);
  } catch (error) {
    console.error('Error clearing leaderboard:', error);
  }
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}
