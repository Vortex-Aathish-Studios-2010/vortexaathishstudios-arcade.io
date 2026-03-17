import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { addEntertainmentPoints } from "@/lib/streaks";
import { sfx } from "@/lib/sounds";
import { useDevice } from "@/lib/DeviceContext";

const LANES = 3;
const GAME_H = 400;
const CAR_SIZE = 40;

interface Obstacle {
  id: number;
  lane: number;
  y: number;
  type: "car" | "cone" | "coin";
}

export const RacingGame = ({ onComplete }: { onComplete?: (score: number) => void }) => {
  const [lane, setLane] = useState(1);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(3);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const nextId = useRef(0);
  const gameLoop = useRef<number>(0);
  const spawnTimer = useRef(0);
  const { device } = useDevice();

  const moveLeft = useCallback(() => {
    if (gameOver) return;
    setLane(prev => Math.max(0, prev - 1));
  }, [gameOver]);

  const moveRight = useCallback(() => {
    if (gameOver) return;
    setLane(prev => Math.min(LANES - 1, prev + 1));
  }, [gameOver]);

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") moveLeft();
      if (e.key === "ArrowRight") moveRight();
      if (!started && (e.key === " " || e.key === "Enter")) setStarted(true);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [moveLeft, moveRight, started]);

  // Game loop
  useEffect(() => {
    if (!started || gameOver) return;

    const loop = () => {
      spawnTimer.current++;

      // Spawn obstacles
      if (spawnTimer.current % Math.max(15, 40 - score / 5) === 0) {
        const obsLane = Math.floor(Math.random() * LANES);
        const type = Math.random() < 0.25 ? "coin" : Math.random() < 0.5 ? "cone" : "car";
        setObstacles(prev => [...prev, {
          id: nextId.current++,
          lane: obsLane,
          y: -40,
          type,
        }]);
      }

      // Move obstacles
      setObstacles(prev => {
        const currentSpeed = 3 + score * 0.05;
        return prev
          .map(o => ({ ...o, y: o.y + currentSpeed }))
          .filter(o => o.y < GAME_H + 40);
      });

      // Check collision
      setObstacles(prev => {
        let hit = false;
        let coinCollected = false;
        const remaining = prev.filter(o => {
          const laneMatch = o.lane === lane;
          const yHit = o.y > GAME_H - 80 && o.y < GAME_H - 30;
          if (laneMatch && yHit) {
            if (o.type === "coin") {
              coinCollected = true;
              return false;
            }
            hit = true;
          }
          return true;
        });

        if (coinCollected) {
          setScore(prev => prev + 5);
          sfx.place();
        }

        if (hit) {
          setGameOver(true);
          sfx.error();
          addEntertainmentPoints(score);
          onComplete?.(score);
        }

        return remaining;
      });

      // Increase score
      setScore(prev => prev + 1);

      gameLoop.current = requestAnimationFrame(loop);
    };

    gameLoop.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(gameLoop.current);
  }, [started, gameOver, lane, score, onComplete]);

  const restart = () => {
    setLane(1);
    setScore(0);
    setSpeed(3);
    setObstacles([]);
    setGameOver(false);
    setStarted(true);
    spawnTimer.current = 0;
  };

  const laneX = (l: number) => (l * 100) / LANES + 100 / LANES / 2;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full max-w-xs">
        <span className="font-sport text-sm text-[hsl(var(--sport-text))]">🏎️ Racing</span>
        <span className="font-sport text-sm text-[hsl(var(--sport-accent))]">Score: {score}</span>
      </div>

      <div
        className="relative rounded-2xl overflow-hidden border-2 border-[hsl(var(--sport-border))]"
        style={{
          width: 300, height: GAME_H,
          background: "linear-gradient(180deg, #333 0%, #444 100%)",
        }}
      >
        {/* Road lines */}
        {Array.from({ length: 10 }, (_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-8 bg-yellow-400/60"
            style={{ left: "33%", top: `${(i * 40 + (started ? (score * 3) % 40 : 0)) % GAME_H}px` }}
          />
        ))}
        {Array.from({ length: 10 }, (_, i) => (
          <motion.div
            key={`r${i}`}
            className="absolute w-1 h-8 bg-yellow-400/60"
            style={{ left: "66%", top: `${(i * 40 + (started ? (score * 3) % 40 : 0)) % GAME_H}px` }}
          />
        ))}

        {/* Road edges */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/30" />
        <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/30" />

        {/* Grass */}
        <div className="absolute left-0 top-0 bottom-0 w-2" style={{ background: "#2d5a1e" }} />
        <div className="absolute right-0 top-0 bottom-0 w-2" style={{ background: "#2d5a1e" }} />

        {/* Obstacles */}
        {obstacles.map(o => (
          <div
            key={o.id}
            className="absolute flex items-center justify-center text-2xl"
            style={{
              left: `${laneX(o.lane)}%`,
              top: o.y,
              transform: "translateX(-50%)",
            }}
          >
            {o.type === "car" ? "🚗" : o.type === "cone" ? "🔶" : "🪙"}
          </div>
        ))}

        {/* Player car */}
        <motion.div
          animate={{ left: `${laneX(lane)}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="absolute text-3xl"
          style={{ bottom: 40, transform: "translateX(-50%)" }}
        >
          🏎️
        </motion.div>

        {/* Start overlay */}
        {!started && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <button
              onClick={() => setStarted(true)}
              className="px-6 py-3 bg-[hsl(var(--sport-primary))] text-[hsl(var(--sport-bg))] rounded-xl font-sport text-lg tracking-wider"
            >
              START RACE
            </button>
          </div>
        )}

        {/* Game over */}
        {gameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-4"
          >
            <p className="font-sport text-2xl text-[hsl(var(--sport-accent))]">CRASH!</p>
            <p className="font-sport text-lg text-white">Score: {score}</p>
            <button onClick={restart} className="px-6 py-2 bg-[hsl(var(--sport-primary))] text-[hsl(var(--sport-bg))] rounded-xl font-sport tracking-wider">
              RACE AGAIN
            </button>
          </motion.div>
        )}
      </div>

      {/* Touch controls */}
      {device !== "laptop" && started && !gameOver && (
        <div className="flex gap-4">
          <button
            onClick={moveLeft}
            className="px-8 py-3 bg-[hsl(var(--sport-card))] border border-[hsl(var(--sport-border))] text-[hsl(var(--sport-text))] rounded-xl font-sport text-lg"
          >
            ← LEFT
          </button>
          <button
            onClick={moveRight}
            className="px-8 py-3 bg-[hsl(var(--sport-card))] border border-[hsl(var(--sport-border))] text-[hsl(var(--sport-text))] rounded-xl font-sport text-lg"
          >
            RIGHT →
          </button>
        </div>
      )}
    </div>
  );
};
