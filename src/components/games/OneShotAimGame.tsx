import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Target } from "lucide-react";
import { sfx } from "@/lib/sounds";
import { addEntertainmentPoints } from "@/lib/streaks";

const AREA_WIDTH = 300;
const AREA_HEIGHT = 400;
const PLAYER_SIZE = 30;
const TARGET_SIZE = 40;
const PROJECTILE_SIZE = 12;

interface Particle { id: number; x: number; y: number; vx: number; vy: number; life: number }

export const OneShotAimGame = ({ onComplete }: { onComplete?: (score: number) => void }) => {
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameover">("menu");
  const [score, setScore] = useState(0);
  
  const targetRef = useRef({ x: AREA_WIDTH / 2, y: 50, direction: 1, speed: 2 });
  const projRef = useRef({ x: AREA_WIDTH / 2, y: AREA_HEIGHT - PLAYER_SIZE, active: false, speed: 15 });
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const trailRef = useRef<{ id: number; x: number; y: number; opacity: number }[]>([]);

  const [targetPos, setTargetPos] = useState(targetRef.current.x);
  const [projPos, setProjPos] = useState({ ...projRef.current });
  const [particles, setParticles] = useState<Particle[]>([]);
  const [trail, setTrail] = useState(trailRef.current);
  const [recoil, setRecoil] = useState(0); // cannon recoil animation state

  const startGame = () => {
    targetRef.current = { x: AREA_WIDTH / 2, y: 50, direction: 1, speed: 2.5 };
    projRef.current = { x: AREA_WIDTH / 2, y: AREA_HEIGHT - PLAYER_SIZE, active: false, speed: 15 };
    particlesRef.current = [];
    trailRef.current = [];
    setTargetPos(targetRef.current.x);
    setProjPos({ ...projRef.current });
    setParticles([]);
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
    addEntertainmentPoints(Math.round(score * 2));
    onComplete?.(score);
  }, [score, onComplete]);

  const gameLoop = useCallback(() => {
    if (gameState !== "playing") return;

    // Move Target
    const t = targetRef.current;
    t.x += t.speed * t.direction;
    if (t.x <= TARGET_SIZE / 2) {
      t.x = TARGET_SIZE / 2;
      t.direction = 1;
    } else if (t.x >= AREA_WIDTH - TARGET_SIZE / 2) {
      t.x = AREA_WIDTH - TARGET_SIZE / 2;
      t.direction = -1;
    }
    setTargetPos(t.x);

    // Particles logic
    if (particlesRef.current.length > 0) {
        particlesRef.current.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2; // gravity
            p.life -= 0.05;
        });
        particlesRef.current = particlesRef.current.filter(p => p.life > 0);
        setParticles([...particlesRef.current]);
    }

    // Trailing logic
    if (projRef.current.active) {
        trailRef.current.push({ id: Date.now() + Math.random(), x: projRef.current.x, y: projRef.current.y, opacity: 1 });
    }
    trailRef.current.forEach(tr => tr.opacity -= 0.1);
    trailRef.current = trailRef.current.filter(tr => tr.opacity > 0);
    setTrail([...trailRef.current]);

    // Move Projectile
    const p = projRef.current;
    if (p.active) {
      p.y -= p.speed;
      
      const dist = Math.sqrt(Math.pow(p.x - t.x, 2) + Math.pow(p.y - t.y, 2));
      if (dist < (TARGET_SIZE / 2 + PROJECTILE_SIZE / 2)) {
        // Hit!
        sfx.correct();
        const newScore = score + 1;
        setScore(newScore);
        p.active = false;
        p.y = AREA_HEIGHT - PLAYER_SIZE;
        // Every 5 points, boost speed by 10%
        if (newScore % 5 === 0) {
          t.speed *= 1.1;
        } else {
          t.speed += 0.3;
        }
        
        // Spawn explosion particles
        for(let i=0; i<15; i++) {
            particlesRef.current.push({
                id: Math.random(), x: t.x, y: t.y,
                vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10,
                life: 1
            });
        }
      } else if (p.y < 0) {
        endGame();
        return;
      }
      
      setProjPos({ ...p });
    }

    if (recoil > 0) setRecoil(prev => Math.max(0, prev - 1));

    animRef.current = requestAnimationFrame(gameLoop);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, endGame, recoil]);

  useEffect(() => {
    if (gameState === "playing") {
      animRef.current = requestAnimationFrame(gameLoop);
    }
    return () => cancelAnimationFrame(animRef.current);
  }, [gameState, gameLoop]);

  const handleShoot = () => {
    if (gameState !== "playing" || projRef.current.active) return;
    
    sfx.click(); 
    projRef.current.active = true;
    projRef.current.x = AREA_WIDTH / 2;
    projRef.current.y = AREA_HEIGHT - PLAYER_SIZE - 10;
    setRecoil(15); // Trigger translateY recoil
  };

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[400px] p-4 select-none">
      <AnimatePresence mode="popLayout">
        {gameState === "menu" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8 }} className="flex flex-col items-center gap-8 text-center relative z-10">
            <div>
              <h2 className="font-sport text-5xl text-primary mb-3 drop-shadow-[0_0_15px_rgba(var(--primary),0.8)] tracking-widest">ONE SHOT AIM</h2>
              <p className="text-white/60 text-sm font-sport-body max-w-[250px] mx-auto">Tap to shoot the moving target. Don't miss!</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={startGame}
              className="px-10 py-4 rounded-full bg-primary text-primary-foreground font-sport tracking-wider text-xl shadow-[0_0_20px_rgba(var(--primary),0.5)] border border-primary/50"
            >
              PLAY NOW
            </motion.button>
          </motion.div>
        )}

        {gameState !== "menu" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full flex justify-center">
            <motion.div 
              className="relative bg-black/40 border-2 border-primary/30 backdrop-blur-md rounded-[2rem] shadow-[0_0_40px_rgba(var(--primary),0.1)] overflow-hidden cursor-crosshair"
              style={{ width: AREA_WIDTH, height: AREA_HEIGHT }}
              onPointerDown={handleShoot}
              animate={gameState === "gameover" ? { x: [-15, 15, -15, 15, 0], filter: "contrast(150%) hue-rotate(90deg)" } : undefined}
              transition={{ duration: 0.4 }}
            >
              {/* Score text background */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                <motion.span key={score} initial={{ scale: 1.5 }} animate={{ scale: 1 }} className="font-sport text-[150px] text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]">{score}</motion.span>
              </div>

              {/* Target with glowing track */}
              <div className="absolute top-[50px] left-0 right-0 h-1 bg-white/5" />
              <motion.div 
                className="absolute flex items-center justify-center rounded-full bg-destructive/20 border-2 border-destructive shadow-[0_0_20px_rgba(var(--destructive),0.8),inset_0_0_10px_rgba(var(--destructive),0.5)]"
                style={{ width: TARGET_SIZE, height: TARGET_SIZE, left: targetPos - TARGET_SIZE / 2, top: targetRef.current.y - TARGET_SIZE / 2 }}
              >
                <Target className="w-6 h-6 text-destructive animate-spin-slow" />
              </motion.div>

              {/* Explosion Particles */}
              {particles.map(p => (
                  <div key={p.id} className="absolute w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_10px_rgba(255,255,0,0.8)]" style={{ left: p.x, top: p.y, opacity: p.life, transform: `scale(${p.life})` }} />
              ))}

              {/* Projectile Trail */}
              {trail.map(tr => (
                  <div key={tr.id} className="absolute w-2 h-2 rounded-full bg-accent blur-[1px]" style={{ left: tr.x - 1, top: tr.y, opacity: tr.opacity * 0.5, transform: `scale(${tr.opacity})` }} />
              ))}

              {/* Projectile */}
              {projPos.active && (
                <div 
                  className="absolute rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,1),0_0_30px_rgba(var(--accent),0.8)]"
                  style={{ width: PROJECTILE_SIZE, height: PROJECTILE_SIZE, left: projPos.x - PROJECTILE_SIZE / 2, top: projPos.y - PROJECTILE_SIZE / 2 }}
                />
              )}

              {/* Player/Cannon with Recoil */}
              <motion.div 
                className="absolute bottom-4 left-1/2 -translate-x-1/2 w-10 h-14 bg-primary flex rounded-full flex-col justify-end items-center pb-2 shadow-[0_0_20px_rgba(var(--primary),0.5),inset_0_-5px_15px_rgba(0,0,0,0.5)] border border-primary/50"
                style={{ transform: `translate(-50%, ${recoil}px)` }}
              >
                <div className="w-5 h-5 rounded-full bg-white/80 shadow-[0_0_10px_rgba(255,255,255,0.8)] animate-pulse" />
              </motion.div>

              {/* Game Over Overlay */}
              <AnimatePresence>
                {gameState === "gameover" && (
                  <motion.div initial={{ opacity: 0, scale: 1.5 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 bg-destructive/20 backdrop-blur-md z-20 flex flex-col items-center justify-center p-6 text-center border-t border-destructive/50">
                    <motion.h3 animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="font-sport text-5xl text-destructive drop-shadow-[0_0_20px_rgba(var(--destructive),0.8)] mb-2">MISSED!</motion.h3>
                    <p className="text-white font-sport text-lg mb-8 tracking-widest">Score: {score}</p>
                    <motion.button
                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      onClick={(e) => { e.stopPropagation(); startGame(); }}
                      className="px-8 py-4 rounded-full bg-secondary text-secondary-foreground shadow-[0_0_30px_rgba(var(--secondary),0.5)] flex items-center justify-center gap-3 font-sport"
                    >
                      <RotateCcw className="h-6 w-6" /> TRY AGAIN
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
