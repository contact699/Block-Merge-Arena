// Settings Screen — tactile-console restyle
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Switch, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getSettings, saveSettings, resetSettings } from '@/lib/utils/settings';
import type { UserSettings } from '@/lib/types/settings';
import { colors, fontWeight } from '@/lib/design/tokens';
import { Pill } from '@/components/design/Pill';
import { GlassCard } from '@/components/design/GlassCard';

// ─── Inline helpers ───────────────────────────────────────────────────────────

function SettingsGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Text
        style={{
          fontSize: 10,
          fontWeight: fontWeight.bold,
          letterSpacing: 1.6,
          color: colors.inkSoft,
          marginLeft: 14,
          marginBottom: 8,
        }}
      >
        {label}
      </Text>
      <GlassCard style={{ padding: 0, overflow: 'hidden' }}>{children}</GlassCard>
    </View>
  );
}

function SettingsRow({
  label,
  right,
  onPress,
  destructive,
  isLast,
  testID,
}: {
  label: string;
  right?: React.ReactNode;
  onPress?: () => void;
  destructive?: boolean;
  isLast?: boolean;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: 'rgba(22,20,15,0.06)',
        opacity: pressed && onPress ? 0.6 : 1,
      })}
    >
      <Text
        style={{
          fontSize: 14,
          fontWeight: fontWeight.semibold,
          color: destructive ? colors.emberDeep : colors.ink,
        }}
      >
        {label}
      </Text>
      <View>{right}</View>
    </Pressable>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async (): Promise<void> => {
    setLoading(true);
    try {
      const loaded = await getSettings();
      setSettings(loaded);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
    setLoading(false);
  };

  const toggleSetting = async (key: keyof UserSettings): Promise<void> => {
    if (!settings) return;
    const newValue = !settings[key];
    const updated = { ...settings, [key]: newValue };
    setSettings(updated);
    await saveSettings(updated);
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
            Alert.alert('Settings Reset', 'All settings restored to defaults', [{ text: 'OK' }]);
          },
        },
      ]
    );
  };

  if (loading || !settings) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.inkDim }}>Loading settings…</Text>
      </SafeAreaView>
    );
  }

  const switchColors = {
    trackFalse: 'rgba(22,20,15,0.14)',
    trackTrue: colors.ember,
    thumbOn: '#ffffff',
    thumbOff: '#ffffff',
  };

  return (
    <SafeAreaView testID="settings-screen" style={{ flex: 1, backgroundColor: colors.paper }}>
      {/* Ambient blob */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -80,
          right: -60,
          width: 240,
          height: 240,
          borderRadius: 120,
          backgroundColor: colors.ember,
          opacity: 0.14,
        }}
      />

      {/* Header */}
      <View style={{ paddingHorizontal: 18, paddingTop: 12 }}>
        <Pressable testID="back-button" onPress={() => router.back()} style={{ marginBottom: 10 }}>
          <Text style={{ color: colors.ember, fontSize: 14, fontWeight: fontWeight.semibold }}>
            ← Back
          </Text>
        </Pressable>
        <Pill variant="ember">SETTINGS</Pill>
        <Text
          style={{
            fontSize: 32,
            fontWeight: fontWeight.black,
            color: colors.ink,
            marginTop: 12,
            letterSpacing: -1,
          }}
        >
          Preferences
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 14, paddingTop: 24, paddingBottom: 40 }}>

        {/* AUDIO */}
        <SettingsGroup label="AUDIO">
          <SettingsRow
            testID="sound-toggle-row"
            label="Sound effects"
            right={
              <Switch
                value={settings.soundEnabled}
                onValueChange={() => toggleSetting('soundEnabled')}
                trackColor={{ false: switchColors.trackFalse, true: switchColors.trackTrue }}
                thumbColor={settings.soundEnabled ? switchColors.thumbOn : switchColors.thumbOff}
              />
            }
          />
          <SettingsRow
            label="Music"
            right={
              <Switch
                value={settings.musicEnabled}
                onValueChange={() => toggleSetting('musicEnabled')}
                trackColor={{ false: switchColors.trackFalse, true: switchColors.trackTrue }}
                thumbColor={settings.musicEnabled ? switchColors.thumbOn : switchColors.thumbOff}
              />
            }
          />
          <SettingsRow
            testID="haptic-toggle-row"
            label="Haptics"
            right={
              <Switch
                value={settings.hapticEnabled}
                onValueChange={() => toggleSetting('hapticEnabled')}
                trackColor={{ false: switchColors.trackFalse, true: switchColors.trackTrue }}
                thumbColor={settings.hapticEnabled ? switchColors.thumbOn : switchColors.thumbOff}
              />
            }
            isLast
          />
        </SettingsGroup>

        {/* DISPLAY */}
        <SettingsGroup label="DISPLAY">
          <SettingsRow
            label="Show tutorial"
            right={
              <Switch
                value={settings.showTutorial}
                onValueChange={() => toggleSetting('showTutorial')}
                trackColor={{ false: switchColors.trackFalse, true: switchColors.trackTrue }}
                thumbColor={settings.showTutorial ? switchColors.thumbOn : switchColors.thumbOff}
              />
            }
          />
          <SettingsRow
            label="Confirm power-ups"
            right={
              <Switch
                value={settings.confirmPowerUps}
                onValueChange={() => toggleSetting('confirmPowerUps')}
                trackColor={{ false: switchColors.trackFalse, true: switchColors.trackTrue }}
                thumbColor={settings.confirmPowerUps ? switchColors.thumbOn : switchColors.thumbOff}
              />
            }
          />
          <SettingsRow
            label="High contrast"
            right={
              <Switch
                value={settings.highContrast}
                onValueChange={() => toggleSetting('highContrast')}
                trackColor={{ false: switchColors.trackFalse, true: switchColors.trackTrue }}
                thumbColor={settings.highContrast ? switchColors.thumbOn : switchColors.thumbOff}
              />
            }
          />
          <SettingsRow
            testID="reduced-motion-toggle-row"
            label="Reduced motion"
            right={
              <Switch
                value={settings.reducedMotion}
                onValueChange={() => toggleSetting('reducedMotion')}
                trackColor={{ false: switchColors.trackFalse, true: switchColors.trackTrue }}
                thumbColor={settings.reducedMotion ? switchColors.thumbOn : switchColors.thumbOff}
              />
            }
            isLast
          />
        </SettingsGroup>

        {/* ACCOUNT */}
        <SettingsGroup label="ACCOUNT">
          <SettingsRow
            testID="display-name-row"
            label="Display name"
            right={
              <Text style={{ fontSize: 14, color: colors.inkSoft }}>
                {settings.displayName || 'Set name'} ›
              </Text>
            }
            onPress={() =>
              Alert.prompt
                ? Alert.prompt(
                    'Display Name',
                    'Enter your display name',
                    async (name: string) => {
                      if (name !== null) {
                        const updated = { ...settings, displayName: name.trim() };
                        setSettings(updated);
                        await saveSettings(updated);
                      }
                    },
                    'plain-text',
                    settings.displayName
                  )
                : Alert.alert('Display Name', 'Edit your display name in-game.')
            }
          />
          <SettingsRow
            label="Analytics"
            right={
              <Switch
                value={settings.allowAnalytics}
                onValueChange={() => toggleSetting('allowAnalytics')}
                trackColor={{ false: switchColors.trackFalse, true: switchColors.trackTrue }}
                thumbColor={settings.allowAnalytics ? switchColors.thumbOn : switchColors.thumbOff}
              />
            }
          />
          <SettingsRow
            label="Restore purchases"
            right={<Text style={{ fontSize: 14, color: colors.inkSoft }}>›</Text>}
            onPress={() => console.warn('restore not implemented yet')}
          />
          <SettingsRow
            label="Reset to defaults"
            right={<Text style={{ fontSize: 14, color: colors.inkSoft }}>›</Text>}
            onPress={handleReset}
          />
          <SettingsRow
            label="Sign out"
            right={<Text style={{ fontSize: 14, color: colors.emberDeep }}>›</Text>}
            onPress={() => console.warn('sign out not implemented yet')}
            destructive
            isLast
          />
        </SettingsGroup>

        {/* ABOUT */}
        <SettingsGroup label="ABOUT">
          <SettingsRow
            label="Version"
            right={<Text style={{ fontSize: 14, color: colors.inkDim }}>1.0.0</Text>}
          />
          <SettingsRow
            label="Privacy"
            right={<Text style={{ fontSize: 14, color: colors.inkSoft }}>›</Text>}
            onPress={() => Linking.openURL('https://blockmergearena.com/privacy').catch(() => null)}
          />
          <SettingsRow
            label="Terms"
            right={<Text style={{ fontSize: 14, color: colors.inkSoft }}>›</Text>}
            onPress={() => Linking.openURL('https://blockmergearena.com/terms').catch(() => null)}
            isLast
          />
        </SettingsGroup>

      </ScrollView>
    </SafeAreaView>
  );
}
