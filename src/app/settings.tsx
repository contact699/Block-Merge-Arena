// Settings Screen
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getSettings, saveSettings, resetSettings } from '@/lib/utils/settings';
import type { UserSettings } from '@/lib/types/settings';

export default function SettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [displayNameInput, setDisplayNameInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async (): Promise<void> => {
    setLoading(true);
    try {
      const loadedSettings = await getSettings();
      setSettings(loadedSettings);
      setDisplayNameInput(loadedSettings.displayName || '');
    } catch (error) {
      console.error('Error loading settings:', error);
    }
    setLoading(false);
  };

  const handleSave = async (): Promise<void> => {
    if (!settings) return;

    const updatedSettings = {
      ...settings,
      displayName: displayNameInput.trim(),
    };

    await saveSettings(updatedSettings);
    Alert.alert('Settings Saved', 'Your preferences have been updated', [{ text: 'OK' }]);
  };

  const handleReset = (): void => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to defaults?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            const defaults = await resetSettings();
            setSettings(defaults);
            setDisplayNameInput(defaults.displayName);
            Alert.alert('Settings Reset', 'All settings restored to defaults', [{ text: 'OK' }]);
          },
        },
      ]
    );
  };

  const toggleSetting = async (key: keyof UserSettings): Promise<void> => {
    if (!settings) return;

    const newValue = !settings[key];
    const updatedSettings = { ...settings, [key]: newValue };
    setSettings(updatedSettings);
    await saveSettings(updatedSettings);
  };

  const updateVolume = async (volume: number): Promise<void> => {
    if (!settings) return;

    const updatedSettings = { ...settings, volume };
    setSettings(updatedSettings);
    await saveSettings(updatedSettings);
  };

  if (loading || !settings) {
    return (
      <SafeAreaView className="flex-1 bg-black items-center justify-center">
        <Text className="text-gray-500">Loading settings...</Text>
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

          <Text className="text-4xl font-black text-white mt-4">⚙️ Settings</Text>
          <Text className="text-gray-400 text-sm mt-1">Customize your experience</Text>
        </View>

        {/* Display Name */}
        <View className="px-6 mt-6">
          <Text className="text-white text-xl font-bold mb-4">Profile</Text>

          <View className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
            <Text className="text-gray-400 text-sm mb-2">Display Name</Text>
            <TextInput
              value={displayNameInput}
              onChangeText={setDisplayNameInput}
              placeholder="Enter your name"
              placeholderTextColor="#6b7280"
              maxLength={20}
              className="bg-gray-800 text-white rounded-lg px-4 py-3 text-base"
            />
            <Text className="text-gray-600 text-xs mt-2">
              This name will appear on leaderboards
            </Text>
          </View>
        </View>

        {/* Audio Settings */}
        <View className="px-6 mt-6">
          <Text className="text-white text-xl font-bold mb-4">Audio</Text>

          <View className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
            {/* Sound Effects */}
            <View className="flex-row items-center justify-between py-3">
              <View className="flex-1">
                <Text className="text-white text-base font-semibold">Sound Effects</Text>
                <Text className="text-gray-500 text-xs">Play sound effects</Text>
              </View>
              <Switch
                value={settings.soundEnabled}
                onValueChange={() => toggleSetting('soundEnabled')}
                trackColor={{ false: '#374151', true: '#a855f7' }}
                thumbColor={settings.soundEnabled ? '#ffffff' : '#9ca3af'}
              />
            </View>

            <View className="border-t border-gray-800 my-2" />

            {/* Music */}
            <View className="flex-row items-center justify-between py-3">
              <View className="flex-1">
                <Text className="text-white text-base font-semibold">Music</Text>
                <Text className="text-gray-500 text-xs">Play background music</Text>
              </View>
              <Switch
                value={settings.musicEnabled}
                onValueChange={() => toggleSetting('musicEnabled')}
                trackColor={{ false: '#374151', true: '#a855f7' }}
                thumbColor={settings.musicEnabled ? '#ffffff' : '#9ca3af'}
              />
            </View>

            <View className="border-t border-gray-800 my-2" />

            {/* Volume */}
            <View className="py-3">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-white text-base font-semibold">Volume</Text>
                <Text className="text-purple-400 text-base font-bold">{settings.volume}%</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Pressable
                  onPress={() => updateVolume(Math.max(0, settings.volume - 10))}
                  className="bg-gray-800 rounded-lg px-4 py-2"
                >
                  <Text className="text-white font-bold">−</Text>
                </Pressable>
                <View className="flex-1 bg-gray-800 rounded-full h-2">
                  <View
                    className="bg-purple-500 h-2 rounded-full"
                    style={{ width: `${settings.volume}%` }}
                  />
                </View>
                <Pressable
                  onPress={() => updateVolume(Math.min(100, settings.volume + 10))}
                  className="bg-gray-800 rounded-lg px-4 py-2"
                >
                  <Text className="text-white font-bold">+</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        {/* Haptics */}
        <View className="px-6 mt-6">
          <Text className="text-white text-xl font-bold mb-4">Haptics</Text>

          <View className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
            <View className="flex-row items-center justify-between py-3">
              <View className="flex-1">
                <Text className="text-white text-base font-semibold">Vibration</Text>
                <Text className="text-gray-500 text-xs">Haptic feedback on actions</Text>
              </View>
              <Switch
                value={settings.hapticEnabled}
                onValueChange={() => toggleSetting('hapticEnabled')}
                trackColor={{ false: '#374151', true: '#a855f7' }}
                thumbColor={settings.hapticEnabled ? '#ffffff' : '#9ca3af'}
              />
            </View>
          </View>
        </View>

        {/* Gameplay */}
        <View className="px-6 mt-6">
          <Text className="text-white text-xl font-bold mb-4">Gameplay</Text>

          <View className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
            {/* Tutorial */}
            <View className="flex-row items-center justify-between py-3">
              <View className="flex-1">
                <Text className="text-white text-base font-semibold">Show Tutorial</Text>
                <Text className="text-gray-500 text-xs">Display tutorial for new players</Text>
              </View>
              <Switch
                value={settings.showTutorial}
                onValueChange={() => toggleSetting('showTutorial')}
                trackColor={{ false: '#374151', true: '#a855f7' }}
                thumbColor={settings.showTutorial ? '#ffffff' : '#9ca3af'}
              />
            </View>

            <View className="border-t border-gray-800 my-2" />

            {/* Confirm Power-ups */}
            <View className="flex-row items-center justify-between py-3">
              <View className="flex-1">
                <Text className="text-white text-base font-semibold">Confirm Power-ups</Text>
                <Text className="text-gray-500 text-xs">
                  Ask before using power-ups
                </Text>
              </View>
              <Switch
                value={settings.confirmPowerUps}
                onValueChange={() => toggleSetting('confirmPowerUps')}
                trackColor={{ false: '#374151', true: '#a855f7' }}
                thumbColor={settings.confirmPowerUps ? '#ffffff' : '#9ca3af'}
              />
            </View>
          </View>
        </View>

        {/* Accessibility */}
        <View className="px-6 mt-6">
          <Text className="text-white text-xl font-bold mb-4">Accessibility</Text>

          <View className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
            {/* Reduced Motion */}
            <View className="flex-row items-center justify-between py-3">
              <View className="flex-1">
                <Text className="text-white text-base font-semibold">Reduced Motion</Text>
                <Text className="text-gray-500 text-xs">Minimize animations</Text>
              </View>
              <Switch
                value={settings.reducedMotion}
                onValueChange={() => toggleSetting('reducedMotion')}
                trackColor={{ false: '#374151', true: '#a855f7' }}
                thumbColor={settings.reducedMotion ? '#ffffff' : '#9ca3af'}
              />
            </View>

            <View className="border-t border-gray-800 my-2" />

            {/* High Contrast */}
            <View className="flex-row items-center justify-between py-3">
              <View className="flex-1">
                <Text className="text-white text-base font-semibold">High Contrast</Text>
                <Text className="text-gray-500 text-xs">Increase visual contrast</Text>
              </View>
              <Switch
                value={settings.highContrast}
                onValueChange={() => toggleSetting('highContrast')}
                trackColor={{ false: '#374151', true: '#a855f7' }}
                thumbColor={settings.highContrast ? '#ffffff' : '#9ca3af'}
              />
            </View>
          </View>
        </View>

        {/* Privacy */}
        <View className="px-6 mt-6">
          <Text className="text-white text-xl font-bold mb-4">Privacy</Text>

          <View className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
            <View className="flex-row items-center justify-between py-3">
              <View className="flex-1">
                <Text className="text-white text-base font-semibold">Analytics</Text>
                <Text className="text-gray-500 text-xs">Help improve the game</Text>
              </View>
              <Switch
                value={settings.allowAnalytics}
                onValueChange={() => toggleSetting('allowAnalytics')}
                trackColor={{ false: '#374151', true: '#a855f7' }}
                thumbColor={settings.allowAnalytics ? '#ffffff' : '#9ca3af'}
              />
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="px-6 mt-6 gap-3">
          {/* Save Button */}
          <Pressable onPress={handleSave} className="bg-purple-500 rounded-xl py-4">
            <Text className="text-white text-center text-lg font-bold">Save Changes</Text>
          </Pressable>

          {/* Reset Button */}
          <Pressable
            onPress={handleReset}
            className="bg-gray-800 border border-gray-700 rounded-xl py-4"
          >
            <Text className="text-gray-300 text-center text-lg font-bold">Reset to Defaults</Text>
          </Pressable>
        </View>

        {/* App Info */}
        <View className="px-6 mt-6 mb-4">
          <View className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
            <Text className="text-gray-500 text-xs text-center">
              Block Merge Arena v1.0.0
            </Text>
            <Text className="text-gray-600 text-xs text-center mt-1">
              Made for Gen Z puzzle lovers 🎮
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
