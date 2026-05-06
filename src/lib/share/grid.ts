// src/lib/share/grid.ts

export interface ShareGridCell {
  color: string;
  gem?: boolean;
  mult?: number;
}

export interface ShareGridInput {
  puzzleId: string;
  score: number;
  maxMultiplier: number;
  board: (ShareGridCell | null)[][];
}

const BLOCK_EMOJI: Record<string, string> = {
  ember: '🟧',
  cobalt: '🟦',
  forest: '🟩',
  mustard: '🟨',
  plum: '🟪',
  rose: '🟥',
  teal: '🟫',
  ink: '⬛',
};

const GEM_EMOJI: Record<string, string> = {
  ember: '🔴',
  cobalt: '🔵',
  forest: '🟢',
  mustard: '🟡',
  plum: '🟣',
  rose: '🌸',
  teal: '🔷',
  ink: '⚫',
};

const SUPERSCRIPTS = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];

function superscriptNumber(n: number): string {
  return String(n)
    .split('')
    .map((d) => SUPERSCRIPTS[Number(d)] ?? d)
    .join('');
}

function formatHeader(input: ShareGridInput): string {
  const score = input.score.toLocaleString('en-US');
  if (input.maxMultiplier > 1) {
    return `Block Merge #${input.puzzleId} · ${score} · ×${input.maxMultiplier} combo`;
  }
  return `Block Merge #${input.puzzleId} · ${score}`;
}

function renderCell(cell: ShareGridCell | null): string {
  if (cell === null) return '⬜';
  if (cell.gem) {
    const base = GEM_EMOJI[cell.color] ?? '⚪';
    if (cell.mult && cell.mult > 1) return base + superscriptNumber(cell.mult);
    return base;
  }
  return BLOCK_EMOJI[cell.color] ?? '⬛';
}

export function renderShareGrid(input: ShareGridInput): string {
  const lines: string[] = [];
  lines.push(formatHeader(input));
  for (const row of input.board) {
    lines.push(row.map(renderCell).join(''));
  }
  lines.push('blockmerge.app');
  return lines.join('\n');
}
