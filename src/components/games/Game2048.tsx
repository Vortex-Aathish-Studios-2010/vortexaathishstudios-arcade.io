import { useState, useEffect, useCallback } from "react";
import { addPoints, updateStreak } from "@/lib/streaks";
import { toast } from "sonner";

type Board = number[][];

const SIZE = 4;

const createEmpty = (): Board => Array.from({ length: SIZE }, () => Array(SIZE).fill(0));

const addRandom = (board: Board): Board => {
  const b = board.map((r) => [...r]);
  const empty: [number, number][] = [];
  b.forEach((row, r) => row.forEach((v, c) => { if (v === 0) empty.push([r, c]); }));
  if (empty.length === 0) return b;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  b[r][c] = Math.random() < 0.9 ? 2 : 4;
  return b;
};

const slide = (row: number[]): [number[], number] => {
  let score = 0;
  const filtered = row.filter((v) => v !== 0);
  const result: number[] = [];
  for (let i = 0; i < filtered.length; i++) {
    if (i < filtered.length - 1 && filtered[i] === filtered[i + 1]) {
      const merged = filtered[i] * 2;
      result.push(merged);
      score += merged;
      i++;
    } else {
      result.push(filtered[i]);
    }
  }
  while (result.length < SIZE) result.push(0);
  return [result, score];
};

const moveLeft = (board: Board): [Board, number] => {
  let totalScore = 0;
  const newBoard = board.map((row) => {
    const [newRow, score] = slide(row);
    totalScore += score;
    return newRow;
  });
  return [newBoard, totalScore];
};

const rotate90 = (board: Board): Board => {
  const n = board.length;
  return board[0].map((_, c) => board.map((row) => row[c]).reverse());
};

const move = (board: Board, dir: string): [Board, number] => {
  let b = board.map((r) => [...r]);
  let rotations = { left: 0, up: 1, right: 2, down: 3 }[dir] || 0;
  for (let i = 0; i < rotations; i++) b = rotate90(b);
  const [moved, score] = moveLeft(b);
  let result = moved;
  for (let i = 0; i < (4 - rotations) % 4; i++) result = rotate90(result);
  return [result, score];
};

const boardsEqual = (a: Board, b: Board) => a.every((row, r) => row.every((v, c) => v === b[r][c]));

const canMove = (board: Board): boolean => {
  for (const dir of ["left", "right", "up", "down"]) {
    const [moved] = move(board, dir);
    if (!boardsEqual(board, moved)) return true;
  }
  return false;
};

const tileColors: Record<number, string> = {
  0: "bg-muted/50",
  2: "bg-primary/20 text-primary",
  4: "bg-primary/30 text-primary",
  8: "bg-primary/50 text-primary-foreground",
  16: "bg-primary/70 text-primary-foreground",
  32: "bg-secondary/50 text-secondary-foreground",
  64: "bg-secondary/70 text-secondary-foreground",
  128: "bg-accent/50 text-accent-foreground",
  256: "bg-accent/70 text-accent-foreground",
  512: "bg-accent/90 text-accent-foreground",
  1024: "bg-primary text-primary-foreground",
  2048: "bg-secondary text-secondary-foreground",
};

export const Game2048 = () => {
  const [board, setBoard] = useState<Board>(() => addRandom(addRandom(createEmpty())));
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const handleMove = useCallback((dir: string) => {
    if (gameOver) return;
    setBoard((prev) => {
      const [moved, pts] = move(prev, dir);
      if (boardsEqual(prev, moved)) return prev;
      const withNew = addRandom(moved);
      setScore((s) => s + pts);
      if (!canMove(withNew)) {
        setGameOver(true);
        addPoints(score + pts);
        updateStreak();
        toast.info(`Game Over! +${score + pts} points`);
      }
      return withNew;
    });
  }, [gameOver, score]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const map: Record<string, string> = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down" };
      if (map[e.key]) { e.preventDefault(); handleMove(map[e.key]); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleMove]);

  // Touch support
  useEffect(() => {
    let startX = 0, startY = 0;
    const onStart = (e: TouchEvent) => { startX = e.touches[0].clientX; startY = e.touches[0].clientY; };
    const onEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return;
      if (Math.abs(dx) > Math.abs(dy)) handleMove(dx > 0 ? "right" : "left");
      else handleMove(dy > 0 ? "down" : "up");
    };
    window.addEventListener("touchstart", onStart);
    window.addEventListener("touchend", onEnd);
    return () => { window.removeEventListener("touchstart", onStart); window.removeEventListener("touchend", onEnd); };
  }, [handleMove]);

  const reset = () => { setBoard(addRandom(addRandom(createEmpty()))); setScore(0); setGameOver(false); };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-sm text-muted-foreground">Score: <span className="font-display text-foreground">{score}</span></div>
      <div className="grid grid-cols-4 gap-2 bg-muted/30 p-3 rounded-xl">
        {board.flat().map((val, i) => (
          <div key={i} className={`w-16 h-16 rounded-lg flex items-center justify-center font-display font-bold text-sm transition-all ${tileColors[val] || "bg-primary text-primary-foreground"}`}>
            {val > 0 ? val : ""}
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Use arrow keys or swipe</p>
      {gameOver && (
        <button onClick={reset} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-display text-sm">
          PLAY AGAIN
        </button>
      )}
    </div>
  );
};
