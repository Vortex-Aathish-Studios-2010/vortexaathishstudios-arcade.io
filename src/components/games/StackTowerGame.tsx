import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { sfx } from "@/lib/sounds";
import { addEntertainmentPoints } from "@/lib/streaks";

interface Block {
  id: number;
  x: number;
  width: number;
  hue: number;
}

const CONTAINER_WIDTH = 300;
const INITIAL_WIDTH = 140;

export const StackTowerGame = ({ onComplete }: { onComplete?: (score: number) => void }) => {
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameover">("menu");
  const [score, setScore] = useState(0);
  
  const blocksRef = useRef<Block[]>([{ id: 0, x: (CONTAINER_WIDTH - INITIAL_WIDTH) / 2, width: INITIAL_WIDTH, hue: 200 }]);
  const movingBlockRef = useRef({ x: 0, width: INITIAL_WIDTH, direction: 1, hue: 210, speed: 2.5 });
  const animRef = useRef<number>(0);
  
  const [blocks, setBlocks] = useState<Block[]>([...blocksRef.current]);
  const [movingBlock, setMovingBlock] = useState({ ...movingBlockRef.current });
  const [cameraY, setCameraY] = useState(0); 
  
  // Animation state for just-dropped block impact squish
  const [impactForce, setImpactForce] = useState(0);

  const startGame = () => {
    blocksRef.current = [{ id: 0, x: (CONTAINER_WIDTH - INITIAL_WIDTH) / 2, width: INITIAL_WIDTH, hue: 200 }];
    movingBlockRef.current = { x: 0, width: INITIAL_WIDTH, direction: 1, hue: 210, speed: 2.5 };
    setBlocks([...blocksRef.current]);
    setMovingBlock({ ...movingBlockRef.current });
    setScore(0);
    setCameraY(0);
    setGameState("playing");
    sfx.click();
    animRef.current = requestAnimationFrame(gameLoop);
  };

  const gameLoop = useCallback(() => {
    if (gameState !== "playing") return;

    const mb = movingBlockRef.current;
    mb.x += mb.speed * mb.direction;
    
    if (mb.x <= 0) {
      mb.x = 0;
      mb.direction = 1;
    } else if (mb.x + mb.width >= CONTAINER_WIDTH) {
      mb.x = CONTAINER_WIDTH - mb.width;
      mb.direction = -1;
    }

    setMovingBlock({ ...mb });
    animRef.current = requestAnimationFrame(gameLoop);
  }, [gameState]);

  useEffect(() => {
    if (gameState === "playing") {
      animRef.current = requestAnimationFrame(gameLoop);
    }
    return () => cancelAnimationFrame(animRef.current);
  }, [gameState, gameLoop]);

  const handleTap = useCallback(() => {
    if (gameState !== "playing") return;

    const mb = movingBlockRef.current;
    const topBlock = blocksRef.current[blocksRef.current.length - 1];

    const overlapStart = Math.max(mb.x, topBlock.x);
    const overlapEnd = Math.min(mb.x + mb.width, topBlock.x + topBlock.width);
    const overlapWidth = overlapEnd - overlapStart;

    if (overlapWidth <= 0) {
      setGameState("gameover");
      sfx.error();
      cancelAnimationFrame(animRef.current);
      addEntertainmentPoints(Math.round(score * 3));
      onComplete?.(score);
      return;
    }

    let finalX = overlapStart;
    let finalWidth = overlapWidth;
    let isPerfect = false;
    
    if (Math.abs(mb.x - topBlock.x) < 4) {
      finalX = topBlock.x;
      finalWidth = topBlock.width;
      isPerfect = true;
      sfx.correct();
    } else {
      sfx.place();
    }

    // Trigger visual squish
    setImpactForce(Date.now());

    const newBlock = { id: blocksRef.current.length, x: finalX, width: finalWidth, hue: mb.hue };
    blocksRef.current.push(newBlock);
    setBlocks([...blocksRef.current]);

    movingBlockRef.current = {
      x: mb.direction === 1 ? 0 : CONTAINER_WIDTH - finalWidth,
      width: finalWidth,
      direction: mb.direction === 1 ? 1 : -1,
      hue: (mb.hue + 15) % 360,
      speed: Math.min(7, mb.speed + 0.15) 
    };
    movingBlockRef.current.direction *= -1; 

    setScore(prev => prev + (isPerfect ? 2 : 1));

    if (blocksRef.current.length > 5) {
      setCameraY((blocksRef.current.length - 5) * 30);
    }
  }, [gameState, score, onComplete]);

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[400px] p-4 select-none relative">
      <AnimatePresence mode="popLayout">
        {gameState === "menu" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-8 text-center relative z-10"
          >
            <div>
              <h2 className="font-sport text-5xl text-primary mb-3 drop-shadow-[0_0_15px_rgba(var(--primary),0.8)] tracking-widest">STACK TOWER</h2>
              <p className="text-white/60 text-sm font-sport-body max-w-[250px] mx-auto">
                Tap to drop the block. Stack as high as you can without missing!
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={startGame}
              className="px-10 py-4 rounded-full bg-primary text-primary-foreground font-sport tracking-wider text-xl shadow-[0_0_20px_rgba(var(--primary),0.5)] bg-gradient-to-b from-primary/80 to-primary"
            >
              BUILD NOW
            </motion.button>
          </motion.div>
        )}

        {gameState !== "menu" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full flex flex-col items-center gap-6">
            <motion.div 
              key={score} initial={{ scale: 1.2, textShadow: "0 0 20px rgba(var(--primary),1)" }} animate={{ scale: 1, textShadow: "0 0 5px rgba(var(--primary),0.5)" }}
              className="flex justify-center bg-card/80 backdrop-blur-md border border-white/10 px-8 py-3 rounded-[2rem] shadow-xl z-10"
            >
                <span className="font-sport text-3xl text-primary">{score}</span>
            </motion.div>

            <motion.div 
              className="relative w-[300px] h-[400px] bg-black/40 border-2 border-primary/30 backdrop-blur-md rounded-[2rem] overflow-hidden cursor-crosshair shadow-[0_0_30px_rgba(var(--primary),0.1)]"
              onPointerDown={handleTap}
              animate={gameState === "gameover" ? { x: [-10, 10, -10, 10, 0], filter: "grayscale(80%)" } : {}}
              transition={{ duration: 0.4 }}
              style={{ touchAction: "none" }}
            >
              <motion.div 
                className="absolute w-full h-full bottom-0"
                animate={{ y: cameraY }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
              >
                {/* Visual Tower Container with squish impact */}
                <motion.div
                  key={impactForce}
                  initial={{ scaleY: 0.9, scaleX: 1.05 }}
                  animate={{ scaleY: 1, scaleX: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  className="absolute bottom-0 w-full h-full"
                  style={{ transformOrigin: "bottom center" }}
                >
                  {blocks.map((block, i) => (
                    <motion.div
                      key={block.id}
                      initial={i === blocks.length - 1 && i !== 0 ? { opacity: 0, y: 30 } : false}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute h-[30px] rounded-[4px] border-t-2 border-white/40 shadow-[0_4px_10px_rgba(0,0,0,0.5)]"
                      style={{
                        width: block.width,
                        left: block.x,
                        bottom: i * 30,
                        backgroundColor: `hsl(${block.hue}, 80%, 55%)`,
                        boxShadow: `inset 0 -5px 10px rgba(0,0,0,0.3), 0 0 10px hsl(${block.hue}, 80%, 50%, 0.5)`
                      }}
                    />
                  ))}
                </motion.div>

                {gameState === "playing" && (
                  <div
                    className="absolute h-[30px] rounded-[4px] border-t-2 border-white/60 shadow-[0_10px_20px_rgba(0,0,0,0.5)] z-10"
                    style={{
                      width: movingBlock.width,
                      left: movingBlock.x,
                      bottom: blocks.length * 30,
                      backgroundColor: `hsl(${movingBlock.hue}, 80%, 65%)`,
                      boxShadow: `0 0 20px hsl(${movingBlock.hue}, 80%, 50%, 0.8), inset 0 5px 10px rgba(255,255,255,0.4)`
                    }}
                  />
                )}
              </motion.div>
              
              <AnimatePresence>
                {gameState === "gameover" && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 1.5 }} animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 bg-destructive/20 backdrop-blur-md z-20 flex flex-col items-center justify-center p-6 text-center border-t border-destructive/50"
                  >
                    <motion.h3 animate={{ rotate: [-2, 2, -2] }} transition={{ repeat: Infinity, duration: 0.2 }} className="font-sport text-5xl text-destructive drop-shadow-[0_0_20px_rgba(var(--destructive),0.8)] mb-2">CRUMBLED</motion.h3>
                    <p className="text-white font-sport text-lg mb-8 tracking-widest">Height: {score}</p>
                    <motion.button
                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      onClick={(e) => { e.stopPropagation(); startGame(); }}
                      className="w-20 h-20 rounded-full bg-secondary text-secondary-foreground shadow-[0_0_30px_rgba(var(--secondary),0.5)] flex items-center justify-center"
                    >
                      <RotateCcw className="h-8 w-8" />
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
