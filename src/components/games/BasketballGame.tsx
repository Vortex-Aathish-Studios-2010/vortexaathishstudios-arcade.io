import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { addEntertainmentPoints } from "@/lib/streaks";
import { sfx } from "@/lib/sounds";

const COURT_W = 300;
const COURT_H = 400;
const PADDLE_W = 60;
const PADDLE_H = 8;
const BALL_R = 6;

export const BasketballGame = ({ onComplete }: { onComplete?: (score: number) => void }) => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [hoopX, setHoopX] = useState(150);
  const [ballPos, setBallPos] = useState<{ x: number; y: number } | null>(null);
  const [throwing, setThrowing] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [lastResult, setLastResult] = useState<"score" | "miss" | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const hoopDir = useRef(1);

  // Move hoop
  useEffect(() => {
    if (gameOver) return;
    const iv = setInterval(() => {
      setHoopX(prev => {
        if (prev >= 240) hoopDir.current = -1;
        if (prev <= 60) hoopDir.current = 1;
        return prev + hoopDir.current * 2;
      });
    }, 30);
    return () => clearInterval(iv);
  }, [gameOver]);

  // Timer
  useEffect(() => {
    if (gameOver) return;
    const iv = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameOver(true);
          addEntertainmentPoints(score);
          sfx.levelComplete();
          onComplete?.(score);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [gameOver, score, onComplete]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (throwing || gameOver) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDragStart({ x, y });
    setDragCurrent({ x, y });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragStart) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDragCurrent({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handlePointerUp = () => {
    if (!dragStart || !dragCurrent || throwing || gameOver) {
      setDragStart(null);
      setDragCurrent(null);
      return;
    }

    const dx = dragStart.x - dragCurrent.x;
    const dy = dragStart.y - dragCurrent.y;
    if (Math.abs(dy) < 20) {
      setDragStart(null);
      setDragCurrent(null);
      return;
    }

    setThrowing(true);
    sfx.click();

    // Simulate ball trajectory
    const startX = 150;
    const startY = 350;
    const targetX = startX + dx * 0.5;
    
    // Check if ball lands in hoop
    const hoopAtArrival = hoopX + hoopDir.current * 2 * 10; // ~10 frames ahead
    const dist = Math.abs(targetX - hoopAtArrival);
    const isScore = dist < 35;

    // Animate ball
    setBallPos({ x: startX, y: startY });
    
    const frames = 15;
    let frame = 0;
    const animate = () => {
      frame++;
      const t = frame / frames;
      const x = startX + (targetX - startX) * t;
      const y = startY - 300 * t + 200 * t * t; // parabolic
      setBallPos({ x, y });
      
      if (frame < frames) {
        requestAnimationFrame(animate);
      } else {
        if (isScore) {
          setScore(prev => prev + 10);
          setLastResult("score");
          sfx.place();
        } else {
          setLastResult("miss");
          sfx.error();
        }
        setTimeout(() => {
          setThrowing(false);
          setBallPos(null);
          setLastResult(null);
          setDragStart(null);
          setDragCurrent(null);
        }, 600);
      }
    };
    requestAnimationFrame(animate);
  };

  const restart = () => {
    setScore(0);
    setTimeLeft(30);
    setGameOver(false);
    setThrowing(false);
    setBallPos(null);
    setLastResult(null);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full max-w-xs">
        <span className="font-sport text-sm text-[hsl(var(--sport-text))]">⏱️ {timeLeft}s</span>
        <span className="font-sport text-sm text-[hsl(var(--sport-accent))]">Score: {score}</span>
      </div>

      <div
        ref={canvasRef}
        className="relative rounded-2xl overflow-hidden border-2 border-[hsl(var(--sport-border))] touch-none select-none"
        style={{
          width: 300, height: 400,
          background: "linear-gradient(180deg, #1a1a2e 0%, #2d1b4e 40%, #4a2c0a 70%, #8B6914 100%)",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Court lines */}
        <div className="absolute bottom-0 left-0 right-0 h-[45%] border-t-2 border-white/20" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-24 border-2 border-white/10 rounded-full" />

        {/* Backboard & Hoop */}
        <motion.div
          animate={{ x: hoopX - 150 }}
          className="absolute top-[15%] left-1/2 -translate-x-1/2"
          style={{ width: 60 }}
        >
          <div className="w-[4px] h-10 bg-gray-400 mx-auto" />
          <div className="w-14 h-10 bg-white/80 border border-gray-400 rounded-sm mx-auto" />
          <div className="w-10 h-1.5 bg-orange-600 rounded-full mx-auto -mt-1" />
          {/* Net */}
          <div className="w-10 h-6 mx-auto border-x border-b border-white/30 rounded-b-lg" style={{
            background: "repeating-linear-gradient(transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)"
          }} />
        </motion.div>

        {/* Ball */}
        {ballPos ? (
          <motion.div
            className="absolute w-6 h-6 rounded-full bg-orange-500 border border-orange-700 shadow-lg"
            style={{ left: ballPos.x - 12, top: ballPos.y - 12 }}
          />
        ) : !throwing && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-orange-500 border-2 border-orange-700 shadow-lg" />
        )}

        {/* Drag indicator */}
        {dragStart && dragCurrent && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <line x1={dragStart.x} y1={dragStart.y} x2={dragCurrent.x} y2={dragCurrent.y} stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeDasharray="4" />
          </svg>
        )}

        {/* Result */}
        {lastResult && (
          <motion.div
            initial={{ opacity: 0, scale: 2 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <span className="font-sport text-3xl text-white drop-shadow-lg">
              {lastResult === "score" ? "🏀 SWISH!" : "MISS!"}
            </span>
          </motion.div>
        )}
      </div>

      <p className="font-sport-body text-xs text-[hsl(var(--sport-muted))]">Drag up to shoot the ball toward the hoop</p>

      {gameOver && (
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <p className="font-sport text-2xl text-[hsl(var(--sport-accent))] mb-2">Score: {score}!</p>
          <button onClick={restart} className="px-6 py-2 bg-[hsl(var(--sport-primary))]/20 border border-[hsl(var(--sport-primary))]/50 text-[hsl(var(--sport-primary))] rounded-xl font-sport tracking-wider">
            PLAY AGAIN
          </button>
        </motion.div>
      )}
    </div>
  );
};
