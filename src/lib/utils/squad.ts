// Squad Management System

import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  Squad,
  SquadMember,
  SquadRole,
  PlayerSquadData,
  SquadInvite,
  SquadActivity,
} from '@/lib/types/squad';
import {
  DEFAULT_PLAYER_SQUAD_DATA,
  MAX_SQUAD_MEMBERS,
  INVITE_EXPIRY_DAYS,
} from '@/lib/types/squad';
import { getPlayerRankData, getRankInfo } from './ranks';

const SQUADS_KEY = '@block_merge_arena:squads';
const PLAYER_SQUAD_DATA_KEY = '@block_merge_arena:player_squad_data';
const SQUAD_ACTIVITIES_KEY = '@block_merge_arena:squad_activities';

/**
 * Generate unique squad ID
 */
function generateSquadId(): string {
  return `squad_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get all squads
 */
export async function getAllSquads(): Promise<Squad[]> {
  try {
    const data = await AsyncStorage.getItem(SQUADS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading squads:', error);
    return [];
  }
}

/**
 * Save all squads
 */
async function saveAllSquads(squads: Squad[]): Promise<void> {
  try {
    await AsyncStorage.setItem(SQUADS_KEY, JSON.stringify(squads));
  } catch (error) {
    console.error('Error saving squads:', error);
  }
}

/**
 * Get squad by ID
 */
export async function getSquadById(squadId: string): Promise<Squad | null> {
  const squads = await getAllSquads();
  return squads.find((s) => s.id === squadId) || null;
}

/**
 * Get player squad data
 */
export async function getPlayerSquadData(userId: string): Promise<PlayerSquadData> {
  try {
    const key = `${PLAYER_SQUAD_DATA_KEY}_${userId}`;
    const data = await AsyncStorage.getItem(key);

    if (data) {
      const squadData: PlayerSquadData = JSON.parse(data);
      // Filter out expired invites
      squadData.pendingInvites = squadData.pendingInvites.filter(
        (invite) => invite.status === 'pending' && invite.expiresAt > Date.now()
      );
      return squadData;
    }

    return DEFAULT_PLAYER_SQUAD_DATA;
  } catch (error) {
    console.error('Error loading player squad data:', error);
    return DEFAULT_PLAYER_SQUAD_DATA;
  }
}

/**
 * Save player squad data
 */
async function savePlayerSquadData(userId: string, data: PlayerSquadData): Promise<void> {
  try {
    const key = `${PLAYER_SQUAD_DATA_KEY}_${userId}`;
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving player squad data:', error);
  }
}

/**
 * Create new squad
 */
export async function createSquad(
  userId: string,
  displayName: string,
  squadName: string,
  tag: string,
  description: string,
  icon: string,
  color: string,
  isPublic: boolean
): Promise<{ success: boolean; error?: string; squad?: Squad }> {
  // Check if user is already in a squad
  const playerData = await getPlayerSquadData(userId);
  if (playerData.currentSquadId) {
    return { success: false, error: 'You are already in a squad' };
  }

  // Get player rank
  const rankData = await getPlayerRankData();
  const rankInfo = getRankInfo(rankData.currentRank);

  // Create founder member
  const founder: SquadMember = {
    userId,
    displayName,
    role: 'leader',
    joinedAt: Date.now(),
    lastActive: Date.now(),
    totalScore: 0,
    rank: rankInfo.displayName,
  };

  // Create squad
  const squad: Squad = {
    id: generateSquadId(),
    name: squadName,
    tag: tag.toUpperCase(),
    description,
    icon,
    color,
    createdAt: Date.now(),
    members: [founder],
    maxMembers: MAX_SQUAD_MEMBERS,
    totalScore: 0,
    isPublic,
  };

  // Save squad
  const squads = await getAllSquads();
  squads.push(squad);
  await saveAllSquads(squads);

  // Update player data
  playerData.currentSquadId = squad.id;
  await savePlayerSquadData(userId, playerData);

  // Log activity
  await logSquadActivity(squad.id, userId, displayName, 'joined', `${displayName} created the squad`);

  console.log('🛡️ Squad created:', squad.name);
  return { success: true, squad };
}

/**
 * Join squad
 */
export async function joinSquad(
  userId: string,
  displayName: string,
  squadId: string
): Promise<{ success: boolean; error?: string }> {
  const [playerData, squad] = await Promise.all([
    getPlayerSquadData(userId),
    getSquadById(squadId),
  ]);

  // Validation
  if (playerData.currentSquadId) {
    return { success: false, error: 'You are already in a squad' };
  }

  if (!squad) {
    return { success: false, error: 'Squad not found' };
  }

  if (squad.members.length >= squad.maxMembers) {
    return { success: false, error: 'Squad is full' };
  }

  if (!squad.isPublic) {
    return { success: false, error: 'This squad is private. You need an invite to join.' };
  }

  // Check requirements
  if (squad.requirements) {
    const rankData = await getPlayerRankData();
    // Would check minRank and minScore here if implemented
  }

  // Get player rank
  const rankData = await getPlayerRankData();
  const rankInfo = getRankInfo(rankData.currentRank);

  // Add member
  const newMember: SquadMember = {
    userId,
    displayName,
    role: 'member',
    joinedAt: Date.now(),
    lastActive: Date.now(),
    totalScore: 0,
    rank: rankInfo.displayName,
  };

  squad.members.push(newMember);

  // Update squad
  const squads = await getAllSquads();
  const squadIndex = squads.findIndex((s) => s.id === squadId);
  if (squadIndex !== -1) {
    squads[squadIndex] = squad;
    await saveAllSquads(squads);
  }

  // Update player data
  playerData.currentSquadId = squadId;
  await savePlayerSquadData(userId, playerData);

  // Log activity
  await logSquadActivity(squadId, userId, displayName, 'joined', `${displayName} joined the squad`);

  console.log('🛡️ Joined squad:', squad.name);
  return { success: true };
}

/**
 * Leave squad
 */
export async function leaveSquad(
  userId: string,
  displayName: string
): Promise<{ success: boolean; error?: string }> {
  const playerData = await getPlayerSquadData(userId);

  if (!playerData.currentSquadId) {
    return { success: false, error: 'You are not in a squad' };
  }

  const squad = await getSquadById(playerData.currentSquadId);
  if (!squad) {
    return { success: false, error: 'Squad not found' };
  }

  const member = squad.members.find((m) => m.userId === userId);
  if (!member) {
    return { success: false, error: 'You are not a member of this squad' };
  }

  // If leader, check if there are other members
  if (member.role === 'leader') {
    if (squad.members.length > 1) {
      // Promote oldest co-leader or member to leader
      const nextLeader = squad.members.find((m) => m.userId !== userId);
      if (nextLeader) {
        nextLeader.role = 'leader';
      }
    } else {
      // Delete squad if no other members
      const squads = await getAllSquads();
      const filteredSquads = squads.filter((s) => s.id !== squad.id);
      await saveAllSquads(filteredSquads);
      playerData.currentSquadId = undefined;
      playerData.squadHistory.push(squad.id);
      await savePlayerSquadData(userId, playerData);
      console.log('🛡️ Squad disbanded:', squad.name);
      return { success: true };
    }
  }

  // Remove member
  squad.members = squad.members.filter((m) => m.userId !== userId);

  // Update squad
  const squads = await getAllSquads();
  const squadIndex = squads.findIndex((s) => s.id === squad.id);
  if (squadIndex !== -1) {
    squads[squadIndex] = squad;
    await saveAllSquads(squads);
  }

  // Update player data
  playerData.currentSquadId = undefined;
  playerData.squadHistory.push(squad.id);
  await savePlayerSquadData(userId, playerData);

  // Log activity
  await logSquadActivity(squad.id, userId, displayName, 'left', `${displayName} left the squad`);

  console.log('🛡️ Left squad:', squad.name);
  return { success: true };
}

/**
 * Invite player to squad
 */
export async function inviteToSquad(
  inviterUserId: string,
  inviterName: string,
  invitedUserId: string,
  squadId: string
): Promise<{ success: boolean; error?: string; invite?: SquadInvite }> {
  const squad = await getSquadById(squadId);
  if (!squad) {
    return { success: false, error: 'Squad not found' };
  }

  // Check if inviter has permission
  const inviter = squad.members.find((m) => m.userId === inviterUserId);
  if (!inviter || (inviter.role !== 'leader' && inviter.role !== 'co-leader')) {
    return { success: false, error: 'You do not have permission to invite members' };
  }

  // Check if squad is full
  if (squad.members.length >= squad.maxMembers) {
    return { success: false, error: 'Squad is full' };
  }

  // Check if user is already in squad
  if (squad.members.some((m) => m.userId === invitedUserId)) {
    return { success: false, error: 'User is already in this squad' };
  }

  // Create invite
  const invite: SquadInvite = {
    id: `invite_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    squadId,
    squadName: squad.name,
    invitedUserId,
    invitedBy: inviterUserId,
    invitedByName: inviterName,
    createdAt: Date.now(),
    expiresAt: Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    status: 'pending',
  };

  // Add to invited user's pending invites
  const invitedPlayerData = await getPlayerSquadData(invitedUserId);
  invitedPlayerData.pendingInvites.push(invite);
  await savePlayerSquadData(invitedUserId, invitedPlayerData);

  console.log('📧 Squad invite sent to user:', invitedUserId);
  return { success: true, invite };
}

