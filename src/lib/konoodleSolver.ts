// Konoodle solver using 11 pentominoes (excluding X) to fill 5×11 = 55 cells

export const BOARD_ROWS = 5;
export const BOARD_COLS = 11;

export interface PieceDef {
  id: string;
  cells: number[][];
  color: string;
  orientations: number[][][];
}

const rotateCells = (cells: number[][]): number[][] =>
  cells.map(([r, c]) => [c, -r]);

const flipCells = (cells: number[][]): number[][] =>
  cells.map(([r, c]) => [r, -c]);

export const normalizeCells = (cells: number[][]): number[][] => {
  const minR = Math.min(...cells.map(([r]) => r));
  const minC = Math.min(...cells.map(([, c]) => c));
  return cells.map(([r, c]) => [r - minR, c - minC]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
};

const getAllOrientations = (cells: number[][]): number[][][] => {
  const seen = new Set<string>();
  const result: number[][][] = [];
  let current = cells.map(c => [...c]);
  for (let flip = 0; flip < 2; flip++) {
    for (let rot = 0; rot < 4; rot++) {
      const normalized = normalizeCells(current);
      const key = JSON.stringify(normalized);
      if (!seen.has(key)) {
        seen.add(key);
        result.push(normalized);
      }
      current = rotateCells(current);
    }
    current = flipCells(normalizeCells(cells.map(c => [...c])));
  }
  return result;
};

const RAW_PIECES: { id: string; cells: number[][]; color: string }[] = [
  { id: "F", cells: [[0,1],[1,0],[1,1],[1,2],[2,2]], color: "bg-rose-500" },
  { id: "I", cells: [[0,0],[1,0],[2,0],[3,0],[4,0]], color: "bg-cyan-500" },
  { id: "L", cells: [[0,0],[1,0],[2,0],[3,0],[3,1]], color: "bg-amber-500" },
  { id: "N", cells: [[0,0],[1,0],[1,1],[2,1],[3,1]], color: "bg-emerald-500" },
  { id: "P", cells: [[0,0],[0,1],[1,0],[1,1],[2,0]], color: "bg-violet-500" },
  { id: "T", cells: [[0,0],[0,1],[0,2],[1,1],[2,1]], color: "bg-orange-500" },
  { id: "U", cells: [[0,0],[0,2],[1,0],[1,1],[1,2]], color: "bg-sky-500" },
  { id: "V", cells: [[0,0],[1,0],[2,0],[2,1],[2,2]], color: "bg-pink-500" },
  { id: "W", cells: [[0,0],[1,0],[1,1],[2,1],[2,2]], color: "bg-lime-500" },
  { id: "Y", cells: [[0,0],[1,0],[1,1],[2,0],[3,0]], color: "bg-indigo-500" },
  { id: "Z", cells: [[0,0],[0,1],[1,1],[2,1],[2,2]], color: "bg-teal-500" },
];

export const PIECES: PieceDef[] = RAW_PIECES.map(p => ({
  ...p,
  orientations: getAllOrientations(p.cells),
}));

export type BoardState = (string | null)[][];

export const createEmptyBoard = (): BoardState =>
  Array.from({ length: BOARD_ROWS }, () => Array(BOARD_COLS).fill(null));

export interface Placement {
  pieceId: string;
  cells: [number, number][];
}

export const solvePuzzle = (
  initialBoard: BoardState,
  placedPieceIds: Set<string>,
  stepLimit = 500000
): Placement[] | null => {
  const board = initialBoard.map(r => [...r]);
  const remaining = PIECES.filter(p => !placedPieceIds.has(p.id));
  let steps = 0;

  const solve = (remIdx: number[]): Placement[] | null => {
    if (steps++ > stepLimit) return null;
    
    // Find first empty cell
    let targetR = -1, targetC = -1;
    outer: for (let r = 0; r < BOARD_ROWS; r++)
      for (let c = 0; c < BOARD_COLS; c++)
        if (!board[r][c]) { targetR = r; targetC = c; break outer; }
    
    if (targetR === -1) return []; // Board full!
    
    for (const idx of remIdx) {
      const piece = remaining[idx];
      for (const orientation of piece.orientations) {
        // Try each cell of orientation as anchor for target cell
        for (const [ar, ac] of orientation) {
          const baseR = targetR - ar;
          const baseC = targetC - ac;
          const placed: [number, number][] = [];
          let valid = true;
          
          for (const [dr, dc] of orientation) {
            const nr = baseR + dr, nc = baseC + dc;
            if (nr < 0 || nr >= BOARD_ROWS || nc < 0 || nc >= BOARD_COLS || board[nr][nc]) {
              valid = false;
              break;
            }
            placed.push([nr, nc]);
          }
          
          if (!valid) continue;
          
          // Place
          placed.forEach(([r, c]) => { board[r][c] = piece.id; });
          const newRem = remIdx.filter(i => i !== idx);
          const result = solve(newRem);
          
          if (result !== null) {
            return [{ pieceId: piece.id, cells: placed }, ...result];
          }
          
          // Unplace
          placed.forEach(([r, c]) => { board[r][c] = null; });
        }
      }
    }
    
    return null;
  };

  const indices = remaining.map((_, i) => i);
  return solve(indices);
};
