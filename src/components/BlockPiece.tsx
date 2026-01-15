// BlockPiece Component - Draggable Block Display
import React from 'react';
import { View } from 'react-native';
import type { GamePiece } from '@/lib/types/game';
import { cn } from '@/lib/cn';

interface BlockPieceProps {
  piece: GamePiece;
  cellSize?: number;
  disabled?: boolean;
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

export function BlockPiece({ piece, cellSize = 30, disabled = false }: BlockPieceProps) {
  const colorClass = BLOCK_COLOR_MAP[piece.color] || 'bg-gray-500';

  // Create a grid to display the piece
  const gridSize = Math.max(piece.width, piece.height);
  const grid: boolean[][] = Array(gridSize).fill(null).map(() => Array(gridSize).fill(false));

  // Fill in the piece shape
  piece.shape.forEach((pos: { row: number; col: number }) => {
    if (pos.row < gridSize && pos.col < gridSize) {
      grid[pos.row][pos.col] = true;
    }
  });

  return (
    <View
      className={cn(
        'p-2 rounded-xl',
        disabled ? 'opacity-30' : 'opacity-100'
      )}
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.3)'
      }}
    >
      {grid.map((row: boolean[], rowIndex: number) => (
        <View key={`row-${rowIndex}`} className="flex-row">
          {row.map((filled: boolean, colIndex: number) => (
            <View
              key={`cell-${rowIndex}-${colIndex}`}
              className={cn(
                'rounded-md m-0.5',
                filled ? colorClass : 'bg-transparent'
              )}
              style={{
                width: cellSize,
                height: cellSize,
                shadowColor: filled ? piece.color : 'transparent',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: filled ? 0.8 : 0,
                shadowRadius: 6
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

// Component to display multiple pieces in a row
interface PiecesSelectorProps {
  pieces: GamePiece[];
  onPieceSelect?: (piece: GamePiece, index: number) => void;
  selectedIndex?: number;
}

export function PiecesSelector({ pieces, onPieceSelect, selectedIndex }: PiecesSelectorProps) {
  return (
    <View className="flex-row justify-around items-center bg-gray-900/50 rounded-2xl p-4">
      {pieces.map((piece: GamePiece, index: number) => (
        <View
          key={piece.id}
          className={cn(
            'p-2 rounded-xl border-2',
            selectedIndex === index ? 'border-purple-500' : 'border-transparent'
          )}
          onTouchEnd={() => onPieceSelect?.(piece, index)}
        >
          <BlockPiece piece={piece} cellSize={24} disabled={selectedIndex !== undefined && selectedIndex !== index} />
        </View>
      ))}
    </View>
  );
}
