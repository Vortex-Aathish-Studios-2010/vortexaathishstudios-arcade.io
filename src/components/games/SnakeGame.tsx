import { useState, useEffect, useCallback, useRef } from "react";
import { addPoints, updateStreak, addLoss } from "@/lib/streaks";
import { toast } from "sonner";

const COLS = 25;
const ROWS = 20;
const INITIAL_SPEED = 140;
type Pos = [number, number];

const randomFood = (snake: Pos[], obstacles: Set<string>): Pos => {
  const occupied = new Set([...snake.map(([r, c]) => `${r},${c}`), ...obstacles]);
  let pos: Pos;
  do { pos = [Math.floor(Math.random() * ROWS), Math.floor(Math.random() * COLS)]; } while (occupied.has(`${pos[0]},${pos[1]}`));
  return pos;
};

const generateObstacles = (count: number, snake: Pos[], food: Pos): Set<string> => {
  const occupied = new Set(snake.map(([r, c]) => `${r},${c}`));
  occupied.add(`${food[0]},${food[1]}`);
  const obs = new Set<string>();
  let attempts = 0;
  while (obs.size < count && attempts < 500) {
    const r = Math.floor(Math.random() * ROWS);
    const c = Math.floor(Math.random() * COLS);
    const key = `${r},${c}`;
    if (!occupied.has(key) && !obs.has(key)) obs.add(key);
    attempts++;
  }
  return obs;
};

interface Props {
  level?: number;
  onComplete?: (score: number) => void;
}

export const SnakeGame = ({ onComplete }: Props) => {
  const initialSnake: Pos[] = [[10, 12], [10, 11], [10, 10]];
  const [snake, setSnake] = useState<Pos[]>(initialSnake);
  const [food, setFood] = useState<Pos>(() => randomFood(initialSnake, new Set()));
  const [dir, setDir] = useState<Pos>([0, 1]);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [started, setStarted] = useState(false);
  const [obstacles, setObstacles] = useState<Set<string>>(new Set());
  const dirRef = useRef<Pos>([0, 1]);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  // Points per food increase with length, obstacles appear as snake grows
  const getPointsPerFood = () => 10 + Math.floor(snake.length / 5) * 5;

  const tick = useCallback(() => {
    setSnake((prev) => {
      const d = dirRef.current;
      const head: Pos = [prev[0][0] + d[0], prev[0][1] + d[1]];
      if (head[0] < 0 || head[0] >= ROWS || head[1] < 0 || head[1] >= COLS) {
        setGameOver(true);
        setScore((s) => { addPoints(s); updateStreak("snake"); addLoss("snake"); toast.info(`Game Over! +${s} points`); onComplete?.(s); return s; });
        return prev;
      }
      if (prev.some(([r, c]) => r === head[0] && c === head[1])) {
        setGameOver(true);
        setScore((s) => { addPoints(s); updateStreak("snake"); addLoss("snake"); toast.info(`Game Over! +${s} points`); onComplete?.(s); return s; });
        return prev;
      }
      if (obstacles.has(`${head[0]},${head[1]}`)) {
        setGameOver(true);
        setScore((s) => { addPoints(s); updateStreak("snake"); addLoss("snake"); toast.info(`Hit obstacle! +${s} points`); onComplete?.(s); return s; });
        return prev;
      }
      const newSnake = [head, ...prev];
      if (head[0] === food[0] && head[1] === food[1]) {
        const pts = getPointsPerFood();
        setScore((s) => s + pts);
        // Add obstacles every 5 foods eaten
        if (newSnake.length % 5 === 0) {
          const newObs = generateObstacles(2, newSnake, food);
          setObstacles((o) => new Set([...o, ...newObs]));
        }
        setFood(randomFood(newSnake, obstacles));
      } else newSnake.pop();
      return newSnake;
    });
  }, [food, obstacles]);

  useEffect(() => {
    if (!started || gameOver) { clearInterval(intervalRef.current); return; }
    // Speed increases with length
    const speed = Math.max(INITIAL_SPEED - (snake.length - 3) * 3, 50);
    intervalRef.current = setInterval(tick, speed);
    return () => clearInterval(intervalRef.current);
  }, [tick, gameOver, started, snake.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const map: Record<string, Pos> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
      if (map[e.key]) {
        e.preventDefault();
        if (!started) setStarted(true);
        const [dr, dc] = map[e.key];
        if (dirRef.current[0] + dr !== 0 || dirRef.current[1] + dc !== 0) { dirRef.current = [dr, dc]; setDir([dr, dc]); }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [started]);

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
      if (dirRef.current[0] + nd[0] !== 0 || dirRef.current[1] + nd[1] !== 0) { dirRef.current = nd; setDir(nd); }
    };
    window.addEventListener("touchstart", onStart);
    window.addEventListener("touchend", onEnd);
    return () => { window.removeEventListener("touchstart", onStart); window.removeEventListener("touchend", onEnd); };
  }, [started]);

  const reset = () => {
    setSnake(initialSnake); setFood(randomFood(initialSnake, new Set())); dirRef.current = [0, 1]; setDir([0, 1]); setGameOver(false); setScore(0); setStarted(false); setObstacles(new Set());
  };

  const snakeSet = new Set(snake.map(([r, c]) => `${r},${c}`));
  const speed = Math.max(INITIAL_SPEED - (snake.length - 3) * 3, 50);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-4 text-sm">
        <span className="text-muted-foreground">Score: <span className="font-display text-foreground">{score}</span></span>
        <span className="text-muted-foreground">Length: <span className="font-display text-primary">{snake.length}</span></span>
        <span className="text-muted-foreground">Speed: <span className="font-display text-accent">{Math.round((1 - speed / INITIAL_SPEED) * 100)}%</span></span>
      </div>
      {obstacles.size > 0 && (
        <div className="text-xs font-display text-destructive">⚠ {obstacles.size} obstacles</div>
      )}
      <div className="bg-card border border-border p-1 rounded-xl inline-block">
        {Array.from({ length: ROWS }, (_, r) => (
          <div key={r} className="flex">
            {Array.from({ length: COLS }, (_, c) => {
              const key = `${r},${c}`;
              const isHead = snake[0][0] === r && snake[0][1] === c;
              const isSnake = snakeSet.has(key);
              const isFood = food[0] === r && food[1] === c;
              const isObstacle = obstacles.has(key);
              return (
                <div key={c} className={`w-4 h-4 rounded-sm transition-colors ${
                  isHead ? "bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)]"
                  : isSnake ? "bg-primary/50"
                  : isFood ? "bg-accent shadow-[0_0_8px_hsl(var(--accent)/0.5)]"
                  : isObstacle ? "bg-destructive/60 shadow-[0_0_4px_hsl(var(--destructive)/0.4)]"
                  : "bg-background/20"
                }`} />
              );
            })}
          </div>
        ))}
      </div>
      {!started && !gameOver && (
        <p className="text-sm text-muted-foreground font-display animate-pulse">Press any arrow key or swipe to start</p>
      )}
      <p className="text-xs text-muted-foreground">Arrow keys or swipe · Obstacles appear as you grow!</p>
      {gameOver && (
        <button onClick={reset} className="px-6 py-2 bg-primary text-primary-foreground rounded-xl font-display text-sm glow-primary">
          PLAY AGAIN
        </button>
      )}
    </div>
  );
};
