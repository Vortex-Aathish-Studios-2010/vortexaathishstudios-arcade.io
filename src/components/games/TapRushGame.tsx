import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, Trophy, Play, RotateCcw } from "lucide-react";
import { sfx } from "@/lib/sounds";
import { addEntertainmentPoints } from "@/lib/streaks";

export const TapRushGame = ({ onComplete }: { onComplete?: (score: number) => void }) => {
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameover">("menu");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [clicks, setClicks] = useState<{ id: number; x: number; y: number }[]>([]);
  const [bestScore, setBestScore] = useState(() => {
    const saved = localStorage.getItem("tapRushBest");
    return saved ? parseInt(saved, 10) : 0;
  });

  useEffect(() => {
    if (gameState === "playing" && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (gameState === "playing" && timeLeft <= 0) {
      endGame();
    }
  }, [gameState, timeLeft]);

  const endGame = () => {
    setGameState("gameover");
    sfx.levelComplete();
    if (score > bestScore) {
      setBestScore(score);
      localStorage.setItem("tapRushBest", score.toString());
    }
    const finalPoints = Math.round(score / 2);
    addEntertainmentPoints(finalPoints);
    onComplete?.(score);
  };

  const startGame = () => {
    setScore(0);
    setTimeLeft(10);
    setClicks([]);
    setGameState("playing");
    sfx.click();
  };

  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    if (gameState !== "playing") return;
    setScore((prev) => prev + 1);
    sfx.click();

    // Spawn floating +1
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    const x = clientX - rect.left - 20; // center offset
    const y = clientY - rect.top - 20;

    const id = Date.now() + Math.random();
    setClicks((prev) => [...prev, { id, x, y }]);
    setTimeout(() => setClicks((prev) => prev.filter((c) => c.id !== id)), 600);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[400px] gap-8 p-4">
      {/* Header HUD */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="flex w-full max-w-sm justify-between items-center bg-card/80 backdrop-blur-md border border-border/50 rounded-2xl p-4 shadow-lg shadow-black/50 relative z-10"
      >
        <div className="flex flex-col items-start gap-1">
          <span className="text-[10px] text-muted-foreground font-sport uppercase tracking-widest">Time</span>
          <div className={`flex items-center gap-2 font-sport text-xl ${timeLeft <= 3 ? "text-red-500 animate-[bounce_1s_infinite]" : "text-primary"}`}>
            <Timer className="h-5 w-5" />
            00:{timeLeft.toString().padStart(2, "0")}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-[10px] text-muted-foreground font-sport uppercase tracking-widest">Best</span>
          <div className="flex items-center gap-2 font-sport text-xl text-accent">
            <Trophy className="h-5 w-5" />
            {bestScore}
          </div>
        </div>
      </motion.div>

      {/* Main Play Area */}
      <div className="relative w-full max-w-sm aspect-square flex items-center justify-center">
        <AnimatePresence mode="wait">
          {gameState === "menu" && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-6"
            >
              <div className="text-center">
                <motion.h2 animate={{ textShadow: ["0 0 10px rgba(var(--primary),0.8)", "0 0 30px rgba(var(--primary), 0.2)", "0 0 10px rgba(var(--primary),0.8)"] }} transition={{ duration: 2, repeat: Infinity }} className="font-sport text-5xl text-primary mb-2 tracking-widest">TAP RUSH</motion.h2>
                <p className="text-white/60 text-sm font-sport-body">Tap as fast as you can in 10 seconds!</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                animate={{ boxShadow: ["0 0 30px rgba(var(--primary),0.4)", "0 0 60px rgba(var(--primary),0.8)", "0 0 30px rgba(var(--primary),0.4)"] }}
                transition={{ duration: 2, repeat: Infinity }}
                onClick={startGame}
                className="w-32 h-32 rounded-full bg-primary flex items-center justify-center z-20"
              >
                <Play className="h-12 w-12 text-primary-foreground ml-2" />
              </motion.button>
            </motion.div>
          )}

          {gameState === "playing" && (
            <motion.div
              key="playing"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-8 relative z-10"
            >
              <motion.h3 key={score} initial={{ scale: 1.5, opacity: 0.5 }} animate={{ scale: 1, opacity: 1 }} className="absolute -top-10 font-sport text-7xl text-white/20 select-none z-0">{score}</motion.h3>
              
              <div className="relative">
                {/* Ripples */}
                <motion.div animate={{ scale: [1, 1.4], opacity: [0.5, 0] }} transition={{ duration: 1, repeat: Infinity, ease: "easeOut" }} className="absolute inset-0 rounded-full bg-accent/40 pointer-events-none" />
                <motion.div animate={{ scale: [1, 1.6], opacity: [0.3, 0] }} transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut", delay: 0.2 }} className="absolute inset-0 rounded-full bg-accent/20 pointer-events-none" />

                <motion.button
                  whileTap={{ scale: 0.9, backgroundColor: "hsl(var(--accent) / 0.8)" }}
                  animate={{ scale: [1, 1.05, 1], boxShadow: ["0 10px 0 rgba(var(--accent-foreground),0.3)", "0 20px 0 rgba(var(--accent-foreground),0.1)", "0 10px 0 rgba(var(--accent-foreground),0.3)"] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  onPointerDown={handleTap}
                  className="relative w-48 h-48 rounded-full bg-accent text-accent-foreground border-4 border-accent-foreground/20 active:translate-y-4 active:shadow-[0_0_0_transparent] transition-all flex items-center justify-center select-none z-20 overflow-hidden"
                  style={{ touchAction: "manipulation" }}
                >
                  <span className="font-sport text-4xl font-bold tracking-widest drop-shadow-md">TAP</span>
                  
                  {/* Floating particles inside button */}
                  <AnimatePresence>
                    {clicks.map(c => (
                      <motion.div 
                        key={c.id} 
                        initial={{ opacity: 1, y: c.y, x: c.x, scale: 0.5 }} 
                        animate={{ opacity: 0, y: c.y - 100, scale: 1.5 }} 
                        exit={{ opacity: 0 }}
                        className="absolute text-background font-sport text-3xl pointer-events-none"
                      >
                        +1
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.button>
              </div>
            </motion.div>
          )}

          {gameState === "gameover" && (
            <motion.div
              key="gameover"
              initial={{ opacity: 0, scale: 0.8, rotateX: 90 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-card/90 backdrop-blur-md border border-primary/30 rounded-[3rem] shadow-[0_0_50px_rgba(var(--primary),0.3)] z-30"
            >
              <div className="text-center">
                <p className="font-sport text-sm text-white/50 mb-2 tracking-widest">FINAL SCORE</p>
                <motion.h2 
                  animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}
                  className="font-sport text-7xl text-primary drop-shadow-[0_0_20px_rgba(var(--primary),0.5)]"
                >
                  {score}
                </motion.h2>
                {score >= bestScore && score > 0 && (
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-accent/20 text-accent font-sport text-sm mt-4 px-4 py-2 rounded-full flex items-center justify-center gap-2 border border-accent/30"
                  >
                    <Trophy className="h-4 w-4" /> NEW BEST!
                  </motion.div>
                )}
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={startGame}
                className="mt-4 px-8 py-4 rounded-full bg-secondary text-secondary-foreground font-sport text-lg shadow-[0_0_20px_rgba(var(--secondary),0.4)] flex items-center gap-3"
              >
                <RotateCcw className="h-5 w-5" /> REPLAY
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
