import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { addEntertainmentPoints } from "@/lib/streaks";
import { sfx } from "@/lib/sounds";
import { useDevice } from "@/lib/DeviceContext";

const LANES = 3;
const GAME_W = 360;
const GAME_H = 520;
const LANE_W = GAME_W / LANES;

interface Obstacle {
  id: number;
  lane: number;
  y: number;
  type: "car" | "cone" | "coin";
  color: string;
}

const CAR_COLORS = ["#e74c3c", "#3498db", "#f39c12", "#9b59b6", "#1abc9c"];

const PlayerCar = ({ color = "#00f0ff" }: { color?: string }) => (
  <svg width="40" height="70" viewBox="0 0 40 70">
    {/* Body */}
    <rect x="6" y="12" width="28" height="46" rx="6" fill={color} />
    {/* Hood */}
    <rect x="10" y="5" width="20" height="12" rx="4" fill={color} />
    {/* Roof */}
    <rect x="10" y="14" width="20" height="20" rx="3" fill={color} filter="brightness(0.85)" />
    {/* Windscreen */}
    <rect x="12" y="16" width="16" height="12" rx="2" fill="rgba(150,230,255,0.7)" />
    {/* Rear window */}
    <rect x="12" y="30" width="16" height="8" rx="2" fill="rgba(150,230,255,0.4)" />
    {/* Headlights */}
    <rect x="8" y="8" width="7" height="4" rx="2" fill="#ffffaa" />
    <rect x="25" y="8" width="7" height="4" rx="2" fill="#ffffaa" />
    {/* Tail lights */}
    <rect x="8" y="54" width="7" height="4" rx="2" fill="#ff4444" />
    <rect x="25" y="54" width="7" height="4" rx="2" fill="#ff4444" />
    {/* Wheels */}
    <rect x="1" y="16" width="7" height="14" rx="3" fill="#222" />
    <rect x="32" y="16" width="7" height="14" rx="3" fill="#222" />
    <rect x="1" y="40" width="7" height="14" rx="3" fill="#222" />
    <rect x="32" y="40" width="7" height="14" rx="3" fill="#222" />
    {/* Wheel rims */}
    <circle cx="4.5" cy="23" r="2.5" fill="#555" />
    <circle cx="35.5" cy="23" r="2.5" fill="#555" />
    <circle cx="4.5" cy="47" r="2.5" fill="#555" />
    <circle cx="35.5" cy="47" r="2.5" fill="#555" />
    {/* Glow under car */}
    <ellipse cx="20" cy="66" rx="14" ry="4" fill={color} opacity="0.2" />
  </svg>
);

const ObstacleCar = ({ color }: { color: string }) => (
  <svg width="36" height="60" viewBox="0 0 36 60">
    <rect x="5" y="10" width="26" height="40" rx="5" fill={color} />
    <rect x="9" y="4" width="18" height="10" rx="3" fill={color} />
    <rect x="9" y="12" width="18" height="14" rx="2" fill="rgba(150,230,255,0.5)" />
    <rect x="5" y="4" width="6" height="4" rx="2" fill="#ffffaa" />
    <rect x="25" y="4" width="6" height="4" rx="2" fill="#ffffaa" />
    <rect x="5" y="46" width="6" height="4" rx="2" fill="#ff4444" />
    <rect x="25" y="46" width="6" height="4" rx="2" fill="#ff4444" />
    <rect x="0" y="12" width="6" height="12" rx="2" fill="#222" />
    <rect x="30" y="12" width="6" height="12" rx="2" fill="#222" />
    <rect x="0" y="34" width="6" height="12" rx="2" fill="#222" />
    <rect x="30" y="34" width="6" height="12" rx="2" fill="#222" />
  </svg>
);

