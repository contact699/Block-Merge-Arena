// useDragPlacement — UI-thread drag hook for piece placement.
//
// Thread model (spec §Task-9):
//   JS thread  : useMemo validity precompute, resolvePiece (calls JS prop
//                pieceIndexAtTrayPoint and reads pieces[]), withSpring for
//                dragScale pick-up animation.
//   UI thread  : onUpdate runs 100% on the UI thread — reads captured validity
//                arrays and shared values, calls snapTarget (worklet), writes
//                ghost/dragX/dragY shared values. Zero runOnJS here.
//   Crossing JS↔UI: only onStart (via runOnJS(resolvePiece)) and onEnd
//                (via runOnJS(onCommit)) may cross threads.

import { useCallback, useMemo } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { useSharedValue, runOnJS, withSpring } from 'react-native-reanimated';
import type { GamePiece, GameBoard } from '@/lib/types/game';
import { canPlacePiece } from '@/lib/game/board';
import { type Geometry, snapTarget } from '@/lib/board/geometry';
import { motion } from '@/lib/design/tokens';
import type { GhostState } from './BoardCanvas';

/** How many points above the finger the dragged piece floats (so the finger
 *  never occludes the ghost). Spec §Task-9 §3. */
const LIFT_PT = 72;

export function useDragPlacement(opts: {
  geometry: Geometry;
  board: GameBoard;
  pieces: GamePiece[];
  /** Map a tray-local (x, y) → piece index, or -1 if no piece hit. */
  pieceIndexAtTrayPoint: (x: number, y: number) => number;
  /** Y offset of the tray container relative to the gesture container top-left.
   *  Tray touches arrive as container-local coords; subtract this before
   *  calling pieceIndexAtTrayPoint. */
  trayOffsetY: number;
  /** Called on the JS thread when the player drops a piece on a valid cell. */
  onCommit: (pieceIndex: number, row: number, col: number) => void;
}) {
  const { geometry, board, pieces, pieceIndexAtTrayPoint, trayOffsetY, onCommit } = opts;

  // -------------------------------------------------------------------------
  // Shared values — all read/written on the UI thread; JS thread reads are
  // only for initial defaults.
  // -------------------------------------------------------------------------

  /** Current drag ghost state. row/col/pieceIndex = -1 when no drag active. */
  const ghost = useSharedValue<GhostState>({ row: -1, col: -1, valid: false, pieceIndex: -1 });

  /** Lifted drag position (finger - LIFT_PT). Consumed by the floating piece
   *  visual in the parent component. */
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);

  /** 0 = piece sits in tray, 1 = piece is lifted/floating. Animated with
   *  spring on pick-up and drop. */
  const dragScale = useSharedValue(0);

  // -------------------------------------------------------------------------
  // Validity map — precomputed on the JS thread, captured by the worklet.
  // validity[pieceIdx][row * geometry.cells + col] === true iff the piece can
  // be placed at (row, col). The worklet reads this flat array — it must NOT
  // call canPlacePiece (not worklet-safe).
  // -------------------------------------------------------------------------
  const validity = useMemo(() => {
    return pieces.map((piece) => {
      const grid: boolean[] = [];
      for (let r = 0; r < geometry.cells; r++) {
        for (let c = 0; c < geometry.cells; c++) {
          grid.push(piece ? canPlacePiece(board, piece, r, c) : false);
        }
      }
      return grid;
    });
  }, [board, pieces, geometry.cells]);

  // -------------------------------------------------------------------------
  // resolvePiece — JS thread only.
  // Determines which piece the finger started on (tray hit-test), initialises
  // the ghost shared value, and kicks off the pick-up spring animation.
  // Called via runOnJS from onStart so the gesture worklet can delegate JS
  // work here while keeping onUpdate pure-UI-thread.
  // -------------------------------------------------------------------------
  const resolvePiece = useCallback(
    (x: number, y: number) => {
      // y - trayOffsetY converts container-local Y to tray-local Y.
      const idx = pieceIndexAtTrayPoint(x, y - trayOffsetY);
      if (idx >= 0 && pieces[idx]) {
        // Initialise ghost with the chosen piece; row/col=-1 until the finger
        // moves into the board region.
        ghost.value = { row: -1, col: -1, valid: false, pieceIndex: idx };
        // JS-side spring assignment: schedules the animation on the UI thread.
        dragScale.value = withSpring(1, motion.spring);
      }
    },
    // Include all JS-side values the callback closes over.
    [pieceIndexAtTrayPoint, trayOffsetY, pieces, ghost, dragScale],
  );

  // -------------------------------------------------------------------------
  // Pan gesture — created with useMemo so a new gesture object is only
  // allocated when dependencies change.
  // -------------------------------------------------------------------------
  const pan = useMemo(
    () =>
      Gesture.Pan()
        // onStart: cross from UI→JS to do the tray hit-test and piece
        // selection. No per-frame work happens here.
        .onStart((e) => {
          'worklet';
          // Delegate to the JS thread — tray hit-test and pieces[] lookup are
          // not worklet-safe.
          runOnJS(resolvePiece)(e.x, e.y);
        })

        // onUpdate: PURE UI THREAD. Reads captured validity array and
        // geometry; writes ghost/drag shared values. Zero runOnJS here.
        .onUpdate((e) => {
          'worklet';
          // No piece selected yet (resolvePiece hasn't fired or found nothing).
          if (ghost.value.pieceIndex < 0) return;

          // Track the lifted position (finger raised by LIFT_PT).
          dragX.value = e.x;
          dragY.value = e.y - LIFT_PT;

          // Compute the snap target with hysteresis (worklet-safe).
          const prev =
            ghost.value.row >= 0 ? { row: ghost.value.row, col: ghost.value.col } : null;
          const target = snapTarget(geometry, { x: e.x, y: e.y - LIFT_PT }, prev);

          if (!target) {
            // Finger is outside the board region — clear row/col but keep
            // pieceIndex so pick-up state is retained.
            ghost.value = { ...ghost.value, row: -1, col: -1, valid: false };
            return;
          }

          // Look up validity from the precomputed flat array (no canPlacePiece
          // call — not worklet-safe).
          const flat = target.row * geometry.cells + target.col;
          const valid = validity[ghost.value.pieceIndex]?.[flat] ?? false;

          ghost.value = { ...ghost.value, row: target.row, col: target.col, valid };
        })

        // onEnd: cross UI→JS for the commit, then reset. The spring is
        // worklet-safe in Reanimated 3 and can run directly on the UI thread.
        .onEnd(() => {
          'worklet';
          const gh = ghost.value;

          // Spring the piece back down whether the drop succeeds or not.
          dragScale.value = withSpring(0, motion.springSoft);

          // Commit if there is a valid ghost position.
          if (gh.pieceIndex >= 0 && gh.row >= 0 && gh.valid) {
            runOnJS(onCommit)(gh.pieceIndex, gh.row, gh.col);
          }

          // Always clear the ghost regardless of success.
          ghost.value = { row: -1, col: -1, valid: false, pieceIndex: -1 };
        }),

    // Gesture deps: all values captured inside the worklet closures.
    [geometry, validity, onCommit, resolvePiece, ghost, dragX, dragY, dragScale],
  );

  return { pan, ghost, dragX, dragY, dragScale };
}
