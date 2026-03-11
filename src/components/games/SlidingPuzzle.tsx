import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { addPoints, updateStreak, addWin } from "@/lib/streaks";
import { sfx } from "@/lib/sounds";
import { toast } from "sonner";
import { Clock, Eye } from "lucide-react";

const SIZE = 4;
const TOTAL = SIZE * SIZE;
const createSolved = () => [...Array(TOTAL - 1).keys()].map((i) => i + 1).concat(0);

const shuffle = (arr: number[]): number[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  let inversions = 0;
  for (let i = 0; i < a.length; i++)
    for (let j = i + 1; j < a.length; j++)
      if (a[i] && a[j] && a[i] > a[j]) inversions++;
  const blankRow = Math.floor(a.indexOf(0) / SIZE);
  const solvable = SIZE % 2 === 1 ? inversions % 2 === 0 : (inversions + blankRow) % 2 === 1;
  if (!solvable) {
    const i1 = a.findIndex((v) => v !== 0);
    const i2 = a.findIndex((v, idx) => v !== 0 && idx !== i1);
    [a[i1], a[i2]] = [a[i2], a[i1]];
  }
  return a;
};

const isSolved = (tiles: number[]) => tiles.every((v, i) => v === (i === tiles.length - 1 ? 0 : i + 1));

// Get neighbors (adjacent indices) of a position
const getNeighbors = (idx: number): number[] => {
  const r = Math.floor(idx / SIZE), c = idx % SIZE;
  const result: number[] = [];
  if (r > 0) result.push((r - 1) * SIZE + c);
  if (r < SIZE - 1) result.push((r + 1) * SIZE + c);
  if (c > 0) result.push(r * SIZE + (c - 1));
  if (c < SIZE - 1) result.push(r * SIZE + (c + 1));
  return result;
};

// Generate a sequence of moves (index swaps with blank) to solve the puzzle
// Uses a simple greedy approach: move each tile to its target one at a time
const generateSolveMoves = (startTiles: number[]): number[][] => {
  const snapshots: number[][] = [startTiles.map(v => v)];
  const tiles = [...startTiles];
  const solved = createSolved();

  // Simple approach: for each target position, move the correct tile there
  // by moving the blank to the tile, then the tile to the target
  // This is a simplified solver that works by direct swaps for visual effect
  for (let targetIdx = 0; targetIdx < TOTAL; targetIdx++) {
    const targetVal = solved[targetIdx];
    const currentIdx = tiles.indexOf(targetVal);
    if (currentIdx === targetIdx) continue;

    // Swap the tile at currentIdx with whatever is at targetIdx
    [tiles[targetIdx], tiles[currentIdx]] = [tiles[currentIdx], tiles[targetIdx]];
    snapshots.push([...tiles]);
  }

  return snapshots;
};

interface Props {
  level?: number;
  onComplete?: (score: number) => void;
}