export const RacingGame = ({ onComplete }: { onComplete?: (score: number) => void }) => {
  const [lane, setLane] = useState(1);
  const [score, setScore] = useState(0);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const [roadOffset, setRoadOffset] = useState(0);
  const nextId = useRef(0);
  const spawnTimer = useRef(0);
  const scoreRef = useRef(0);
  const gameLoop = useRef<number>(0);
  const { device } = useDevice();

  const getSpeed = (s: number) => 2 + Math.min(s * 0.04, 8);

  const moveLeft = useCallback(() => {
    if (gameOver) return;
    setLane(prev => Math.max(0, prev - 1));
    sfx.click();
  }, [gameOver]);

  const moveRight = useCallback(() => {
    if (gameOver) return;
    setLane(prev => Math.min(LANES - 1, prev + 1));
    sfx.click();
  }, [gameOver]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") moveLeft();
      if (e.key === "ArrowRight") moveRight();
      if (!started && (e.key === " " || e.key === "Enter")) setStarted(true);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [moveLeft, moveRight, started]);

  useEffect(() => {
    if (!started || gameOver) return;

    const loop = () => {
      spawnTimer.current++;
      const currentScore = scoreRef.current;
      const speed = getSpeed(currentScore);
      const spawnInterval = Math.max(25, 55 - currentScore * 0.3);

      // Update road animation
      setRoadOffset(prev => (prev + speed) % 60);

      // Spawn
      if (spawnTimer.current % Math.floor(spawnInterval) === 0) {
        const obsLane = Math.floor(Math.random() * LANES);
        const type = Math.random() < 0.2 ? "coin" : Math.random() < 0.4 ? "cone" : "car";
        const color = CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)];
        setObstacles(prev => [...prev, { id: nextId.current++, lane: obsLane, y: -80, type, color }]);
      }

      // Move + collision
      let hit = false;
      let coinGained = 0;

      setObstacles(prev => {
        const updated = prev
          .map(o => ({ ...o, y: o.y + speed }))
          .filter(o => {
            if (o.y > GAME_H + 80) return false;
            if (o.lane === lane && o.y > GAME_H - 140 && o.y < GAME_H - 60) {
              if (o.type === "coin") { coinGained++; return false; }
              hit = true;
            }
            return true;
          });
        return updated;
      });

      if (coinGained > 0) {
        setScore(prev => { scoreRef.current = prev + coinGained * 5; return prev + coinGained * 5; });
        sfx.place();
      }

      if (hit) {
        setGameOver(true);
        sfx.error();
        addEntertainmentPoints(scoreRef.current);
        onComplete?.(scoreRef.current);
        return;
      }

      setScore(prev => { scoreRef.current = prev + 1; return prev + 1; });
      gameLoop.current = requestAnimationFrame(loop);
    };

    gameLoop.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(gameLoop.current);
  }, [started, gameOver, lane, onComplete]);

  const restart = () => {
    setLane(1);
    setScore(0);
    scoreRef.current = 0;
    setObstacles([]);
    setGameOver(false);
    setStarted(true);
    setRoadOffset(0);
    spawnTimer.current = 0;
  };

  const laneCenter = (l: number) => LANE_W * l + LANE_W / 2;

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* HUD */}
      <div className="flex items-center justify-between w-full max-w-sm px-2">
        <span className="font-sport text-sm text-[hsl(var(--sport-text))]">🏎️ Speed: {getSpeed(score).toFixed(1)}x</span>
        <span className="font-sport text-sm text-[hsl(var(--sport-accent))]">Score: {score}</span>
      </div>

      {/* Road */}
      <div
        className="relative rounded-2xl overflow-hidden border-2 border-[hsl(var(--sport-border))] select-none"
        style={{ width: GAME_W, height: GAME_H, background: "#1a1a1a" }}
      >
        {/* Road surface */}
        <div className="absolute inset-0" style={{ background: "#2a2a2a" }} />

        {/* Grass strips */}
        <div className="absolute left-0 top-0 bottom-0 w-8" style={{ background: "linear-gradient(90deg, #1a4a1a, #2d6b2d)" }} />
        <div className="absolute right-0 top-0 bottom-0 w-8" style={{ background: "linear-gradient(270deg, #1a4a1a, #2d6b2d)" }} />

        {/* Road edges */}
        <div className="absolute left-8 top-0 bottom-0 w-[3px] bg-white/60" />
        <div className="absolute right-8 top-0 bottom-0 w-[3px] bg-white/60" />

        {/* Lane dividers */}
        {[1, 2].map(l => (
          <div key={l} className="absolute top-0 bottom-0" style={{ left: l * LANE_W + 4 }}>
            {Array.from({ length: 14 }, (_, i) => (
              <div
                key={i}
                className="absolute w-[3px] rounded-full bg-yellow-300/50"
                style={{
                  left: 0,
                  top: ((i * 60 + roadOffset) % (GAME_H + 60)) - 40,
                  height: 32,
                }}
              />
            ))}
          </div>
        ))}

        {/* Road texture */}
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="absolute left-8 right-8 opacity-5"
            style={{
              top: ((i * 80 + roadOffset * 1.5) % (GAME_H + 80)) - 40,
              height: 4,
              background: "white",
            }}
          />
        ))}

        {/* Obstacles */}
        {obstacles.map(o => (
          <div
            key={o.id}
            className="absolute"
            style={{
              left: laneCenter(o.lane) - (o.type === "car" ? 18 : 16),
              top: o.y,
            }}
          >
            {o.type === "car" ? (
              <ObstacleCar color={o.color} />
            ) : o.type === "cone" ? (
              <svg width="32" height="40" viewBox="0 0 32 40">
                <polygon points="16,2 28,38 4,38" fill="#f97316" />
                <polygon points="16,2 22,24 10,24" fill="#fed7aa" />
                <rect x="2" y="36" width="28" height="4" rx="2" fill="#ea580c" />
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 28 28">
                <circle cx="14" cy="14" r="13" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2" />
                <text x="14" y="19" textAnchor="middle" fontSize="14" fill="#92400e">$</text>
              </svg>
            )}
          </div>
        ))}

        {/* Player car */}
        <motion.div
          animate={{ left: laneCenter(lane) - 20 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="absolute"
          style={{ bottom: 50 }}
        >
          <PlayerCar color="hsl(185 100% 50%)" />
          {/* Speed exhaust */}
          {started && !gameOver && (
            <motion.div
              animate={{ scaleY: [1, 1.5, 1], opacity: [0.6, 0.3, 0.6] }}
              transition={{ duration: 0.3, repeat: Infinity }}
              className="absolute left-1/2 -translate-x-1/2 -bottom-5 w-3 rounded-full"
              style={{ height: 16, background: "linear-gradient(180deg, rgba(0,200,255,0.6), transparent)" }}
            />
          )}
        </motion.div>

        {/* Start overlay */}
        {!started && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-5"
          >
            <p className="font-sport text-3xl text-[hsl(var(--sport-primary))] tracking-widest">READY?</p>
            <button
              onClick={() => setStarted(true)}
              className="px-10 py-4 bg-[hsl(var(--sport-primary))] text-[hsl(var(--sport-bg))] rounded-xl font-sport text-xl tracking-wider hover:brightness-110 transition-all"
            >
              START RACE
            </button>
            <p className="font-sport-body text-xs text-white/50">Arrow keys or buttons to steer</p>
          </motion.div>
        )}

        {/* Game over */}
        <AnimatePresence>
          {gameOver && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-5"
            >
              <motion.p
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                className="font-sport text-4xl text-red-400 tracking-widest"
              >
                CRASH!
              </motion.p>
              <p className="font-sport text-xl text-white">Score: {score}</p>
              <button
                onClick={restart}
                className="px-8 py-3 bg-[hsl(var(--sport-primary))] text-[hsl(var(--sport-bg))] rounded-xl font-sport text-lg tracking-wider hover:brightness-110 transition-all"
              >
                RACE AGAIN
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Touch controls */}
      {started && !gameOver && (
        <div className="flex gap-4">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={moveLeft}
            className="px-10 py-4 bg-[hsl(var(--sport-card))] border-2 border-[hsl(var(--sport-border))] text-[hsl(var(--sport-text))] rounded-xl font-sport text-lg hover:border-[hsl(var(--sport-primary))]/60 transition-all"
          >
            ← LEFT
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={moveRight}
            className="px-10 py-4 bg-[hsl(var(--sport-card))] border-2 border-[hsl(var(--sport-border))] text-[hsl(var(--sport-text))] rounded-xl font-sport text-lg hover:border-[hsl(var(--sport-primary))]/60 transition-all"
          >
            RIGHT →
          </motion.button>
        </div>
      )}
    </div>
  );
};
