import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { sfx } from "@/lib/sounds";
import { addEntertainmentPoints } from "@/lib/streaks";

const COLORS = [
  { id: "red", hex: "#ef4444", label: "RED" },
  { id: "green", hex: "#22c55e", label: "GREEN" },
  { id: "blue", hex: "#3b82f6", label: "BLUE" },
  { id: "yellow", hex: "#eab308", label: "YELLOW" },
];

export const ColorSwitchTapGame = ({ onComplete }: { onComplete?: (score: number) => void }) => {
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameover">("menu");
  const [score, setScore] = useState(0);
  const [currentColor, setCurrentColor] = useState(COLORS[0]);
  const [rule, setRule] = useState<{ type: "only" | "not"; targetId: string }>({ type: "only", targetId: "green" });
  
  const stateRefs = useRef({
    score: 0,
    speed: 2200,
    rule: { type: "only" as "only" | "not", targetId: "green" }
  });

  const timerRef = useRef<number | null>(null);

  const endGame = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setGameState("gameover");
    sfx.error();
    addEntertainmentPoints(Math.round(stateRefs.current.score * 2));
    if (onComplete) onComplete(stateRefs.current.score);
  }, [onComplete]);

  const nextTurnRef = useRef<() => void>();

  nextTurnRef.current = () => {
    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    setCurrentColor(randomColor);
    
    let currentRule = stateRefs.current.rule;
    if (Math.random() < 0.2) {
        const isNotRule = Math.random() < 0.3; 
        const ruleTarget = COLORS[Math.floor(Math.random() * COLORS.length)].id;
        currentRule = { type: isNotRule ? "not" : "only", targetId: ruleTarget };
        stateRefs.current.rule = currentRule;
        setRule(currentRule);
    }

    const nextSpeed = Math.max(900, stateRefs.current.speed * 0.97);
    stateRefs.current.speed = nextSpeed;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
        const shouldHaveTapped = currentRule.type === "only" 
            ? randomColor.id === currentRule.targetId 
            : randomColor.id !== currentRule.targetId;
            
        if (shouldHaveTapped) {
            endGame(); 
        } else {
            nextTurnRef.current?.(); 
        }
    }, nextSpeed);
  };

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const startGame = () => {
    setScore(0);
    stateRefs.current.score = 0;
    stateRefs.current.speed = 2200;
    
    const initialRule = { type: "only" as const, targetId: COLORS[Math.floor(Math.random() * COLORS.length)].id };
    stateRefs.current.rule = initialRule;
    setRule(initialRule);
    
    setGameState("playing");
    sfx.click();
    nextTurnRef.current?.();
  };

  const handleTap = () => {
    if (gameState !== "playing") return;

    if (timerRef.current) clearTimeout(timerRef.current);

    const currentRule = stateRefs.current.rule;
    const isValid = currentRule.type === "only" 
        ? currentColor.id === currentRule.targetId 
        : currentColor.id !== currentRule.targetId;

    if (isValid) {
        stateRefs.current.score += 1;
        setScore(stateRefs.current.score);
        sfx.click();
        nextTurnRef.current?.();
    } else {
        endGame();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[400px] gap-6 p-4 select-none relative">
      {/* Background glow syncing with target color */}
      {gameState === "playing" && (
        <motion.div 
          className="absolute inset-0 z-0 pointer-events-none opacity-20 transition-colors duration-300" 
          animate={{ backgroundColor: COLORS.find(c => c.id === rule.targetId)?.hex }}
        />
      )}

      <AnimatePresence mode="popLayout">
        {gameState === "menu" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
            className="flex flex-col items-center gap-8 relative z-10"
          >
            <div className="text-center">
              <motion.h2 animate={{ color: ["#ef4444", "#22c55e", "#3b82f6", "#eab308", "#ef4444"] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="font-sport text-5xl mb-3 tracking-widest drop-shadow-lg">COLOR SWITCH</motion.h2>
              <p className="text-white/60 text-sm font-sport-body max-w-[250px] mx-auto">
                Tap when the color fits the rule. Ignore it if it doesn't!
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={startGame}
              className="px-10 py-4 rounded-full bg-primary text-primary-foreground font-sport tracking-wider text-xl shadow-[0_0_20px_rgba(var(--primary),0.5)]"
            >
              PLAY NOW
            </motion.button>
          </motion.div>
        )}

        {gameState === "playing" && (
          <motion.div
            key="playing"
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.2 }}
            className="w-full max-w-sm flex flex-col items-center gap-8 relative z-10"
          >
            {/* Score HUD */}
            <motion.div initial={{ y: -20 }} animate={{ y: 0 }} className="flex w-full justify-between items-center bg-card/80 backdrop-blur-md border border-border/50 px-6 py-4 rounded-full shadow-lg">
                <span className="font-sport text-white/50 tracking-widest text-sm">SCORE</span>
                <span className="font-sport text-4xl text-primary drop-shadow-[0_0_10px_rgba(var(--primary),0.5)]">{score}</span>
            </motion.div>

            {/* Rule Box */}
            <motion.div layout className="bg-card/80 border border-white/10 backdrop-blur-md px-8 py-4 rounded-[2rem] text-center min-w-[280px] shadow-xl">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40 block mb-2">CURRENT RULE</span>
                <AnimatePresence mode="wait">
                  <motion.div key={rule.targetId + rule.type} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} className="font-sport text-2xl flex flex-wrap justify-center gap-2 items-center">
                      {rule.type === "only" ? (
                          <>TAP ONLY <span className="drop-shadow-md" style={{ color: COLORS.find(c => c.id === rule.targetId)?.hex }}>{COLORS.find(c => c.id === rule.targetId)?.label}</span></>
                      ) : (
                          <>DO <span className="text-destructive drop-shadow-md">NOT</span> TAP <span className="drop-shadow-md" style={{ color: COLORS.find(c => c.id === rule.targetId)?.hex }}>{COLORS.find(c => c.id === rule.targetId)?.label}</span></>
                      )}
                  </motion.div>
                </AnimatePresence>
            </motion.div>

            {/* Main Color Orb */}
            <motion.div 
                className="relative w-full aspect-square max-w-[280px] rounded-[3rem] shadow-2xl overflow-hidden cursor-pointer bg-black/50"
                onClick={handleTap}
                whileTap={{ scale: 0.95 }}
            >
                <AnimatePresence mode="wait">
                  <motion.div
                      key={currentColor.id}
                      initial={{ scale: 0, opacity: 0, rotate: 90 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      exit={{ scale: 1.5, opacity: 0, filter: "blur(10px)" }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="absolute inset-0 flex items-center justify-center shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]"
                      style={{ backgroundColor: currentColor.hex }}
                  >
                      {/* Inner glowing orb effect */}
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.4)_0%,transparent_70%)] opacity-50 pointer-events-none mix-blend-overlay" />
                      <motion.span animate={{ textShadow: ["0 0 10px rgba(255,255,255,0.5)", "0 0 30px rgba(255,255,255,0.8)", "0 0 10px rgba(255,255,255,0.5)"] }} transition={{ duration: Math.max(0.5, stateRefs.current.speed/1000), repeat: Infinity }} className="font-sport text-white/90 text-6xl rotate-[-15deg] drop-shadow-xl">{currentColor.label}</motion.span>
                  </motion.div>
                </AnimatePresence>
                
                {/* Progress bar representing time remaining */}
                <motion.div
                    key={`timer-${currentColor.id}-${score}`}
                    className="absolute bottom-0 left-0 h-3 bg-white/50 backdrop-blur-md rounded-t-xl"
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: stateRefs.current.speed / 1000, ease: "linear" }}
                />
            </motion.div>
          </motion.div>
        )}

        {gameState === "gameover" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, rotate: Math.random() * 20 - 10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 10 }} // Bouncy dramatic game over
            className="flex flex-col items-center gap-6 bg-destructive/10 backdrop-blur-xl border border-destructive/50 p-10 rounded-[3rem] shadow-[0_0_50px_rgba(var(--destructive),0.4)] relative z-20"
          >
            <h2 className="font-sport text-5xl text-destructive drop-shadow-[0_0_15px_rgba(var(--destructive),0.8)]">GAME OVER</h2>
            <div className="text-center mb-4">
              <span className="text-xs text-white/50 font-sport block mb-1 tracking-widest">FINAL SCORE</span>
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring" }} className="font-sport text-7xl text-white drop-shadow-xl block">{score}</motion.span>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={startGame}
              className="px-8 py-4 rounded-full bg-secondary text-secondary-foreground font-sport text-lg shadow-[0_0_20px_rgba(var(--secondary),0.4)] flex items-center gap-3 mt-2"
            >
              <RotateCcw className="h-5 w-5" /> REPLAY
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