/**
 * Accept squad invite
 */
export async function acceptSquadInvite(
  userId: string,
  displayName: string,
  inviteId: string
): Promise<{ success: boolean; error?: string }> {
  const playerData = await getPlayerSquadData(userId);

  const invite = playerData.pendingInvites.find((i) => i.id === inviteId);
  if (!invite) {
    return { success: false, error: 'Invite not found' };
  }

  if (invite.status !== 'pending') {
    return { success: false, error: 'Invite is no longer valid' };
  }

  if (invite.expiresAt < Date.now()) {
    invite.status = 'expired';
    await savePlayerSquadData(userId, playerData);
    return { success: false, error: 'Invite has expired' };
  }

  // Join the squad
  const result = await joinSquad(userId, displayName, invite.squadId);

  if (result.success) {
    // Mark invite as accepted
    invite.status = 'accepted';
    await savePlayerSquadData(userId, playerData);
  }

  return result;
}

/**
 * Decline squad invite
 */
export async function declineSquadInvite(
  userId: string,
  inviteId: string
): Promise<{ success: boolean }> {
  const playerData = await getPlayerSquadData(userId);

  const invite = playerData.pendingInvites.find((i) => i.id === inviteId);
  if (invite) {
    invite.status = 'declined';
    await savePlayerSquadData(userId, playerData);
  }

  return { success: true };
}

