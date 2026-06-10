// GameSurface — composes the board canvas, invisible lattice, pieces tray,
// and drag gesture into a single component consumed by both game screens.
//
// Spec §3: outer padding 12 px. Spec §5: floating lifted piece follows finger,
// floats LIFT_PT (72 px) above the touch point so the finger never occludes
// the drag ghost.
//
// Thread model:
//   - dragX/dragY/dragScale are SharedValues written on the UI thread.
//   - ghost.pieceIndex is a SharedValue read via useAnimatedReaction to mirror
//     the held-piece index into React state (JS thread) for the floating piece
//     grid layout, while position/scale stay purely on the UI thread via
//     useAnimatedStyle. This keeps the "which piece cells to draw" decision in
//     React without any UI-thread layout calls.
import React, { useCallback, useMemo, useState } from 'react';
import { View, Dimensions, type LayoutChangeEvent, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useAnimatedReaction,
  runOnJS,
} from 'react-native-reanimated';
import { GestureDetector } from 'react-native-gesture-handler';
import type { GameBoard, GamePiece } from '@/lib/types/game';
import { makeGeometry } from '@/lib/board/geometry';
import { blockColors, resolveBlockColor, space } from '@/lib/design/tokens';
import { BoardCanvas } from './BoardCanvas';
import { InputLattice } from './InputLattice';
import { useDragPlacement } from './useDragPlacement';
import { PiecesTray } from '@/components/design/PiecesTray';

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------

const SCREEN_W = Dimensions.get('window').width;
/** Spec §3: outer horizontal padding 12 px each side. */
const BOARD_SIZE_PX = SCREEN_W - 12 * 2;
const PADDING = 10;
const GAP = 2;

/** Cell size for the floating drag piece mini-grid (px). */
const DRAG_CELL_SIZE = 18;
const DRAG_CELL_GAP = 2;

// ---------------------------------------------------------------------------
// FloatingPiece — static mini-grid of solid color cells rendered as a
// transient drag visual. Positioned and scaled by the animated overlay;
// no gradient needed here (quick transient element).
// ---------------------------------------------------------------------------

