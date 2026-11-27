import { BOARD_COLS, BOARD_ROWS, normalizeCells } from "./konoodleSolver";
export const rotatePiece = (cells: number[][]) =>
  normalizeCells(cells.map(([r, c]) => [c, -r]));
export const flipPiece = (cells: number[][]) =>
  normalizeCells(cells.map(([r, c]) => [r, -c]));
export function placementAt(
  cells: number[][],
  row: number,
  col: number,
  occupied: number[][],
) {
  const candidate = cells.map(([r, c]) => [r + row, c + col]);
  return candidate.every(
    ([r, c]) =>
      r >= 0 &&
      r < BOARD_ROWS &&
      c >= 0 &&
      c < BOARD_COLS &&
      !occupied.some(([y, x]) => y === r && x === c),
  )
    ? candidate
    : null;
}
