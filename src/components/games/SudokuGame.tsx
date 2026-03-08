import { useState, useMemo } from "react";
import { addPoints, updateStreak, getGameLevel, incrementLevel, addWin } from "@/lib/streaks";
import { sfx } from "@/lib/sounds";
import { toast } from "sonner";

const getDifficulty = (level: number): { removed: number; label: string } => {
  if (level <= 1) return { removed: 30, label: "Easy" };
  if (level === 2) return { removed: 38, label: "Medium" };
  if (level === 3) return { removed: 45, label: "Hard" };
  if (level === 4) return { removed: 52, label: "Expert" };
  return { removed: Math.min(58, 45 + level * 2), label: "Master" };
};

const generateSudoku = (removedCount: number): { puzzle: number[][]; solution: number[][] } => {
  const board: number[][] = Array.from({ length: 9 }, () => Array(9).fill(0));
  const isValid = (b: number[][], r: number, c: number, n: number) => {
    for (let i = 0; i < 9; i++) if (b[r][i] === n || b[i][c] === n) return false;
    const br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
    for (let i = br; i < br + 3; i++) for (let j = bc; j < bc + 3; j++) if (b[i][j] === n) return false;
    return true;
  };
  const solve = (b: number[][]): boolean => {
    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
      if (b[r][c] === 0) {
        const nums = [1,2,3,4,5,6,7,8,9].sort(() => Math.random() - 0.5);
        for (const n of nums) { if (isValid(b, r, c, n)) { b[r][c] = n; if (solve(b)) return true; b[r][c] = 0; } }
        return false;
      }
    }
    return true;
  };
  solve(board);
  const solution = board.map((r) => [...r]);
  const cells = Array.from({ length: 81 }, (_, i) => i).sort(() => Math.random() - 0.5);
  let removed = 0;
  for (const idx of cells) { if (removed >= removedCount) break; board[Math.floor(idx / 9)][idx % 9] = 0; removed++; }
  return { puzzle: board, solution };
};

interface Props {
  level?: number;
  onComplete?: (score: number) => void;
}

export const SudokuGame = ({ level: propLevel, onComplete }: Props) => {
  const currentLevel = propLevel || getGameLevel("sudoku");
  const difficulty = getDifficulty(currentLevel);
  const { puzzle: initialPuzzle, solution } = useMemo(() => generateSudoku(difficulty.removed), [currentLevel]);
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
    if (n !== 0 && n === solution[r][c]) sfx.correct();
    else if (n !== 0) sfx.error();
    else sfx.click();
    if (newBoard.every((row, ri) => row.every((v, ci) => v === solution[ri][ci]))) {
      setWon(true);
      sfx.levelComplete();
      const pts = 100 + currentLevel * 50;
      addPoints(pts);
      updateStreak("sudoku");
      addWin("sudoku");
      incrementLevel("sudoku");
      toast.success(`${difficulty.label} Sudoku solved! +${pts} points`);
      onComplete?.(pts);
    }
  };

  const isError = (r: number, c: number) => board[r][c] !== 0 && board[r][c] !== solution[r][c];

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-4 text-sm">
        <span className="text-muted-foreground">Difficulty: <span className="font-display text-primary">{difficulty.label}</span></span>
        <span className="text-muted-foreground">Level: <span className="font-display text-accent">{currentLevel}</span></span>
      </div>
      <div className="bg-card border border-border p-2 rounded-xl inline-block">
        {board.map((row, r) => (
          <div key={r} className="flex">
            {row.map((val, c) => (
              <div
                key={c}
                onClick={() => { setSelected([r, c]); sfx.click(); }}
                className={`w-8 h-8 flex items-center justify-center text-sm font-display cursor-pointer transition-all
                  ${r % 3 === 0 ? "border-t-2 border-t-border" : "border-t border-t-border/20"}
                  ${c % 3 === 0 ? "border-l-2 border-l-border" : "border-l border-l-border/20"}
                  ${r === 8 ? "border-b-2 border-b-border" : ""}
                  ${c === 8 ? "border-r-2 border-r-border" : ""}
                  ${selected && selected[0] === r && selected[1] === c ? "bg-primary/20 shadow-[inset_0_0_10px_hsl(var(--primary)/0.3)]" : ""}
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
        {[1,2,3,4,5,6,7,8,9].map((n) => (
          <button key={n} onClick={() => placeNumber(n)} className="w-9 h-9 bg-card border border-border text-foreground rounded-lg font-display text-sm hover:border-primary/50 hover:text-primary transition-all">
            {n}
          </button>
        ))}
        <button onClick={() => selected && placeNumber(0)} className="w-9 h-9 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg font-display text-xs hover:bg-destructive/20 transition-all">
          ✕
        </button>
      </div>
      {won && (
        <button onClick={() => window.location.reload()} className="px-6 py-2 bg-primary text-primary-foreground rounded-xl font-display text-sm glow-primary">
          NEXT LEVEL →
        </button>
      )}
    </div>
  );
};
