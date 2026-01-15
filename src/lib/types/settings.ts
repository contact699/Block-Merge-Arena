// Settings & Preferences Types

/**
 * User settings/preferences
 */
export interface UserSettings {
  // Display
  displayName: string;

  // Audio
  soundEnabled: boolean;
  musicEnabled: boolean;
  volume: number; // 0-100

  // Haptics
  hapticEnabled: boolean;

  // Gameplay
  showTutorial: boolean;
  confirmPowerUps: boolean;

  // Privacy
  allowAnalytics: boolean;

  // Accessibility
  reducedMotion: boolean;
  highContrast: boolean;
}

/**
 * Default settings
 */
export const DEFAULT_SETTINGS: UserSettings = {
  displayName: '',
  soundEnabled: true,
  musicEnabled: true,
  volume: 80,
  hapticEnabled: true,
  showTutorial: true,
  confirmPowerUps: false,
  allowAnalytics: true,
  reducedMotion: false,
  highContrast: false,
};
