import { useState, useMemo, useCallback } from "react";
import { addPoints, updateStreak, getGameLevel, incrementLevel, addWin } from "@/lib/streaks";
import { sfx } from "@/lib/sounds";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Eye } from "lucide-react";

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
  const [isRemoving, setIsRemoving] = useState(false);
  const [showingSolution, setShowingSolution] = useState(false);
  const [revealedCells, setRevealedCells] = useState<boolean[][]>(() =>
    Array.from({ length: 9 }, () => Array(9).fill(false))
  );

  // Track which cells the player has filled (non-fixed, non-zero)
  const hasPlayerPlacedCells = board.some((row, r) =>
    row.some((val, c) => !fixed[r][c] && val !== 0)
  );

  const placeNumber = (n: number) => {
    if (!selected || won || showingSolution) return;
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

  const handleViewSolution = useCallback(() => {
    if (won || showingSolution) return;

    // If player has placed numbers, animate them away first
    if (hasPlayerPlacedCells) {
      setIsRemoving(true);
      sfx.click();

      setTimeout(() => {
        // Clear all player-placed cells
        const clearedBoard = board.map((row, r) =>
          row.map((val, c) => (fixed[r][c] ? val : 0))
        );
        setBoard(clearedBoard);
        setIsRemoving(false);
        setSelected(null);

        // Now reveal solution step by step
        startSolutionReveal(clearedBoard);
      }, 600);
    } else {
      startSolutionReveal(board);
    }
  }, [won, showingSolution, hasPlayerPlacedCells, board, fixed, solution]);

  const startSolutionReveal = useCallback((currentBoard: number[][]) => {
    setShowingSolution(true);

    // Collect all empty cells
    const emptyCells: [number, number][] = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (currentBoard[r][c] === 0) {
          emptyCells.push([r, c]);
        }
      }
    }

    // Reveal cells one by one with delay
    emptyCells.forEach(([r, c], index) => {
      setTimeout(() => {
        setBoard((prev) => {
          const newBoard = prev.map((row) => [...row]);
          newBoard[r][c] = solution[r][c];
          return newBoard;
        });
        setRevealedCells((prev) => {
          const next = prev.map((row) => [...row]);
          next[r][c] = true;
          return next;
        });
        sfx.click();
      }, 50 * (index + 1));
    });

    setTimeout(() => {
      toast.info("Solution revealed! No points awarded.");
    }, 50 * emptyCells.length + 200);
  }, [solution]);

  const isError = (r: number, c: number) => board[r][c] !== 0 && board[r][c] !== solution[r][c];
  const isPlayerCell = (r: number, c: number) => !fixed[r][c] && board[r][c] !== 0;

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
              <motion.div
                key={c}
                onClick={() => { if (!showingSolution) { setSelected([r, c]); sfx.click(); } }}
                animate={
                  isRemoving && isPlayerCell(r, c)
                    ? { scale: 0, opacity: 0, rotate: 180 }
                    : revealedCells[r][c]
                    ? { scale: [0, 1.2, 1], opacity: [0, 1, 1] }
                    : { scale: 1, opacity: 1, rotate: 0 }
                }
                transition={
                  isRemoving && isPlayerCell(r, c)
                    ? { duration: 0.5, ease: "easeIn" }
                    : revealedCells[r][c]
                    ? { duration: 0.3, ease: "easeOut" }
                    : { duration: 0.15 }
                }
                className={`w-8 h-8 flex items-center justify-center text-sm font-display cursor-pointer transition-colors
                  ${r % 3 === 0 ? "border-t-2 border-t-border" : "border-t border-t-border/20"}
                  ${c % 3 === 0 ? "border-l-2 border-l-border" : "border-l border-l-border/20"}
                  ${r === 8 ? "border-b-2 border-b-border" : ""}
                  ${c === 8 ? "border-r-2 border-r-border" : ""}
                  ${selected && selected[0] === r && selected[1] === c ? "bg-primary/20 shadow-[inset_0_0_10px_hsl(var(--primary)/0.3)]" : ""}
                  ${fixed[r][c] ? "text-foreground font-bold" : revealedCells[r][c] ? "text-secondary" : isError(r, c) ? "text-destructive" : "text-primary"}
                `}
              >
                {val > 0 ? val : ""}
              </motion.div>
            ))}
          </div>
        ))}
      </div>

      {!showingSolution && (
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
      )}

      {!won && !showingSolution && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleViewSolution}
          className="flex items-center gap-2 px-4 py-2 bg-secondary/10 border border-secondary/30 text-secondary rounded-xl font-display text-xs hover:bg-secondary/20 hover:border-secondary/50 transition-all"
        >
          <Eye className="h-4 w-4" />
          VIEW SOLUTION
        </motion.button>
      )}

      {won && (
        <button onClick={() => window.location.reload()} className="px-6 py-2 bg-primary text-primary-foreground rounded-xl font-display text-sm glow-primary">
          NEXT LEVEL →
        </button>
      )}
    </div>
  );
};
