// Friends Management System

import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  Friend,
  FriendRequest,
  FriendChallenge,
  SharedReplay,
  FriendActivity,
  PlayerFriendData,
} from '@/lib/types/friends';
import {
  DEFAULT_PLAYER_FRIEND_DATA,
  MAX_FRIENDS,
  MAX_PENDING_REQUESTS,
  FRIEND_CODE_LENGTH,
  CHALLENGE_EXPIRY_DAYS,
  REQUEST_EXPIRY_DAYS,
} from '@/lib/types/friends';
import { getPlayerRankData, getRankInfo } from './ranks';
import { getTopScores } from './leaderboard';

const FRIEND_DATA_KEY = '@block_merge_arena:friend_data';
const FRIEND_ACTIVITIES_KEY = '@block_merge_arena:friend_activities';
const FRIEND_CODES_KEY = '@block_merge_arena:friend_codes';

/**
 * Generate unique friend code (8 characters)
 */
function generateFriendCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous chars
  let code = '';
  for (let i = 0; i < FRIEND_CODE_LENGTH; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get player friend data
 */
export async function getPlayerFriendData(userId: string): Promise<PlayerFriendData> {
  try {
    const key = `${FRIEND_DATA_KEY}_${userId}`;
    const data = await AsyncStorage.getItem(key);

    if (data) {
      const friendData: PlayerFriendData = JSON.parse(data);
      
      // Filter expired requests and challenges
      const now = Date.now();
      friendData.incomingRequests = friendData.incomingRequests.filter(
        (req) => req.status === 'pending' && 
                 req.createdAt + REQUEST_EXPIRY_DAYS * 24 * 60 * 60 * 1000 > now
      );
      friendData.challenges = friendData.challenges.filter(
        (ch) => ch.status === 'pending' && ch.expiresAt > now
      );
      
      return friendData;
    }

    // Create new friend data with unique code
    const newData: PlayerFriendData = {
      ...DEFAULT_PLAYER_FRIEND_DATA,
      friendCode: generateFriendCode(),
    };
    await savePlayerFriendData(userId, newData);
    
    // Register the friend code
    await registerFriendCode(newData.friendCode, userId);
    
    return newData;
  } catch (error) {
    console.error('Error loading friend data:', error);
    const newData: PlayerFriendData = {
      ...DEFAULT_PLAYER_FRIEND_DATA,
      friendCode: generateFriendCode(),
    };
    return newData;
  }
}

/**
 * Save player friend data
 */
async function savePlayerFriendData(userId: string, data: PlayerFriendData): Promise<void> {
  try {
    const key = `${FRIEND_DATA_KEY}_${userId}`;
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving friend data:', error);
  }
}

/**
 * Register a friend code to user ID mapping
 */
async function registerFriendCode(code: string, userId: string): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(FRIEND_CODES_KEY);
    const codes: Record<string, string> = data ? JSON.parse(data) : {};
    codes[code] = userId;
    await AsyncStorage.setItem(FRIEND_CODES_KEY, JSON.stringify(codes));
  } catch (error) {
    console.error('Error registering friend code:', error);
  }
}

/**
 * Look up user ID by friend code
 */
export async function lookupFriendCode(code: string): Promise<string | null> {
  try {
    const data = await AsyncStorage.getItem(FRIEND_CODES_KEY);
    const codes: Record<string, string> = data ? JSON.parse(data) : {};
    return codes[code.toUpperCase()] || null;
  } catch (error) {
    console.error('Error looking up friend code:', error);
    return null;
  }
}

/**
 * Send friend request
 */
