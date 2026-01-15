// Friends Screen - Add friends, view friend list, send challenges
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Alert, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  getPlayerFriendData,
  sendFriendRequestByCode,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  toggleFavoriteFriend,
  getFriendLeaderboard,
  getFriendActivities,
  sendChallenge,
  shareReplayWithFriend,
  blockUser,
  getPendingRequestCount,
  getPendingChallengeCount,
} from '@/lib/utils/friends';
import { getOrCreateUser } from '@/lib/firebase';
import { getSettings } from '@/lib/utils/settings';
import { getTopScores } from '@/lib/utils/leaderboard';
import type {
  PlayerFriendData,
  Friend,
  FriendRequest,
  FriendChallenge,
  SharedReplay,
  FriendActivity,
} from '@/lib/types/friends';

type TabType = 'friends' | 'requests' | 'challenges' | 'activity';

export default function FriendsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [loading, setLoading] = useState<boolean>(true);
  const [friendData, setFriendData] = useState<PlayerFriendData | null>(null);
  const [friendLeaderboard, setFriendLeaderboard] = useState<Array<Friend & { position: number }>>([]);
  const [activities, setActivities] = useState<FriendActivity[]>([]);
  const [userId, setUserId] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [myHighScore, setMyHighScore] = useState<number>(0);

  // Add friend form
  const [showAddFriend, setShowAddFriend] = useState<boolean>(false);
  const [friendCodeInput, setFriendCodeInput] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  // Challenge modal
  const [showChallengeModal, setShowChallengeModal] = useState<boolean>(false);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);

  // Counts
  const [requestCount, setRequestCount] = useState<number>(0);
  const [challengeCount, setChallengeCount] = useState<number>(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (): Promise<void> => {
    setLoading(true);
    try {
      const uid = await getOrCreateUser();
      setUserId(uid);

      const settings = await getSettings();
      setDisplayName(settings.displayName || `Player${uid.substring(0, 6)}`);

      const [data, leaderboard, acts, scores, reqCount, chalCount] = await Promise.all([
        getPlayerFriendData(uid),
        getFriendLeaderboard(uid),
        getFriendActivities(uid),
        getTopScores(1),
        getPendingRequestCount(uid),
        getPendingChallengeCount(uid),
      ]);

      setFriendData(data);
      setFriendLeaderboard(leaderboard);
      setActivities(acts);
      setMyHighScore(scores[0]?.score || 0);
      setRequestCount(reqCount);
      setChallengeCount(chalCount);
    } catch (error) {
      console.error('Error loading friend data:', error);
    }
    setLoading(false);
  };

  const handleAddFriend = async (): Promise<void> => {
    if (!friendCodeInput.trim()) {
      Alert.alert('Invalid Code', 'Please enter a friend code', [{ text: 'OK' }]);
      return;
    }

    const result = await sendFriendRequestByCode(
      userId,
      displayName,
      friendCodeInput.trim().toUpperCase(),
      message.trim() || undefined
    );

    if (result.success) {
      Alert.alert('Request Sent! 🎉', `Friend request sent to ${result.friendName}!`, [{ text: 'OK' }]);
      setFriendCodeInput('');
      setMessage('');
      setShowAddFriend(false);
      loadData();
    } else {
      Alert.alert('Error', result.error || 'Failed to send request', [{ text: 'OK' }]);
    }
  };

  const handleAcceptRequest = async (requestId: string): Promise<void> => {
    const result = await acceptFriendRequest(userId, requestId);
    if (result.success) {
      Alert.alert('Friend Added! 🎉', 'You are now friends!', [{ text: 'OK' }]);
      loadData();
    } else {
      Alert.alert('Error', result.error || 'Failed to accept request', [{ text: 'OK' }]);
    }
  };

  const handleDeclineRequest = async (requestId: string): Promise<void> => {
    const result = await declineFriendRequest(userId, requestId);
    if (result.success) {
      loadData();
    }
  };

  const handleRemoveFriend = async (friend: Friend): Promise<void> => {
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${friend.displayName} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const result = await removeFriend(userId, friend.friendUserId);
            if (result.success) {
              loadData();
            }
          },
        },
      ]
    );
  };

  const handleToggleFavorite = async (friendUserId: string): Promise<void> => {
    await toggleFavoriteFriend(userId, friendUserId);
    loadData();
  };

  const handleSendChallenge = async (): Promise<void> => {
    if (!selectedFriend) return;

    const result = await sendChallenge(
      userId,
      displayName,
      myHighScore,
      selectedFriend.friendUserId,
      'endless'
    );

    if (result.success) {
      Alert.alert('Challenge Sent! ⚔️', `Challenged ${selectedFriend.displayName} to beat ${myHighScore.toLocaleString()} points!`, [{ text: 'OK' }]);
      setShowChallengeModal(false);
      setSelectedFriend(null);
    } else {
      Alert.alert('Error', result.error || 'Failed to send challenge', [{ text: 'OK' }]);
    }
  };

  const handleShareFriendCode = async (): Promise<void> => {
    if (!friendData) return;

    try {
      await Share.share({
        message: `Add me as a friend in Block Merge Arena! 🎮\n\nMy friend code: ${friendData.friendCode}\n\nDownload the game and enter my code to play together!`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const tabs: { id: TabType; label: string; badge?: number }[] = [
    { id: 'friends', label: '👥 Friends' },
    { id: 'requests', label: '📬 Requests', badge: requestCount },
    { id: 'challenges', label: '⚔️ Challenges', badge: challengeCount },
    { id: 'activity', label: '📊 Activity' },
  ];

  const renderHeader = () => (
    <View className="mb-6">
      <View className="flex-row items-center justify-between mb-4">
        <Pressable onPress={() => router.back()} className="p-2">
          <Text className="text-2xl">←</Text>
        </Pressable>
        <Text className="text-2xl font-bold text-white">Friends</Text>
        <Pressable onPress={() => setShowAddFriend(true)} className="p-2">
          <Text className="text-2xl">➕</Text>
        </Pressable>
      </View>

      {/* Friend Code */}
      {friendData && (
        <View className="bg-purple-900/50 rounded-xl p-4 mb-4">
          <Text className="text-gray-400 text-sm mb-1">Your Friend Code</Text>
          <View className="flex-row items-center justify-between">
            <Text className="text-white text-2xl font-bold tracking-widest">
              {friendData.friendCode}
            </Text>
            <Pressable
              onPress={handleShareFriendCode}
              className="bg-purple-600 px-4 py-2 rounded-lg"
            >
              <Text className="text-white font-semibold">Share 📤</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2">
          {tabs.map((tab) => (
            <Pressable
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-full flex-row items-center ${
                activeTab === tab.id ? 'bg-purple-600' : 'bg-gray-800'
              }`}
            >
              <Text className={activeTab === tab.id ? 'text-white font-semibold' : 'text-gray-400'}>
                {tab.label}
              </Text>
              {tab.badge && tab.badge > 0 ? (
                <View className="bg-red-500 rounded-full px-2 py-0.5 ml-2">
                  <Text className="text-white text-xs font-bold">{tab.badge}</Text>
                </View>
              ) : null}
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderFriendsList = () => {
    if (!friendData || friendData.friends.length === 0) {
      return (
        <View className="items-center justify-center py-12">
          <Text className="text-6xl mb-4">👥</Text>
          <Text className="text-white text-xl font-bold mb-2">No Friends Yet</Text>
          <Text className="text-gray-400 text-center mb-6">
            Add friends using their friend code{'\n'}to compete and share replays!
          </Text>
          <Pressable
            onPress={() => setShowAddFriend(true)}
            className="bg-purple-600 px-6 py-3 rounded-xl"
          >
            <Text className="text-white font-bold">Add Friend</Text>
          </Pressable>
        </View>
      );
    }

    // Sort: favorites first, then by high score
    const sortedFriends = [...friendData.friends].sort((a, b) => {
      if (a.favorited && !b.favorited) return -1;
      if (!a.favorited && b.favorited) return 1;
      return b.highScore - a.highScore;
    });

    return (
      <View className="gap-3">
        <Text className="text-gray-400 mb-2">
          {friendData.friends.length} Friend{friendData.friends.length !== 1 ? 's' : ''}
        </Text>
        
        {sortedFriends.map((friend) => (
          <View
            key={friend.id}
            className="bg-gray-800 rounded-xl p-4"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="w-12 h-12 bg-purple-600 rounded-full items-center justify-center mr-3">
                  <Text className="text-white text-lg font-bold">
                    {friend.displayName.charAt(0).toUpperCase()}
                  </Text>
                  {friend.isOnline && (
                    <View className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800" />
                  )}
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center">
                    {friend.favorited && <Text className="mr-1">⭐</Text>}
                    <Text className="text-white font-semibold">{friend.displayName}</Text>
                  </View>
                  <Text className="text-gray-400 text-sm">
                    {friend.rank || 'Unranked'} • {friend.highScore.toLocaleString()} pts
                  </Text>
                  <Text className="text-gray-500 text-xs">
                    {friend.isOnline ? '🟢 Online' : `Last seen ${formatTimeAgo(friend.lastActive)}`}
                  </Text>
                </View>
              </View>
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => handleToggleFavorite(friend.friendUserId)}
                  className="p-2"
                >
                  <Text className="text-xl">{friend.favorited ? '⭐' : '☆'}</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setSelectedFriend(friend);
                    setShowChallengeModal(true);
                  }}
                  className="bg-orange-600 px-3 py-2 rounded-lg"
                >
                  <Text className="text-white font-semibold">⚔️</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleRemoveFriend(friend)}
                  className="p-2"
                >
                  <Text className="text-xl">🗑️</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderRequests = () => {
    const incoming = friendData?.incomingRequests.filter((r) => r.status === 'pending') || [];
    const outgoing = friendData?.outgoingRequests.filter((r) => r.status === 'pending') || [];

    if (incoming.length === 0 && outgoing.length === 0) {
      return (
        <View className="items-center justify-center py-12">
          <Text className="text-6xl mb-4">📬</Text>
          <Text className="text-white text-xl font-bold mb-2">No Pending Requests</Text>
          <Text className="text-gray-400 text-center">
            Friend requests you send or receive{'\n'}will appear here
          </Text>
        </View>
      );
    }

    return (
      <View className="gap-4">
        {incoming.length > 0 && (
          <View>
            <Text className="text-white font-bold mb-3">Incoming Requests ({incoming.length})</Text>
            {incoming.map((request) => (
              <View key={request.id} className="bg-gray-800 rounded-xl p-4 mb-2">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-white font-semibold">{request.fromDisplayName}</Text>
                    {request.message && (
                      <Text className="text-gray-400 text-sm mt-1">"{request.message}"</Text>
                    )}
                    <Text className="text-gray-500 text-xs mt-1">
                      {formatTimeAgo(request.createdAt)}
                    </Text>
                  </View>
                  <View className="flex-row gap-2">
                    <Pressable
                      onPress={() => handleAcceptRequest(request.id)}
                      className="bg-green-600 px-4 py-2 rounded-lg"
                    >
                      <Text className="text-white font-semibold">Accept</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleDeclineRequest(request.id)}
                      className="bg-red-600/30 px-4 py-2 rounded-lg"
                    >
                      <Text className="text-red-400 font-semibold">Decline</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {outgoing.length > 0 && (
          <View>
            <Text className="text-white font-bold mb-3">Sent Requests ({outgoing.length})</Text>
            {outgoing.map((request) => (
              <View key={request.id} className="bg-gray-800 rounded-xl p-4 mb-2">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-white font-semibold">{request.toDisplayName}</Text>
                    <Text className="text-gray-500 text-xs">
                      Sent {formatTimeAgo(request.createdAt)}
                    </Text>
                  </View>
                  <View className="bg-yellow-600/30 px-3 py-1 rounded-full">
                    <Text className="text-yellow-400 text-sm">Pending</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderChallenges = () => {
    const challenges = friendData?.challenges || [];
    const pending = challenges.filter((c) => c.status === 'pending');
    const completed = challenges.filter((c) => c.status === 'completed').slice(0, 10);

    if (challenges.length === 0) {
      return (
        <View className="items-center justify-center py-12">
          <Text className="text-6xl mb-4">⚔️</Text>
          <Text className="text-white text-xl font-bold mb-2">No Challenges</Text>
          <Text className="text-gray-400 text-center">
            Challenge friends to beat your score!{'\n'}Tap ⚔️ on any friend to start
          </Text>
        </View>
      );
    }

    return (
      <View className="gap-4">
        {pending.length > 0 && (
          <View>
            <Text className="text-white font-bold mb-3">Active Challenges ({pending.length})</Text>
            {pending.map((challenge) => (
              <View key={challenge.id} className="bg-gray-800 rounded-xl p-4 mb-2">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-white font-semibold">{challenge.challengerName}</Text>
                  <View className="bg-orange-600/30 px-3 py-1 rounded-full">
                    <Text className="text-orange-400 text-sm">Challenge!</Text>
                  </View>
                </View>
                <Text className="text-gray-300 mb-3">
                  Beat their score of <Text className="text-yellow-400 font-bold">
                    {challenge.challengerScore.toLocaleString()}
                  </Text> points!
                </Text>
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => router.push('/game')}
                    className="flex-1 bg-green-600 py-2 rounded-lg items-center"
                  >
                    <Text className="text-white font-bold">Accept Challenge 🎮</Text>
                  </Pressable>
                  {challenge.replayCode && (
                    <Pressable
                      onPress={() => router.push(`/replays?code=${challenge.replayCode}`)}
                      className="bg-purple-600 px-4 py-2 rounded-lg"
                    >
                      <Text className="text-white">👁️</Text>
                    </Pressable>
                  )}
                </View>
                <Text className="text-gray-500 text-xs mt-2">
                  Expires in {Math.ceil((challenge.expiresAt - Date.now()) / (1000 * 60 * 60 * 24))} days
                </Text>
              </View>
            ))}
          </View>
        )}

        {completed.length > 0 && (
          <View>
            <Text className="text-white font-bold mb-3">Recent Results</Text>
            {completed.map((challenge) => (
              <View key={challenge.id} className="bg-gray-800 rounded-xl p-4 mb-2">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-white font-semibold">
                      vs {challenge.challengerName}
                    </Text>
                    <Text className="text-gray-400 text-sm">
                      You: {(challenge.challengedScore || 0).toLocaleString()} • 
                      Them: {challenge.challengerScore.toLocaleString()}
                    </Text>
                  </View>
                  <Text className="text-2xl">
                    {challenge.winnerId === userId ? '🏆' : '😢'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderActivity = () => {
    if (activities.length === 0) {
      return (
        <View className="items-center justify-center py-12">
          <Text className="text-6xl mb-4">📊</Text>
          <Text className="text-white text-xl font-bold mb-2">No Activity</Text>
          <Text className="text-gray-400 text-center">
            Friend activities like high scores,{'\n'}challenges, and rank ups appear here
          </Text>
        </View>
      );
    }

    return (
      <View className="gap-2">
        {activities.map((activity) => (
          <View key={activity.id} className="bg-gray-800 rounded-xl p-4">
            <View className="flex-row items-start">
              <Text className="text-2xl mr-3">
                {activity.type === 'high_score' && '🏆'}
                {activity.type === 'challenge_sent' && '⚔️'}
                {activity.type === 'challenge_won' && '🎉'}
                {activity.type === 'rank_up' && '📈'}
                {activity.type === 'achievement' && '🏅'}
                {activity.type === 'online' && '🟢'}
              </Text>
              <View className="flex-1">
                <Text className="text-white">{activity.message}</Text>
                <Text className="text-gray-500 text-xs mt-1">
                  {formatTimeAgo(activity.timestamp)}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderAddFriendModal = () => {
    if (!showAddFriend) return null;

    return (
      <View className="absolute inset-0 bg-black/80 items-center justify-center p-4">
        <View className="bg-gray-900 rounded-2xl p-6 w-full max-w-md">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-white text-xl font-bold">Add Friend</Text>
            <Pressable onPress={() => setShowAddFriend(false)} className="p-2">
              <Text className="text-2xl text-gray-400">✕</Text>
            </Pressable>
          </View>

          <Text className="text-gray-400 mb-2">Friend Code</Text>
          <TextInput
            value={friendCodeInput}
            onChangeText={(text) => setFriendCodeInput(text.toUpperCase())}
            placeholder="Enter 8-character code"
            placeholderTextColor="#666"
            className="bg-gray-800 text-white text-lg px-4 py-3 rounded-xl mb-4 text-center tracking-widest"
            autoCapitalize="characters"
            maxLength={8}
          />

          <Text className="text-gray-400 mb-2">Message (optional)</Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Say hello!"
            placeholderTextColor="#666"
            className="bg-gray-800 text-white px-4 py-3 rounded-xl mb-6"
            maxLength={50}
          />

          <Pressable
            onPress={handleAddFriend}
            className="bg-purple-600 py-4 rounded-xl items-center"
          >
            <Text className="text-white font-bold text-lg">Send Request</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  const renderChallengeModal = () => {
    if (!showChallengeModal || !selectedFriend) return null;

    return (
      <View className="absolute inset-0 bg-black/80 items-center justify-center p-4">
        <View className="bg-gray-900 rounded-2xl p-6 w-full max-w-md">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-white text-xl font-bold">Send Challenge</Text>
            <Pressable onPress={() => setShowChallengeModal(false)} className="p-2">
              <Text className="text-2xl text-gray-400">✕</Text>
            </Pressable>
          </View>

          <View className="items-center mb-6">
            <Text className="text-6xl mb-4">⚔️</Text>
            <Text className="text-white text-lg font-semibold mb-2">
              Challenge {selectedFriend.displayName}
            </Text>
            <Text className="text-gray-400 text-center">
              Challenge them to beat your high score:
            </Text>
            <Text className="text-yellow-400 text-3xl font-bold mt-2">
              {myHighScore.toLocaleString()} pts
            </Text>
          </View>

          <Pressable
            onPress={handleSendChallenge}
            className="bg-orange-600 py-4 rounded-xl items-center mb-3"
          >
            <Text className="text-white font-bold text-lg">Send Challenge ⚔️</Text>
          </Pressable>

          <Pressable
            onPress={() => setShowChallengeModal(false)}
            className="py-4 rounded-xl items-center"
          >
            <Text className="text-gray-400 font-semibold">Cancel</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-950">
      <ScrollView className="flex-1 px-4 pt-4">
        {renderHeader()}

        {loading ? (
          <View className="items-center justify-center py-12">
            <Text className="text-white text-lg">Loading...</Text>
          </View>
        ) : (
          <>
            {activeTab === 'friends' && renderFriendsList()}
            {activeTab === 'requests' && renderRequests()}
            {activeTab === 'challenges' && renderChallenges()}
            {activeTab === 'activity' && renderActivity()}
          </>
        )}

        <View className="h-8" />
      </ScrollView>

      {renderAddFriendModal()}
      {renderChallengeModal()}
    </SafeAreaView>
  );
}
