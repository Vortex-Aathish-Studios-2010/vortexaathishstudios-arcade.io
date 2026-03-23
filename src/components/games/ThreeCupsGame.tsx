import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Sparkles } from "lucide-react";
import { sfx } from "@/lib/sounds";
import { addEntertainmentPoints } from "@/lib/streaks";

const CUP_POSITIONS = [-110, 0, 110];

export const ThreeCupsGame = ({ onComplete }: { onComplete?: (score: number) => void }) => {
  const [gameState, setGameState] = useState<"menu" | "showing" | "shuffling" | "guessing" | "revealing">("menu");
  const [score, setScore] = useState(0);
  
  const [cups, setCups] = useState([0, 1, 2]);
  const [ballCup, setBallCup] = useState(1);
  const [selectedCup, setSelectedCup] = useState<number | null>(null);
  
  const [difficulty, setDifficulty] = useState(1);
  const currentSpeedRef = useRef(400);
  
  const startGame = () => {
    setScore(0);
    setDifficulty(1);
    startRound();
  };

  const startRound = () => {
    setSelectedCup(null);
    setCups([0, 1, 2]); 
    const hideBallIn = Math.floor(Math.random() * 3);
    setBallCup(hideBallIn);
    setGameState("showing");
    sfx.click();

    setTimeout(() => {
      setGameState("shuffling");
      shuffleCups(difficulty * 4 + 4); 
    }, 2000);
  };

  const shuffleCups = (remaining: number) => {
    if (remaining <= 0) {
      setGameState("guessing");
      return;
    }

    setCups(prev => {
      const next = [...prev];
      let a = Math.floor(Math.random() * 3);
      let b = Math.floor(Math.random() * 3);
      while (a === b) b = Math.floor(Math.random() * 3);
      const temp = next[a];
      next[a] = next[b];
      next[b] = temp;
      sfx.place();
      return next;
    });

    const speed = Math.max(250, 450 - (difficulty * 30));
    currentSpeedRef.current = speed;
    setTimeout(() => shuffleCups(remaining - 1), speed);
  };

  const guess = (cupId: number) => {
    if (gameState !== "guessing") return;
    setSelectedCup(cupId);
    setGameState("revealing");
    
    setTimeout(() => {
      if (cupId === ballCup) {
        sfx.correct();
        setScore(prev => prev + 1);
        setDifficulty(prev => prev + 1);
        setTimeout(startRound, 2000);
      } else {
        sfx.error();
        addEntertainmentPoints(score);
        onComplete?.(score);
      }
    }, 1200);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[400px] p-4 select-none perspective-[1000px]">
      <AnimatePresence mode="popLayout">
        {gameState === "menu" && (
          <motion.div initial={{ opacity: 0, scale: 0.8, rotateX: -20 }} animate={{ opacity: 1, scale: 1, rotateX: 0 }} exit={{ opacity: 0, scale: 1.2 }} className="flex flex-col items-center gap-8 text-center relative z-10">
            <div>
              <motion.h2 animate={{ textShadow: ["0 0 10px rgba(var(--primary),0.8)", "0 0 30px rgba(var(--primary),0.2)", "0 0 10px rgba(var(--primary),0.8)"] }} transition={{ duration: 2, repeat: Infinity }} className="font-sport text-5xl text-primary mb-3 tracking-widest">SHELL GAME</motion.h2>
              <p className="text-white/60 text-sm font-sport-body max-w-[250px] mx-auto">Keep your eye on the golden cup with the ball! It gets faster over time.</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={startGame}
              className="px-10 py-4 rounded-full bg-primary text-primary-foreground font-sport tracking-wider text-xl shadow-[0_0_30px_rgba(var(--primary),0.5)] border border-primary/50"
            >
              PLAY NOW
            </motion.button>
          </motion.div>
        )}

        {gameState !== "menu" && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full flex flex-col items-center gap-16 relative">
            
            {/* Spotlight Background effect */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.1)_0%,transparent_70%)] pointer-events-none -z-10 h-[300px]" />

            <div className="flex justify-between w-full max-w-xs items-center bg-black/40 px-8 py-3 rounded-full border border-white/10 shadow-lg backdrop-blur-md">
              <span className="font-sport text-white/40 tracking-widest text-sm">SCORE</span>
              <motion.span key={score} initial={{ scale: 1.5, textShadow: "0 0 20px rgba(var(--primary),1)" }} animate={{ scale: 1, textShadow: "0 0 0px rgba(var(--primary),0)" }} className="font-sport text-4xl text-primary">{score}</motion.span>
            </div>

            <div className="font-sport text-2xl h-10 flex items-center justify-center min-w-[300px] border border-white/5 bg-black/20 rounded-2xl shadow-inner">
              {gameState === "showing" && <span className="text-secondary animate-pulse tracking-widest">WATCH CAREFULLY...</span>}
              {gameState === "shuffling" && <span className="text-white/50 tracking-widest">SHUFFLING...</span>}
              {gameState === "guessing" && <motion.span animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 0.5 }} className="text-primary tracking-widest drop-shadow-[0_0_10px_rgba(var(--primary),0.5)]">FIND THE BALL!</motion.span>}
              {gameState === "revealing" && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className={selectedCup === ballCup ? "text-green-400 drop-shadow-[0_0_15px_rgba(34,197,94,0.8)] flex items-center gap-2 tracking-widest" : "text-destructive drop-shadow-[0_0_15px_rgba(var(--destructive),0.8)] tracking-widest"}>
                  {selectedCup === ballCup ? <><Sparkles className="w-6 h-6" /> CORRECT!</> : "WRONG!"}
                </motion.div>
              )}
            </div>

            <div className="relative w-[300px] h-[150px] flex justify-center items-end pb-4" style={{ perspective: "1000px" }}>
              
              {/* Table shadow */}
              <div className="absolute bottom-0 w-[400px] h-8 bg-black/50 rounded-[100%] blur-md" />

              <motion.div 
                className="absolute w-10 h-10 rounded-full bg-[radial-gradient(circle_at_30%_30%,#ff6b6b_0%,#c92a2a_100%)] bottom-8 z-0 shadow-[0_5px_15px_rgba(200,0,0,0.5),inset_-2px_-2px_10px_rgba(0,0,0,0.5)]"
                animate={{ 
                  x: CUP_POSITIONS[cups.indexOf(ballCup)],
                  opacity: (gameState === "showing" || gameState === "revealing") ? 1 : 0,
                  scale: (gameState === "showing" || gameState === "revealing") ? 1 : 0.5,
                  y: gameState === "shuffling" ? 20 : 0
                }}
                transition={{ duration: 0.3 }}
              />

              {[0, 1, 2].map((cupId) => {
                const posIndex = cups.indexOf(cupId);
                const xOffset = CUP_POSITIONS[posIndex];
                
                let isLifted = false;
                let rotateY = 0;
                if (gameState === "showing" && cupId === ballCup) isLifted = true;
                if (gameState === "revealing" && (cupId === selectedCup || cupId === ballCup)) {
                  isLifted = true;
                  rotateY = 360 * 2; // Spin multiple times on reveal
                }

                return (
                  <motion.div
                    key={cupId}
                    className="absolute bottom-4 w-24 h-32 cursor-pointer flex justify-center"
                    animate={{ x: xOffset, y: isLifted ? -70 : 0 }}
                    transition={{ 
                      x: { type: "tween", ease: "easeInOut", duration: (currentSpeedRef.current / 1000) * 0.9 }, 
                      y: { type: "spring", stiffness: 200, damping: 20 } 
                    }}
                    style={{ transformStyle: "preserve-3d", zIndex: cupId === 1 ? 20 : cupId === 2 ? 10 : 5 }}
                    onClick={() => guess(cupId)}
                  >
                    <motion.div
                      className="w-full h-full relative"
                      animate={{ rotateY: rotateY }}
                      transition={{ duration: 1.5, type: "spring", damping: 15 }}
                      style={{ transformStyle: "preserve-3d" }}
                       whileHover={gameState === "guessing" ? { scale: 1.05, y: -10 } : {}}
                       whileTap={gameState === "guessing" ? { scale: 0.95 } : {}}
                    >
                      {/* 3D Cup Front (Shiny Gold) */}
                      <div className="absolute inset-0 bg-[linear-gradient(135deg,#fde047_0%,#ca8a04_50%,#854d0e_100%)] rounded-t-[1.5rem] rounded-b-lg shadow-[0_10px_20px_rgba(0,0,0,0.5),inset_0_-10px_10px_rgba(0,0,0,0.3),inset_0_2px_5px_rgba(255,255,255,0.8)] border border-yellow-500/50" style={{ backfaceVisibility: 'hidden', transform: 'translateZ(1px)' }}>
                        <div className="absolute inset-x-2 bottom-2 h-4 bg-yellow-900/40 rounded-full blur-[2px]" />
                        <div className="absolute top-2 left-2 right-2 h-[4px] bg-white/60 rounded-full blur-[1px] opacity-70" />
                      </div>
                      
                      {/* 3D Cup Back (Inside shadow) */}
                      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#222_0%,#000_100%)] rounded-t-[1.5rem] rounded-b-lg shadow-inner border border-white/5 flex items-center justify-center overflow-hidden" style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}>
                        <div className="absolute bottom-4 w-12 h-6 bg-yellow-400/10 rounded-full blur-md" />
                      </div>
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>

            <AnimatePresence>
              {gameState === "revealing" && selectedCup !== ballCup && (
                <motion.div initial={{ opacity: 0, scale: 0.5, y: 50 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="absolute bottom-0 w-full flex justify-center pb-8 z-20">
                  <motion.button whileHover={{ scale: 1.1, boxShadow: "0 0 30px rgba(var(--secondary),0.6)" }} whileTap={{ scale: 0.9 }} onClick={startGame} className="px-8 py-4 rounded-full bg-secondary text-secondary-foreground font-sport text-lg shadow-[0_0_20px_rgba(var(--secondary),0.4)] flex items-center gap-3 border border-white/20">
                    <RotateCcw className="h-5 w-5" /> REPLAY
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