function FloatingPieceGrid({ piece }: { piece: GamePiece }) {
  const colorKey = resolveBlockColor(piece.color);
  const tone = blockColors[colorKey];

  // Build a 2-D boolean grid from the piece shape.
  const grid: boolean[][] = useMemo(() => {
    const g: boolean[][] = Array.from({ length: piece.height }, () =>
      Array(piece.width).fill(false),
    );
    piece.shape.forEach((p) => {
      if (p.row < piece.height && p.col < piece.width) g[p.row][p.col] = true;
    });
    return g;
  }, [piece]);

  return (
    <View>
      {grid.map((row, r) => (
        <View key={r} style={styles.floatRow}>
          {row.map((filled, c) => (
            <View
              key={c}
              style={[
                styles.floatCell,
                filled ? { backgroundColor: tone.base } : { backgroundColor: 'transparent' },
              ]}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// GameSurface
// ---------------------------------------------------------------------------

export function GameSurface({
  board,
  pieces,
  selectedPieceIndex,
  onSelectPiece,
  onPlace,
}: {
  board: GameBoard;
  pieces: GamePiece[];
  selectedPieceIndex: number | undefined;
  onSelectPiece: (piece: GamePiece, index: number) => void;
  onPlace: (pieceIndex: number, row: number, col: number) => void;
}) {
  const geometry = useMemo(
    () =>
      makeGeometry({
        boardX: 0,
        boardY: 0,
        boardSize: BOARD_SIZE_PX,
        padding: PADDING,
        gap: GAP,
        cells: 8,
      }),
    [],
  );

  // Y offset of the tray container relative to the GestureDetector view's top.
  // Seeded to a reasonable default (board + margin) so tray hit-testing works
  // even before the first layout event fires.
  const [trayOffsetY, setTrayOffsetY] = useState(BOARD_SIZE_PX + space.md);

  // Mirror ghost.pieceIndex → React state so FloatingPieceGrid can re-render
  // with the correct piece shape when the drag starts/ends (JS-thread concern).
  // Position and scale remain on the UI thread via useAnimatedStyle.
  const [heldPieceIndex, setHeldPieceIndex] = useState<number>(-1);

  // Tray slots are thirds of the surface width — pure math, no measurement.
  const pieceIndexAtTrayPoint = useCallback(
    (x: number, y: number) => {
      if (y < 0 || y > 96) return -1;
      return Math.min(2, Math.max(0, Math.floor(x / (BOARD_SIZE_PX / 3))));
    },
    [],
  );

  const { pan, ghost, dragX, dragY, dragScale } = useDragPlacement({
    geometry,
    board,
    pieces,
    pieceIndexAtTrayPoint,
    trayOffsetY,
    onCommit: onPlace,
  });

  // Mirror ghost.pieceIndex from the UI thread into React state.
  // The setter is called via runOnJS so it never blocks the UI thread.
  const setHeldPieceIndexJS = useCallback((idx: number) => {
    setHeldPieceIndex(idx);
  }, []);

  useAnimatedReaction(
    () => ghost.value.pieceIndex,
    (current, previous) => {
      if (current !== previous) {
        runOnJS(setHeldPieceIndexJS)(current);
      }
    },
    [ghost],
  );

  // Animated style for the floating overlay:
  //   - Translate to (dragX, dragY): the position LIFT_PT above the finger,
  //     already computed by the hook so the overlay follows without occlusion.
  //   - Scale and opacity interpolated from dragScale (0 → hidden, 1 → full).
  const floatStyle = useAnimatedStyle(() => {
    const s = dragScale.value;
    return {
      transform: [
        { translateX: dragX.value },
        { translateY: dragY.value },
        { scale: 0.6 + s * 0.4 }, // 0.6 in tray → 1.0 when lifted
      ],
      opacity: s,
    };
  }, [dragX, dragY, dragScale]);

  const handleTap = useCallback(
    (row: number, col: number) => {
      if (selectedPieceIndex !== undefined) onPlace(selectedPieceIndex, row, col);
    },
    [selectedPieceIndex, onPlace],
  );

  const heldPiece = heldPieceIndex >= 0 ? pieces[heldPieceIndex] : undefined;

  return (
    <GestureDetector gesture={pan}>
      <View style={{ width: BOARD_SIZE_PX, alignSelf: 'center' }}>
        {/* Board region: canvas + invisible tap lattice, stacked */}
        <View>
          <BoardCanvas board={board} geometry={geometry} pieces={pieces} ghost={ghost} />
          <InputLattice board={board} geometry={geometry} onCellPress={handleTap} />

          {/* Floating lifted-piece overlay — above lattice in z-order.
              pointerEvents="none" so it never intercepts the gesture.
              Absolutely positioned at the board's top-left (0,0); translateX/Y
              from the animated style move it to the drag position.        */}
          <Animated.View
            pointerEvents="none"
            style={[styles.floatOverlay, floatStyle]}
          >
            {heldPiece ? <FloatingPieceGrid piece={heldPiece} /> : null}
          </Animated.View>
        </View>

        {/* Pieces tray — measures its Y offset so the hook can convert
            container-local coordinates to tray-local ones.               */}
        <View
          style={{ marginTop: space.md }}
          onLayout={(e: LayoutChangeEvent) =>
            setTrayOffsetY(e.nativeEvent.layout.y)
          }
        >
          <PiecesTray
            pieces={pieces}
            selectedIndex={selectedPieceIndex}
            onSelect={onSelectPiece}
          />
        </View>
      </View>
    </GestureDetector>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  floatOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    // zIndex ensures the overlay renders above the InputLattice sibling.
    zIndex: 10,
  },
  floatRow: {
    flexDirection: 'row',
  },
  floatCell: {
    width: DRAG_CELL_SIZE,
    height: DRAG_CELL_SIZE,
    margin: DRAG_CELL_GAP / 2,
    borderRadius: 3,
  },
});
