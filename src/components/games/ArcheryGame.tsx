import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { addEntertainmentPoints } from "@/lib/streaks";
import { sfx } from "@/lib/sounds";

const WIND_LABELS = ["Calm", "Light Breeze", "Moderate Wind", "Strong Wind"];

export const ArcheryGame = ({ onComplete }: { onComplete?: (score: number) => void }) => {
  const [arrows, setArrows] = useState(5);
  const [score, setScore] = useState(0);
  const [crosshairPos, setCrosshairPos] = useState({ x: 50, y: 50 });
  const [shooting, setShooting] = useState(false);
  const [arrowFlying, setArrowFlying] = useState(false);
  const [arrowFrom, setArrowFrom] = useState({ x: 50, y: 105 });
  const [hitPos, setHitPos] = useState<{ x: number; y: number; points: number } | null>(null);
  const [hits, setHits] = useState<{ x: number; y: number; ring: number }[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [lastPoints, setLastPoints] = useState<number | null>(null);
  const [wind, setWind] = useState({ x: 0, y: 0, label: "Calm", strength: 0 });
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);

  const generateWind = useCallback(() => {
    const strength = Math.floor(Math.random() * 4);
    const angle = Math.random() * Math.PI * 2;
    setWind({
      x: Math.cos(angle) * strength * 3,
      y: Math.sin(angle) * strength * 1.5,
      label: WIND_LABELS[strength],
      strength,
    });
  }, []);

  useEffect(() => { generateWind(); }, [generateWind]);

  // Crosshair movement
  useEffect(() => {
    if (gameOver || shooting) return;
    const speed = 0.025;
    const animate = () => {
      timeRef.current += speed;
      const t = timeRef.current;
      const x = 50 + 32 * Math.sin(t * 1.4) * Math.cos(t * 0.8);
      const y = 50 + 32 * Math.cos(t * 1.2) * Math.sin(t * 0.95);
      setCrosshairPos({ x, y });
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [gameOver, shooting]);

  const shoot = useCallback(() => {
    if (shooting || gameOver || arrows <= 0) return;
    setShooting(true);
    setArrowFlying(true);
    sfx.click();

    // Apply wind offset
    const finalX = crosshairPos.x + wind.x;
    const finalY = crosshairPos.y + wind.y;
    const clampX = Math.max(5, Math.min(95, finalX));
    const clampY = Math.max(5, Math.min(95, finalY));

    const dx = clampX - 50;
    const dy = clampY - 50;
    const dist = Math.sqrt(dx * dx + dy * dy);

    let ring: number;
    let points: number;
    if (dist < 4)       { ring = 0; points = 100; }
    else if (dist < 9)  { ring = 1; points = 80; }
    else if (dist < 16) { ring = 2; points = 60; }
    else if (dist < 24) { ring = 3; points = 40; }
    else if (dist < 33) { ring = 4; points = 20; }
    else                { ring = 5; points = 5; }

    const hit = { x: clampX, y: clampY, ring };

    // Animate arrow flight then stick it
    setTimeout(() => {
      setArrowFlying(false);
      setHitPos({ x: clampX, y: clampY, points });
      setHits(prev => [...prev, hit]);
      setScore(prev => prev + points);
      setLastPoints(points);
      setArrows(prev => prev - 1);

      setTimeout(() => {
        setShooting(false);
        setHitPos(null);
        setLastPoints(null);
        generateWind();
        if (arrows - 1 <= 0) {
          setGameOver(true);
          const finalScore = score + points;
          addEntertainmentPoints(Math.round(finalScore / 10));
          sfx.levelComplete();
          onComplete?.(finalScore);
        }
      }, 900);
    }, 500);
  }, [shooting, gameOver, arrows, crosshairPos, score, wind, onComplete, generateWind]);

  const restart = () => {
    setArrows(5);
    setScore(0);
    setHits([]);
    setGameOver(false);
    setShooting(false);
    setHitPos(null);
    setLastPoints(null);
    generateWind();
  };

  const ringColors = ["#facc15", "#ef4444", "#f87171", "#60a5fa", "#93c5fd", "#ffffff"];

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      {/* HUD */}
      <div className="flex items-center justify-between w-full max-w-md px-2">
        <div className="flex items-center gap-1.5">
          {Array.from({ length: 5 }, (_, i) => (
            <span key={i} className={`text-xl ${i < (5 - arrows) ? "opacity-40" : "opacity-100"}`}>🏹</span>
          ))}
        </div>
        <span className="font-sport text-sm text-[hsl(var(--sport-accent))]">Score: {score}</span>
      </div>

      {/* Wind indicator */}
      <div className="flex items-center gap-2 bg-[hsl(var(--sport-card))]/80 border border-[hsl(var(--sport-border))] rounded-xl px-4 py-2">
        <span className="font-sport-body text-xs text-[hsl(var(--sport-muted))]">Wind:</span>
        <div className="flex items-center gap-1.5">
          {wind.strength > 0 && (
            <motion.div
              animate={{ x: [0, wind.x > 0 ? 4 : -4, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            >
              {wind.x > 0 ? "→" : wind.x < 0 ? "←" : wind.y > 0 ? "↓" : "↑"}
            </motion.div>
          )}
          <span className={`font-sport text-sm font-bold ${
            wind.strength === 0 ? "text-green-400" :
            wind.strength === 1 ? "text-yellow-400" :
            wind.strength === 2 ? "text-orange-400" : "text-red-400"
          }`}>
            {wind.label}
          </span>
        </div>
      </div>

      {/* Scene: sky + target */}
      <div
        className="relative overflow-hidden rounded-2xl cursor-crosshair border-2 border-[hsl(var(--sport-border))] w-full max-w-md"
        style={{
          height: 340,
          background: "linear-gradient(180deg, #87CEEB 0%, #b0e0ff 45%, #4a8c3f 45%, #2d5a1e 100%)",
        }}
        onClick={shoot}
      >
        {/* Clouds */}
        <div className="absolute top-4 left-10 w-20 h-6 bg-white/60 rounded-full blur-sm" />
        <div className="absolute top-8 left-16 w-28 h-5 bg-white/50 rounded-full blur-sm" />
        <div className="absolute top-3 right-14 w-16 h-5 bg-white/60 rounded-full blur-sm" />

        {/* Target board on stand */}
        <svg viewBox="0 0 100 115" className="absolute inset-0 w-full h-full">
          {/* Stand */}
          <rect x="46" y="85" width="8" height="25" fill="#8B4513" rx="1" />
          <rect x="35" y="108" width="30" height="5" rx="2" fill="#654321" />

          {/* Target rings (back to front = big to small) */}
          <circle cx="50" cy="52" r="38" fill={ringColors[5]} stroke="#ddd" strokeWidth="0.5" />
          <circle cx="50" cy="52" r="32" fill={ringColors[4]} stroke="#ddd" strokeWidth="0.5" />
          <circle cx="50" cy="52" r="26" fill={ringColors[3]} stroke="#ddd" strokeWidth="0.5" />
          <circle cx="50" cy="52" r="18" fill={ringColors[2]} stroke="#ddd" strokeWidth="0.5" />
          <circle cx="50" cy="52" r="10" fill={ringColors[1]} stroke="#ddd" strokeWidth="0.5" />
          <circle cx="50" cy="52" r="4" fill={ringColors[0]} stroke="#ddd" strokeWidth="0.5" />

          {/* Ring score labels */}
          <text x="50" y="28" textAnchor="middle" fontSize="3.5" fill="rgba(0,0,0,0.4)" fontFamily="monospace">20</text>
          <text x="50" y="33.5" textAnchor="middle" fontSize="3.5" fill="rgba(0,0,0,0.4)" fontFamily="monospace">40</text>
          <text x="50" y="40" textAnchor="middle" fontSize="3.5" fill="rgba(255,255,255,0.6)" fontFamily="monospace">60</text>
          <text x="50" y="46" textAnchor="middle" fontSize="3.5" fill="rgba(255,255,255,0.7)" fontFamily="monospace">80</text>

          {/* Past arrow hits */}
          {hits.map((h, i) => (
            <g key={i}>
              {/* Arrow shaft */}
              <line
                x1={h.x}
                y1={h.y - 6}
                x2={h.x}
                y2={h.y + 6}
                stroke="#8B4513"
                strokeWidth="1"
              />
              {/* Arrow tip */}
              <circle cx={h.x} cy={h.y} r="1.2" fill="#333" />
              {/* Fletching */}
              <polygon
                points={`${h.x - 1.5},${h.y + 4} ${h.x},${h.y + 6} ${h.x + 1.5},${h.y + 4}`}
                fill="#e74c3c"
              />
            </g>
          ))}

          {/* Flying arrow animation */}
          {arrowFlying && (
            <motion.line
              initial={{ x1: 50, y1: 110, x2: 50, y2: 108 }}
              animate={{ x1: crosshairPos.x, y1: crosshairPos.y + 2, x2: crosshairPos.x, y2: crosshairPos.y - 6 }}
              transition={{ duration: 0.5, ease: "easeIn" }}
              stroke="#8B4513"
              strokeWidth="1.2"
            />
          )}

          {/* Hit flash ring */}
          {hitPos && (
            <motion.circle
              initial={{ r: 0, opacity: 1 }}
              animate={{ r: 8, opacity: 0 }}
              transition={{ duration: 0.7 }}
              cx={hitPos.x}
              cy={hitPos.y}
              fill="hsl(var(--sport-accent))"
            />
          )}

          {/* Crosshair */}
          {!shooting && !gameOver && (
            <g>
              <circle cx={crosshairPos.x} cy={crosshairPos.y} r="4" fill="none" stroke="rgba(255,0,0,0.9)" strokeWidth="0.8" />
              <circle cx={crosshairPos.x} cy={crosshairPos.y} r="0.8" fill="rgba(255,0,0,0.9)" />
              <line x1={crosshairPos.x - 7} y1={crosshairPos.y} x2={crosshairPos.x - 4.5} y2={crosshairPos.y} stroke="rgba(255,0,0,0.9)" strokeWidth="0.6" />
              <line x1={crosshairPos.x + 4.5} y1={crosshairPos.y} x2={crosshairPos.x + 7} y2={crosshairPos.y} stroke="rgba(255,0,0,0.9)" strokeWidth="0.6" />
              <line x1={crosshairPos.x} y1={crosshairPos.y - 7} x2={crosshairPos.x} y2={crosshairPos.y - 4.5} stroke="rgba(255,0,0,0.9)" strokeWidth="0.6" />
              <line x1={crosshairPos.x} y1={crosshairPos.y + 4.5} x2={crosshairPos.x} y2={crosshairPos.y + 7} stroke="rgba(255,0,0,0.9)" strokeWidth="0.6" />
            </g>
          )}
        </svg>

        {/* Wind deflection preview */}
        {!shooting && wind.strength > 0 && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: `${crosshairPos.x}%`,
              top: `${crosshairPos.y * 0.9}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <motion.div
              animate={{ x: wind.x * 3, y: wind.y * 3, opacity: [0, 0.6, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-white/40"
            />
          </div>
        )}
      </div>

      {/* Points flash */}
      <AnimatePresence>
        {lastPoints !== null && (
          <motion.div
            key={`pts-${score}`}
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className={`font-sport text-2xl font-bold ${
              lastPoints >= 80 ? "text-yellow-400" :
              lastPoints >= 60 ? "text-red-400" :
              lastPoints >= 40 ? "text-blue-400" : "text-white/60"
            }`}
          >
            {lastPoints >= 100 ? "🎯 BULLSEYE! +100" :
             lastPoints >= 80 ? "⭐ GREAT! +" + lastPoints :
             lastPoints >= 60 ? "👍 NICE! +" + lastPoints :
             "+" + lastPoints}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={shoot}
        disabled={shooting || gameOver}
        className="px-10 py-4 bg-[hsl(var(--sport-accent))] text-[hsl(var(--sport-bg))] rounded-xl font-sport text-lg tracking-wider disabled:opacity-40 hover:brightness-110 transition-all shadow-lg active:scale-95"
      >
        🏹 SHOOT
      </button>

      <AnimatePresence>
        {gameOver && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="text-center"
          >
            <p className="font-sport text-3xl text-[hsl(var(--sport-accent))] mb-1">Final: {score}</p>
            <p className="font-sport-body text-sm text-[hsl(var(--sport-muted))] mb-4">
              {score >= 400 ? "🏆 Sharpshooter!" : score >= 280 ? "⭐ Excellent aim!" : score >= 180 ? "👍 Good effort!" : "Keep practicing!"}
            </p>
            <button onClick={restart} className="px-8 py-3 bg-[hsl(var(--sport-primary))]/20 border-2 border-[hsl(var(--sport-primary))]/50 text-[hsl(var(--sport-primary))] rounded-xl font-sport tracking-wider hover:bg-[hsl(var(--sport-primary))]/30 transition-all">
              PLAY AGAIN
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
