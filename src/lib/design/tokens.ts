// Tactile Console design tokens — warm cream paper, deep ink, ember accents.
// Source: Block Merge design handoff (Direction B · polished).

export const colors = {
  paper: '#f3efe7',
  paper2: '#ece6d9',
  paper3: '#e3dcca',
  ink: '#16140f',
  ink2: '#2a2620',
  inkSoft: 'rgba(22,20,15,0.7)',
  inkDim: 'rgba(22,20,15,0.45)',
  inkRule: 'rgba(22,20,15,0.12)',
  inkRuleSoft: 'rgba(22,20,15,0.06)',

  ember: '#ff5a36',
  emberDeep: '#d83a18',
  emberLight: '#ff8e72',
  cobalt: '#2848d4',
  cobaltDeep: '#1c2faa',
  forest: '#2d6a4f',
  forestDeep: '#14392a',
  mustard: '#e6a93c',
  mustardDeep: '#b07e1d',
  plum: '#6c3aa3',
  plumDeep: '#381c5a',
  rose: '#e87aa1',
  roseDeep: '#9f2b53',
  teal: '#1d8c8c',
  tealDeep: '#0a4444',

  boardBgTop: '#211c14',
  boardBgBottom: '#0a0805',
  boardCellBg: 'rgba(255,255,255,0.025)',
  boardCellBorder: 'rgba(255,255,255,0.06)',
} as const;

export type BlockColorKey =
  | 'ember'
  | 'cobalt'
  | 'forest'
  | 'mustard'
  | 'plum'
  | 'rose'
  | 'teal'
  | 'ink';

export const blockColors: Record<BlockColorKey, { base: string; deep: string; glow: string }> = {
  ember: { base: '#ff5a36', deep: '#b32a10', glow: '#ffb39a' },
  cobalt: { base: '#2848d4', deep: '#15267a', glow: '#8aa3ff' },
  forest: { base: '#2d6a4f', deep: '#14392a', glow: '#95d4b6' },
  mustard: { base: '#e6a93c', deep: '#8e6418', glow: '#ffdb95' },
  plum: { base: '#6c3aa3', deep: '#381c5a', glow: '#c8a8e6' },
  rose: { base: '#e87aa1', deep: '#9f2b53', glow: '#f7c1d4' },
  teal: { base: '#1d8c8c', deep: '#0a4444', glow: '#88dada' },
  ink: { base: '#2a2620', deep: '#0a0805', glow: '#6b6258' },
};

// Map the legacy in-game color names to the design palette.
export const legacyColorMap: Record<string, BlockColorKey> = {
  red: 'ember',
  orange: 'ember',
  blue: 'cobalt',
  green: 'forest',
  yellow: 'mustard',
  purple: 'plum',
  pink: 'rose',
  cyan: 'teal',
};

export function resolveBlockColor(name: string): BlockColorKey {
  if (name in blockColors) return name as BlockColorKey;
  return legacyColorMap[name] ?? 'ember';
}

export const radii = {
  sm: 6,
  md: 12,
  lg: 14,
  xl: 18,
  pill: 999,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
  black: '900',
} as const;

// Shadow presets approximating the design's box-shadows (RN can't do multi-layer
// box-shadows, so we use the most prominent layer only).
export const shadows = {
  cardLift: {
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 6,
  },
  cardDeep: {
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 12,
  },
  buttonEmber: {
    shadowColor: colors.ember,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 8,
  },
  boardLift: {
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 14,
  },
} as const;
