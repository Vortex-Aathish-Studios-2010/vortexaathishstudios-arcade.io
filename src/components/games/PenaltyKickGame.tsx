import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { addEntertainmentPoints } from "@/lib/streaks";
import { sfx } from "@/lib/sounds";

type Zone = "left" | "center" | "right";

const ZONE_LABELS: Record<Zone, string> = {
  left: "← LEFT",
  center: "↑ CENTER",
  right: "RIGHT →",
};

export const PenaltyKickGame = ({ onComplete }: { onComplete?: (score: number) => void }) => {
  const [kicks, setKicks] = useState(5);
  const [goals, setGoals] = useState(0);
  const [saves, setSaves] = useState(0);
  const [kicking, setKicking] = useState(false);
  const [lastResult, setLastResult] = useState<"goal" | "save" | null>(null);
  const [shotZone, setShotZone] = useState<Zone | null>(null);
  const [gkZone, setGkZone] = useState<Zone | null>(null);
  const [ballAnimating, setBallAnimating] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [showZones, setShowZones] = useState(true);

  const kick = useCallback((zone: Zone) => {
    if (kicking || gameOver) return;
    setKicking(true);
    setShowZones(false);
    sfx.click();

    const gk: Zone = (["left", "center", "right"] as Zone[])[Math.floor(Math.random() * 3)];
    setShotZone(zone);
    setGkZone(gk);
    setBallAnimating(true);

    const isGoal = gk !== zone;

    setTimeout(() => {
      setBallAnimating(false);
      if (isGoal) {
        setGoals(prev => prev + 1);
        setLastResult("goal");
        sfx.levelComplete();
      } else {
        setSaves(prev => prev + 1);
        setLastResult("save");
        sfx.error();
      }

      setTimeout(() => {
        setKicking(false);
        setShotZone(null);
        setGkZone(null);
        setLastResult(null);
        setShowZones(true);
        const remaining = kicks - 1;
        setKicks(remaining);
        if (remaining <= 0) {
          setGameOver(true);
          const finalGoals = isGoal ? goals + 1 : goals;
          addEntertainmentPoints(finalGoals * 20);
          onComplete?.(finalGoals * 20);
        }
      }, 1400);
    }, 900);
  }, [kicking, gameOver, kicks, goals, onComplete]);

  const restart = () => {
    setKicks(5);
    setGoals(0);
    setSaves(0);
    setGameOver(false);
    setKicking(false);
    setLastResult(null);
    setShotZone(null);
    setGkZone(null);
    setBallAnimating(false);
    setShowZones(true);
  };

  const gkXPct = gkZone === "left" ? 20 : gkZone === "right" ? 80 : 50;
  const ballTargetX = shotZone === "left" ? 22 : shotZone === "right" ? 78 : 50;
  const ballTargetY = 28;

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      {/* Scoreboard */}
      <div className="flex items-center justify-between w-full max-w-md px-2">
        <div className="flex items-center gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <span key={i} className={`text-lg ${i < (5 - kicks) ? (i < goals ? "text-green-400" : "text-red-400") : "text-[hsl(var(--sport-muted))]"}`}>
              {i < (5 - kicks) ? (i < goals ? "⚽" : "🧤") : "○"}
            </span>
          ))}
        </div>
        <span className="font-sport text-sm text-[hsl(var(--sport-accent))]">
          {goals} / {goals + saves} Goals
        </span>
      </div>

      {/* Football pitch */}
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border-2 border-[hsl(var(--sport-border))] select-none"
        style={{
          height: 360,
          background: "linear-gradient(180deg, #1a1a2e 0%, #0d0d1a 25%, #0a3d0a 45%, #0d5a0d 65%, #0a3d0a 100%)",
        }}
      >
        {/* Night sky with stadium lights */}
        <div className="absolute top-0 left-0 right-0 h-[40%]">
          <div className="absolute top-3 left-[10%] w-3 h-3 rounded-full bg-yellow-200/80" style={{ boxShadow: "0 0 20px 8px rgba(255,240,150,0.3)" }} />
          <div className="absolute top-3 right-[10%] w-3 h-3 rounded-full bg-yellow-200/80" style={{ boxShadow: "0 0 20px 8px rgba(255,240,150,0.3)" }} />
          <div className="absolute top-1 left-[10%] w-1 h-8 bg-white/30 rounded-full" />
          <div className="absolute top-1 right-[10%] w-1 h-8 bg-white/30 rounded-full" />
        </div>

        {/* Grass with pitch markings */}
        <div className="absolute left-0 right-0 bottom-0" style={{ top: "38%" }}>
          {/* Pitch stripes */}
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="absolute top-0 bottom-0 opacity-20" style={{
              left: `${i * 16.67}%`, width: "16.67%",
              background: i % 2 === 0 ? "#1a6b1a" : "#1d7a1d"
            }} />
          ))}
          {/* Penalty arc */}
          <svg className="absolute w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <ellipse cx="50" cy="5" rx="20" ry="12" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
            <line x1="20" y1="0" x2="20" y2="20" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
            <line x1="80" y1="0" x2="80" y2="20" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
            <line x1="20" y1="20" x2="80" y2="20" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
            {/* Center spot for ball */}
            <circle cx="50" cy="90" r="1.5" fill="rgba(255,255,255,0.4)" />
            <line x1="0" y1="100" x2="100" y2="100" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
          </svg>
        </div>

        {/* Goal (SVG) */}
        <svg viewBox="0 0 100 60" className="absolute w-full" style={{ top: "4%", height: "44%" }}>
          {/* Net backdrop */}
          <rect x="15" y="8" width="70" height="38" fill="rgba(255,255,255,0.04)" />
          {/* Net lines vertical */}
          {Array.from({ length: 14 }, (_, i) => (
            <line key={`nv${i}`} x1={17 + i * 5} y1={8} x2={17 + i * 5} y2={46} stroke="rgba(255,255,255,0.12)" strokeWidth="0.4" />
          ))}
          {/* Net lines horizontal */}
          {Array.from({ length: 8 }, (_, i) => (
            <line key={`nh${i}`} x1={15} y1={10 + i * 5} x2={85} y2={10 + i * 5} stroke="rgba(255,255,255,0.12)" strokeWidth="0.4" />
          ))}
          {/* Goal frame */}
          <rect x="15" y="6" width="2" height="42" fill="white" rx="1" />
          <rect x="83" y="6" width="2" height="42" fill="white" rx="1" />
          <rect x="15" y="4" width="70" height="3.5" fill="white" rx="1" />
          {/* Goal depth sides */}
          <rect x="13" y="4" width="3" height="44" fill="rgba(200,200,200,0.3)" rx="1" />
          <rect x="84" y="4" width="3" height="44" fill="rgba(200,200,200,0.3)" rx="1" />

          {/* Goalkeeper */}
          <motion.g
            animate={{ x: gkZone ? (gkXPct - 50) * 0.55 : 0, scaleX: gkZone === "left" ? -1 : 1 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            style={{ originX: "50%" }}
          >
            {/* Body */}
            <rect x="46" y="28" width="8" height="16" rx="2" fill="#2563eb" />
            {/* Head */}
            <circle cx="50" cy="24" r="4.5" fill="#fbbf24" />
            {/* Left arm */}
            <motion.rect
              x="38" y="28" width="8" height="3" rx="1.5" fill="#2563eb"
              animate={{ rotate: gkZone === "left" ? -60 : gkZone === "right" ? 20 : 0 }}
              style={{ originX: "46px", originY: "29.5px" }}
            />
            {/* Right arm */}
            <motion.rect
              x="54" y="28" width="8" height="3" rx="1.5" fill="#2563eb"
              animate={{ rotate: gkZone === "right" ? 60 : gkZone === "left" ? -20 : 0 }}
              style={{ originX: "54px", originY: "29.5px" }}
            />
            {/* Gloves */}
            <circle cx={gkZone === "left" ? 37 : gkZone === "right" ? 43 : 40} cy="27" r="2.5" fill="#f59e0b" />
            <circle cx={gkZone === "right" ? 63 : gkZone === "left" ? 57 : 60} cy="27" r="2.5" fill="#f59e0b" />
            {/* Legs */}
            <rect x="46" y="43" width="4" height="6" rx="1" fill="#1e3a8a" />
            <rect x="50" y="43" width="4" height="6" rx="1" fill="#1e3a8a" />
            {/* Boots */}
            <rect x="45" y="48" width="5" height="2.5" rx="1" fill="#111" />
            <rect x="50" y="48" width="5" height="2.5" rx="1" fill="#111" />
          </motion.g>

          {/* Ball animation */}
          <AnimatePresence>
            {ballAnimating && shotZone && (
              <motion.g
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.circle
                  initial={{ cx: 50, cy: 58, r: 5 }}
                  animate={{ cx: ballTargetX, cy: ballTargetY, r: 3.5 }}
                  transition={{ duration: 0.7, ease: [0.3, 0.1, 0.2, 1] }}
                  fill="white"
                  stroke="#555"
                  strokeWidth="0.5"
                />
                {/* Ball spin pattern */}
                <motion.line
                  initial={{ x1: 50, y1: 58, x2: 52, y2: 56 }}
                  animate={{ x1: ballTargetX - 1, y1: ballTargetY + 1, x2: ballTargetX + 1, y2: ballTargetY - 1 }}
                  transition={{ duration: 0.7, ease: [0.3, 0.1, 0.2, 1] }}
                  stroke="#999" strokeWidth="0.4"
                />
              </motion.g>
            )}
          </AnimatePresence>

          {/* Resting ball */}
          {!ballAnimating && showZones && (
            <g>
              <circle cx="50" cy="58" r="4.5" fill="white" stroke="#555" strokeWidth="0.5" />
              <path d="M48 56 Q50 54 52 56 Q50 58 48 56" fill="#333" />
              <path d="M46 58 Q48 56 48 60 Q46 60 46 58" fill="#333" />
              <path d="M52 58 Q52 56 54 58 Q54 60 52 60 Q52 58" fill="#333" />
            </g>
          )}
        </svg>

        {/* Clickable aim zones */}
        <AnimatePresence>
          {showZones && !kicking && !gameOver && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-x-[15%] flex gap-1"
              style={{ top: "8%", height: "40%" }}
            >
              {(["left", "center", "right"] as Zone[]).map(zone => (
                <button
                  key={zone}
                  onClick={() => kick(zone)}
                  className="flex-1 rounded-lg border border-white/10 hover:border-white/40 hover:bg-white/10 transition-all flex items-end justify-center pb-3 group"
                >
                  <span className="font-sport text-[10px] tracking-wider text-white/20 group-hover:text-white/70 transition-colors">
                    {ZONE_LABELS[zone]}
                  </span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result overlay */}
        <AnimatePresence>
          {lastResult && (
            <motion.div
              initial={{ opacity: 0, scale: 1.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 300 }}
              className={`absolute inset-0 flex items-center justify-center ${
                lastResult === "goal" ? "bg-green-500/25" : "bg-red-500/25"
              }`}
            >
              <div className="text-center">
                <motion.p
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.4 }}
                  className="font-sport text-4xl md:text-5xl text-white drop-shadow-2xl"
                  style={{ textShadow: lastResult === "goal" ? "0 0 30px #22c55e" : "0 0 30px #ef4444" }}
                >
                  {lastResult === "goal" ? "⚽ GOAL!" : "🧤 SAVED!"}
                </motion.p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Instruction */}
        {showZones && !gameOver && (
          <div className="absolute bottom-3 left-0 right-0 text-center">
            <p className="font-sport text-[11px] tracking-wider text-white/30">
              CLICK A ZONE TO SHOOT
            </p>
          </div>
        )}
      </div>

      {/* Kick indicators */}
      <div className="flex items-center gap-1 font-sport text-sm text-[hsl(var(--sport-muted))]">
        <span>{kicks} kicks remaining</span>
      </div>

      {/* Game over */}
      {gameOver && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="text-center"
        >
          <p className="font-sport text-3xl text-[hsl(var(--sport-accent))] mb-1">{goals}/5 Goals!</p>
          <p className="font-sport-body text-sm text-[hsl(var(--sport-muted))] mb-4">
            {goals >= 4 ? "🏆 Legend!" : goals >= 3 ? "👏 Great shooting!" : goals >= 2 ? "Not bad!" : "Keep practicing!"}
          </p>
          <button
            onClick={restart}
            className="px-8 py-3 bg-[hsl(var(--sport-primary))]/20 border-2 border-[hsl(var(--sport-primary))]/50 text-[hsl(var(--sport-primary))] rounded-xl font-sport tracking-wider hover:bg-[hsl(var(--sport-primary))]/30 transition-all"
          >
            PLAY AGAIN
          </button>
        </motion.div>
      )}
    </div>
  );
};
