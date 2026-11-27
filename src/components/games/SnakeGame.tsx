import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Play,
  RotateCcw,
} from "lucide-react";
import { addPoints, updateStreak } from "@/lib/streaks";
import { sfx } from "@/lib/sounds";
import { advanceSnake, SnakeCell } from "@/lib/snakePhysics";
import { useGameRandom, useMatchProgress } from "@/lib/matchPlay";
export const SnakeGame = ({
  onComplete,
}: {
  level?: number;
  onComplete?: (score: number) => void;
}) => {
  const [round, setRound] = useState(0),
    [phase, setPhase] = useState<"ready" | "playing" | "over">("ready"),
    [score, setScore] = useState(0);
  const canvas = useRef<HTMLCanvasElement>(null),
    queue = useRef<SnakeCell[]>([]),
    dir = useRef<SnakeCell>([1, 0]),
    touch = useRef<SnakeCell | null>(null),
    callback = useRef(onComplete);
  callback.current = onComplete;
  const random = useGameRandom();
  useMatchProgress(score);
  const start = () => {
    queue.current = [];
    dir.current = [1, 0];
    setScore(0);
    setPhase("playing");
    setRound((r) => r + 1);
  };
  function turn(next: SnakeCell) {
    const prev = queue.current.at(-1) || dir.current;
    if (prev[0] === -next[0] && prev[1] === -next[1]) return;
    if (queue.current.length < 2) queue.current.push(next);
  }
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input,textarea")) return;
      const keys: Record<string, SnakeCell> = {
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        w: [0, -1],
        s: [0, 1],
        a: [-1, 0],
        d: [1, 0],
      };
      if (keys[e.key]) {
        e.preventDefault();
        if (phase === "ready") start();
        turn(keys[e.key]);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [phase]);
  useEffect(() => {
    const el = canvas.current,
      ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    const cols = 24,
      rows = 18,
      cell = 28;
    el.width = cols * cell;
    el.height = rows * cell;
    let snake: SnakeCell[] = [
        [7, 9],
        [6, 9],
        [5, 9],
        [4, 9],
      ],
      previous = snake,
      rocks: SnakeCell[] = [],
      points = 0,
      t = 0,
      last = 0,
      elapsed = 0,
      raf = 0,
      finished = false;
    let sparks: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
    }[] = [];
    function pickFood(): SnakeCell {
      const empty: SnakeCell[] = [];
      for (let y = 0; y < rows; y++)
        for (let x = 0; x < cols; x++)
          if (![...snake, ...rocks].some((p) => p[0] === x && p[1] === y))
            empty.push([x, y]);
      return empty[Math.floor(random() * empty.length)] || [-1, -1];
    }
    let food = pickFood();
    const speed = () => Math.max(65, 155 - (snake.length - 4) * 4);
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;
    function finish() {
      if (finished) return;
      finished = true;
      setPhase("over");
      setScore(points);
      addPoints(points);
      updateStreak("snake");
      callback.current?.(points);
      sfx.gameOver();
    }
    function step() {
      if (queue.current.length) dir.current = queue.current.shift()!;
      const result = advanceSnake(snake, dir.current, food, cols, rows, rocks);
      if (result.collision) {
        finish();
        return;
      }
      previous = snake;
      snake = result.snake;
      if (result.ate) {
        points += 10 + Math.floor((snake.length - 4) / 5) * 5;
        setScore(points);
        sfx.eat();
        for (let i = 0; i < 12; i++)
          sparks.push({
            x: (food[0] + 0.5) * cell,
            y: (food[1] + 0.5) * cell,
            vx: (Math.random() - 0.5) * 150,
            vy: (Math.random() - 0.5) * 150,
            life: 1,
          });
        food = pickFood();
        if (food[0] < 0) finish();
      }
    }
    function draw() {
      ctx.fillStyle = "#13231f";
      ctx.fillRect(0, 0, el.width, el.height);
      ctx.fillStyle = "#20342a";
      for (let y = 0; y < rows; y++)
        for (let x = 0; x < cols; x++) {
          ctx.beginPath();
          ctx.arc((x + 0.5) * cell, (y + 0.5) * cell, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      const pulse = 1 + Math.sin(t / 180) * 0.12;
      ctx.save();
      ctx.translate((food[0] + 0.5) * cell, (food[1] + 0.5) * cell);
      ctx.scale(pulse, pulse);
      ctx.fillStyle = "#ed9570";
      ctx.beginPath();
      ctx.roundRect(-8, -8, 16, 16, 5);
      ctx.fill();
      ctx.fillStyle = "#a8ce96";
      ctx.fillRect(1, -13, 3, 6);
      ctx.restore();
      const alpha = smooth ? Math.min(1, elapsed / speed()) : 1;
      const positions = snake.map((p, i) => {
        const old = previous[i] || previous.at(-1)!;
        return [
          (old[0] + (p[0] - old[0]) * alpha + 0.5) * cell,
          (old[1] + (p[1] - old[1]) * alpha + 0.5) * cell,
        ];
      });
      ctx.strokeStyle = "#1b3f2e";
      ctx.lineWidth = 24;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      positions.forEach((p, i) =>
        i ? ctx.lineTo(p[0], p[1] + 3) : ctx.moveTo(p[0], p[1] + 3),
      );
      ctx.stroke();
      ctx.strokeStyle = "#b4ce7d";
      ctx.lineWidth = 20;
      ctx.beginPath();
      positions.forEach((p, i) =>
        i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]),
      );
      ctx.stroke();
      positions.forEach((p, i) => {
        if (i % 2 && i > 0) {
          ctx.fillStyle = "#94b56a";
          ctx.beginPath();
          ctx.arc(p[0], p[1], 4, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      const head = positions[0];
      ctx.save();
      ctx.translate(head[0], head[1]);
      ctx.rotate(Math.atan2(dir.current[1], dir.current[0]));
      ctx.fillStyle = "#d9e99f";
      ctx.beginPath();
      ctx.roundRect(-12, -12, 26, 24, 9);
      ctx.fill();
      ctx.fillStyle = "#112d25";
      ctx.beginPath();
      ctx.arc(5, -6, 3, 0, Math.PI * 2);
      ctx.arc(5, 6, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      sparks.forEach((p) => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = "#f8bc81";
        ctx.fillRect(p.x, p.y, 4, 4);
      });
      ctx.globalAlpha = 1;
    }
    function frame(now: number) {
      const dt = last ? Math.min(now - last, 40) : 0;
      last = now;
      t += dt;
      if (phase === "playing" && !finished) {
        elapsed += dt;
        while (elapsed >= speed() && !finished) {
          elapsed -= speed();
          step();
        }
      }
      sparks.forEach((p) => {
        p.x += (p.vx * dt) / 1000;
        p.y += (p.vy * dt) / 1000;
        p.life -= dt / 600;
      });
      sparks = sparks.filter((p) => p.life > 0);
      draw();
      if (!finished) raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [round, phase, random]);
  return (
    <section className="snake-game">
      <div className="game-hud">
        <div>
          <span>SCORE</span>
          <strong>{score}</strong>
        </div>
        <div>
          <span>THE GREEN ROOM</span>
          <strong>Snake</strong>
        </div>
      </div>
      <div className="snake-stage">
        <canvas
          ref={canvas}
          aria-label="Snake arena"
          onPointerDown={(e) => {
            touch.current = [e.clientX, e.clientY];
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerUp={(e) => {
            if (!touch.current) return;
            const dx = e.clientX - touch.current[0],
              dy = e.clientY - touch.current[1];
            touch.current = null;
            if (Math.max(Math.abs(dx), Math.abs(dy)) < 12) return;
            if (phase === "ready") start();
            turn(
              Math.abs(dx) > Math.abs(dy)
                ? [Math.sign(dx), 0]
                : [0, Math.sign(dy)],
            );
          }}
        />
        {phase !== "playing" && (
          <div className="game-overlay">
            <span className="eyebrow">
              {phase === "over" ? "RUN COMPLETE" : "SNAKE"}
            </span>
            <h2>{phase === "over" ? `${score} points` : "Keep growing."}</h2>
            <p>Eat, weave, and leave yourself a way out.</p>
            <button className="solid-button" onClick={start}>
              {phase === "over" ? <RotateCcw size={18} /> : <Play size={18} />}{" "}
              {phase === "over" ? "Play again" : "Start snake"}
            </button>
          </div>
        )}
      </div>
      <div className="snake-controls">
        {[
          [ArrowLeft, [-1, 0], "Left"],
          [ArrowUp, [0, -1], "Up"],
          [ArrowDown, [0, 1], "Down"],
          [ArrowRight, [1, 0], "Right"],
        ].map(([Icon, d, label]: any) => (
          <button
            key={label}
            aria-label={"Move " + label.toLowerCase()}
            onPointerDown={() => {
              if (phase === "ready") start();
              turn(d);
            }}
          >
            <Icon size={24} />
          </button>
        ))}
      </div>
      <p className="club-help">
        Arrow keys, WASD, swipe, or the buttons. Your snake gets faster as it
        grows.
      </p>
    </section>
  );
};
