// Squads Screen - Create, join, and manage squads
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  getPlayerSquadData,
  getSquadById,
  getAllSquads,
  createSquad,
  joinSquad,
  leaveSquad,
  acceptSquadInvite,
  declineSquadInvite,
  getSquadLeaderboard,
  searchSquads,
  getSquadActivities,
} from '@/lib/utils/squad';
import { getOrCreateUser } from '@/lib/firebase';
import { getSettings } from '@/lib/utils/settings';
import type { Squad, PlayerSquadData, SquadInvite, SquadActivity } from '@/lib/types/squad';

type TabType = 'my_squad' | 'discover' | 'leaderboard' | 'invites';

export default function SquadsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('my_squad');
  const [loading, setLoading] = useState<boolean>(true);
  const [playerData, setPlayerData] = useState<PlayerSquadData | null>(null);
  const [currentSquad, setCurrentSquad] = useState<Squad | null>(null);
  const [allSquads, setAllSquads] = useState<Squad[]>([]);
  const [squadActivities, setSquadActivities] = useState<SquadActivity[]>([]);
  const [userId, setUserId] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');

  // Create squad form
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [squadName, setSquadName] = useState<string>('');
  const [squadTag, setSquadTag] = useState<string>('');
  const [squadDescription, setSquadDescription] = useState<string>('');
  const [squadIcon, setSquadIcon] = useState<string>('🛡️');
  const [isPublic, setIsPublic] = useState<boolean>(true);

  // Search
  const [searchQuery, setSearchQuery] = useState<string>('');

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

      const [pd, squads] = await Promise.all([
        getPlayerSquadData(uid),
        getAllSquads(),
      ]);

      setPlayerData(pd);
      setAllSquads(squads);

      // Load current squad
      if (pd.currentSquadId) {
        const squad = await getSquadById(pd.currentSquadId);
        setCurrentSquad(squad);

        // Load activities
        if (squad) {
          const activities = await getSquadActivities(squad.id);
          setSquadActivities(activities);
        }
      }
    } catch (error) {
      console.error('Error loading squad data:', error);
    }
    setLoading(false);
  };

  const handleCreateSquad = async (): Promise<void> => {
    if (!squadName.trim() || !squadTag.trim()) {
      Alert.alert('Invalid Input', 'Please enter squad name and tag', [{ text: 'OK' }]);
      return;
    }

    if (squadTag.length < 2 || squadTag.length > 4) {
      Alert.alert('Invalid Tag', 'Squad tag must be 2-4 characters', [{ text: 'OK' }]);
      return;
    }

    const result = await createSquad(
      userId,
      displayName,
      squadName,
      squadTag,
      squadDescription,
      squadIcon,
      '#a855f7',
      isPublic
    );

    if (result.success) {
      Alert.alert('🛡️ Squad Created!', `Welcome to ${squadName}!`, [{ text: 'Awesome!' }]);
      setShowCreateForm(false);
      setSquadName('');
      setSquadTag('');
      setSquadDescription('');
      await loadData();
      setActiveTab('my_squad');
    } else {
      Alert.alert('Failed to Create Squad', result.error || 'Unknown error', [{ text: 'OK' }]);
    }
  };

  const handleJoinSquad = async (squadId: string): Promise<void> => {
    const result = await joinSquad(userId, displayName, squadId);

    if (result.success) {
      Alert.alert('🎉 Joined Squad!', 'Welcome to your new squad!', [{ text: 'OK' }]);
      await loadData();
      setActiveTab('my_squad');
    } else {
      Alert.alert('Failed to Join', result.error || 'Unknown error', [{ text: 'OK' }]);
    }
  };

  const handleLeaveSquad = (): void => {
    Alert.alert(
      'Leave Squad?',
      'Are you sure you want to leave this squad?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            const result = await leaveSquad(userId, displayName);
            if (result.success) {
              Alert.alert('Left Squad', 'You have left the squad', [{ text: 'OK' }]);
              await loadData();
            }
          },
        },
      ]
    );
  };

  const handleAcceptInvite = async (invite: SquadInvite): Promise<void> => {
    const result = await acceptSquadInvite(userId, displayName, invite.id);

    if (result.success) {
      Alert.alert('🎉 Invite Accepted!', `Welcome to ${invite.squadName}!`, [{ text: 'OK' }]);
      await loadData();
      setActiveTab('my_squad');
    } else {
      Alert.alert('Failed to Accept', result.error || 'Unknown error', [{ text: 'OK' }]);
    }
  };

  const handleDeclineInvite = async (invite: SquadInvite): Promise<void> => {
    await declineSquadInvite(userId, invite.id);
    await loadData();
  };

  const renderMySquad = () => {
    if (!currentSquad) {
      return (
        <View className="px-6 mt-6">
          <View className="bg-gray-900/80 border border-gray-700 rounded-xl p-6 items-center">
            <Text className="text-6xl mb-4">🛡️</Text>
            <Text className="text-white text-xl font-bold mb-2">No Squad</Text>
            <Text className="text-gray-400 text-sm text-center mb-6">
              Join a squad to compete with friends and climb the squad leaderboard!
            </Text>

            <Pressable
              onPress={() => setShowCreateForm(true)}
              className="bg-purple-500 rounded-xl py-3 px-6 mb-3 active:scale-95"
            >
              <Text className="text-white font-bold">Create Squad</Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('discover')}
              className="border border-gray-700 rounded-xl py-3 px-6 active:scale-95"
            >
              <Text className="text-gray-300 font-bold">Browse Squads</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    const userMember = currentSquad.members.find((m) => m.userId === userId);
    const isLeader = userMember?.role === 'leader';

    return (
      <View className="px-6 mt-6">
        {/* Squad Header */}
        <View
          className="bg-gradient-to-br from-purple-900/40 to-black border-2 border-purple-500 rounded-2xl p-6 mb-4"
        >
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-3">
              <Text className="text-5xl">{currentSquad.icon}</Text>
              <View>
                <View className="flex-row items-center gap-2">
                  <Text className="text-white text-2xl font-black">{currentSquad.name}</Text>
                  <View className="bg-purple-500 rounded px-2 py-1">
                    <Text className="text-white text-xs font-bold">{currentSquad.tag}</Text>
                  </View>
                </View>
                <Text className="text-gray-400 text-xs mt-1">
                  {currentSquad.members.length}/{currentSquad.maxMembers} Members
                </Text>
              </View>
            </View>

            {isLeader && (
              <View className="bg-yellow-500/20 border border-yellow-600 rounded-full px-2 py-1">
                <Text className="text-yellow-400 text-xs font-bold">Leader</Text>
              </View>
            )}
          </View>

          {currentSquad.description && (
            <Text className="text-gray-300 text-sm mb-3">{currentSquad.description}</Text>
          )}

          <View className="bg-black/40 rounded-lg p-3">
            <Text className="text-gray-400 text-xs text-center mb-1">Total Squad Score</Text>
            <Text className="text-purple-400 text-2xl font-black text-center">
              {currentSquad.totalScore.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Members List */}
        <View className="mb-4">
          <Text className="text-gray-400 text-xs font-bold uppercase mb-3">Members</Text>
          {currentSquad.members
            .sort((a, b) => b.totalScore - a.totalScore)
            .map((member, index) => (
              <View
                key={member.userId}
                className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 mb-2"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3 flex-1">
                    <View className="w-10 h-10 bg-purple-500/20 rounded-full items-center justify-center">
                      <Text className="text-purple-400 font-bold">#{index + 1}</Text>
                    </View>

                    <View className="flex-1">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-white font-bold">{member.displayName}</Text>
                        {member.role === 'leader' && (
                          <Text className="text-yellow-400 text-xs">👑</Text>
                        )}
                        {member.role === 'co-leader' && (
                          <Text className="text-blue-400 text-xs">⭐</Text>
                        )}
                      </View>
                      <Text className="text-gray-400 text-xs">{member.rank}</Text>
                    </View>

                    <View className="items-end">
                      <Text className="text-purple-400 font-bold">
                        {member.totalScore.toLocaleString()}
                      </Text>
                      <Text className="text-gray-500 text-xs">points</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
        </View>

        {/* Recent Activity */}
        {squadActivities.length > 0 && (
          <View className="mb-4">
            <Text className="text-gray-400 text-xs font-bold uppercase mb-3">
              Recent Activity
            </Text>
            <View className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
              {squadActivities.slice(0, 5).map((activity) => (
                <View key={activity.id} className="mb-3 last:mb-0">
                  <Text className="text-gray-300 text-sm">{activity.message}</Text>
                  <Text className="text-gray-500 text-xs mt-1">
                    {new Date(activity.timestamp).toLocaleDateString()}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Leave Squad Button */}
        <Pressable
          onPress={handleLeaveSquad}
          className="bg-red-500/20 border border-red-500 rounded-xl py-3 active:scale-95"
        >
          <Text className="text-red-400 text-center font-bold">Leave Squad</Text>
        </Pressable>
      </View>
    );
  };

  const renderDiscover = () => {
    const publicSquads = allSquads.filter((s) => s.isPublic);
    const displaySquads = searchQuery
      ? publicSquads.filter(
          (s) =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.tag.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : publicSquads;

    return (
      <View className="px-6 mt-6">
        {/* Search */}
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search squads..."
          placeholderTextColor="#666"
          className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white mb-4"
        />

        {/* Squads List */}
        {displaySquads.length === 0 ? (
          <View className="bg-gray-900/80 border border-gray-700 rounded-xl p-6 items-center">
            <Text className="text-gray-400 text-center">No squads found</Text>
          </View>
        ) : (
          displaySquads.map((squad) => (
            <View
              key={squad.id}
              className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 mb-3"
            >
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-3 flex-1">
                  <Text className="text-3xl">{squad.icon}</Text>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-white text-lg font-bold">{squad.name}</Text>
                      <View className="bg-purple-500 rounded px-2 py-1">
                        <Text className="text-white text-xs font-bold">{squad.tag}</Text>
                      </View>
                    </View>
                    <Text className="text-gray-400 text-xs">
                      {squad.members.length}/{squad.maxMembers} Members • {squad.totalScore.toLocaleString()} pts
                    </Text>
                  </View>
                </View>
              </View>

              {squad.description && (
                <Text className="text-gray-400 text-sm mb-3">{squad.description}</Text>
              )}

              {!playerData?.currentSquadId && (
                <Pressable
                  onPress={() => handleJoinSquad(squad.id)}
                  disabled={squad.members.length >= squad.maxMembers}
                  className={`rounded-xl py-2 ${
                    squad.members.length >= squad.maxMembers
                      ? 'bg-gray-800'
                      : 'bg-purple-500 active:scale-95'
                  }`}
                >
                  <Text
                    className={`text-center font-bold ${
                      squad.members.length >= squad.maxMembers ? 'text-gray-600' : 'text-white'
                    }`}
                  >
                    {squad.members.length >= squad.maxMembers ? 'Full' : 'Join Squad'}
                  </Text>
                </Pressable>
              )}
            </View>
          ))
        )}
      </View>
    );
  };

  const renderLeaderboard = () => {
    const sortedSquads = [...allSquads].sort((a, b) => b.totalScore - a.totalScore);

    return (
      <View className="px-6 mt-6">
        <Text className="text-gray-400 text-xs font-bold uppercase mb-3">
          Squad Rankings
        </Text>

        {sortedSquads.length === 0 ? (
          <View className="bg-gray-900/80 border border-gray-700 rounded-xl p-6 items-center">
            <Text className="text-gray-400 text-center">No squads yet</Text>
          </View>
        ) : (
          sortedSquads.map((squad, index) => (
            <View
              key={squad.id}
              className={`bg-gray-900/80 border rounded-xl p-4 mb-2 ${
                squad.id === currentSquad?.id ? 'border-purple-500' : 'border-gray-800'
              }`}
            >
              <View className="flex-row items-center gap-3">
                <View
                  className={`w-12 h-12 rounded-full items-center justify-center ${
                    index === 0
                      ? 'bg-yellow-500/20'
                      : index === 1
                      ? 'bg-gray-400/20'
                      : index === 2
                      ? 'bg-orange-500/20'
                      : 'bg-gray-800'
                  }`}
                >
                  <Text
                    className={`text-xl font-bold ${
                      index === 0
                        ? 'text-yellow-400'
                        : index === 1
                        ? 'text-gray-300'
                        : index === 2
                        ? 'text-orange-400'
                        : 'text-gray-500'
                    }`}
                  >
                    {index + 1}
                  </Text>
                </View>

                <Text className="text-2xl">{squad.icon}</Text>

                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-white font-bold">{squad.name}</Text>
                    <View className="bg-purple-500 rounded px-2 py-1">
                      <Text className="text-white text-xs font-bold">{squad.tag}</Text>
                    </View>
                  </View>
                  <Text className="text-gray-400 text-xs">
                    {squad.members.length} members
                  </Text>
                </View>

                <View className="items-end">
                  <Text className="text-purple-400 text-lg font-bold">
                    {squad.totalScore.toLocaleString()}
                  </Text>
                  <Text className="text-gray-500 text-xs">points</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    );
  };

  const renderInvites = () => {
    const pendingInvites = playerData?.pendingInvites.filter((i) => i.status === 'pending') || [];

    return (
      <View className="px-6 mt-6">
        {pendingInvites.length === 0 ? (
          <View className="bg-gray-900/80 border border-gray-700 rounded-xl p-6 items-center">
            <Text className="text-4xl mb-2">📧</Text>
            <Text className="text-gray-400 text-center">No pending invites</Text>
          </View>
        ) : (
          pendingInvites.map((invite) => (
            <View
              key={invite.id}
              className="bg-gray-900/80 border border-purple-500 rounded-xl p-4 mb-3"
            >
              <Text className="text-white text-lg font-bold mb-1">{invite.squadName}</Text>
              <Text className="text-gray-400 text-sm mb-3">
                Invited by {invite.invitedByName}
              </Text>

              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => handleAcceptInvite(invite)}
                  className="flex-1 bg-purple-500 rounded-xl py-2 active:scale-95"
                >
                  <Text className="text-white text-center font-bold">Accept</Text>
                </Pressable>

                <Pressable
                  onPress={() => handleDeclineInvite(invite)}
                  className="flex-1 bg-gray-800 rounded-xl py-2 active:scale-95"
                >
                  <Text className="text-gray-400 text-center font-bold">Decline</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-black items-center justify-center">
        <Text className="text-purple-400 text-lg">Loading squads...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Header */}
        <View className="px-6 pt-4 pb-6 border-b border-gray-800">
          <Pressable onPress={() => router.back()}>
            <Text className="text-purple-400 text-base font-semibold">← Back</Text>
          </Pressable>

          <Text className="text-4xl font-black text-white mt-4">🛡️ Squads</Text>
          <Text className="text-gray-400 text-sm mt-1">Team up and compete together</Text>
        </View>

        {/* Tabs */}
        <View className="px-6 mt-6">
          <View className="flex-row bg-gray-900 rounded-xl p-1">
            <Pressable
              onPress={() => setActiveTab('my_squad')}
              className={`flex-1 py-2 rounded-lg ${
                activeTab === 'my_squad' ? 'bg-purple-500' : ''
              }`}
            >
              <Text
                className={`text-center text-sm font-bold ${
                  activeTab === 'my_squad' ? 'text-white' : 'text-gray-400'
                }`}
              >
                My Squad
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('discover')}
              className={`flex-1 py-2 rounded-lg ${
                activeTab === 'discover' ? 'bg-purple-500' : ''
              }`}
            >
              <Text
                className={`text-center text-sm font-bold ${
                  activeTab === 'discover' ? 'text-white' : 'text-gray-400'
                }`}
              >
                Discover
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('leaderboard')}
              className={`flex-1 py-2 rounded-lg ${
                activeTab === 'leaderboard' ? 'bg-purple-500' : ''
              }`}
            >
              <Text
                className={`text-center text-sm font-bold ${
                  activeTab === 'leaderboard' ? 'text-white' : 'text-gray-400'
                }`}
              >
                Ranks
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('invites')}
              className={`flex-1 py-2 rounded-lg ${
                activeTab === 'invites' ? 'bg-purple-500' : ''
              }`}
            >
              <Text
                className={`text-center text-sm font-bold ${
                  activeTab === 'invites' ? 'text-white' : 'text-gray-400'
                }`}
              >
                Invites
                {playerData && playerData.pendingInvites.filter((i) => i.status === 'pending').length > 0 && (
                  <Text className="text-red-400"> •</Text>
                )}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Tab Content */}
        {activeTab === 'my_squad' && renderMySquad()}
        {activeTab === 'discover' && renderDiscover()}
        {activeTab === 'leaderboard' && renderLeaderboard()}
        {activeTab === 'invites' && renderInvites()}
      </ScrollView>

      {/* Create Squad Modal */}
      {showCreateForm && (
        <View className="absolute inset-0 bg-black/90 items-center justify-center p-6">
          <View className="bg-gray-900 border-2 border-purple-500 rounded-2xl p-6 w-full max-w-md">
            <Text className="text-white text-2xl font-bold mb-4">Create Squad</Text>

            <TextInput
              value={squadName}
              onChangeText={setSquadName}
              placeholder="Squad Name"
              placeholderTextColor="#666"
              className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white mb-3"
              maxLength={20}
            />

            <TextInput
              value={squadTag}
              onChangeText={(text) => setSquadTag(text.toUpperCase())}
              placeholder="Tag (2-4 chars)"
              placeholderTextColor="#666"
              className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white mb-3"
              maxLength={4}
            />

            <TextInput
              value={squadDescription}
              onChangeText={setSquadDescription}
              placeholder="Description (optional)"
              placeholderTextColor="#666"
              multiline
              numberOfLines={3}
              className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white mb-3"
              maxLength={100}
            />

            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-gray-400">Public Squad</Text>
              <Pressable
                onPress={() => setIsPublic(!isPublic)}
                className={`w-12 h-6 rounded-full ${isPublic ? 'bg-purple-500' : 'bg-gray-700'}`}
              >
                <View
                  className={`w-5 h-5 rounded-full bg-white absolute top-0.5 ${
                    isPublic ? 'right-0.5' : 'left-0.5'
                  }`}
                />
              </Pressable>
            </View>

            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setShowCreateForm(false)}
                className="flex-1 bg-gray-800 rounded-xl py-3"
              >
                <Text className="text-gray-400 text-center font-bold">Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleCreateSquad}
                className="flex-1 bg-purple-500 rounded-xl py-3"
              >
                <Text className="text-white text-center font-bold">Create</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
