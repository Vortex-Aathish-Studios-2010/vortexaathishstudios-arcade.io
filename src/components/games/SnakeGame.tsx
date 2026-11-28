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
import { createCanvasResolution } from "@/lib/canvasResolution";
import { drawSnake,drawBomb } from "@/lib/snakeArtwork";
import { advanceSnake,safeBombCell, SnakeCell } from "@/lib/snakePhysics";
import { useGameRandom, useMatchProgress } from "@/lib/matchPlay";
export const SnakeGame = ({
  onComplete,
}: {
  level?: number;
  onComplete?: (score: number) => void;
}) => {
  const [round, setRound] = useState(0),
    [phase, setPhase] = useState<"ready" | "playing" | "over">("ready"),
    [score, setScore] = useState(0),
    [best,setBest] = useState(()=>Number(localStorage.getItem("snakeBest"))||0);
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
    const el=canvas.current;if(!el)return;
    const surface=createCanvasResolution(el,672,504);if(!surface)return;
    const ctx=surface.context;
    const cols = 24,
      rows = 18,
      cell = 28;

    let snake: SnakeCell[] = [
        [7, 9],
        [6, 9],
        [5, 9],
        [4, 9],
      ],
      previous = snake,
      bombs:{cell:SnakeCell,armed:number,expires:number}[] = [],
      nextBomb=4500,death=0,
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
          if (![...snake, ...bombs.map(b=>b.cell)].some((p) => p[0] === x && p[1] === y))
            empty.push([x, y]);
      return empty[Math.floor(random() * empty.length)] || [-1, -1];
    }
    let food = pickFood();
    const speed = () => Math.max(65, 155 - (snake.length - 4) * 4);
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;
    function finish(hit=snake[0]) {
      if (finished) return;
      finished = true;
      death=650;
      const record=Math.max(points,Number(localStorage.getItem("snakeBest"))||0);
      localStorage.setItem("snakeBest",String(record));setBest(record);
      setScore(points);
      addPoints(points);
      updateStreak("snake");
      callback.current?.(points);
      sfx.explosion();
      for(let i=0;i<28;i++)sparks.push({x:(hit[0]+.5)*cell,y:(hit[1]+.5)*cell,vx:(Math.random()-.5)*360,vy:(Math.random()-.5)*360,life:1});
    }
    function step() {
      if (queue.current.length) dir.current = queue.current.shift()!;
      const result = advanceSnake(snake, dir.current, food, cols, rows, bombs.filter(b=>b.armed<=t).map(b=>b.cell));
      if (result.collision) {
        finish(result.head);
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
      ctx.fillRect(0, 0, cols*cell, rows*cell);
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
      drawSnake(ctx,snake,previous,dir.current,alpha,cols,rows,cell,'#b4ce7d');
      for(const bomb of bombs)drawBomb(ctx,(bomb.cell[0]+.5)*cell,(bomb.cell[1]+.5)*cell,cell*.38,bomb.armed<=t,t);
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
        bombs=bombs.filter(b=>b.expires>t);
        if(t>=nextBomb&&bombs.length<7){const cell=safeBombCell(snake,food,bombs.map(b=>b.cell),cols,rows,random);if(cell)bombs.push({cell,armed:t+900,expires:t+16000});nextBomb=t+Math.max(2400,5000-points*4);}
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
      if(finished){death-=dt;if(death<=0){setPhase("over");return;}}
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => {cancelAnimationFrame(raf);surface.dispose();};
  }, [round, phase, random]);
  return (
    <section className="snake-game">
      <div className="game-hud">
        <div>
          <span>SCORE</span>
          <strong>{score}</strong>
        </div>
        <div>
          <span>BEST</span>
          <strong>{best}</strong>
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
            <p>Wrap through the edges. Eat food. Dodge the bombs.</p>
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
        grows. All four edges wrap. Glowing bombs are deadly.
      </p>
    </section>
  );
};
