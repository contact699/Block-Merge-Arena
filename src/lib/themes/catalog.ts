// Cosmetic themes per ADR 0008 (rotation cadence) and ADR 0010 (minimum-viable
// theming). Each theme overrides only paper background + primary accent; block
// colors and ink are constant for gameplay legibility.
import { colors as defaultColors } from '@/lib/design/tokens';

export type ThemeId = 'warm' | 'cool' | 'mono' | 'neon';

export interface ThemePalette {
  id: ThemeId;
  name: string;
  paper: string;
  accent: string;
  /** Locked themes require an active subscription. */
  locked: boolean;
}

export const THEMES: ThemePalette[] = [
  {
    id: 'warm',
    name: 'Warm Cream',
    paper: defaultColors.paper,
    accent: defaultColors.ember,
    locked: false,
  },
  {
    id: 'cool',
    name: 'Cool Sage',
    paper: '#eef1ef',
    accent: '#2a8c8a',
    locked: true,
  },
  {
    id: 'mono',
    name: 'Monochrome',
    paper: '#efece5',
    accent: '#2a2620',
    locked: true,
  },
  {
    id: 'neon',
    name: 'Neon',
    paper: '#0c0f1a',
    accent: '#ff2e63',
    locked: true,
  },
];

export const DEFAULT_THEME: ThemeId = 'warm';

export function getTheme(id: ThemeId): ThemePalette {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