/**
 * Update squad member score
 */
export async function updateMemberScore(
  userId: string,
  squadId: string,
  scoreToAdd: number
): Promise<void> {
  const squad = await getSquadById(squadId);
  if (!squad) return;

  const member = squad.members.find((m) => m.userId === userId);
  if (!member) return;

  member.totalScore += scoreToAdd;
  member.lastActive = Date.now();
  squad.totalScore += scoreToAdd;

  // Update squad
  const squads = await getAllSquads();
  const squadIndex = squads.findIndex((s) => s.id === squadId);
  if (squadIndex !== -1) {
    squads[squadIndex] = squad;
    await saveAllSquads(squads);
  }
}

/**
 * Log squad activity
 */
async function logSquadActivity(
  squadId: string,
  userId: string,
  displayName: string,
  type: SquadActivity['type'],
  message: string
): Promise<void> {
  try {
    const key = `${SQUAD_ACTIVITIES_KEY}_${squadId}`;
    const data = await AsyncStorage.getItem(key);
    const activities: SquadActivity[] = data ? JSON.parse(data) : [];

    const activity: SquadActivity = {
      id: `activity_${Date.now()}`,
      squadId,
      userId,
      displayName,
      type,
      message,
      timestamp: Date.now(),
    };

    activities.unshift(activity);

    // Keep only last 50 activities
    const trimmedActivities = activities.slice(0, 50);

    await AsyncStorage.setItem(key, JSON.stringify(trimmedActivities));
  } catch (error) {
    console.error('Error logging squad activity:', error);
  }
}

/**
 * Get squad activities
 */
export async function getSquadActivities(squadId: string): Promise<SquadActivity[]> {
  try {
    const key = `${SQUAD_ACTIVITIES_KEY}_${squadId}`;
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading squad activities:', error);
    return [];
  }
}

/**
 * Get squad leaderboard (sorted by total score)
 */
export async function getSquadLeaderboard(): Promise<Squad[]> {
  const squads = await getAllSquads();
  return squads.sort((a, b) => b.totalScore - a.totalScore);
}

/**
 * Search squads by name or tag
 */
export async function searchSquads(query: string): Promise<Squad[]> {
  const squads = await getAllSquads();
  const lowerQuery = query.toLowerCase();

  return squads.filter(
    (squad) =>
      squad.isPublic &&
      (squad.name.toLowerCase().includes(lowerQuery) ||
        squad.tag.toLowerCase().includes(lowerQuery))
  );
}
