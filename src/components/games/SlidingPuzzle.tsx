import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { addPoints, updateStreak } from "@/lib/streaks";
import { toast } from "sonner";

const SIZE = 4;
const createSolved = () => [...Array(SIZE * SIZE - 1).keys()].map((i) => i + 1).concat(0);

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

export const SlidingPuzzle = () => {
  const [tiles, setTiles] = useState<number[]>(() => shuffle(createSolved()));
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const dragStart = useRef<{ index: number; x: number; y: number } | null>(null);

  const tryMove = (index: number) => {
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
        updateStreak("sliding");
        toast.success(`Puzzle solved! +${pts} points`);
      }
    }
  };

  const handleMouseDown = (index: number, e: React.MouseEvent) => {
    if (tiles[index] === 0 || won) return;
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
    if (tiles[index] === 0 || won) return;
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

  const reset = () => { setTiles(shuffle(createSolved())); setMoves(0); setWon(false); };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-sm text-muted-foreground">Moves: <span className="font-display text-foreground">{moves}</span></div>
      <div
        className="grid grid-cols-4 gap-2 bg-card p-3 rounded-xl border border-border select-none"
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { dragStart.current = null; }}
      >
        {tiles.map((val, i) => (
          <motion.div
            key={i}
            layout
            whileTap={val !== 0 ? { scale: 0.9 } : {}}
            onMouseDown={(e) => handleMouseDown(i, e)}
            onTouchStart={(e) => handleTouchStart(i, e)}
            onTouchEnd={handleTouchEnd}
            className={`w-14 h-14 rounded-lg flex items-center justify-center font-display font-bold cursor-pointer transition-all ${
              val === 0
                ? "bg-transparent"
                : won
                ? "bg-primary/20 border-2 border-primary text-primary glow-primary"
                : "bg-card border-2 border-accent/40 text-accent hover:border-accent hover:glow-accent"
            }`}
          >
            {val > 0 ? val : ""}
          </motion.div>
        ))}
      </div>
      <button onClick={reset} className="px-6 py-2 bg-card border border-border text-foreground rounded-xl font-display text-sm hover:border-primary/50 hover:glow-primary transition-all">
        {won ? "PLAY AGAIN" : "SHUFFLE"}
      </button>
    </div>
  );
};
