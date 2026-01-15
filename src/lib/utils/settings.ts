// Settings Storage & Management
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserSettings } from '@/lib/types/settings';
import { DEFAULT_SETTINGS } from '@/lib/types/settings';

const SETTINGS_KEY = '@block_merge_arena:settings';

/**
 * Get user settings
 */
export async function getSettings(): Promise<UserSettings> {
  try {
    const data = await AsyncStorage.getItem(SETTINGS_KEY);
    if (data) {
      const settings = JSON.parse(data);
      // Merge with defaults to ensure all fields exist
      return { ...DEFAULT_SETTINGS, ...settings };
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error loading settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save user settings
 */
export async function saveSettings(settings: UserSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    console.log('✅ Settings saved');
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

/**
 * Update specific setting
 */
export async function updateSetting<K extends keyof UserSettings>(
  key: K,
  value: UserSettings[K]
): Promise<UserSettings> {
  try {
    const settings = await getSettings();
    settings[key] = value;
    await saveSettings(settings);
    return settings;
  } catch (error) {
    console.error('Error updating setting:', error);
    return await getSettings();
  }
}

/**
 * Reset settings to defaults
 */
export async function resetSettings(): Promise<UserSettings> {
  try {
    await saveSettings(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error resetting settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Get display name or generate default
 */
export async function getDisplayName(): Promise<string> {
  const settings = await getSettings();
  if (settings.displayName) {
    return settings.displayName;
  }
  // Generate default name
  return `Player${Math.floor(Math.random() * 9999)}`;
}

/**
 * Set display name
 */
export async function setDisplayName(name: string): Promise<void> {
  await updateSetting('displayName', name);
}
