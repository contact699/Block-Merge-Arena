// Block Piece Shapes Generator
import type { BlockShapeType, GamePiece, Position, BlockColor } from '@/lib/types/game';

// Define all block shapes as position arrays
const BLOCK_SHAPES: Record<BlockShapeType, Position[]> = {
  // Straight lines (I pieces)
  I2: [{ row: 0, col: 0 }, { row: 0, col: 1 }],
  I3: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }],
  I4: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 }],
  I5: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 }, { row: 0, col: 4 }],

  // Squares (O pieces)
  O2x2: [
    { row: 0, col: 0 }, { row: 0, col: 1 },
    { row: 1, col: 0 }, { row: 1, col: 1 }
  ],
  O3x3: [
    { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 },
    { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 },
    { row: 2, col: 0 }, { row: 2, col: 1 }, { row: 2, col: 2 }
  ],

  // L shapes
  L3: [
    { row: 0, col: 0 },
    { row: 1, col: 0 },
    { row: 2, col: 0 }, { row: 2, col: 1 }
  ],
  L4: [
    { row: 0, col: 0 },
    { row: 1, col: 0 },
    { row: 2, col: 0 },
    { row: 3, col: 0 }, { row: 3, col: 1 }
  ],

  // T shapes
  T3: [
    { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 },
    { row: 1, col: 1 }
  ],
  T4: [
    { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 },
    { row: 1, col: 1 },
    { row: 2, col: 1 }
  ],

  // Z shape
  Z3: [
    { row: 0, col: 0 }, { row: 0, col: 1 },
    { row: 1, col: 1 }, { row: 1, col: 2 }
  ],

  // S shape
  S3: [
    { row: 0, col: 1 }, { row: 0, col: 2 },
    { row: 1, col: 0 }, { row: 1, col: 1 }
  ]
};

// Color palette for blocks
const BLOCK_COLORS: BlockColor[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

/**
 * Calculate the bounding box dimensions of a shape
 */
function getShapeDimensions(shape: Position[]): { width: number; height: number } {
  const maxRow = Math.max(...shape.map((p: Position) => p.row));
  const maxCol = Math.max(...shape.map((p: Position) => p.col));
  return {
    width: maxCol + 1,
    height: maxRow + 1
  };
}

/**
 * Generate a random block piece
 */
export function generateRandomPiece(): GamePiece {
  const shapeTypes = Object.keys(BLOCK_SHAPES) as BlockShapeType[];
  const randomShapeType = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
  const shape = BLOCK_SHAPES[randomShapeType];
  const color = BLOCK_COLORS[Math.floor(Math.random() * BLOCK_COLORS.length)];
  const dimensions = getShapeDimensions(shape);

  return {
    id: `piece-${Date.now()}-${Math.random()}`,
    shape,
    shapeType: randomShapeType,
    color,
    width: dimensions.width,
    height: dimensions.height
  };
}

/**
 * Generate N random pieces
 */
export function generatePieces(count: number): GamePiece[] {
  const pieces: GamePiece[] = [];
  for (let i = 0; i < count; i++) {
    pieces.push(generateRandomPiece());
  }
  return pieces;
}

/**
 * Generate a specific piece by shape type
 */
export function generatePieceByType(shapeType: BlockShapeType, color?: BlockColor): GamePiece {
  const shape = BLOCK_SHAPES[shapeType];
  const pieceColor = color || BLOCK_COLORS[Math.floor(Math.random() * BLOCK_COLORS.length)];
  const dimensions = getShapeDimensions(shape);

  return {
    id: `piece-${Date.now()}-${Math.random()}`,
    shape,
    shapeType,
    color: pieceColor,
    width: dimensions.width,
    height: dimensions.height
  };
}

/**
 * Get all available shape types
 */
export function getAllShapeTypes(): BlockShapeType[] {
  return Object.keys(BLOCK_SHAPES) as BlockShapeType[];
}

/**
 * Rotate a piece 90 degrees clockwise
 */
export function rotatePiece(piece: GamePiece): GamePiece {
  const rotatedShape = piece.shape.map((pos: Position) => ({
    row: pos.col,
    col: piece.height - 1 - pos.row
  }));
  const dimensions = getShapeDimensions(rotatedShape);

  return {
    ...piece,
    shape: rotatedShape,
    width: dimensions.width,
    height: dimensions.height
  };
}
