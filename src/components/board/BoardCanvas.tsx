// Full-Skia board renderer (spec §2.2). Draws frame, cells, blocks, gems,
// drag ghost. ALL math comes from BoardGeometry props — no local coordinates.
import React from 'react';
import { Platform } from 'react-native';
import {
  Canvas, RoundedRect, Group, Circle, Text as SkText,
  LinearGradient, RadialGradient, vec, matchFont,
} from '@shopify/react-native-skia';
import type { SharedValue } from 'react-native-reanimated';
import { useDerivedValue } from 'react-native-reanimated';
import type { BlockColor, GameBoard, GamePiece } from '@/lib/types/game';
import { blockColors, colors, resolveBlockColor } from '@/lib/design/tokens';
import { type Geometry, rectForCell } from '@/lib/board/geometry';

// ---------------------------------------------------------------------------
// Font — computed once at module scope via matchFont (system font, no asset
// required). matchFont(Partial<RNFontStyle>) returns SkFont directly in v2.
// ---------------------------------------------------------------------------
const badgeFont = matchFont({
  fontFamily: Platform.select({ ios: 'Helvetica', default: 'sans-serif' }) ?? 'sans-serif',
  fontSize: 11,
  fontWeight: 'bold',
});

const GEM_SCALE = { small: 0.62, medium: 0.78, large: 0.92, mega: 1.0 } as const;

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface GhostState {
  /** row = -1 when no ghost. */
  row: number;
  col: number;
  valid: boolean;
  pieceIndex: number;
}

interface Props {
  board: GameBoard;
  geometry: Geometry;
  pieces: GamePiece[];
  /** Drag ghost — driven from the gesture worklet, read here per frame. */
  ghost: SharedValue<GhostState>;
}

// ---------------------------------------------------------------------------
// BoardCanvas
// ---------------------------------------------------------------------------

export function BoardCanvas({ board, geometry: g, pieces, ghost }: Props) {
  // Derive the list of ghost cells from the shared drag state.
  // ghostCells is a DerivedValue (extends SharedValue) — each GhostCell slot
  // reads individual number / string values out of it via further useDerivedValue.
  const ghostCells = useDerivedValue(() => {
    const gh = ghost.value;
    if (gh.row < 0 || gh.pieceIndex < 0) return [];
    const piece = pieces[gh.pieceIndex];
    if (!piece) return [];
    return piece.shape.map((p) => ({
      rect: rectForCell(g, { row: gh.row + p.row, col: gh.col + p.col }),
      valid: gh.valid,
      color: piece.color,
    }));
  }, [pieces, g]);

  return (
    <Canvas style={{ width: g.boardSize, height: g.boardSize }}>
      {/* Board background — rounded frame with dark gradient */}
      <RoundedRect
        x={0}
        y={0}
        width={g.boardSize}
        height={g.boardSize}
        r={14}
      >
        <LinearGradient
          start={vec(g.boardSize / 2, 0)}
          end={vec(g.boardSize / 2, g.boardSize)}
          colors={[colors.boardBgTop, colors.boardBgBottom]}
        />
      </RoundedRect>

      {/* Cells */}
      {board.map((row, r) =>
        row.map((cell, c) => {
          const rect = rectForCell(g, { row: r, col: c });
          const key = `${r}-${c}`;

          // Filled block cell
          if (cell.filled && cell.color) {
            const tone = blockColors[resolveBlockColor(cell.color)];
            return (
              <Group key={key}>
                <RoundedRect
                  x={rect.x}
                  y={rect.y}
                  width={rect.width}
                  height={rect.height}
                  r={4}
                >
                  <LinearGradient
                    start={vec(rect.x, rect.y)}
                    end={vec(rect.x, rect.y + rect.height)}
                    colors={[tone.glow, tone.base, tone.deep]}
                  />
                </RoundedRect>
                {/* Specular highlight strip */}
                <RoundedRect
                  x={rect.x + 2}
                  y={rect.y + 1.5}
                  width={rect.width - 4}
                  height={2}
                  r={1}
                  color="rgba(255,255,255,0.35)"
                />
              </Group>
            );
          }

          // Gem cell (cleared block with color but not filled)
          if (!cell.filled && cell.color) {
            const tone = blockColors[resolveBlockColor(cell.color)];
            const tier = cell.gemTier ?? 'small';
            const radius = (rect.width * GEM_SCALE[tier]) / 2;
            const cx = rect.x + rect.width / 2;
            const cy = rect.y + rect.height / 2;
            const mult = cell.gemMultiplier ?? 1;
            return (
              <Group key={key}>
                {/* Outer glow ring — only for medium+ tiers */}
                {tier !== 'small' && (
                  <Circle cx={cx} cy={cy} r={radius + 3} color={tone.glow} opacity={0.35} />
                )}
                {/* Gem body with radial gradient */}
                <Circle cx={cx} cy={cy} r={radius}>
                  <RadialGradient
                    c={vec(cx - radius * 0.3, cy - radius * 0.4)}
                    r={radius * 1.4}
                    colors={[tone.glow, tone.base, tone.deep]}
                  />
                </Circle>
                {/* Multiplier badge — approximate centering */}
                {mult > 1 && (
                  <SkText
                    x={cx - 8}
                    y={cy + 4}
                    text={`×${mult}`}
                    font={badgeFont}
                    color="white"
                  />
                )}
              </Group>
            );
          }

          // Empty cell
          return (
            <RoundedRect
              key={key}
              x={rect.x}
              y={rect.y}
              width={rect.width}
              height={rect.height}
              r={5}
              color={colors.boardCellBg}
            />
          );
        })
      )}

      {/* Drag ghost overlay */}
      <GhostLayer ghostCells={ghostCells} />
    </Canvas>
  );
}