export const SlidingPuzzle = ({ onComplete }: Props) => {
  const [tiles, setTiles] = useState<number[]>(() => shuffle(createSolved()));
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(true);
  const [solvingInProgress, setSolvingInProgress] = useState(false);
  const dragStart = useRef<{ index: number; x: number; y: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const solveTimeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (!running || won) { clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [running, won]);

  // Cleanup solve timeouts on unmount
  useEffect(() => {
    return () => solveTimeouts.current.forEach(clearTimeout);
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const tryMove = (index: number) => {
    if (won || solvingInProgress) return;
    const blankIdx = tiles.indexOf(0);
    const row = Math.floor(index / SIZE), col = index % SIZE;
    const bRow = Math.floor(blankIdx / SIZE), bCol = blankIdx % SIZE;
    if ((Math.abs(row - bRow) === 1 && col === bCol) || (Math.abs(col - bCol) === 1 && row === bRow)) {
      sfx.move();
      const newTiles = [...tiles];
      [newTiles[index], newTiles[blankIdx]] = [newTiles[blankIdx], newTiles[index]];
      setTiles(newTiles);
      setMoves((m) => m + 1);
      if (isSolved(newTiles)) {
        setWon(true);
        setRunning(false);
        sfx.levelComplete();
        const pts = Math.max(300 - elapsed - moves * 2, 20);
        addPoints(pts);
        updateStreak("sliding");
        addWin("sliding");
        toast.success(`Solved in ${formatTime(elapsed)}! +${pts} points`);
        onComplete?.(pts);
      }
    }
  };

  const handleViewSolution = useCallback(() => {
    if (won || solvingInProgress) return;
    setSolvingInProgress(true);
    setRunning(false);

    const snapshots = generateSolveMoves(tiles);

    // Animate through snapshots step by step
    snapshots.forEach((snapshot, i) => {
      if (i === 0) return; // skip initial state
      const timeout = setTimeout(() => {
        setTiles(snapshot);
        sfx.move();

        // Check if this is the last step
        if (i === snapshots.length - 1) {
          setTimeout(() => {
            toast.info("Solution revealed! No points awarded.");
            setSolvingInProgress(false);
          }, 300);
        }
      }, i * 400);
      solveTimeouts.current.push(timeout);
    });
  }, [tiles, won, solvingInProgress]);

  const handleMouseDown = (index: number, e: React.MouseEvent) => {
    if (tiles[index] === 0 || won || solvingInProgress) return;
    dragStart.current = { index, x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    const { index } = dragStart.current;
    dragStart.current = null;
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) { tryMove(index); return; }
    const blankIdx = tiles.indexOf(0);
    const row = Math.floor(index / SIZE), col = index % SIZE;
    const bRow = Math.floor(blankIdx / SIZE), bCol = blankIdx % SIZE;
    const dirToBlank = { dr: bRow - row, dc: bCol - col };
    if (Math.abs(dx) > Math.abs(dy)) {
      if ((dx > 0 && dirToBlank.dc === 1) || (dx < 0 && dirToBlank.dc === -1)) tryMove(index);
    } else {
      if ((dy > 0 && dirToBlank.dr === 1) || (dy < 0 && dirToBlank.dr === -1)) tryMove(index);
    }
  };

  const handleTouchStart = (index: number, e: React.TouchEvent) => {
    if (tiles[index] === 0 || won || solvingInProgress) return;
    const t = e.touches[0];
    dragStart.current = { index, x: t.clientX, y: t.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!dragStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - dragStart.current.x;
    const dy = t.clientY - dragStart.current.y;
    const { index } = dragStart.current;
    dragStart.current = null;
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) { tryMove(index); return; }
    const blankIdx = tiles.indexOf(0);
    const row = Math.floor(index / SIZE), col = index % SIZE;
    const bRow = Math.floor(blankIdx / SIZE), bCol = blankIdx % SIZE;
    const dirToBlank = { dr: bRow - row, dc: bCol - col };
    if (Math.abs(dx) > Math.abs(dy)) {
      if ((dx > 0 && dirToBlank.dc === 1) || (dx < 0 && dirToBlank.dc === -1)) tryMove(index);
    } else {
      if ((dy > 0 && dirToBlank.dr === 1) || (dy < 0 && dirToBlank.dr === -1)) tryMove(index);
    }
  };

  const reset = () => {
    sfx.click();
    solveTimeouts.current.forEach(clearTimeout);
    solveTimeouts.current = [];
    setSolvingInProgress(false);
    setTiles(shuffle(createSolved()));
    setMoves(0);
    setWon(false);
    setElapsed(0);
    setRunning(true);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-6 text-sm">
        <span className="text-muted-foreground">Moves: <span className="font-display text-foreground">{moves}</span></span>
        <span className="flex items-center gap-1 text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span className={`font-display ${elapsed > 120 ? "text-destructive" : elapsed > 60 ? "text-accent" : "text-foreground"}`}>{formatTime(elapsed)}</span>
        </span>
      </div>
      <div
        className="grid grid-cols-4 gap-2 bg-card p-3 rounded-xl border border-border select-none"
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { dragStart.current = null; }}
      >
        {tiles.map((val, i) => (
          <motion.div
            key={val || "blank"}
            layout
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            whileTap={val !== 0 && !solvingInProgress ? { scale: 0.9 } : {}}
            onMouseDown={(e) => handleMouseDown(i, e)}
            onTouchStart={(e) => handleTouchStart(i, e)}
            onTouchEnd={handleTouchEnd}
            className={`w-14 h-14 rounded-lg flex items-center justify-center font-display font-bold cursor-pointer transition-colors ${
              val === 0
                ? "bg-transparent"
                : won || (solvingInProgress && isSolved(tiles))
                ? "bg-primary/20 border-2 border-primary text-primary glow-primary"
                : solvingInProgress
                ? "bg-secondary/20 border-2 border-secondary/40 text-secondary"
                : "bg-card border-2 border-accent/40 text-accent hover:border-accent hover:glow-accent"
            }`}
          >
            {val > 0 ? val : ""}
          </motion.div>
        ))}
      </div>
      <div className="flex gap-3">
        <button onClick={reset} className="px-6 py-2 bg-card border border-border text-foreground rounded-xl font-display text-sm hover:border-primary/50 hover:glow-primary transition-all">
          {won ? "PLAY AGAIN" : "SHUFFLE"}
        </button>
        {!won && !solvingInProgress && (
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
      </div>
    </div>
  );
};