export async function sendFriendRequest(
  fromUserId: string,
  fromDisplayName: string,
  toUserId: string,
  toDisplayName: string,
  message?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get both users' friend data
    const fromData = await getPlayerFriendData(fromUserId);
    const toData = await getPlayerFriendData(toUserId);

    // Check if already friends
    if (fromData.friends.some((f) => f.friendUserId === toUserId)) {
      return { success: false, error: 'Already friends with this player' };
    }

    // Check if already sent request
    if (fromData.outgoingRequests.some((r) => r.toUserId === toUserId && r.status === 'pending')) {
      return { success: false, error: 'Friend request already sent' };
    }

    // Check if blocked
    if (toData.blockedUsers.includes(fromUserId)) {
      return { success: false, error: 'Cannot send request to this player' };
    }

    // Check max requests
    if (toData.incomingRequests.length >= MAX_PENDING_REQUESTS) {
      return { success: false, error: 'Player has too many pending requests' };
    }

    // Create request
    const request: FriendRequest = {
      id: `req_${generateId()}`,
      fromUserId,
      fromDisplayName,
      toUserId,
      toDisplayName,
      createdAt: Date.now(),
      status: 'pending',
      message,
    };

    // Add to sender's outgoing
    fromData.outgoingRequests.push(request);
    await savePlayerFriendData(fromUserId, fromData);

    // Add to receiver's incoming
    toData.incomingRequests.push(request);
    await savePlayerFriendData(toUserId, toData);

    return { success: true };
  } catch (error) {
    console.error('Error sending friend request:', error);
    return { success: false, error: 'Failed to send request' };
  }
}

/**
 * Send friend request by friend code
 */
export async function sendFriendRequestByCode(
  fromUserId: string,
  fromDisplayName: string,
  friendCode: string,
  message?: string
): Promise<{ success: boolean; error?: string; friendName?: string }> {
  // Look up friend code
  const toUserId = await lookupFriendCode(friendCode);
  if (!toUserId) {
    return { success: false, error: 'Invalid friend code' };
  }

  if (toUserId === fromUserId) {
    return { success: false, error: 'Cannot add yourself as a friend' };
  }

  // Get target user's display name
  const toData = await getPlayerFriendData(toUserId);
  
  // We don't have their display name stored, use a placeholder
  const toDisplayName = `Player${toUserId.substring(0, 6)}`;

  const result = await sendFriendRequest(fromUserId, fromDisplayName, toUserId, toDisplayName, message);
  
  if (result.success) {
    return { ...result, friendName: toDisplayName };
  }
  return result;
}

/**
 * Accept friend request
 */
export async function acceptFriendRequest(
  userId: string,
  requestId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const userData = await getPlayerFriendData(userId);
    
    // Find request
    const request = userData.incomingRequests.find((r) => r.id === requestId);
    if (!request) {
      return { success: false, error: 'Request not found' };
    }

    // Check max friends
    if (userData.friends.length >= MAX_FRIENDS) {
      return { success: false, error: 'You have reached the maximum number of friends' };
    }

    // Get sender's data
    const senderData = await getPlayerFriendData(request.fromUserId);
    if (senderData.friends.length >= MAX_FRIENDS) {
      return { success: false, error: 'This player has reached their friend limit' };
    }

    // Get player ranks and scores
    const [myRankData, senderRankData, myScores, senderScores] = await Promise.all([
      getPlayerRankData(),
      getPlayerRankData(), // In production, would get sender's rank
      getTopScores(1),
      getTopScores(1),
    ]);

    const myRank = getRankInfo(myRankData.currentRank);
    const senderRank = getRankInfo(senderRankData.currentRank);

    // Create friend entries
    const newFriendForMe: Friend = {
      id: `friend_${generateId()}`,
      friendUserId: request.fromUserId,
      displayName: request.fromDisplayName,
      addedAt: Date.now(),
      lastActive: Date.now(),
      isOnline: false,
      rank: senderRank.displayName,
      highScore: senderScores[0]?.score || 0,
      favorited: false,
    };

    const newFriendForSender: Friend = {
      id: `friend_${generateId()}`,
      friendUserId: userId,
      displayName: request.toDisplayName,
      addedAt: Date.now(),
      lastActive: Date.now(),
      isOnline: false,
      rank: myRank.displayName,
      highScore: myScores[0]?.score || 0,
      favorited: false,
    };

    // Update my data
    userData.friends.push(newFriendForMe);
    userData.incomingRequests = userData.incomingRequests.filter((r) => r.id !== requestId);
    await savePlayerFriendData(userId, userData);

    // Update sender's data
    senderData.friends.push(newFriendForSender);
    senderData.outgoingRequests = senderData.outgoingRequests.filter(
      (r) => r.toUserId !== userId
    );
    await savePlayerFriendData(request.fromUserId, senderData);

    return { success: true };
  } catch (error) {
    console.error('Error accepting friend request:', error);
    return { success: false, error: 'Failed to accept request' };
  }
}

