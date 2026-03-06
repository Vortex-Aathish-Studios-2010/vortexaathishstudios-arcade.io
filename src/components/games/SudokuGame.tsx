import { useState, useMemo } from "react";
import { addPoints, updateStreak } from "@/lib/streaks";
import { toast } from "sonner";

const generateSudoku = (): { puzzle: number[][]; solution: number[][] } => {
  const board: number[][] = Array.from({ length: 9 }, () => Array(9).fill(0));

  const isValid = (b: number[][], r: number, c: number, n: number) => {
    for (let i = 0; i < 9; i++) {
      if (b[r][i] === n || b[i][c] === n) return false;
    }
    const br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
    for (let i = br; i < br + 3; i++)
      for (let j = bc; j < bc + 3; j++)
        if (b[i][j] === n) return false;
    return true;
  };

  const solve = (b: number[][]): boolean => {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (b[r][c] === 0) {
          const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
          for (const n of nums) {
            if (isValid(b, r, c, n)) {
              b[r][c] = n;
              if (solve(b)) return true;
              b[r][c] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  };

  solve(board);
  const solution = board.map((r) => [...r]);
  // Remove cells to create puzzle (30-35 clues)
  const cells = Array.from({ length: 81 }, (_, i) => i).sort(() => Math.random() - 0.5);
  let removed = 0;
  for (const idx of cells) {
    if (removed >= 45) break;
    const r = Math.floor(idx / 9), c = idx % 9;
    board[r][c] = 0;
    removed++;
  }
  return { puzzle: board, solution };
};

export const SudokuGame = () => {
  const { puzzle: initialPuzzle, solution } = useMemo(() => generateSudoku(), []);
  const [board, setBoard] = useState<number[][]>(() => initialPuzzle.map((r) => [...r]));
  const [fixed] = useState<boolean[][]>(() => initialPuzzle.map((r) => r.map((v) => v !== 0)));
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [won, setWon] = useState(false);

  const placeNumber = (n: number) => {
    if (!selected || won) return;
    const [r, c] = selected;
    if (fixed[r][c]) return;
    const newBoard = board.map((row) => [...row]);
    newBoard[r][c] = n;
    setBoard(newBoard);

    // Check win
    const complete = newBoard.every((row, ri) => row.every((v, ci) => v === solution[ri][ci]));
    if (complete) {
      setWon(true);
      addPoints(150);
      updateStreak();
      toast.success("Sudoku solved! +150 points");
    }
  };

  const isError = (r: number, c: number) => {
    if (board[r][c] === 0) return false;
    return board[r][c] !== solution[r][c];
  };

  const reset = () => {
    const { puzzle, solution: sol } = generateSudoku();
    setBoard(puzzle.map((r) => [...r]));
    setSelected(null);
    setWon(false);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="bg-muted/30 p-2 rounded-xl inline-block">
        {board.map((row, r) => (
          <div key={r} className="flex">
            {row.map((val, c) => (
              <div
                key={c}
                onClick={() => setSelected([r, c])}
                className={`w-8 h-8 flex items-center justify-center text-sm font-display cursor-pointer transition-colors
                  ${r % 3 === 0 ? "border-t-2 border-t-border" : "border-t border-t-border/30"}
                  ${c % 3 === 0 ? "border-l-2 border-l-border" : "border-l border-l-border/30"}
                  ${r === 8 ? "border-b-2 border-b-border" : ""}
                  ${c === 8 ? "border-r-2 border-r-border" : ""}
                  ${selected && selected[0] === r && selected[1] === c ? "bg-primary/30" : ""}
                  ${fixed[r][c] ? "text-foreground font-bold" : isError(r, c) ? "text-destructive" : "text-primary"}
                `}
              >
                {val > 0 ? val : ""}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="flex gap-1.5 flex-wrap justify-center">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button key={n} onClick={() => placeNumber(n)} className="w-8 h-8 bg-muted text-foreground rounded-lg font-display text-sm hover:bg-muted/80">
            {n}
          </button>
        ))}
        <button onClick={() => selected && placeNumber(0)} className="w-8 h-8 bg-destructive/20 text-destructive rounded-lg font-display text-xs hover:bg-destructive/30">
          ✕
        </button>
      </div>
      {won && (
        <button onClick={reset} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-display text-sm">
          NEW GAME
        </button>
      )}
    </div>
  );
};
