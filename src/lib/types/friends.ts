// Friends System Types

export type FriendRequestStatus = 'pending' | 'accepted' | 'declined';

export interface Friend {
  id: string; // Unique friendship ID
  friendUserId: string;
  displayName: string;
  addedAt: number; // Unix timestamp
  lastActive: number; // Unix timestamp
  isOnline: boolean;
  rank?: string; // Player's current rank
  highScore: number; // Their best score
  lastPlayedWith?: number; // Last time played together
  favorited: boolean; // Pinned friend
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromDisplayName: string;
  toUserId: string;
  toDisplayName: string;
  createdAt: number;
  status: FriendRequestStatus;
  message?: string; // Optional message with request
}

export interface FriendChallenge {
  id: string;
  challengerId: string;
  challengerName: string;
  challengerScore: number;
  challengedUserId: string;
  replayCode?: string; // Replay to beat
  mode: 'endless' | 'tournament';
  createdAt: number;
  expiresAt: number;
  status: 'pending' | 'accepted' | 'completed' | 'expired';
  challengedScore?: number; // Score if completed
  winnerId?: string;
}

export interface SharedReplay {
  id: string;
  fromUserId: string;
  fromDisplayName: string;
  toUserId: string;
  replayCode: string;
  message?: string;
  createdAt: number;
  viewed: boolean;
}

export interface FriendActivity {
  id: string;
  userId: string;
  displayName: string;
  type: 'high_score' | 'challenge_sent' | 'challenge_won' | 'rank_up' | 'achievement' | 'online';
  message: string;
  timestamp: number;
  metadata?: {
    score?: number;
    rank?: string;
    achievementId?: string;
    challengeId?: string;
    replayCode?: string;
  };
}

export interface PlayerFriendData {
  friends: Friend[];
  incomingRequests: FriendRequest[];
  outgoingRequests: FriendRequest[];
  challenges: FriendChallenge[];
  sharedReplays: SharedReplay[];
  blockedUsers: string[];
  friendCode: string; // 8-character unique code for adding friends
}

/**
 * Default friend data for new players
 */
export const DEFAULT_PLAYER_FRIEND_DATA: PlayerFriendData = {
  friends: [],
  incomingRequests: [],
  outgoingRequests: [],
  challenges: [],
  sharedReplays: [],
  blockedUsers: [],
  friendCode: '',
};

/**
 * Friend system constants
 */
export const MAX_FRIENDS = 100;
export const MAX_PENDING_REQUESTS = 50;
export const FRIEND_CODE_LENGTH = 8;
export const CHALLENGE_EXPIRY_DAYS = 7;
export const REQUEST_EXPIRY_DAYS = 30;
