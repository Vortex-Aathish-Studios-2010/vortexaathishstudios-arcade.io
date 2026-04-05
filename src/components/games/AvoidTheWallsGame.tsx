import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDevice } from "@/lib/DeviceContext";
import { RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { sfx } from "@/lib/sounds";
import { addEntertainmentPoints } from "@/lib/streaks";

const AREA_WIDTH = 300;
const AREA_HEIGHT = 400;
const PLAYER_SIZE = 24;
const WALL_HEIGHT = 20;

export const AvoidTheWallsGame = ({ onComplete }: { onComplete?: (score: number) => void }) => {
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameover">("menu");
  const [score, setScore] = useState(0);

  const playerRef = useRef({ x: AREA_WIDTH / 2 });
  const wallsRef = useRef<{ id: number; y: number; gapX: number; gapWidth: number; passed?: boolean }[]>([]);
  const animRef = useRef<number>(0);
  const frameCount = useRef(0);
  const speedRef = useRef(3.5);
  const inputRef = useRef(0); 
  const trailRef = useRef<{ id: number; x: number; y: number; opacity: number }[]>([]);

  const [playerX, setPlayerX] = useState(playerRef.current.x);
  const [walls, setWalls] = useState([...wallsRef.current]);
  const [trail, setTrail] = useState([...trailRef.current]);
  const { device } = useDevice();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") inputRef.current = -1;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") inputRef.current = 1;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if ((e.key === "ArrowLeft" || e.key === "a" || e.key === "A") && inputRef.current === -1) inputRef.current = 0;
      if ((e.key === "ArrowRight" || e.key === "d" || e.key === "D") && inputRef.current === 1) inputRef.current = 0;
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const startGame = () => {
    playerRef.current = { x: AREA_WIDTH / 2 };
    wallsRef.current = [];
    trailRef.current = [];
    frameCount.current = 0;
    speedRef.current = 3.5;
    setPlayerX(playerRef.current.x);
    setWalls([]);
    setTrail([]);
    setScore(0);
    setGameState("playing");
    sfx.click();
    animRef.current = requestAnimationFrame(gameLoop);
  };

  const endGame = useCallback(() => {
    setGameState("gameover");
    sfx.error();
    cancelAnimationFrame(animRef.current);
    addEntertainmentPoints(Math.round(score / 10));
    onComplete?.(score);
  }, [score, onComplete]);

  const gameLoop = useCallback(() => {
    if (gameState !== "playing") return;

    if (inputRef.current !== 0) {
      playerRef.current.x += inputRef.current * 7;
      if (playerRef.current.x < PLAYER_SIZE / 2) playerRef.current.x = PLAYER_SIZE / 2;
      if (playerRef.current.x > AREA_WIDTH - PLAYER_SIZE / 2) playerRef.current.x = AREA_WIDTH - PLAYER_SIZE / 2;
      setPlayerX(playerRef.current.x);
    }

    // Trailing logic
    trailRef.current.push({ id: Date.now() + Math.random(), x: playerRef.current.x, y: AREA_HEIGHT - 40, opacity: 0.6 });
    trailRef.current.forEach(tr => tr.opacity -= 0.08);
    trailRef.current = trailRef.current.filter(tr => tr.opacity > 0);
    setTrail([...trailRef.current]);

    frameCount.current++;
    if (frameCount.current % Math.floor(60 * (3.5 / speedRef.current)) === 0) {
      const gapWidth = Math.max(70, 110 - (speedRef.current * 4)); 
      const gapX = Math.random() * (AREA_WIDTH - gapWidth);
      wallsRef.current.push({ id: Date.now(), y: -WALL_HEIGHT, gapX, gapWidth, passed: false });
    }

    const survivingWalls = [];
    const playerY = AREA_HEIGHT - 40; 

    for (const wall of wallsRef.current) {
      wall.y += speedRef.current;
      
      const isVerticallyAligned = wall.y + WALL_HEIGHT > playerY - PLAYER_SIZE/2 && wall.y < playerY + PLAYER_SIZE/2;
      if (isVerticallyAligned) {
        const inGap = playerRef.current.x > wall.gapX + PLAYER_SIZE/2 && playerRef.current.x < wall.gapX + wall.gapWidth - PLAYER_SIZE/2;
        if (!inGap) {
          endGame();
          return;
        }
      }

      if (wall.y > playerY + PLAYER_SIZE / 2 && !wall.passed) {
        wall.passed = true;
        setScore(prev => prev + 10);
        speedRef.current += 0.15; // Increased speed bump for more distinct progression
      }

      if (wall.y < AREA_HEIGHT) survivingWalls.push(wall);
    }

    wallsRef.current = survivingWalls;
    setWalls([...survivingWalls]);

    animRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, endGame]);

  useEffect(() => {
    if (gameState === "playing") {
      animRef.current = requestAnimationFrame(gameLoop);
    }
    return () => cancelAnimationFrame(animRef.current);
  }, [gameState, gameLoop]);

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[400px] p-4 select-none">
      <AnimatePresence mode="popLayout">
        {gameState === "menu" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-8 text-center relative z-10">
            <div>
              <h2 className="font-sport text-5xl text-primary mb-3 drop-shadow-[0_0_15px_rgba(var(--primary),0.8)] tracking-widest">AVOID WALLS</h2>
              <p className="text-white/60 text-sm font-sport-body max-w-[250px] mx-auto">Hold left or right to move. Don't touch the falling neon walls!</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={startGame}
              className="px-10 py-4 rounded-full bg-primary text-primary-foreground font-sport tracking-wider text-xl shadow-[0_0_20px_rgba(var(--primary),0.5)] bg-gradient-to-b from-primary/80 to-primary"
            >
              PLAY NOW
            </motion.button>
          </motion.div>
        )}

        {gameState !== "menu" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full flex flex-col items-center gap-4">
            <motion.div key={Math.floor(score/100)} initial={{ scale: 1.2 }} animate={{ scale: 1 }} className="flex justify-center bg-card/80 backdrop-blur-md border border-white/10 px-8 py-2 rounded-full shadow-lg">
                <span className="font-sport text-3xl text-primary drop-shadow-[0_0_10px_rgba(var(--primary),0.8)]">{score}</span>
            </motion.div>

            <div className="flex gap-4">
              {/* Left Button */}
              {device !== "laptop" && (
                <button 
                  className="w-16 h-16 bg-card/80 backdrop-blur-md border border-white/5 rounded-[2rem] shadow-xl flex items-center justify-center active:bg-secondary/40 active:scale-95 transition-all outline-none"
                  onPointerDown={(e) => { e.preventDefault(); inputRef.current = -1; }} onPointerUp={() => { inputRef.current = 0; }} onPointerLeave={() => { inputRef.current = 0; }}
                  style={{ touchAction: "none" }}
                >
                  <ChevronLeft className="w-10 h-10 text-primary drop-shadow-[0_0_10px_rgba(var(--primary),1)]" />
                </button>
              )}

              {/* Viewport */}
              <motion.div 
                className="relative bg-black/60 border-2 border-primary/20 backdrop-blur-md shadow-[0_0_50px_rgba(var(--primary),0.1)] overflow-hidden"
                style={{ width: AREA_WIDTH, height: AREA_HEIGHT, borderRadius: "2rem" }}
                animate={gameState === "gameover" ? { x: [-20, 20, -20, 20, 0], filter: "contrast(200%) hue-rotate(-50deg)" } : undefined}
                transition={{ duration: 0.4 }}
              >
                {/* Visual grid in background */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

                {/* Trail */}
                {trail.map(t => (
                  <div key={t.id} className="absolute rounded-full bg-primary blur-[2px]" style={{ width: PLAYER_SIZE, height: PLAYER_SIZE, left: t.x - PLAYER_SIZE/2, top: t.y - PLAYER_SIZE/2, opacity: t.opacity * 0.4, transform: `scale(${t.opacity + 0.5})` }} />
                ))}

                {/* Player */}
                <div 
                  className="absolute bottom-[28px] bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,1),0_0_40px_rgba(var(--primary),1)] border-2 border-primary"
                  style={{ width: PLAYER_SIZE, height: PLAYER_SIZE, left: playerX - PLAYER_SIZE / 2 }}
                />

                {/* Walls */}
                {walls.map(w => (
                  <div key={w.id}>
                    <div className="absolute bg-accent rounded-r-lg shadow-[0_0_20px_rgba(var(--accent),0.8),inset_0_0_10px_rgba(0,0,0,0.5)] border-y border-r border-white/40" style={{ left: 0, top: w.y, width: w.gapX, height: WALL_HEIGHT }} />
                    <div className="absolute bg-accent rounded-l-lg shadow-[0_0_20px_rgba(var(--accent),0.8),inset_0_0_10px_rgba(0,0,0,0.5)] border-y border-l border-white/40" style={{ left: w.gapX + w.gapWidth, top: w.y, right: 0, height: WALL_HEIGHT }} />
                  </div>
                ))}

                <AnimatePresence>
                  {gameState === "gameover" && (
                    <motion.div initial={{ opacity: 0, scale: 1.5 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 bg-destructive/30 backdrop-blur-md z-20 flex flex-col items-center justify-center p-6 text-center border-t border-destructive/50">
                      <motion.h3 animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 0.5 }} className="font-sport text-5xl text-destructive drop-shadow-[0_0_20px_rgba(var(--destructive),0.8)] mb-2">CRASHED!</motion.h3>
                      <p className="text-white font-sport text-lg mb-8 tracking-widest">Score: {score}</p>
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={startGame} className="w-20 h-20 rounded-full bg-secondary text-secondary-foreground shadow-[0_0_30px_rgba(var(--secondary),0.5)] flex items-center justify-center border border-white/20">
                        <RotateCcw className="h-8 w-8" />
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
              
              {/* Right Button */}
              {device !== "laptop" && (
                <button 
                  className="w-16 h-16 bg-card/80 backdrop-blur-md border border-white/5 rounded-[2rem] shadow-xl flex items-center justify-center active:bg-secondary/40 active:scale-95 transition-all outline-none"
                  onPointerDown={(e) => { e.preventDefault(); inputRef.current = 1; }} onPointerUp={() => { inputRef.current = 0; }} onPointerLeave={() => { inputRef.current = 0; }}
                  style={{ touchAction: "none" }}
                >
                  <ChevronRight className="w-10 h-10 text-primary drop-shadow-[0_0_10px_rgba(var(--primary),1)]" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