/**
 * Decline friend request
 */
export async function declineFriendRequest(
  userId: string,
  requestId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const userData = await getPlayerFriendData(userId);
    
    // Find request
    const request = userData.incomingRequests.find((r) => r.id === requestId);
    if (!request) {
      return { success: false, error: 'Request not found' };
    }

    // Remove from incoming
    userData.incomingRequests = userData.incomingRequests.filter((r) => r.id !== requestId);
    await savePlayerFriendData(userId, userData);

    // Update sender's outgoing request status
    const senderData = await getPlayerFriendData(request.fromUserId);
    senderData.outgoingRequests = senderData.outgoingRequests.map((r) =>
      r.id === requestId ? { ...r, status: 'declined' as const } : r
    );
    await savePlayerFriendData(request.fromUserId, senderData);

    return { success: true };
  } catch (error) {
    console.error('Error declining friend request:', error);
    return { success: false, error: 'Failed to decline request' };
  }
}

/**
 * Remove friend
 */
export async function removeFriend(
  userId: string,
  friendUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const userData = await getPlayerFriendData(userId);
    
    // Remove from my friends list
    userData.friends = userData.friends.filter((f) => f.friendUserId !== friendUserId);
    await savePlayerFriendData(userId, userData);

    // Remove from their friends list
    const friendData = await getPlayerFriendData(friendUserId);
    friendData.friends = friendData.friends.filter((f) => f.friendUserId !== userId);
    await savePlayerFriendData(friendUserId, friendData);

    return { success: true };
  } catch (error) {
    console.error('Error removing friend:', error);
    return { success: false, error: 'Failed to remove friend' };
  }
}

/**
 * Block user
 */
export async function blockUser(
  userId: string,
  blockedUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const userData = await getPlayerFriendData(userId);
    
    // Add to blocked list
    if (!userData.blockedUsers.includes(blockedUserId)) {
      userData.blockedUsers.push(blockedUserId);
    }

    // Remove from friends if present
    userData.friends = userData.friends.filter((f) => f.friendUserId !== blockedUserId);
    
    // Remove any pending requests
    userData.incomingRequests = userData.incomingRequests.filter(
      (r) => r.fromUserId !== blockedUserId
    );
    userData.outgoingRequests = userData.outgoingRequests.filter(
      (r) => r.toUserId !== blockedUserId
    );

    await savePlayerFriendData(userId, userData);

    return { success: true };
  } catch (error) {
    console.error('Error blocking user:', error);
    return { success: false, error: 'Failed to block user' };
  }
}

/**
 * Unblock user
 */
export async function unblockUser(
  userId: string,
  blockedUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const userData = await getPlayerFriendData(userId);
    userData.blockedUsers = userData.blockedUsers.filter((id) => id !== blockedUserId);
    await savePlayerFriendData(userId, userData);
    return { success: true };
  } catch (error) {
    console.error('Error unblocking user:', error);
    return { success: false, error: 'Failed to unblock user' };
  }
}

/**
 * Toggle favorite friend
 */
export async function toggleFavoriteFriend(
  userId: string,
  friendUserId: string
): Promise<{ success: boolean; favorited?: boolean; error?: string }> {
  try {
    const userData = await getPlayerFriendData(userId);
    
    const friend = userData.friends.find((f) => f.friendUserId === friendUserId);
    if (!friend) {
      return { success: false, error: 'Friend not found' };
    }

    friend.favorited = !friend.favorited;
    await savePlayerFriendData(userId, userData);

    return { success: true, favorited: friend.favorited };
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return { success: false, error: 'Failed to update favorite' };
  }
}

