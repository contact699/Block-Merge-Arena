// Squad/Clan System Types

export type SquadRole = 'leader' | 'co-leader' | 'member';

export interface SquadMember {
  userId: string;
  displayName: string;
  role: SquadRole;
  joinedAt: number; // Unix timestamp
  lastActive: number; // Unix timestamp
  totalScore: number; // Total contribution to squad
  rank?: string; // Player's current rank (e.g., "Gold II")
}

export interface Squad {
  id: string;
  name: string;
  tag: string; // 3-4 character tag (e.g., "EPIC", "PRO")
  description: string;
  icon: string; // Emoji icon
  color: string; // Hex color for squad theme
  createdAt: number;
  members: SquadMember[];
  maxMembers: number; // Default 10
  totalScore: number; // Combined score of all members
  isPublic: boolean; // Public squads can be joined, private requires invite
  requirements?: {
    minRank?: string; // Minimum rank to join
    minScore?: number; // Minimum score to join
  };
}

export interface SquadInvite {
  id: string;
  squadId: string;
  squadName: string;
  invitedUserId: string;
  invitedBy: string;
  invitedByName: string;
  createdAt: number;
  expiresAt: number;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
}

export interface SquadActivity {
  id: string;
  squadId: string;
  userId: string;
  displayName: string;
  type: 'joined' | 'left' | 'promoted' | 'demoted' | 'kicked' | 'score_milestone';
  message: string;
  timestamp: number;
}

export interface PlayerSquadData {
  currentSquadId?: string;
  pendingInvites: SquadInvite[];
  squadHistory: string[]; // List of previous squad IDs
}

/**
 * Default squad data for new players
 */
export const DEFAULT_PLAYER_SQUAD_DATA: PlayerSquadData = {
  currentSquadId: undefined,
  pendingInvites: [],
  squadHistory: [],
};

/**
 * Squad constants
 */
export const MAX_SQUAD_MEMBERS = 10;
export const MIN_SQUAD_NAME_LENGTH = 3;
export const MAX_SQUAD_NAME_LENGTH = 20;
export const MIN_TAG_LENGTH = 2;
export const MAX_TAG_LENGTH = 4;
export const MAX_DESCRIPTION_LENGTH = 100;
export const INVITE_EXPIRY_DAYS = 7;
