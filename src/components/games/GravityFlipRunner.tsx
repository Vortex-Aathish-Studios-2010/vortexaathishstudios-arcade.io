import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { sfx } from "@/lib/sounds";
import { Trophy, RotateCcw } from "lucide-react";

interface PlayerState {
  id: number;
  x: number;
  y: number;
  vy: number;
  gravityState: number; // 1 down, -1 up
  isGrounded: boolean;
  color: string;
  alive: boolean;
}

export const GravityFlipRunner = ({ initialMode = "bot" }: { initialMode?: "bot" | "friend" }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [winnerMessage, setWinnerMessage] = useState<string | null>(null);
  const requestRef = useRef<number>();
  
  const isMultiplayer = initialMode === "friend";

  // High score persistence
  useEffect(() => {
    const saved = localStorage.getItem("gravityFlipHighScore");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const saveHighScore = (newScore: number) => {
    if (newScore > highScore) {
      setHighScore(newScore);
      localStorage.setItem("gravityFlipHighScore", newScore.toString());
    }
  };

  const startGame = useCallback(() => {
    setIsPlaying(true);
    setIsGameOver(false);
    setScore(0);
    setWinnerMessage(null);
    sfx.click?.();
  }, []);

  const endGame = useCallback((finalScore: number, winnerMsg?: string | null) => {
    setIsPlaying(false);
    setIsGameOver(true);
    setWinnerMessage(winnerMsg || null);
    const hs = parseInt(localStorage.getItem("gravityFlipHighScore") || "0", 10);
    if (Math.floor(finalScore) > hs) {
      setHighScore(Math.floor(finalScore));
      localStorage.setItem("gravityFlipHighScore", Math.floor(finalScore).toString());
    }
    sfx.gameOver?.();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Game Constants
    const WIDTH = 800;
    const HEIGHT = 400;
    const FLOOR_Y = 350;
    const CEIL_Y = 50;
    const PLAYER_SIZE = 30;
    const OBSTACLE_WIDTH = 45;

    // Setup initial players
    const initialPlayers: PlayerState[] = [];
    initialPlayers.push({
      id: 1, x: 100, y: FLOOR_Y - PLAYER_SIZE, vy: 0, gravityState: 1, isGrounded: true, color: "#00ffcc", alive: true
    });
    if (isMultiplayer) {
      initialPlayers.push({
        id: 2, x: 180, y: FLOOR_Y - PLAYER_SIZE, vy: 0, gravityState: 1, isGrounded: true, color: "#ffcc00", alive: true
      });
    }

    // Game State Mutable Object (to avoid React re-renders for 60fps)
    let state = {
      players: initialPlayers,
      obstacles: [] as { x: number; y: number; w: number; h: number; type: "ground" | "ceil" }[],
      particles: [] as { x: number; y: number; vx: number; vy: number; life: number; color: string }[],
      gameSpeed: 7, // Starting speed increased slightly
      distance: 0,
      frames: 0,
      running: isPlaying && !isGameOver,
      deathTimer: 0,
    };

    // Make canvas responsive to internal resolution
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    const spawnObstacle = () => {
      // Difficulty pacing
      const minSpacing = Math.max(220, 450 - state.gameSpeed * 15);
      const lastObstacle = state.obstacles[state.obstacles.length - 1];
      if (lastObstacle && (WIDTH - lastObstacle.x) < minSpacing) return;

      // Higher chance to spawn as game progresses
      const spawnChance = Math.min(0.08, 0.03 + (state.gameSpeed * 0.003));
      
      if (Math.random() < spawnChance) {
        const type = Math.random() < 0.5 ? "ground" : "ceil";
        const h = Math.random() * 50 + 30; // 30 to 80 height
        state.obstacles.push({
          x: WIDTH,
          y: type === "ground" ? FLOOR_Y - h : CEIL_Y,
          w: OBSTACLE_WIDTH,
          h: h,
          type
        });
        
        // Sometimes spawn a double obstacle on the opposite side to force precision!
        if (state.gameSpeed > 9 && Math.random() < 0.25) {
            const oppType = type === "ground" ? "ceil" : "ground";
            const oppH = Math.random() * 40 + 20;
            state.obstacles.push({
                x: WIDTH + Math.random() * 100 + 100,
                y: oppType === "ground" ? FLOOR_Y - oppH : CEIL_Y,
                w: OBSTACLE_WIDTH,
                h: oppH,
                type: oppType
            });
        }
      }
    };

    const createParticles = (x: number, y: number, color: string, count: number = 10) => {
      for (let i = 0; i < count; i++) {
        state.particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8,
          life: 1.0,
          color
        });
      }
    };

    const flipGravity = (p: PlayerState) => {
      if (!p.alive) return;
      p.gravityState *= -1;
      p.isGrounded = false;
      p.vy = p.gravityState === 1 ? 13 : -13; // Fast burst speed
      sfx.flip?.();
      
      // Flip effect
      createParticles(p.x + PLAYER_SIZE/2, p.y + PLAYER_SIZE/2, p.color, 12);
    };

    const handleInput = (e: KeyboardEvent | MouseEvent | TouchEvent) => {
      if (e.target && (e.target as HTMLElement).closest('button')) return; // Don't jump if clicking a native button

      if ((e.type === "keydown" && (e as KeyboardEvent).code === "Space") || e.type === "mousedown" || e.type === "touchstart") {
        if (!state.running) {
          startGame();
          return;
        }

        let isLeft = false;
        let isRight = false;
        
        // Convert screen coordinates to left/right for multiplayer tap zones
        if (e.type === "mousedown") {
            const mx = (e as MouseEvent).clientX;
            if (mx < window.innerWidth / 2) isLeft = true;
            else isRight = true;
        } else if (e.type === "touchstart") {
            const touches = (e as TouchEvent).changedTouches;
            for (let i = 0; i < touches.length; i++) {
                const tx = touches[i].clientX;
                if (tx < window.innerWidth / 2) isLeft = true;
                else isRight = true;
            }
        } else if (e.type === "keydown") {
            const code = (e as KeyboardEvent).code;
            if (isMultiplayer) {
                if (code === "KeyW" || code === "KeyA" || code === "KeyD" || code === "Space") isLeft = true;
                if (code === "ArrowUp" || code === "ArrowLeft" || code === "ArrowRight" || code === "Enter") isRight = true;
            } else {
                isLeft = true; 
                isRight = true;
            }
        }

        if (!isMultiplayer) {
            isLeft = true;
            isRight = true;
        }

        // Apply flips
        state.players.forEach(p => {
           if (!p.alive) return;
           if (isMultiplayer) {
               if (p.id === 1 && isLeft) flipGravity(p);
               if (p.id === 2 && isRight) flipGravity(p);
           } else {
               if (isLeft || isRight) flipGravity(p);
           }
        });
      }
    };

    window.addEventListener("keydown", handleInput);
    window.addEventListener("mousedown", handleInput);
    window.addEventListener("touchstart", handleInput);

    let lastTime = performance.now();

    const update = (time: number) => {
      if (!state.running) {
        // Just draw static frame
        draw(ctx);
        requestRef.current = requestAnimationFrame(update);
        return;
      }

      const deltaTime = (time - lastTime) / 16.66; // Normalize to 60fps
      lastTime = time;

      state.frames++;
      state.distance += state.gameSpeed * 0.1;
      
      // ACCELERATED SCALING: speeds up noticeably over time
      state.gameSpeed += 0.003 * deltaTime; 

      if (state.frames % 10 === 0) setScore(Math.floor(state.distance));

      // Update Players Physics
      state.players.forEach(p => {
          if (!p.alive) {
              // Dead players tumble away
              p.vy += 0.5 * deltaTime; // Normal downward gravity overrides
              p.y += p.vy * deltaTime;
              p.x -= state.gameSpeed * deltaTime * 1.5;
              return;
          }
          if (!p.isGrounded) {
            p.y += p.vy * deltaTime;
            // Gravity bounds check
            if (p.gravityState === 1 && p.y >= FLOOR_Y - PLAYER_SIZE) {
              p.y = FLOOR_Y - PLAYER_SIZE;
              p.vy = 0;
              p.isGrounded = true;
              createParticles(p.x + PLAYER_SIZE/2, FLOOR_Y, "#ffffff", 5);
            } else if (p.gravityState === -1 && p.y <= CEIL_Y) {
              p.y = CEIL_Y;
              p.vy = 0;
              p.isGrounded = true;
              createParticles(p.x + PLAYER_SIZE/2, CEIL_Y, "#ffffff", 5);
            }
          }
      });

      spawnObstacle();

      // Update Obstacles and Check Collisions
      if (state.deathTimer === 0) {
        let someoneDied = false;

        for (let i = state.obstacles.length - 1; i >= 0; i--) {
          const obs = state.obstacles[i];
          obs.x -= state.gameSpeed * deltaTime;

          // Collision detection (AABB)
          state.players.forEach(p => {
              if (!p.alive) return;
              // slightly shrunken hitbox for fair gameplay
              const px = p.x + 4; 
              const py = p.y + 4;
              const pw = PLAYER_SIZE - 8;
              const ph = PLAYER_SIZE - 8;

              if (px < obs.x + obs.w && px + pw > obs.x && py < obs.y + obs.h && py + ph > obs.y) {
                  // Crash!
                  createParticles(p.x + PLAYER_SIZE/2, p.y + PLAYER_SIZE/2, "#ff2a55", 35);
                  p.alive = false;
                  p.isGrounded = false;
                  p.vy = -12; // bounce up
                  someoneDied = true;
              }
          });

          if (obs.x + obs.w < 0) {
            state.obstacles.splice(i, 1);
          }
        }

        if (someoneDied) {
            state.deathTimer = 1.0; // 1 second slowdown
        }
      } else {
        // We are dying, obstacles still move but slow down
        for (let i = state.obstacles.length - 1; i >= 0; i--) {
            state.obstacles[i].x -= state.gameSpeed * deltaTime;
        }
      }

      // Handle Death Sequence
      if (state.deathTimer > 0) {
          state.gameSpeed *= Math.pow(0.9, deltaTime); // friction slowdown
          state.deathTimer -= deltaTime * 0.016; // 60fps = ~1 sec

          if (state.deathTimer <= 0) {
              if (isMultiplayer) {
                  const p1 = state.players[0];
                  const p2 = state.players[1];
                  let wMsg = "Draw!";
                  if (!p1.alive && p2.alive) wMsg = "Player 2 Wins!";
                  if (p1.alive && !p2.alive) wMsg = "Player 1 Wins!";
                  endGame(state.distance, wMsg);
              } else {
                  endGame(state.distance);
              }
              state.running = false;
              state.deathTimer = 0;
          }
      }

      // Update Particles
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx * deltaTime;
        p.y += p.vy * deltaTime;
        p.life -= 0.05 * deltaTime;
        if (p.life <= 0) state.particles.splice(i, 1);
      }

      draw(ctx);
      requestRef.current = requestAnimationFrame(update);
    };

    const draw = (ctx: CanvasRenderingContext2D) => {
      // Clear background
      ctx.fillStyle = "#0a0a0c";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Draw Floor and Ceiling
      ctx.fillStyle = "#1f1f2e";
      ctx.fillRect(0, 0, WIDTH, CEIL_Y);
      ctx.fillRect(0, FLOOR_Y, WIDTH, HEIGHT - FLOOR_Y);

      // Draw Grid / Speed lines for motion effect
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = 1;
      const offset = (state.distance * 15) % 80;
      for (let x = -80; x < WIDTH + 80; x += 80) {
        ctx.beginPath();
        ctx.moveTo(x - offset, CEIL_Y);
        ctx.lineTo(x - offset - 100, FLOOR_Y);
        ctx.stroke();
      }

      if (isMultiplayer && (state.running || !isPlaying)) {
          // Draw split screen indicator line lightly in background
          ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
          ctx.lineWidth = 2;
          ctx.setLineDash([10, 10]);
          ctx.beginPath();
          ctx.moveTo(WIDTH / 2, 0);
          ctx.lineTo(WIDTH / 2, HEIGHT);
          ctx.stroke();
          ctx.setLineDash([]);
      }

      // Draw Obstacles
      ctx.fillStyle = "#ff2a55"; // bright red
      ctx.shadowBlur = 12;
      ctx.shadowColor = "#ff2a55";
      state.obstacles.forEach(obs => {
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
      });
      ctx.shadowBlur = 0;

      // Draw Players if alive or dying
      state.players.forEach(p => {
          if (!state.running && isGameOver && !p.alive) return; // Hide strictly when fully over
          
          ctx.fillStyle = p.color;
          ctx.shadowBlur = p.alive ? 15 : 0;
          ctx.shadowColor = p.color;
          ctx.globalAlpha = p.alive ? 1.0 : 0.6; // ghost effect for dead
          
          ctx.save();
          ctx.translate(p.x + PLAYER_SIZE/2, p.y + PLAYER_SIZE/2);
          
          if (!p.alive) {
              ctx.rotate(state.frames * 0.3); // Spin wildly when dead
          } else if (!p.isGrounded) {
            ctx.rotate(p.vy * 0.05);
          } else {
            // Slight running bob when grounded
            if (state.running) {
                const bob = Math.sin(state.frames * 0.5) * 2;
                ctx.translate(0, p.gravityState === 1 ? bob : -bob);
            }
          }
          ctx.fillRect(-PLAYER_SIZE/2, -PLAYER_SIZE/2, PLAYER_SIZE, PLAYER_SIZE);
          
          // Draw trailing eye to show direction (only if alive)
          if (p.alive) {
            ctx.fillStyle = "#000";
            ctx.shadowBlur = 0;
            ctx.fillRect(PLAYER_SIZE/4, p.gravityState === 1 ? -PLAYER_SIZE/4 : PLAYER_SIZE/8, 4, 4);
          }
          
          ctx.restore();
          ctx.globalAlpha = 1.0;
      });

      // Draw Particles
      state.particles.forEach(p => {
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 4, 4);
      });
      ctx.globalAlpha = 1.0;
    };

    if (state.running) {
       lastTime = performance.now();
    }
    requestRef.current = requestAnimationFrame(update);

    return () => {
      window.removeEventListener("keydown", handleInput);
      window.removeEventListener("mousedown", handleInput);
      window.removeEventListener("touchstart", handleInput);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, isGameOver, endGame, startGame, isMultiplayer]);

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto pt-4 relative select-none touch-none">
      
      {/* Score HUD */}
      <div className="w-full flex justify-between items-center mb-4 px-4">
        <div className="flex flex-col">
          <span className="text-[hsl(var(--sport-muted))] font-sport tracking-widest text-xs">SCORE</span>
          <span className="text-[hsl(var(--sport-text))] font-sport tracking-widest text-3xl">{score}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[hsl(var(--sport-primary))] font-sport tracking-widest text-xs flex items-center gap-1">
            <Trophy className="w-3 h-3" /> BEST
          </span>
          <span className="text-[hsl(var(--sport-text))] font-sport tracking-widest text-2xl">{highScore}</span>
        </div>
      </div>

      {/* Game Canvas */}
      <div className="relative w-full aspect-[2/1] bg-[#0a0a0c] rounded-2xl overflow-hidden border-2 border-[#1f1f2e] shadow-[0_0_30px_rgba(0,255,204,0.1)]">
        <canvas
          ref={canvasRef}
          className="w-full h-full block cursor-pointer"
        />

        {/* Start Overlay */}
        <AnimatePresence>
          {!isPlaying && !isGameOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center cursor-pointer pointer-events-none"
            >
              <div className="text-[hsl(var(--sport-primary))] opacity-80 mb-2">
                <RotateCcw className="w-12 h-12" />
              </div>
              <h2 className="font-sport text-4xl text-white tracking-widest mb-2">GRAVITY FLIP runner</h2>
              <p className="font-sport-body text-[hsl(var(--sport-muted))]">
                  {isMultiplayer ? "P1: Tap Left | P2: Tap Right" : "Tap or Space to invert gravity."}
              </p>
              <div className="mt-8 px-6 py-2 rounded-full border border-[hsl(var(--sport-primary))] text-[hsl(var(--sport-primary))] font-sport tracking-widest animate-pulse">
                TAP TO START
              </div>
            </motion.div>
          )}

          {/* Game Over Overlay */}
          {isGameOver && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-[100]"
            >
              <h2 className="font-sport text-5xl text-[#ff2a55] tracking-widest mb-2 drop-shadow-[0_0_15px_rgba(255,42,85,0.5)]">
                  {winnerMessage ? winnerMessage.toUpperCase() : "CRASHED!"}
              </h2>
              <div className="flex gap-8 mb-8">
                <div className="text-center">
                  <p className="font-sport text-[hsl(var(--sport-muted))] text-sm tracking-widest">SCORE</p>
                  <p className="font-sport text-3xl text-white">{score}</p>
                </div>
                <div className="text-center">
                  <p className="font-sport text-[hsl(var(--sport-primary))] text-sm tracking-widest">BEST</p>
                  <p className="font-sport text-3xl text-white">{highScore}</p>
                </div>
              </div>
              <button
                // Bind pointer events directly so it doesn't get captured arbitrarily
                onClick={(e) => { e.stopPropagation(); startGame(); }}
                className="pointer-events-auto px-8 py-3 rounded-xl bg-[#ff2a55]/20 border border-[#ff2a55] text-[#ff2a55] font-sport text-xl tracking-widest hover:bg-[#ff2a55]/30 hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,42,85,0.2)]"
              >
                RESTART (TAP)
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <p className="text-xs text-[hsl(var(--sport-muted))] font-sport-body mt-4 text-center max-w-sm">
          {isMultiplayer 
              ? "Left Side vs Right Side. First to crash into a red block loses!" 
              : "Stay alive for as long as possible. The game speeds up the further you run!"}
      </p>
    </div>
  );
};
