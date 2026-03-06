import { useState, useEffect, useCallback, useRef } from "react";
import { addPoints, updateStreak } from "@/lib/streaks";
import { toast } from "sonner";

const COLS = 20;
const ROWS = 15;
const INITIAL_SPEED = 150;

type Pos = [number, number];

const randomFood = (snake: Pos[]): Pos => {
  const occupied = new Set(snake.map(([r, c]) => `${r},${c}`));
  let pos: Pos;
  do {
    pos = [Math.floor(Math.random() * ROWS), Math.floor(Math.random() * COLS)];
  } while (occupied.has(`${pos[0]},${pos[1]}`));
  return pos;
};

export const SnakeGame = () => {
  const [snake, setSnake] = useState<Pos[]>([[7, 10], [7, 9], [7, 8]]);
  const [food, setFood] = useState<Pos>(() => randomFood([[7, 10], [7, 9], [7, 8]]));
  const [dir, setDir] = useState<Pos>([0, 1]);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [started, setStarted] = useState(false);
  const dirRef = useRef<Pos>([0, 1]);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const tick = useCallback(() => {
    setSnake((prev) => {
      const d = dirRef.current;
      const head: Pos = [prev[0][0] + d[0], prev[0][1] + d[1]];

      // Wall collision
      if (head[0] < 0 || head[0] >= ROWS || head[1] < 0 || head[1] >= COLS) {
        setGameOver(true);
        setScore((s) => { addPoints(s); updateStreak(); toast.info(`Game Over! +${s} points`); return s; });
        return prev;
      }

      // Self collision
      if (prev.some(([r, c]) => r === head[0] && c === head[1])) {
        setGameOver(true);
        setScore((s) => { addPoints(s); updateStreak(); toast.info(`Game Over! +${s} points`); return s; });
        return prev;
      }

      const newSnake = [head, ...prev];
      if (head[0] === food[0] && head[1] === food[1]) {
        setFood(randomFood(newSnake));
        setScore((s) => s + 10);
      } else {
        newSnake.pop();
      }
      return newSnake;
    });
  }, [food]);

  useEffect(() => {
    if (!started || gameOver) { clearInterval(intervalRef.current); return; }
    const speed = Math.max(INITIAL_SPEED - score, 60);
    intervalRef.current = setInterval(tick, speed);
    return () => clearInterval(intervalRef.current);
  }, [tick, gameOver, started, score]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const map: Record<string, Pos> = {
        ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1],
      };
      if (map[e.key]) {
        e.preventDefault();
        if (!started) setStarted(true);
        const [dr, dc] = map[e.key];
        if (dirRef.current[0] + dr !== 0 || dirRef.current[1] + dc !== 0) {
          dirRef.current = [dr, dc];
          setDir([dr, dc]);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [started]);

  // Touch
  useEffect(() => {
    let sx = 0, sy = 0;
    const onStart = (e: TouchEvent) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; };
    const onEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
      if (!started) setStarted(true);
      let nd: Pos;
      if (Math.abs(dx) > Math.abs(dy)) nd = dx > 0 ? [0, 1] : [0, -1];
      else nd = dy > 0 ? [1, 0] : [-1, 0];
      if (dirRef.current[0] + nd[0] !== 0 || dirRef.current[1] + nd[1] !== 0) {
        dirRef.current = nd;
        setDir(nd);
      }
    };
    window.addEventListener("touchstart", onStart);
    window.addEventListener("touchend", onEnd);
    return () => { window.removeEventListener("touchstart", onStart); window.removeEventListener("touchend", onEnd); };
  }, [started]);

  const reset = () => {
    const initial: Pos[] = [[7, 10], [7, 9], [7, 8]];
    setSnake(initial);
    setFood(randomFood(initial));
    dirRef.current = [0, 1];
    setDir([0, 1]);
    setGameOver(false);
    setScore(0);
    setStarted(false);
  };

  const snakeSet = new Set(snake.map(([r, c]) => `${r},${c}`));

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-sm text-muted-foreground">Score: <span className="font-display text-foreground">{score}</span></div>
      <div className="bg-muted/30 p-1 rounded-xl inline-block">
        {Array.from({ length: ROWS }, (_, r) => (
          <div key={r} className="flex">
            {Array.from({ length: COLS }, (_, c) => {
              const isHead = snake[0][0] === r && snake[0][1] === c;
              const isSnake = snakeSet.has(`${r},${c}`);
              const isFood = food[0] === r && food[1] === c;
              return (
                <div key={c} className={`w-4 h-4 rounded-sm transition-colors ${
                  isHead ? "bg-primary" : isSnake ? "bg-primary/60" : isFood ? "bg-destructive" : "bg-background/30"
                }`} />
              );
            })}
          </div>
        ))}
      </div>
      {!started && !gameOver && (
        <p className="text-sm text-muted-foreground font-display animate-pulse">Press any arrow key or swipe to start</p>
      )}
      <p className="text-xs text-muted-foreground">Arrow keys or swipe to move</p>
      {gameOver && (
        <button onClick={reset} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-display text-sm">
          PLAY AGAIN
        </button>
      )}
    </div>
  );
};
