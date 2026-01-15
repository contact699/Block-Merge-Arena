// GameBoard Component - 8x8 Grid Display
import React from 'react';
import { View, Pressable, Dimensions } from 'react-native';
import type { GameBoard as GameBoardType, CellState } from '@/lib/types/game';
import { cn } from '@/lib/cn';
import { GemCell } from '@/components/GemDisplay';

const SCREEN_WIDTH = Dimensions.get('window').width;
const BOARD_PADDING = 16;
const BOARD_WIDTH = SCREEN_WIDTH - (BOARD_PADDING * 2);
const CELL_GAP = 2;

interface GameBoardProps {
  board: GameBoardType;
  onCellPress?: (row: number, col: number) => void;
  highlightedCells?: { row: number; col: number }[];
}

// Color mapping for blocks
const BLOCK_COLOR_MAP: Record<string, string> = {
  red: 'bg-red-500',
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-400',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500'
};

export function GameBoard({ board, onCellPress, highlightedCells = [] }: GameBoardProps) {
  const boardSize = board.length;
  const cellSize = (BOARD_WIDTH - (CELL_GAP * (boardSize - 1))) / boardSize;

  const isCellHighlighted = (row: number, col: number): boolean => {
    return highlightedCells.some(
      (cell: { row: number; col: number }) => cell.row === row && cell.col === col
    );
  };

  const getCellColor = (cell: CellState): string => {
    if (cell.filled && cell.color) {
      return BLOCK_COLOR_MAP[cell.color] || 'bg-gray-500';
    }
    return 'bg-gray-900';
  };

  const isGem = (cell: CellState): boolean => {
    return !cell.filled && !!cell.color;
  };

  return (
    <View
      className="bg-black rounded-2xl p-2"
      style={{
        width: BOARD_WIDTH + 16,
        shadowColor: '#a855f7',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10
      }}
    >
      {board.map((row: CellState[], rowIndex: number) => (
        <View
          key={`row-${rowIndex}`}
          className="flex-row"
          style={{ marginBottom: rowIndex < boardSize - 1 ? CELL_GAP : 0 }}
        >
          {row.map((cell: CellState, colIndex: number) => {
            const isHighlighted = isCellHighlighted(rowIndex, colIndex);
            const cellColor = getCellColor(cell);
            const cellIsGem = isGem(cell);

            return (
              <Pressable
                key={`cell-${rowIndex}-${colIndex}`}
                onPress={() => onCellPress?.(rowIndex, colIndex)}
                className={cn(
                  'rounded-lg items-center justify-center',
                  !cellIsGem && cellColor,
                  cellIsGem && 'bg-gray-900',
                  isHighlighted && 'border-2 border-purple-400'
                )}
                style={{
                  width: cellSize,
                  height: cellSize,
                  marginRight: colIndex < boardSize - 1 ? CELL_GAP : 0
                }}
              >
                {/* Gem rendering */}
                {cellIsGem && cell.color && (
                  <GemCell color={cell.color} size={cellSize * 0.7} />
                )}

                {/* Cell border glow effect for empty cells */}
                {!cell.filled && !cellIsGem && (
                  <View
                    className="absolute inset-0 rounded-lg border border-gray-800"
                  />
                )}

                {/* Filled cell glow effect for blocks */}
                {cell.filled && (
                  <View
                    className="absolute inset-0 rounded-lg"
                    style={{
                      shadowColor: cell.color || '#ffffff',
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.6,
                      shadowRadius: 4
                    }}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
