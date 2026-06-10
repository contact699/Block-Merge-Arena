// Invisible 8x8 Pressable grid over the canvas (spec §2.3): keeps every
// existing Maestro `cell-r-c` testID, adds screen-reader labels, and carries
// the tap-to-place fallback. Renders no visuals; cheap and static.
import React, { memo } from 'react';
import { View, Pressable } from 'react-native';
import type { GameBoard } from '@/lib/types/game';
import { type Geometry, rectForCell } from '@/lib/board/geometry';

function cellLabel(board: GameBoard, row: number, col: number): string {
  const cell = board[row]?.[col];
  if (!cell) return `Row ${row + 1}, column ${col + 1}`;
  if (cell.filled && cell.color) return `Row ${row + 1}, column ${col + 1}, ${cell.color} block`;
  if (!cell.filled && cell.color) {
    const mult = cell.gemMultiplier ?? 1;
    return `Row ${row + 1}, column ${col + 1}, ${cell.color} gem times ${mult}`;
  }
  return `Row ${row + 1}, column ${col + 1}, empty`;
}

export const InputLattice = memo(function InputLattice({
  board, geometry: g, onCellPress,
}: {
  board: GameBoard;
  geometry: Geometry;
  onCellPress: (row: number, col: number) => void;
}) {
  return (
    <View pointerEvents="box-none"
      style={{ position: 'absolute', top: 0, left: 0, width: g.boardSize, height: g.boardSize }}>
      {board.map((row, r) =>
        row.map((_, c) => {
          const rect = rectForCell(g, { row: r, col: c });
          return (
            <Pressable
              key={`${r}-${c}`}
              testID={`cell-${r}-${c}`}
              accessibilityRole="button"
              accessibilityLabel={cellLabel(board, r, c)}
              onPress={() => onCellPress(r, c)}
              style={{
                position: 'absolute',
                left: rect.x, top: rect.y, width: rect.width, height: rect.height,
              }}
            />
          );
        })
      )}
    </View>
  );
});