/**
 * Send challenge to friend
 */
export async function sendChallenge(
  challengerId: string,
  challengerName: string,
  challengerScore: number,
  friendUserId: string,
  mode: 'endless' | 'tournament',
  replayCode?: string
): Promise<{ success: boolean; error?: string; challengeId?: string }> {
  try {
    const challengerData = await getPlayerFriendData(challengerId);
    const friendData = await getPlayerFriendData(friendUserId);

    // Check if they're friends
    if (!challengerData.friends.some((f) => f.friendUserId === friendUserId)) {
      return { success: false, error: 'You can only challenge friends' };
    }

    // Check for existing pending challenge
    const existingChallenge = friendData.challenges.find(
      (c) => c.challengerId === challengerId && c.status === 'pending'
    );
    if (existingChallenge) {
      return { success: false, error: 'You already have a pending challenge with this friend' };
    }

    const challenge: FriendChallenge = {
      id: `challenge_${generateId()}`,
      challengerId,
      challengerName,
      challengerScore,
      challengedUserId: friendUserId,
      replayCode,
      mode,
      createdAt: Date.now(),
      expiresAt: Date.now() + CHALLENGE_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
      status: 'pending',
    };

    // Add to friend's challenges
    friendData.challenges.push(challenge);
    await savePlayerFriendData(friendUserId, friendData);

    // Add activity
    await addFriendActivity({
      id: generateId(),
      userId: challengerId,
      displayName: challengerName,
      type: 'challenge_sent',
      message: `${challengerName} challenged you to beat ${challengerScore.toLocaleString()} points!`,
      timestamp: Date.now(),
      metadata: {
        score: challengerScore,
        challengeId: challenge.id,
        replayCode,
      },
    }, friendUserId);

    return { success: true, challengeId: challenge.id };
  } catch (error) {
    console.error('Error sending challenge:', error);
    return { success: false, error: 'Failed to send challenge' };
  }
}

/**
 * Complete a challenge
 */
export async function completeChallenge(
  userId: string,
  challengeId: string,
  score: number
): Promise<{ success: boolean; won?: boolean; error?: string }> {
  try {
    const userData = await getPlayerFriendData(userId);
    
    const challenge = userData.challenges.find((c) => c.id === challengeId);
    if (!challenge) {
      return { success: false, error: 'Challenge not found' };
    }

    if (challenge.status !== 'pending') {
      return { success: false, error: 'Challenge is no longer active' };
    }

    const won = score > challenge.challengerScore;
    
    // Update challenge
    challenge.status = 'completed';
    challenge.challengedScore = score;
    challenge.winnerId = won ? userId : challenge.challengerId;
    
    await savePlayerFriendData(userId, userData);

    // Add activity for challenger
    const challengerData = await getPlayerFriendData(challenge.challengerId);
    await addFriendActivity({
      id: generateId(),
      userId,
      displayName: 'You',
      type: 'challenge_won',
      message: won 
        ? `Your friend beat your challenge with ${score.toLocaleString()} points!`
        : `Your friend scored ${score.toLocaleString()} but couldn't beat your ${challenge.challengerScore.toLocaleString()}!`,
      timestamp: Date.now(),
      metadata: {
        score,
        challengeId,
      },
    }, challenge.challengerId);

    return { success: true, won };
  } catch (error) {
    console.error('Error completing challenge:', error);
    return { success: false, error: 'Failed to complete challenge' };
  }
}

/**
 * Share replay with friend
 */
