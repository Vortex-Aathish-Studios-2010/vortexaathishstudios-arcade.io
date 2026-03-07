import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { addPoints, updateStreak } from "@/lib/streaks";
import { toast } from "sonner";

const COLS = 10;
const ROWS = 20;
const SHAPES = [
  [[1, 1, 1, 1]],
  [[1, 1], [1, 1]],
  [[0, 1, 0], [1, 1, 1]],
  [[1, 0, 0], [1, 1, 1]],
  [[0, 0, 1], [1, 1, 1]],
  [[1, 1, 0], [0, 1, 1]],
  [[0, 1, 1], [1, 1, 0]],
];

const COLORS = [
  "bg-primary", "bg-secondary", "bg-accent",
  "bg-primary/70", "bg-secondary/70", "bg-accent/70", "bg-primary/50",
];

type Board = number[][];
type Piece = { shape: number[][]; x: number; y: number; color: number };

const createBoard = (): Board => Array.from({ length: ROWS }, () => Array(COLS).fill(0));

const rotate = (shape: number[][]): number[][] => {
  const rows = shape.length, cols = shape[0].length;
  return Array.from({ length: cols }, (_, c) =>
    Array.from({ length: rows }, (_, r) => shape[rows - 1 - r][c])
  );
};

const collides = (board: Board, piece: Piece): boolean => {
  for (let r = 0; r < piece.shape.length; r++)
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (!piece.shape[r][c]) continue;
      const nr = piece.y + r, nc = piece.x + c;
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) return true;
      if (board[nr][nc]) return true;
    }
  return false;
};

const merge = (board: Board, piece: Piece): Board => {
  const b = board.map((r) => [...r]);
  for (let r = 0; r < piece.shape.length; r++)
    for (let c = 0; c < piece.shape[r].length; c++)
      if (piece.shape[r][c]) b[piece.y + r][piece.x + c] = piece.color + 1;
  return b;
};

const clearLines = (board: Board): [Board, number] => {
  const remaining = board.filter((row) => row.some((v) => v === 0));
  const cleared = ROWS - remaining.length;
  const newRows = Array.from({ length: cleared }, () => Array(COLS).fill(0));
  return [[...newRows, ...remaining], cleared];
};

const randomPiece = (): Piece => {
  const idx = Math.floor(Math.random() * SHAPES.length);
  return { shape: SHAPES[idx], x: Math.floor(COLS / 2) - 1, y: 0, color: idx };
};

export const BlockStack = () => {
  const [board, setBoard] = useState<Board>(createBoard);
  const [piece, setPiece] = useState<Piece>(randomPiece);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const drop = useCallback(() => {
    setPiece((prev) => {
      const next = { ...prev, y: prev.y + 1 };
      if (!collides(board, next)) return next;
      const merged = merge(board, prev);
      const [cleared, lines] = clearLines(merged);
      setBoard(cleared);
      const pts = lines * lines * 100;
      if (pts > 0) setScore((s) => s + pts);
      const np = randomPiece();
      if (collides(cleared, np)) {
        setGameOver(true);
        setScore((s) => {
          addPoints(s + pts);
          updateStreak("tetris");
          toast.info(`Game Over! +${s + pts} points`);
          return s + pts;
        });
      }
      return np;
    });
  }, [board]);

  useEffect(() => {
    if (gameOver) { clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(drop, 500);
    return () => clearInterval(intervalRef.current);
  }, [drop, gameOver]);

  const movePiece = useCallback((dx: number, dy: number, rot = false) => {
    if (gameOver) return;
    setPiece((prev) => {
      let next = { ...prev };
      if (rot) next = { ...next, shape: rotate(prev.shape) };
      else next = { ...next, x: prev.x + dx, y: prev.y + dy };
      return collides(board, next) ? prev : next;
    });
  }, [board, gameOver]);

  const hardDrop = useCallback(() => {
    if (gameOver) return;
    setPiece((prev) => {
      let y = prev.y;
      while (!collides(board, { ...prev, y: y + 1 })) y++;
      return { ...prev, y };
    });
    setTimeout(drop, 10);
  }, [board, gameOver, drop]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const map: Record<string, () => void> = {
        ArrowLeft: () => movePiece(-1, 0),
        ArrowRight: () => movePiece(1, 0),
        ArrowDown: () => movePiece(0, 1),
        ArrowUp: () => movePiece(0, 0, true),
        " ": hardDrop,
      };
      if (map[e.key]) { e.preventDefault(); map[e.key](); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [movePiece, hardDrop]);

  const reset = () => { setBoard(createBoard()); setPiece(randomPiece()); setScore(0); setGameOver(false); };

  const renderBoard = () => {
    const display = board.map((r) => [...r]);
    for (let r = 0; r < piece.shape.length; r++)
      for (let c = 0; c < piece.shape[r].length; c++)
        if (piece.shape[r][c]) {
          const nr = piece.y + r, nc = piece.x + c;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) display[nr][nc] = piece.color + 1;
        }
    return display;
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-sm text-muted-foreground">Score: <span className="font-display text-foreground">{score}</span></div>
      <div className="bg-card border border-border p-1 rounded-xl inline-block">
        {renderBoard().map((row, r) => (
          <div key={r} className="flex">
            {row.map((cell, c) => (
              <div key={c} className={`w-5 h-5 border border-border/10 rounded-sm transition-colors ${cell ? `${COLORS[cell - 1]} shadow-[0_0_6px_hsl(var(--primary)/0.3)]` : "bg-background/30"}`} />
            ))}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={() => movePiece(-1, 0)} className="px-3 py-2 bg-card border border-border text-foreground rounded-lg font-display text-xs hover:border-primary/50 transition-colors">←</button>
        <button onClick={() => movePiece(0, 0, true)} className="px-3 py-2 bg-card border border-border text-foreground rounded-lg font-display text-xs hover:border-secondary/50 transition-colors">↻</button>
        <button onClick={() => movePiece(1, 0)} className="px-3 py-2 bg-card border border-border text-foreground rounded-lg font-display text-xs hover:border-primary/50 transition-colors">→</button>
        <button onClick={() => movePiece(0, 1)} className="px-3 py-2 bg-card border border-border text-foreground rounded-lg font-display text-xs hover:border-accent/50 transition-colors">↓</button>
        <button onClick={hardDrop} className="px-3 py-2 bg-primary/20 border border-primary/40 text-primary rounded-lg font-display text-xs hover:glow-primary transition-all">DROP</button>
      </div>
      <p className="text-xs text-muted-foreground">Arrow keys + Space to drop</p>
      {gameOver && (
        <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} onClick={reset} className="px-6 py-2 bg-primary text-primary-foreground rounded-xl font-display text-sm glow-primary">
          PLAY AGAIN
        </motion.button>
      )}
    </div>
  );
};
