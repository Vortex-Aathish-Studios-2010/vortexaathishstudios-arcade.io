import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { addEntertainmentPoints } from "@/lib/streaks";
import { sfx } from "@/lib/sounds";

const COURT_W = 360;
const COURT_H = 500;
const BALL_START_X = COURT_W / 2;
const BALL_START_Y = COURT_H - 60;
const HOOP_Y = 140;
const HOOP_HALF_W = 22;

export const BasketballGame = ({ onComplete }: { onComplete?: (score: number) => void }) => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [hoopX, setHoopX] = useState(COURT_W / 2);
  const [ballPos, setBallPos] = useState<{ x: number; y: number } | null>(null);
  const [shooting, setShooting] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [lastResult, setLastResult] = useState<"score" | "miss" | null>(null);
  const [shotResult, setShotResult] = useState<"score" | "miss" | null>(null);
  const courtRef = useRef<HTMLDivElement>(null);
  const hoopDir = useRef(1);
  const animFrameRef = useRef<number>(0);

  // Hoop movement
  useEffect(() => {
    if (gameOver) return;
    const iv = setInterval(() => {
      setHoopX(prev => {
        const next = prev + hoopDir.current * 2.5;
        if (next >= COURT_W - 50) hoopDir.current = -1;
        if (next <= 50) hoopDir.current = 1;
        return next;
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
          clearInterval(iv);
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

  const getCourtXY = (clientX: number, clientY: number) => {
    const rect = courtRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (shooting || gameOver) return;
    const pos = getCourtXY(e.clientX, e.clientY);
    if (!pos) return;
    // Only start drag near the ball
    const distToBall = Math.hypot(pos.x - BALL_START_X, pos.y - BALL_START_Y);
    if (distToBall > 50) return;
    courtRef.current?.setPointerCapture(e.pointerId);
    setDragStart(pos);
    setDragCurrent(pos);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragStart) return;
    const pos = getCourtXY(e.clientX, e.clientY);
    if (!pos) return;
    setDragCurrent(pos);
  };

  const handlePointerUp = useCallback(() => {
    if (!dragStart || !dragCurrent || shooting || gameOver) {
      setDragStart(null);
      setDragCurrent(null);
      return;
    }

    const dx = dragStart.x - dragCurrent.x;
    const dy = dragStart.y - dragCurrent.y;
    const power = Math.hypot(dx, dy);

    if (power < 20 || dy < 10) {
      setDragStart(null);
      setDragCurrent(null);
      return;
    }

    setShooting(true);
    setDragStart(null);
    setDragCurrent(null);
    sfx.click();

    // Target X = ball starting position offset by horizontal drag
    const targetX = BALL_START_X + dx * 0.8;
    // Clamp to court
    const clampedTargetX = Math.max(20, Math.min(COURT_W - 20, targetX));

    // Capture hoop position at shoot time
    const capturedHoopX = hoopX;

    // Is it a score? Ball must land within hoop width at hoop height
    const distToHoop = Math.abs(clampedTargetX - capturedHoopX);
    const isScore = distToHoop < HOOP_HALF_W;

    // Animate ball along parabola, going all the way through
    const totalFrames = 32;
    let frame = 0;

    const animate = () => {
      frame++;
      const t = frame / totalFrames;
      // Parabolic path - ball goes up then down
      const x = BALL_START_X + (clampedTargetX - BALL_START_X) * t;
      const peakY = isScore ? HOOP_Y - 40 : HOOP_Y - 20;
      // Bezier-like arc
      const y = BALL_START_Y + (peakY - BALL_START_Y) * (2 * t - t * t) + (COURT_H - BALL_START_Y - peakY + BALL_START_Y) * t * t;

      setBallPos({ x, y });

      if (frame < totalFrames) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Show result
        if (isScore) {
          setScore(prev => prev + 2);
          setLastResult("score");
          setShotResult("score");
          sfx.place();
        } else {
          setLastResult("miss");
          setShotResult("miss");
          sfx.error();
        }

        setTimeout(() => {
          setShooting(false);
          setBallPos(null);
          setLastResult(null);
          setShotResult(null);
        }, 700);
      }
    };

    setBallPos({ x: BALL_START_X, y: BALL_START_Y });
    animFrameRef.current = requestAnimationFrame(animate);
  }, [dragStart, dragCurrent, shooting, gameOver, hoopX]);

  useEffect(() => () => cancelAnimationFrame(animFrameRef.current), []);

  const restart = () => {
    setScore(0);
    setTimeLeft(30);
    setGameOver(false);
    setShooting(false);
    setBallPos(null);
    setLastResult(null);
    setShotResult(null);
    setDragStart(null);
    setDragCurrent(null);
  };

  // Drag direction arrow
  const dragAngle = dragStart && dragCurrent
    ? Math.atan2(dragStart.y - dragCurrent.y, dragStart.x - dragCurrent.x)
    : null;
  const dragPower = dragStart && dragCurrent
    ? Math.min(Math.hypot(dragStart.x - dragCurrent.x, dragStart.y - dragCurrent.y) / 120, 1)
    : 0;

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* HUD */}
      <div className="flex items-center justify-between w-full max-w-sm px-2">
        <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-3 py-1.5">
          <span className="font-sport text-sm text-[hsl(var(--sport-text))]">⏱</span>
          <span className="font-sport text-sm text-[hsl(var(--sport-primary))]">{timeLeft}s</span>
        </div>
        <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-3 py-1.5">
          <span className="font-sport text-sm text-[hsl(var(--sport-accent))]">🏀 {score}</span>
        </div>
      </div>

      {/* Court */}
      <div
        ref={courtRef}
        className="relative rounded-2xl overflow-hidden border-2 border-[hsl(var(--sport-border))] touch-none select-none"
        style={{
          width: COURT_W, height: COURT_H,
          background: "linear-gradient(180deg, #0a0a1e 0%, #1a1060 30%, #2d3a00 55%, #5a6e00 75%, #7a8f10 100%)",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Court floor */}
        <div className="absolute left-0 right-0 bottom-0" style={{ top: "52%", background: "linear-gradient(180deg, #c27c2a 0%, #a0601a 100%)" }} />
        <div className="absolute left-0 right-0" style={{ top: "52%", height: 2, background: "rgba(255,255,255,0.3)" }} />

        {/* Court markings */}
        <svg className="absolute left-0 right-0 bottom-0" style={{ top: "52%", width: "100%", height: "48%" }} viewBox={`0 0 ${COURT_W} 240`} preserveAspectRatio="none">
          <ellipse cx={COURT_W / 2} cy={20} rx={60} ry={20} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
          <line x1={COURT_W / 2} y1={0} x2={COURT_W / 2} y2={240} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <rect x={(COURT_W - 100) / 2} y={0} width={100} height={80} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
        </svg>

        {/* Backboard + hoop (animated) */}
        <motion.div
          animate={{ left: hoopX - 40 }}
          transition={{ ease: "linear", duration: 0 }}
          className="absolute"
          style={{ top: HOOP_Y - 50, width: 80 }}
        >
          {/* Pole */}
          <div className="w-[3px] h-12 bg-gray-500 mx-auto" />
          {/* Backboard */}
          <div className="w-20 h-12 bg-white/85 border border-gray-400 rounded-sm mx-auto flex items-center justify-center">
            <div className="w-10 h-7 border-2 border-red-500" />
          </div>
          {/* Rim */}
          <div className="relative mx-auto" style={{ width: HOOP_HALF_W * 2 + 6, marginTop: -4 }}>
            {/* Left side of rim */}
            <div className="absolute left-0 top-0 w-2 h-2 rounded-full bg-orange-500" />
            {/* Rim bar */}
            <div className="mx-1 h-2 bg-orange-500 rounded-full" style={{ width: HOOP_HALF_W * 2 }} />
            {/* Right side */}
            <div className="absolute right-0 top-0 w-2 h-2 rounded-full bg-orange-500" />
          </div>
          {/* Net */}
          <svg width={HOOP_HALF_W * 2 + 6} height={28} className="mx-auto">
            {Array.from({ length: 5 }, (_, i) => (
              <line key={i} x1={3 + (i * (HOOP_HALF_W * 2) / 4)} y1={0} x2={8 + (i * (HOOP_HALF_W * 2 - 10) / 4)} y2={28} stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />
            ))}
            {[8, 16, 24].map(y => (
              <line key={y} x1={3} y1={y * 0.4} x2={HOOP_HALF_W * 2 + 3} y2={y * 0.4} stroke="rgba(255,255,255,0.3)" strokeWidth="0.6" />
            ))}
          </svg>
        </motion.div>

        {/* Swish/score flash on the rim */}
        {shotResult === "score" && (
          <motion.div
            initial={{ opacity: 1, scale: 1 }}
            animate={{ opacity: 0, scale: 2 }}
            transition={{ duration: 0.5 }}
            className="absolute rounded-full bg-yellow-400/60"
            style={{ left: hoopX - 30, top: HOOP_Y - 8, width: 60, height: 16 }}
          />
        )}

        {/* Ball - resting */}
        {!shooting && !ballPos && (
          <div
            className="absolute rounded-full border-2 border-orange-700 shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
            style={{
              left: BALL_START_X - 16, top: BALL_START_Y - 16,
              width: 32, height: 32,
              background: "radial-gradient(circle at 35% 35%, #fb923c, #c2410c)",
            }}
          >
            {/* Ball seams */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 32 32">
              <path d="M8 16 Q16 8 24 16" stroke="rgba(0,0,0,0.3)" strokeWidth="1" fill="none" />
              <path d="M8 16 Q16 24 24 16" stroke="rgba(0,0,0,0.3)" strokeWidth="1" fill="none" />
              <path d="M16 6 Q8 16 16 26" stroke="rgba(0,0,0,0.2)" strokeWidth="1" fill="none" />
            </svg>
          </div>
        )}

        {/* Ball - in flight */}
        {ballPos && (
          <motion.div
            className="absolute rounded-full border-2 border-orange-700 shadow-lg"
            style={{
              left: ballPos.x - 14, top: ballPos.y - 14,
              width: 28, height: 28,
              background: "radial-gradient(circle at 35% 35%, #fb923c, #c2410c)",
              zIndex: 10,
            }}
          >
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 28 28">
              <path d="M7 14 Q14 7 21 14" stroke="rgba(0,0,0,0.3)" strokeWidth="1" fill="none" />
              <path d="M7 14 Q14 21 21 14" stroke="rgba(0,0,0,0.3)" strokeWidth="1" fill="none" />
            </svg>
          </motion.div>
        )}

        {/* Drag arrow indicator */}
        {dragStart && dragCurrent && dragAngle !== null && !shooting && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
            {/* Power arc */}
            <line
              x1={BALL_START_X}
              y1={BALL_START_Y}
              x2={BALL_START_X + Math.cos(dragAngle) * dragPower * 80}
              y2={BALL_START_Y + Math.sin(dragAngle) * dragPower * 80}
              stroke="rgba(255,255,255,0.6)"
              strokeWidth="2.5"
              strokeDasharray="6 4"
              strokeLinecap="round"
            />
            {/* Arrowhead */}
            <circle
              cx={BALL_START_X + Math.cos(dragAngle) * dragPower * 80}
              cy={BALL_START_Y + Math.sin(dragAngle) * dragPower * 80}
              r={4}
              fill="white"
              fillOpacity={0.8}
            />
          </svg>
        )}

        {/* Result flash */}
        <AnimatePresence>
          {lastResult && (
            <motion.div
              initial={{ opacity: 0, scale: 1.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{ zIndex: 20 }}
            >
              <span className="font-sport text-4xl text-white drop-shadow-2xl"
                style={{ textShadow: lastResult === "score" ? "0 0 30px #fbbf24" : "0 0 30px #ef4444" }}>
                {lastResult === "score" ? "🏀 +2" : "MISS!"}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Start / game over overlays */}
        {gameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-4"
          >
            <p className="font-sport text-3xl text-[hsl(var(--sport-accent))]">FULL TIME!</p>
            <p className="font-sport text-xl text-white">Score: {score}</p>
            <button onClick={restart} className="px-8 py-3 bg-[hsl(var(--sport-primary))] text-[hsl(var(--sport-bg))] rounded-xl font-sport tracking-wider text-lg">
              PLAY AGAIN
            </button>
          </motion.div>
        )}
      </div>

      <p className="font-sport-body text-xs text-[hsl(var(--sport-muted))]">
        Drag the ball upward toward the hoop to shoot
      </p>
    </div>
  );
};
