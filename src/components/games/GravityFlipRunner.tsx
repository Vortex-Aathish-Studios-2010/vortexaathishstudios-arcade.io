import { createCanvasResolution } from "@/lib/canvasResolution";
import { useCallback, useEffect, useRef, useState } from "react";
import { Play, RotateCcw, ArrowUpDown } from "lucide-react";
import { addEntertainmentPoints, updateStreak } from "@/lib/streaks";
import { sfx } from "@/lib/sounds";
import { useGameRandom, useMatchProgress } from "@/lib/matchPlay";
import { gravityDifficulty, RUNNER_SIZE } from "@/lib/gravityPhysics";
type Gate = { x: number; top: boolean; gap: number; passed: boolean };
type Spark = { x: number; y: number; vx: number; vy: number; life: number };
export const GravityFlipRunner = ({
  onComplete,
}: {
  initialMode?: "bot" | "friend";
  onComplete?: (score: number, won?: boolean) => void;
}) => {
  const canvas = useRef<HTMLCanvasElement>(null),
    input = useRef(false),
    callback = useRef(onComplete);
  callback.current = onComplete;
  const [round, setRound] = useState(0),
    [phase, setPhase] = useState<"ready" | "running" | "over">("ready"),
    [score, setScore] = useState(0);
  const [best, setBest] = useState(
    () => Number(localStorage.getItem("gravityFlipHighScore")) || 0,
  );
  const random = useGameRandom();
  useMatchProgress(score);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const start = useCallback(() => {
    setScore(0);
    setPhase("running");
    setRound((n) => n + 1);
  }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.code !== "Space" && e.code !== "ArrowUp") return;
      if ((e.target as HTMLElement).closest("input,textarea,button")) return;
      e.preventDefault();
      if (e.repeat) return;
      if (phaseRef.current === "running") input.current = true;
      else start();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [start]);
  useEffect(() => {
    const canvasEl=canvas.current;if(!canvasEl)return;
    const resolution=createCanvasResolution(canvasEl,900,460);if(!resolution)return;
    const ctx=resolution.context;
    const W = 900,
      H = 460,
      TOP = 40,
      BOTTOM = 420,
      X = 150,
      S = RUNNER_SIZE;

    let y = BOTTOM - S,
      direction = 1,
      distance = 0,
      elapsed = 0,
      last = 0,
      acc = 0,
      raf = 0,
      dead = false,
      death = 0,
      lastHud = 0,
      flipCount = 0;
    let finished = false;
    let gates: Gate[] = [],
      sparks: Spark[] = [],
      trail: { x: number; y: number }[] = [];
    const running = phase === "running";
    input.current = false;
    function burst() {
      for (let i = 0; i < 16; i++)
        sparks.push({
          x: X + S / 2,
          y: y + S / 2,
          vx: (Math.random() - 0.5) * 180,
          vy: (Math.random() - 0.5) * 180,
          life: 1,
        });
    }
    function finish() {
      if (finished) return;
      finished = true;
      const result = Math.floor(distance / 20);
      setScore(result);
      const record = Math.max(
        result,
        Number(localStorage.getItem("gravityFlipHighScore")) || 0,
      );
      localStorage.setItem("gravityFlipHighScore", String(record));
      setBest(record);
      addEntertainmentPoints(Math.floor(result / 4));
      updateStreak("gravity-flip");
      setPhase("over");
      callback.current?.(result, false);
      sfx.gameOver();
    }
    function step(dt: number) {
      elapsed += dt;
      if (!running) return;
      if (dead) {
        death += dt;
        sparks.forEach((p) => {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.life -= dt * 1.5;
        });
        if (death > 0.5) finish();
        return;
      }
      const d = gravityDifficulty(distance / 20);
      if (input.current) {
        input.current = false;
        direction *= -1;
        flipCount++;
        sfx.flip();
      }
      y = Math.max(TOP, Math.min(BOTTOM - S, y + direction * 520 * dt));
      distance += d.speed * dt;
      if (!gates.length || W - gates[gates.length - 1].x >= d.spacing)
        gates.push({
          x: W + 20,
          top: random() < 0.5,
          gap: d.gap,
          passed: false,
        });
      for (const g of gates) {
        g.x -= d.speed * dt;
        const bottom = g.top ? BOTTOM - g.gap : BOTTOM;
        const top = g.top ? TOP : TOP + g.gap;
        const px = X + 3,
          py = y + 3,
          size = S - 6;
        if (
          px < g.x + 54 &&
          px + size > g.x &&
          py < bottom &&
          py + size > top
        ) {
          dead = true;
          burst();
          sfx.error();
          break;
        }
        if (!g.passed && g.x + 54 < X) {
          g.passed = true;
          sfx.place();
        }
      }
      gates = gates.filter((g) => g.x > -70);
      if (elapsed - lastHud > 0.1) {
        lastHud = elapsed;
        setScore(Math.floor(distance / 20));
      }
    }
    function draw() {
      ctx.fillStyle = "#111b20";
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "#24343b";
      ctx.lineWidth = 1;
      for (let x = -((distance * 0.3) % 90); x < W; x += 90) {
        ctx.beginPath();
        ctx.moveTo(x, TOP);
        ctx.lineTo(x - 90, BOTTOM);
        ctx.stroke();
      }
      ctx.fillStyle = "#253b40";
      ctx.fillRect(0, 0, W, TOP);
      ctx.fillRect(0, BOTTOM, W, H - BOTTOM);
      ctx.fillStyle = "#8eaf9f";
      ctx.fillRect(0, TOP - 3, W, 3);
      ctx.fillRect(0, BOTTOM, W, 3);
      for (const g of gates) {
        const top = g.top ? TOP : TOP + g.gap,
          height = BOTTOM - TOP - g.gap;
        ctx.fillStyle = "#d87354";
        ctx.fillRect(g.x, top, 54, height);
        ctx.fillStyle = "#f1bb82";
        ctx.fillRect(g.x + 5, g.top ? top + height - 5 : top + 2, 44, 3);
        ctx.fillStyle = "#994f3e";
        for (let z = top + 14; z < top + height - 8; z += 24)
          ctx.fillRect(g.x + 12, z, 30, 4);
      }
      if (!dead) {
        trail.unshift({ x: X, y });
        if (trail.length > 12) trail.pop();
        trail.forEach((p, i) => {
          ctx.globalAlpha = (1 - i / 12) * 0.18;
          ctx.fillStyle = "#cfdf83";
          ctx.fillRect(p.x - i * 5, p.y + S * 0.2, S * 0.6, S * 0.6);
        });
        ctx.globalAlpha = 1;
        ctx.save();
        ctx.translate(X + S / 2, y + S / 2);
        ctx.rotate(
          Math.sin(elapsed * 9) * 0.08 + (direction < 0 ? Math.PI : 0),
        );
        ctx.fillStyle = "#d4e68b";
        ctx.beginPath();
        ctx.roundRect(-S / 2, -S / 2, S, S, 7);
        ctx.fill();
        ctx.fillStyle = "#203a36";
        ctx.fillRect(4, -7, 6, 6);
        ctx.fillRect(4, 3, 6, 6);
        ctx.restore();
      }
      sparks.forEach((p) => {
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = "#f3bc83";
        ctx.fillRect(p.x, p.y, 5, 5);
      });
      ctx.globalAlpha = 1;
    }
    function frame(t: number) {
      if (death > 0.5) return;
      const delta = last ? Math.min((t - last) / 1000, 0.05) : 0;
      last = t;
      acc += delta;
      while (acc >= 1 / 120) {
        step(1 / 120);
        acc -= 1 / 120;
      }
      draw();
      if (running) raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => {cancelAnimationFrame(raf);resolution.dispose();};
  }, [round, phase, random]);
  const difficulty = gravityDifficulty(score);
  return (
    <section className="runner-game">
      <div className="game-hud">
        <div>
          <span>DISTANCE</span>
          <strong>{score}</strong>
        </div>
        <div>
          <span>THREAT LEVEL</span>
          <strong>{difficulty.tier + 1}</strong>
        </div>
        <div>
          <span>BEST</span>
          <strong>{best}</strong>
        </div>
      </div>
      <div className="runner-stage">
        <canvas
          ref={canvas}
          aria-label="Gravity Flip course"
          onPointerDown={(e) => {
            e.preventDefault();
            if (phase === "running") input.current = true;
          }}
        />
        {phase !== "running" && (
          <div className="game-overlay">
            <span className="eyebrow">
              {phase === "over" ? "RUN COMPLETE" : "GRAVITY FLIP"}
            </span>
            <h2>{phase === "over" ? `${score} metres` : "Defy the drop."}</h2>
            <p>Speed climbs. Openings shrink. Time every flip.</p>
            <button className="solid-button" onClick={start}>
              {phase === "over" ? <RotateCcw size={18} /> : <Play size={18} />}{" "}
              {phase === "over" ? "Run again" : "Start run"}
            </button>
          </div>
        )}
      </div>
      <button
        className="runner-flip"
        disabled={phase !== "running"}
        onPointerDown={() => {
          input.current = true;
        }}
      >
        <ArrowUpDown size={22} /> FLIP GRAVITY{" "}
        <small>Tap the course or press Space</small>
      </button>
      <p className="club-help">
        Every 100 points raises the threat level. Narrower openings always leave
        room for your runner.
      </p>
    </section>
  );
};
