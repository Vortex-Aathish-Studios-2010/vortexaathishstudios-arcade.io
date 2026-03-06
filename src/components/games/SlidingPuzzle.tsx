import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { addPoints, updateStreak } from "@/lib/streaks";
import { toast } from "sonner";

const SIZE = 4;

const createSolved = () => [...Array(SIZE * SIZE - 1).keys()].map((i) => i + 1).concat(0);

const shuffle = (arr: number[]): number[] => {
  const a = [...arr];
  let inversions = 0;
  // Fisher-Yates with solvability check
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  // Check solvability
  for (let i = 0; i < a.length; i++) {
    for (let j = i + 1; j < a.length; j++) {
      if (a[i] && a[j] && a[i] > a[j]) inversions++;
    }
  }
  const blankRow = Math.floor(a.indexOf(0) / SIZE);
  const solvable = SIZE % 2 === 1 ? inversions % 2 === 0 : (inversions + blankRow) % 2 === 1;
  if (!solvable) {
    // Swap first two non-zero tiles
    const i1 = a.findIndex((v) => v !== 0);
    const i2 = a.findIndex((v, idx) => v !== 0 && idx !== i1);
    [a[i1], a[i2]] = [a[i2], a[i1]];
  }
  return a;
};

const isSolved = (tiles: number[]) => tiles.every((v, i) => v === (i === tiles.length - 1 ? 0 : i + 1));

export const SlidingPuzzle = () => {
  const [tiles, setTiles] = useState<number[]>(() => shuffle(createSolved()));
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);

  const handleClick = (index: number) => {
    if (won) return;
    const blankIdx = tiles.indexOf(0);
    const row = Math.floor(index / SIZE), col = index % SIZE;
    const bRow = Math.floor(blankIdx / SIZE), bCol = blankIdx % SIZE;
    
    if ((Math.abs(row - bRow) === 1 && col === bCol) || (Math.abs(col - bCol) === 1 && row === bRow)) {
      const newTiles = [...tiles];
      [newTiles[index], newTiles[blankIdx]] = [newTiles[blankIdx], newTiles[index]];
      setTiles(newTiles);
      setMoves((m) => m + 1);
      
      if (isSolved(newTiles)) {
        setWon(true);
        const pts = Math.max(200 - moves * 2, 30);
        addPoints(pts);
        updateStreak();
        toast.success(`Puzzle solved! +${pts} points`);
      }
    }
  };

  const reset = () => { setTiles(shuffle(createSolved())); setMoves(0); setWon(false); };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-sm text-muted-foreground">Moves: <span className="font-display text-foreground">{moves}</span></div>
      <div className="grid grid-cols-4 gap-1.5 bg-muted/30 p-3 rounded-xl">
        {tiles.map((val, i) => (
          <motion.div
            key={i}
            whileTap={val !== 0 ? { scale: 0.9 } : {}}
            onClick={() => handleClick(i)}
            className={`w-14 h-14 rounded-lg flex items-center justify-center font-display font-bold cursor-pointer transition-colors ${
              val === 0 ? "bg-transparent" : "bg-accent/20 border border-accent/40 text-accent hover:bg-accent/30"
            }`}
          >
            {val > 0 ? val : ""}
          </motion.div>
        ))}
      </div>
      <button onClick={reset} className="px-6 py-2 bg-muted text-foreground rounded-lg font-display text-sm hover:bg-muted/80">
        {won ? "PLAY AGAIN" : "SHUFFLE"}
      </button>
    </div>
  );
};