// ---------------------------------------------------------------------------
// GhostLayer — fixed 9-slot (3×3 max) animated ghost rendering.
// ---------------------------------------------------------------------------

type GhostCellData = {
  rect: { x: number; y: number; width: number; height: number };
  valid: boolean;
  color: BlockColor;
};

function GhostLayer({
  ghostCells,
}: {
  ghostCells: SharedValue<GhostCellData[]>;
}) {
  // O3x3 = 9 cells max per piece. Draw a fixed set of 9 slots; unused ones
  // hide off-canvas (x/y = -100, width/height = 0).
  const slots = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;
  return (
    <Group>
      {slots.map((i) => (
        <GhostCell key={i} index={i} ghostCells={ghostCells} />
      ))}
    </Group>
  );
}

// ---------------------------------------------------------------------------
// GhostCell — one animated slot for the ghost layer.
// Each numeric/color prop is a separate DerivedValue so Skia can read it
// directly per frame on the UI thread (Skia v2 AnimatedProp pattern).
// ---------------------------------------------------------------------------

function GhostCell({
  index,
  ghostCells,
}: {
  index: number;
  ghostCells: SharedValue<GhostCellData[]>;
}) {
  const x = useDerivedValue(() => ghostCells.value[index]?.rect.x ?? -100);
  const y = useDerivedValue(() => ghostCells.value[index]?.rect.y ?? -100);
  const w = useDerivedValue(() => ghostCells.value[index]?.rect.width ?? 0);
  const h = useDerivedValue(() => ghostCells.value[index]?.rect.height ?? 0);
  const color = useDerivedValue<string>(() => {
    const cell = ghostCells.value[index];
    if (!cell) return 'transparent';
    if (!cell.valid) return 'rgba(128,128,128,0.15)';
    const tone = blockColors[resolveBlockColor(cell.color)];
    return tone.base + '59'; // hex suffix ≈ 35 % alpha
  });

  return <RoundedRect x={x} y={y} width={w} height={h} r={4} color={color} />;
}
