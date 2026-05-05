// GameBoard — Tactile Console redesign.
// Dark "deep" 8x8 board with cream-floating elevation and gradient cells.
import React from 'react';
import { View, Pressable, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { GameBoard as GameBoardType, CellState } from '@/lib/types/game';
import { GemCell } from '@/components/GemDisplay';
import { TactileCell } from '@/components/design/TactileCell';
import { resolveBlockColor } from '@/lib/design/tokens';

const SCREEN_WIDTH = Dimensions.get('window').width;
const BOARD_OUTER_PADDING = 16;
const BOARD_WIDTH = SCREEN_WIDTH - BOARD_OUTER_PADDING * 2;
const BOARD_INNER_PADDING = 10;
const CELL_GAP = 2;

interface GameBoardProps {
  board: GameBoardType;
  onCellPress?: (row: number, col: number) => void;
  highlightedCells?: { row: number; col: number }[];
}

export function GameBoard({ board, onCellPress, highlightedCells = [] }: GameBoardProps) {
  const boardSize = board.length;
  const cellSize =
    (BOARD_WIDTH - BOARD_INNER_PADDING * 2 - CELL_GAP * (boardSize - 1)) / boardSize;

  const isHighlighted = (r: number, c: number) =>
    highlightedCells.some((h) => h.row === r && h.col === c);

  return (
    <View
      style={{
        width: BOARD_WIDTH,
        height: BOARD_WIDTH,
        padding: BOARD_INNER_PADDING,
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 24 },
        shadowOpacity: 0.5,
        shadowRadius: 30,
        elevation: 14,
      }}
    >
      <LinearGradient
        colors={['#211c14', '#0a0805']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {board.map((row: CellState[], r: number) => (
        <View key={r} style={{ flexDirection: 'row' }}>
          {row.map((cell: CellState, c: number) => {
            const highlighted = isHighlighted(r, c);
            const isGem = !cell.filled && !!cell.color;
            const isBlock = cell.filled && !!cell.color;
            return (
              <Pressable
                key={c}
                testID={`cell-${r}-${c}`}
                onPress={() => onCellPress?.(r, c)}
                style={{
                  width: cellSize,
                  height: cellSize,
                  marginRight: c < boardSize - 1 ? CELL_GAP : 0,
                  marginBottom: r < boardSize - 1 ? CELL_GAP : 0,
                  borderRadius: 5,
                  backgroundColor: 'rgba(255,255,255,0.025)',
                  borderWidth: 1,
                  borderColor: highlighted ? '#ff5a36' : 'rgba(255,255,255,0.06)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                {isBlock && cell.color && (
                  <TactileCell color={resolveBlockColor(cell.color)} size={cellSize - 2} rounded={4} />
                )}
                {isGem && cell.color && (
                  <GemCell color={cell.color} size={cellSize * 0.72} />
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
