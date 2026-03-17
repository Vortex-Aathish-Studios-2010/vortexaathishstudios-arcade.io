import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { addEntertainmentPoints } from "@/lib/streaks";
import { sfx } from "@/lib/sounds";

type Zone = "TL" | "TC" | "TR" | "BL" | "BC" | "BR";

const ZONES: { id: Zone; label: string; x: number; y: number }[] = [
  { id: "TL", label: "↖", x: 15, y: 25 },
  { id: "TC", label: "↑", x: 50, y: 20 },
  { id: "TR", label: "↗", x: 85, y: 25 },
  { id: "BL", label: "↙", x: 15, y: 65 },
  { id: "BC", label: "↓", x: 50, y: 70 },
  { id: "BR", label: "↘", x: 85, y: 65 },
];

const GK_DIVE_ZONES: Zone[] = ["TL", "TC", "TR", "BL", "BC", "BR"];

export const PenaltyKickGame = ({ onComplete }: { onComplete?: (score: number) => void }) => {
  const [kicks, setKicks] = useState(5);
  const [goals, setGoals] = useState(0);
  const [saves, setSaves] = useState(0);
  const [kicking, setKicking] = useState(false);
  const [lastResult, setLastResult] = useState<"goal" | "save" | null>(null);
  const [ballPos, setBallPos] = useState<{ x: number; y: number } | null>(null);
  const [gkDive, setGkDive] = useState<Zone | null>(null);
  const [gameOver, setGameOver] = useState(false);

  const kick = useCallback((zone: Zone) => {
    if (kicking || gameOver) return;
    setKicking(true);
    sfx.click();

    // GK randomly dives
    const gkZone = GK_DIVE_ZONES[Math.floor(Math.random() * GK_DIVE_ZONES.length)];
    setGkDive(gkZone);

    const target = ZONES.find(z => z.id === zone)!;
    setBallPos({ x: target.x, y: target.y });

    const isGoal = gkZone !== zone;
    
    setTimeout(() => {
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
        setBallPos(null);
        setGkDive(null);
        setLastResult(null);
        const remaining = kicks - 1;
        setKicks(remaining);
        if (remaining <= 0) {
          setGameOver(true);
          const finalGoals = isGoal ? goals + 1 : goals;
          addEntertainmentPoints(finalGoals * 20);
          onComplete?.(finalGoals * 20);
        }
      }, 1200);
    }, 500);
  }, [kicking, gameOver, kicks, goals, onComplete]);

  const restart = () => {
    setKicks(5);
    setGoals(0);
    setSaves(0);
    setGameOver(false);
    setKicking(false);
    setLastResult(null);
    setBallPos(null);
    setGkDive(null);
  };

  const gkX = gkDive ? (ZONES.find(z => z.id === gkDive)?.x ?? 50) : 50;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full max-w-xs">
        <span className="font-sport text-sm text-[hsl(var(--sport-text))]">⚽ {kicks} kicks left</span>
        <span className="font-sport text-sm text-[hsl(var(--sport-accent))]">Goals: {goals}/{goals + saves}</span>
      </div>

      {/* Goal with grass field */}
      <div
        className="relative w-80 h-56 rounded-2xl overflow-hidden border-2 border-[hsl(var(--sport-border))]"
        style={{
          background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 30%, #0f3d0f 70%, #0a2f0a 100%)",
        }}
      >
        {/* Stadium lights */}
        <div className="absolute top-2 left-4 w-2 h-2 rounded-full bg-yellow-300/60" />
        <div className="absolute top-2 right-4 w-2 h-2 rounded-full bg-yellow-300/60" />

        {/* Goal frame */}
        <svg viewBox="0 0 100 70" className="absolute inset-0 w-full h-full">
          {/* Goal posts */}
          <rect x="15" y="10" width="2" height="45" fill="white" rx="1" />
          <rect x="83" y="10" width="2" height="45" fill="white" rx="1" />
          <rect x="15" y="8" width="70" height="3" fill="white" rx="1" />

          {/* Net */}
          {Array.from({ length: 12 }, (_, i) => (
            <line key={`v${i}`} x1={17 + i * 5.5} y1={11} x2={17 + i * 5.5} y2={55} stroke="rgba(255,255,255,0.15)" strokeWidth="0.3" />
          ))}
          {Array.from({ length: 8 }, (_, i) => (
            <line key={`h${i}`} x1={17} y1={13 + i * 5.5} x2={83} y2={13 + i * 5.5} stroke="rgba(255,255,255,0.15)" strokeWidth="0.3" />
          ))}

          {/* Goalkeeper */}
          <motion.g
            animate={{ x: gkDive ? (gkX - 50) * 0.5 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <rect x="46" y="35" width="8" height="18" rx="2" fill="hsl(var(--sport-secondary))" />
            <circle cx="50" cy="32" r="4" fill="#ffd6a0" />
            {/* Arms */}
            <motion.line
              x1="46" y1="38" x2={gkDive?.includes("L") ? 36 : gkDive?.includes("R") ? 46 : 40} y2={gkDive?.includes("T") ? 28 : 38}
              stroke="hsl(var(--sport-secondary))" strokeWidth="2" strokeLinecap="round"
              animate={{ x2: gkDive?.includes("L") ? 36 : 40 }}
            />
            <motion.line
              x1="54" y1="38" x2={gkDive?.includes("R") ? 64 : gkDive?.includes("L") ? 54 : 60} y2={gkDive?.includes("T") ? 28 : 38}
              stroke="hsl(var(--sport-secondary))" strokeWidth="2" strokeLinecap="round"
              animate={{ x2: gkDive?.includes("R") ? 64 : 60 }}
            />
          </motion.g>

          {/* Ball animation */}
          {ballPos && (
            <motion.circle
              initial={{ cx: 50, cy: 65, r: 3 }}
              animate={{ cx: ballPos.x, cy: ballPos.y, r: 2 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              fill="white"
              stroke="#333"
              strokeWidth="0.3"
            />
          )}

          {/* Grass lines */}
          <line x1="0" y1="60" x2="100" y2="60" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
        </svg>

        {/* Clickable zones */}
        {!kicking && !gameOver && (
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-2" style={{ top: "12%", height: "65%", left: "15%", width: "70%" }}>
            {ZONES.map(zone => (
              <button
                key={zone.id}
                onClick={() => kick(zone.id)}
                className="hover:bg-white/10 transition-colors border border-transparent hover:border-white/20 rounded flex items-center justify-center text-white/30 hover:text-white/60 font-sport text-lg"
              >
                {zone.label}
              </button>
            ))}
          </div>
        )}

        {/* Result overlay */}
        <AnimatePresence>
          {lastResult && (
            <motion.div
              initial={{ opacity: 0, scale: 2 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className={`absolute inset-0 flex items-center justify-center ${
                lastResult === "goal" ? "bg-green-500/20" : "bg-red-500/20"
              }`}
            >
              <span className="font-sport text-4xl text-white drop-shadow-lg">
                {lastResult === "goal" ? "GOAL! ⚽" : "SAVED! 🧤"}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="font-sport-body text-xs text-[hsl(var(--sport-muted))]">Click a zone on the goal to aim your kick</p>

      {gameOver && (
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <p className="font-sport text-2xl text-[hsl(var(--sport-accent))] mb-2">{goals}/5 Goals!</p>
          <p className="font-sport-body text-sm text-[hsl(var(--sport-muted))] mb-4">
            {goals >= 4 ? "🏆 Legend!" : goals >= 3 ? "👏 Great shooting!" : "Keep practicing!"}
          </p>
          <button onClick={restart} className="px-6 py-2 bg-[hsl(var(--sport-primary))]/20 border border-[hsl(var(--sport-primary))]/50 text-[hsl(var(--sport-primary))] rounded-xl font-sport tracking-wider">
            PLAY AGAIN
          </button>
        </motion.div>
      )}
    </div>
  );
};
