// Firebase Firestore Types and Schema

/**
 * User profile in Firestore
 * Collection: users/{userId}
 */
export interface FirebaseUser {
  id: string;
  createdAt: number; // timestamp
  lastActiveAt: number; // timestamp
  displayName?: string;
  stats: {
    totalGames: number;
    totalScore: number;
    highScore: number;
    highScoreEndless: number;
    highScoreTournament: number;
    gamesWon: number;
    averageScore: number;
  };
  preferences?: {
    soundEnabled: boolean;
    musicEnabled: boolean;
    vibrationEnabled: boolean;
  };
}

/**
 * Game score in Firestore
 * Collection: scores/{scoreId}
 */
export interface FirebaseScore {
  id: string;
  userId: string;
  score: number;
  mode: 'endless' | 'tournament';
  date: number; // timestamp
  dateString: string; // YYYY-MM-DD for tournament grouping
  maxMultiplier: number;
  moveCount?: number;
  duration?: number; // milliseconds
  // For anti-cheat (future feature)
  verified?: boolean;
  deviceInfo?: {
    platform: string;
    version: string;
  };
}

/**
 * Tournament entry in Firestore
 * Collection: tournaments/{tournamentDate}/entries/{userId}
 */
export interface TournamentEntry {
  userId: string;
  tournamentDate: string; // YYYY-MM-DD
  score: number;
  rank?: number; // Calculated rank
  maxMultiplier: number;
  submittedAt: number; // timestamp
  duration?: number;
  // Only best score per user per tournament
  isBestScore: boolean;
}

/**
 * Tournament metadata
 * Collection: tournaments/{tournamentDate}
 */
export interface Tournament {
  date: string; // YYYY-MM-DD
  seed: number; // Daily seed for piece generation
  startTime: number; // timestamp
  endTime: number; // timestamp
  participantCount: number;
  topScore: number;
  status: 'active' | 'completed' | 'upcoming';
}

/**
 * Leaderboard entry (computed/cached)
 * Collection: leaderboards/global, leaderboards/endless, leaderboards/tournament
 */
export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  score: number;
  rank: number;
  mode: 'all' | 'endless' | 'tournament';
  maxMultiplier: number;
  date: number;
  // For display
  isCurrentUser?: boolean;
}

/**
 * API response types
 */
export interface SubmitScoreResponse {
  success: boolean;
  scoreId?: string;
  rank?: number;
  error?: string;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  total: number;
  userRank?: number;
  userScore?: number;
}

export interface TournamentStandingsResponse {
  tournamentDate: string;
  entries: TournamentEntry[];
  userEntry?: TournamentEntry;
  total: number;
}
