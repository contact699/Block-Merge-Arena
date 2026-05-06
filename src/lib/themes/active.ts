// Active-theme selection + persistence. Locked themes require subscription;
// canApplyTheme is the gate.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEMES, DEFAULT_THEME, type ThemeId } from './catalog';

const ACTIVE_THEME_KEY = '@block_merge:active_theme';

export function canApplyTheme(id: ThemeId, isSubscribed: boolean): boolean {
  const theme = THEMES.find((t) => t.id === id);
  if (!theme) return false;
  if (!theme.locked) return true;
  return isSubscribed;
}

export async function getActiveThemeId(): Promise<ThemeId> {
  const raw = await AsyncStorage.getItem(ACTIVE_THEME_KEY);
  if (raw && THEMES.some((t) => t.id === raw)) return raw as ThemeId;
  return DEFAULT_THEME;
}

export async function setActiveThemeId(id: ThemeId): Promise<void> {
  await AsyncStorage.setItem(ACTIVE_THEME_KEY, id);
}
