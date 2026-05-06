// Theme context provider — supplies the active palette to the keep-list screens
// via useThemePalette(). Listens to subscription state so a churned subscriber
// auto-downgrades to the free default theme.
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { THEMES, DEFAULT_THEME, getTheme, type ThemeId, type ThemePalette } from './catalog';
import { getActiveThemeId, setActiveThemeId, canApplyTheme } from './active';
import { useSubscription } from '@/lib/subscription/state';

interface ThemeContextValue {
  palette: ThemePalette;
  activeId: ThemeId;
  setActive: (id: ThemeId) => Promise<boolean>;
  available: ThemePalette[];
}

const ThemeContext = createContext<ThemeContextValue>({
  palette: getTheme(DEFAULT_THEME),
  activeId: DEFAULT_THEME,
  setActive: async () => false,
  available: THEMES,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [activeId, setActiveIdState] = useState<ThemeId>(DEFAULT_THEME);
  const { isSubscribed } = useSubscription();

  useEffect(() => {
    (async () => {
      const stored = await getActiveThemeId();
      setActiveIdState(stored);
    })();
  }, []);

  // If subscription lapses while a locked theme is active, downgrade to default.
  useEffect(() => {
    if (!canApplyTheme(activeId, isSubscribed)) {
      setActiveIdState(DEFAULT_THEME);
      void setActiveThemeId(DEFAULT_THEME);
    }
  }, [isSubscribed, activeId]);

  const setActive = async (id: ThemeId): Promise<boolean> => {
    if (!canApplyTheme(id, isSubscribed)) return false;
    await setActiveThemeId(id);
    setActiveIdState(id);
    return true;
  };

  const value: ThemeContextValue = {
    palette: getTheme(activeId),
    activeId,
    setActive,
    available: THEMES,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemePalette(): ThemePalette {
  return useContext(ThemeContext).palette;
}

export function useThemeControls(): ThemeContextValue {
  return useContext(ThemeContext);
}
