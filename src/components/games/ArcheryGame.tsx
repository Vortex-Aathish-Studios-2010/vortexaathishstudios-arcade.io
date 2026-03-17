import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { addEntertainmentPoints } from "@/lib/streaks";
import { sfx } from "@/lib/sounds";

export const ArcheryGame = ({ onComplete }: { onComplete?: (score: number) => void }) => {
  const [arrows, setArrows] = useState(5);
  const [score, setScore] = useState(0);
  const [crosshairPos, setCrosshairPos] = useState({ x: 50, y: 50 });
  const [shooting, setShooting] = useState(false);
  const [hitPos, setHitPos] = useState<{ x: number; y: number; ring: number } | null>(null);
  const [hits, setHits] = useState<{ x: number; y: number; ring: number }[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);

  // Crosshair movement
  useEffect(() => {
    if (gameOver || shooting) return;
    const speed = 0.03;
    const animate = () => {
      timeRef.current += speed;
      const t = timeRef.current;
      const x = 50 + 35 * Math.sin(t * 1.3) * Math.cos(t * 0.7);
      const y = 50 + 35 * Math.cos(t * 1.1) * Math.sin(t * 0.9);
      setCrosshairPos({ x, y });
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [gameOver, shooting]);

  const shoot = useCallback(() => {
    if (shooting || gameOver || arrows <= 0) return;
    setShooting(true);
    sfx.click();

    const dx = crosshairPos.x - 50;
    const dy = crosshairPos.y - 50;
    const dist = Math.sqrt(dx * dx + dy * dy);

    let ring: number;
    let points: number;
    if (dist < 5) { ring = 0; points = 100; }
    else if (dist < 10) { ring = 1; points = 80; }
    else if (dist < 18) { ring = 2; points = 60; }
    else if (dist < 26) { ring = 3; points = 40; }
    else if (dist < 34) { ring = 4; points = 20; }
    else { ring = 5; points = 10; }

    const hit = { x: crosshairPos.x, y: crosshairPos.y, ring };
    setHitPos(hit);
    setHits(prev => [...prev, hit]);
    setScore(prev => prev + points);
    setArrows(prev => prev - 1);

    setTimeout(() => {
      setShooting(false);
      setHitPos(null);
      if (arrows - 1 <= 0) {
        setGameOver(true);
        const finalScore = score + points;
        addEntertainmentPoints(Math.round(finalScore / 10));
        sfx.levelComplete();
        onComplete?.(finalScore);
      }
    }, 800);
  }, [shooting, gameOver, arrows, crosshairPos, score, onComplete]);

  const restart = () => {
    setArrows(5);
    setScore(0);
    setHits([]);
    setGameOver(false);
    setShooting(false);
    setHitPos(null);
  };

  const ringColors = [
    "fill-yellow-400", "fill-red-500", "fill-red-400",
    "fill-blue-400", "fill-blue-300", "fill-white"
  ];

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full max-w-xs">
        <span className="font-sport text-sm text-[hsl(var(--sport-text))]">🏹 {arrows} arrows</span>
        <span className="font-sport text-sm text-[hsl(var(--sport-accent))]">Score: {score}</span>
      </div>

      {/* Target with grass background */}
      <div
        className="relative w-72 h-72 rounded-2xl overflow-hidden cursor-crosshair border-2 border-[hsl(var(--sport-border))]"
        onClick={shoot}
        style={{
          background: "linear-gradient(180deg, #87CEEB 0%, #87CEEB 55%, #4a8c3f 55%, #2d5a1e 100%)",
        }}
      >
        {/* Target board */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
          {/* Target stand */}
          <rect x="46" y="80" width="8" height="16" fill="#8B4513" />
          <rect x="38" y="94" width="24" height="4" rx="2" fill="#654321" />

          {/* Target rings */}
          <circle cx="50" cy="50" r="38" className="fill-white" stroke="#ddd" strokeWidth="0.5" />
          <circle cx="50" cy="50" r="32" className="fill-blue-200" stroke="#ddd" strokeWidth="0.5" />
          <circle cx="50" cy="50" r="26" className="fill-blue-400" stroke="#ddd" strokeWidth="0.5" />
          <circle cx="50" cy="50" r="18" className="fill-red-400" stroke="#ddd" strokeWidth="0.5" />
          <circle cx="50" cy="50" r="10" className="fill-red-500" stroke="#ddd" strokeWidth="0.5" />
          <circle cx="50" cy="50" r="5" className="fill-yellow-400" stroke="#ddd" strokeWidth="0.5" />

          {/* Previous hits */}
          {hits.map((h, i) => (
            <g key={i}>
              <circle cx={h.x} cy={h.y} r="1.5" fill="#333" />
              <line x1={h.x - 1} y1={h.y} x2={h.x + 1} y2={h.y} stroke="#666" strokeWidth="0.3" />
              <line x1={h.x} y1={h.y - 1} x2={h.x} y2={h.y + 1} stroke="#666" strokeWidth="0.3" />
            </g>
          ))}

          {/* Current hit flash */}
          {hitPos && (
            <motion.circle
              initial={{ r: 0, opacity: 1 }}
              animate={{ r: 5, opacity: 0 }}
              transition={{ duration: 0.6 }}
              cx={hitPos.x} cy={hitPos.y}
              fill="hsl(var(--sport-accent))"
            />
          )}

          {/* Crosshair */}
          {!shooting && !gameOver && (
            <g>
              <circle cx={crosshairPos.x} cy={crosshairPos.y} r="3" fill="none" stroke="red" strokeWidth="0.6" />
              <line x1={crosshairPos.x - 5} y1={crosshairPos.y} x2={crosshairPos.x + 5} y2={crosshairPos.y} stroke="red" strokeWidth="0.4" />
              <line x1={crosshairPos.x} y1={crosshairPos.y - 5} x2={crosshairPos.x} y2={crosshairPos.y + 5} stroke="red" strokeWidth="0.4" />
            </g>
          )}
        </svg>
      </div>

      <button
        onClick={shoot}
        disabled={shooting || gameOver}
        className="px-8 py-3 bg-[hsl(var(--sport-accent))] text-[hsl(var(--sport-bg))] rounded-xl font-sport text-lg tracking-wider disabled:opacity-40 hover:brightness-110 transition-all shadow-lg"
      >
        🏹 SHOOT
      </button>

      {gameOver && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <p className="font-sport text-2xl text-[hsl(var(--sport-accent))] mb-2">Final Score: {score}</p>
          <p className="font-sport-body text-sm text-[hsl(var(--sport-muted))] mb-4">
            {score >= 400 ? "🎯 Sharpshooter!" : score >= 250 ? "👏 Great aim!" : "Keep practicing!"}
          </p>
          <button onClick={restart} className="px-6 py-2 bg-[hsl(var(--sport-primary))]/20 border border-[hsl(var(--sport-primary))]/50 text-[hsl(var(--sport-primary))] rounded-xl font-sport tracking-wider">
            PLAY AGAIN
          </button>
        </motion.div>
      )}
    </div>
  );
};
