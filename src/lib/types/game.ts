// Block Merge Arena - Game Type Definitions

export type BlockColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange';

export type CellState = {
  filled: boolean;
  color?: BlockColor;
};

export type Position = {
  row: number;
  col: number;
};

export type BlockShapeType =
  | 'I2' | 'I3' | 'I4' | 'I5'  // Straight lines
  | 'O2x2' | 'O3x3'            // Squares
  | 'L3' | 'L4'                // L shapes
  | 'T3' | 'T4'                // T shapes
  | 'Z3' | 'S3';               // Z and S shapes

export type BlockShape = Position[];

export type GamePiece = {
  id: string;
  shape: BlockShape;
  shapeType: BlockShapeType;
  color: BlockColor;
  width: number;
  height: number;
};

export type Gem = {
  id: string;
  color: BlockColor;
  position: Position;
  size: 'small' | 'medium' | 'large' | 'mega';
  multiplier: number; // 1x, 2x, 3x, 5x
};

export type PowerUpType = 'reroll' | 'blast' | 'freeze' | 'target' | 'colorBomb';

export type PowerUp = {
  type: PowerUpType;
  name: string;
  description: string;
  uses: number;
};

export type GameBoard = CellState[][];

export type GameState = {
  board: GameBoard;
  currentPieces: GamePiece[];
  score: number;
  gems: Gem[];
  gameOver: boolean;
  moveCount: number;
};

export type TournamentRound = {
  id: string;
  startPieces: GamePiece[];
  startTime: Date;
  endTime: Date;
  players: number;
};