export async function shareReplayWithFriend(
  fromUserId: string,
  fromDisplayName: string,
  toUserId: string,
  replayCode: string,
  message?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const fromData = await getPlayerFriendData(fromUserId);
    
    // Check if friends
    if (!fromData.friends.some((f) => f.friendUserId === toUserId)) {
      return { success: false, error: 'You can only share replays with friends' };
    }

    const toData = await getPlayerFriendData(toUserId);

    const sharedReplay: SharedReplay = {
      id: `replay_${generateId()}`,
      fromUserId,
      fromDisplayName,
      toUserId,
      replayCode,
      message,
      createdAt: Date.now(),
      viewed: false,
    };

    toData.sharedReplays.push(sharedReplay);
    await savePlayerFriendData(toUserId, toData);

    return { success: true };
  } catch (error) {
    console.error('Error sharing replay:', error);
    return { success: false, error: 'Failed to share replay' };
  }
}

/**
 * Mark shared replay as viewed
 */
export async function markReplayViewed(
  userId: string,
  replayId: string
): Promise<void> {
  try {
    const userData = await getPlayerFriendData(userId);
    const replay = userData.sharedReplays.find((r) => r.id === replayId);
    if (replay) {
      replay.viewed = true;
      await savePlayerFriendData(userId, userData);
    }
  } catch (error) {
    console.error('Error marking replay viewed:', error);
  }
}

/**
 * Add friend activity
 */
async function addFriendActivity(activity: FriendActivity, forUserId: string): Promise<void> {
  try {
    const key = `${FRIEND_ACTIVITIES_KEY}_${forUserId}`;
    const data = await AsyncStorage.getItem(key);
    const activities: FriendActivity[] = data ? JSON.parse(data) : [];
    
    activities.unshift(activity);
    
    // Keep only last 50 activities
    const trimmed = activities.slice(0, 50);
    
    await AsyncStorage.setItem(key, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Error adding friend activity:', error);
  }
}

/**
 * Get friend activities
 */
export async function getFriendActivities(userId: string): Promise<FriendActivity[]> {
  try {
    const key = `${FRIEND_ACTIVITIES_KEY}_${userId}`;
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading friend activities:', error);
    return [];
  }
}

/**
 * Get friend leaderboard (sorted by high score)
 */
export async function getFriendLeaderboard(
  userId: string
): Promise<Array<Friend & { position: number }>> {
  try {
    const userData = await getPlayerFriendData(userId);
    
    // Sort friends by high score
    const sorted = [...userData.friends].sort((a, b) => b.highScore - a.highScore);
    
    return sorted.map((friend, index) => ({
      ...friend,
      position: index + 1,
    }));
  } catch (error) {
    console.error('Error getting friend leaderboard:', error);
    return [];
  }
}

/**
 * Update friend's last active status
 */
export async function updateFriendActivity(userId: string): Promise<void> {
  try {
    // In a real app, this would update Firebase and notify friends
    // For now, just update local timestamp
    const userData = await getPlayerFriendData(userId);
    
    // Mark ourselves as active for all friends
    for (const friend of userData.friends) {
      const friendData = await getPlayerFriendData(friend.friendUserId);
      const me = friendData.friends.find((f) => f.friendUserId === userId);
      if (me) {
        me.lastActive = Date.now();
        me.isOnline = true;
        await savePlayerFriendData(friend.friendUserId, friendData);
      }
    }
  } catch (error) {
    console.error('Error updating friend activity:', error);
  }
}

/**
 * Get pending request count
 */
export async function getPendingRequestCount(userId: string): Promise<number> {
  const userData = await getPlayerFriendData(userId);
  return userData.incomingRequests.filter((r) => r.status === 'pending').length;
}

/**
 * Get pending challenge count
 */
export async function getPendingChallengeCount(userId: string): Promise<number> {
  const userData = await getPlayerFriendData(userId);
  return userData.challenges.filter((c) => c.status === 'pending').length;
}

/**
 * Get unread replay count
 */
export async function getUnreadReplayCount(userId: string): Promise<number> {
  const userData = await getPlayerFriendData(userId);
  return userData.sharedReplays.filter((r) => !r.viewed).length;
}
