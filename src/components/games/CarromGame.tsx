import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";

interface Coin {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: "white" | "black" | "red";
  pocketed: boolean;
  points: number;
}

interface Striker {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  moving: boolean;
}

const BOARD_SIZE = 360;
const POCKET_RADIUS = 18;
const COIN_RADIUS = 11;
const STRIKER_RADIUS = 14;
const FRICTION = 0.975;
const MIN_SPEED = 0.15;
const POCKET_POSITIONS = [
  { x: 30, y: 30 },
  { x: BOARD_SIZE - 30, y: 30 },
  { x: 30, y: BOARD_SIZE - 30 },
  { x: BOARD_SIZE - 30, y: BOARD_SIZE - 30 },
];

const createCoins = (): Coin[] => {
  const coins: Coin[] = [];
  const cx = BOARD_SIZE / 2;
  const cy = BOARD_SIZE / 2;

  // Center red coin (queen) - 20 points
  coins.push({ id: "red-0", x: cx, y: cy, vx: 0, vy: 0, radius: COIN_RADIUS, color: "red", pocketed: false, points: 20 });

  // Inner ring - 6 coins alternating black/white
  const innerRadius = 28;
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI * 2) / 6;
    const color = i % 2 === 0 ? "white" : "black";
    coins.push({
      id: `${color}-${i}`,
      x: cx + Math.cos(angle) * innerRadius,
      y: cy + Math.sin(angle) * innerRadius,
      vx: 0, vy: 0,
      radius: COIN_RADIUS,
      color,
      pocketed: false,
      points: color === "white" ? 10 : 5,
    });
  }

  // Outer ring - 12 coins alternating
  const outerRadius = 52;
  for (let i = 0; i < 12; i++) {
    const angle = (i * Math.PI * 2) / 12 + Math.PI / 12;
    const color = i % 2 === 0 ? "black" : "white";
    coins.push({
      id: `${color}-outer-${i}`,
      x: cx + Math.cos(angle) * outerRadius,
      y: cy + Math.sin(angle) * outerRadius,
      vx: 0, vy: 0,
      radius: COIN_RADIUS,
      color,
      pocketed: false,
      points: color === "white" ? 10 : 5,
    });
  }

  return coins;
};

const createStriker = (): Striker => ({
  x: BOARD_SIZE / 2,
  y: BOARD_SIZE - 60,
  vx: 0, vy: 0,
  radius: STRIKER_RADIUS,
  moving: false,
});

export const CarromGame = () => {
  const [coins, setCoins] = useState<Coin[]>(createCoins);
  const [striker, setStriker] = useState<Striker>(createStriker);
  const [score, setScore] = useState(0);
  const [shots, setShots] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null);
  const [animating, setAnimating] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [strikerPocketed, setStrikerPocketed] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const coinsRef = useRef(coins);
  const strikerRef = useRef(striker);

  coinsRef.current = coins;
  strikerRef.current = striker;

  // Drawing
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scale = window.devicePixelRatio || 1;
    canvas.width = BOARD_SIZE * scale;
    canvas.height = BOARD_SIZE * scale;
    ctx.scale(scale, scale);

    // Board background
    ctx.fillStyle = "#D4A056";
    ctx.fillRect(0, 0, BOARD_SIZE, BOARD_SIZE);

    // Board border
    ctx.strokeStyle = "#5C3A1E";
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, BOARD_SIZE - 8, BOARD_SIZE - 8);

    // Inner border lines
    ctx.strokeStyle = "#8B6914";
    ctx.lineWidth = 2;
    ctx.strokeRect(24, 24, BOARD_SIZE - 48, BOARD_SIZE - 48);

    // Center circles
    const cx = BOARD_SIZE / 2;
    const cy = BOARD_SIZE / 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 60, 0, Math.PI * 2);
    ctx.strokeStyle = "#8B6914";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 20, 0, Math.PI * 2);
    ctx.strokeStyle = "#8B6914";
    ctx.stroke();

    // Diagonal lines in corners
    const cornerLen = 45;
    const cornerOff = 24;
    const corners = [
      { x: cornerOff, y: cornerOff, dx: 1, dy: 1 },
      { x: BOARD_SIZE - cornerOff, y: cornerOff, dx: -1, dy: 1 },
      { x: cornerOff, y: BOARD_SIZE - cornerOff, dx: 1, dy: -1 },
      { x: BOARD_SIZE - cornerOff, y: BOARD_SIZE - cornerOff, dx: -1, dy: -1 },
    ];
    corners.forEach(({ x, y, dx, dy }) => {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + dx * cornerLen, y + dy * cornerLen);
      ctx.strokeStyle = "#8B6914";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    // Striker baseline
    ctx.beginPath();
    ctx.setLineDash([5, 5]);
    ctx.moveTo(70, BOARD_SIZE - 60);
    ctx.lineTo(BOARD_SIZE - 70, BOARD_SIZE - 60);
    ctx.strokeStyle = "#8B6914aa";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);

    // Pockets
    POCKET_POSITIONS.forEach(({ x, y }) => {
      ctx.beginPath();
      ctx.arc(x, y, POCKET_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = "#2a1a0a";
      ctx.fill();
      ctx.strokeStyle = "#5C3A1E";
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Coins
    coinsRef.current.forEach((coin) => {
      if (coin.pocketed) return;
      ctx.beginPath();
      ctx.arc(coin.x, coin.y, coin.radius, 0, Math.PI * 2);
      if (coin.color === "white") {
        ctx.fillStyle = "#F5F0E0";
        ctx.strokeStyle = "#C0B090";
      } else if (coin.color === "black") {
        ctx.fillStyle = "#1a1a1a";
        ctx.strokeStyle = "#444";
      } else {
        ctx.fillStyle = "#DC2626";
        ctx.strokeStyle = "#991B1B";
      }
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Inner circle decoration
      ctx.beginPath();
      ctx.arc(coin.x, coin.y, coin.radius * 0.55, 0, Math.PI * 2);
      ctx.strokeStyle = coin.color === "black" ? "#555" : coin.color === "red" ? "#FCA5A5" : "#D4C8A8";
      ctx.lineWidth = 0.8;
      ctx.stroke();
    });

    // Striker
    const s = strikerRef.current;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#E8D8B8";
    ctx.fill();
    ctx.strokeStyle = "#8B6914";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius * 0.4, 0, Math.PI * 2);
    ctx.strokeStyle = "#A08050";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Drag arrow
    if (dragging && dragStart && dragCurrent) {
      const dx = dragStart.x - dragCurrent.x;
      const dy = dragStart.y - dragCurrent.y;
      const power = Math.min(Math.sqrt(dx * dx + dy * dy), 120);
      const angle = Math.atan2(dy, dx);

      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x + Math.cos(angle) * power * 0.8, s.y + Math.sin(angle) * power * 0.8);
      ctx.strokeStyle = `rgba(220, 38, 38, ${0.4 + power / 200})`;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Power dot
      ctx.beginPath();
      ctx.arc(s.x + Math.cos(angle) * power * 0.8, s.y + Math.sin(angle) * power * 0.8, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#DC2626";
      ctx.fill();
    }
  }, [dragging, dragStart, dragCurrent]);

  useEffect(() => {
    draw();
  }, [draw, coins, striker]);

  const getCanvasPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = BOARD_SIZE / rect.width;
    const scaleY = BOARD_SIZE / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (animating || gameOver) return;
    const pos = getCanvasPos(e);
    const dx = pos.x - striker.x;
    const dy = pos.y - striker.y;
    if (Math.sqrt(dx * dx + dy * dy) < striker.radius * 2.5) {
      setDragging(true);
      setDragStart(pos);
      setDragCurrent(pos);
    }
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!dragging) return;
    e.preventDefault();
    setDragCurrent(getCanvasPos(e));
  };

  const handlePointerUp = () => {
    if (!dragging || !dragStart || !dragCurrent) {
      setDragging(false);
      return;
    }

    const dx = dragStart.x - dragCurrent.x;
    const dy = dragStart.y - dragCurrent.y;
    const power = Math.min(Math.sqrt(dx * dx + dy * dy), 120);

    if (power < 8) {
      setDragging(false);
      setDragStart(null);
      setDragCurrent(null);
      return;
    }

    const angle = Math.atan2(dy, dx);
    const speed = power * 0.12;

    setStriker((s) => ({
      ...s,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      moving: true,
    }));
    setShots((s) => s + 1);
    setAnimating(true);
    setDragging(false);
    setDragStart(null);
    setDragCurrent(null);
  };

  // Move striker horizontally on baseline
  const handleStrikerDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (animating || dragging || gameOver) return;
    // Only allow repositioning when not dragging for shot
  };

  // Physics simulation
  useEffect(() => {
    if (!animating) return;

    const simulate = () => {
      let allStopped = true;
      const currentCoins = [...coinsRef.current];
      const s = { ...strikerRef.current };
      let pocketedThisFrame: Coin[] = [];
      let strikerPocket = false;

      // Update striker
      if (Math.abs(s.vx) > MIN_SPEED || Math.abs(s.vy) > MIN_SPEED) {
        s.x += s.vx;
        s.y += s.vy;
        s.vx *= FRICTION;
        s.vy *= FRICTION;
        allStopped = false;

        // Wall bounces for striker
        if (s.x - s.radius < 12) { s.x = 12 + s.radius; s.vx = Math.abs(s.vx) * 0.7; }
        if (s.x + s.radius > BOARD_SIZE - 12) { s.x = BOARD_SIZE - 12 - s.radius; s.vx = -Math.abs(s.vx) * 0.7; }
        if (s.y - s.radius < 12) { s.y = 12 + s.radius; s.vy = Math.abs(s.vy) * 0.7; }
        if (s.y + s.radius > BOARD_SIZE - 12) { s.y = BOARD_SIZE - 12 - s.radius; s.vy = -Math.abs(s.vy) * 0.7; }

        // Check striker pocket
        for (const pocket of POCKET_POSITIONS) {
          const pdx = s.x - pocket.x;
          const pdy = s.y - pocket.y;
          if (Math.sqrt(pdx * pdx + pdy * pdy) < POCKET_RADIUS - 2) {
            strikerPocket = true;
            break;
          }
        }
      } else {
        s.vx = 0;
        s.vy = 0;
      }

      // Update coins
      for (const coin of currentCoins) {
        if (coin.pocketed) continue;

        if (Math.abs(coin.vx) > MIN_SPEED || Math.abs(coin.vy) > MIN_SPEED) {
          coin.x += coin.vx;
          coin.y += coin.vy;
          coin.vx *= FRICTION;
          coin.vy *= FRICTION;
          allStopped = false;
        } else {
          coin.vx = 0;
          coin.vy = 0;
        }

        // Wall bounces
        if (coin.x - coin.radius < 12) { coin.x = 12 + coin.radius; coin.vx = Math.abs(coin.vx) * 0.7; }
        if (coin.x + coin.radius > BOARD_SIZE - 12) { coin.x = BOARD_SIZE - 12 - coin.radius; coin.vx = -Math.abs(coin.vx) * 0.7; }
        if (coin.y - coin.radius < 12) { coin.y = 12 + coin.radius; coin.vy = Math.abs(coin.vy) * 0.7; }
        if (coin.y + coin.radius > BOARD_SIZE - 12) { coin.y = BOARD_SIZE - 12 - coin.radius; coin.vy = -Math.abs(coin.vy) * 0.7; }

        // Check pockets
        for (const pocket of POCKET_POSITIONS) {
          const pdx = coin.x - pocket.x;
          const pdy = coin.y - pocket.y;
          if (Math.sqrt(pdx * pdx + pdy * pdy) < POCKET_RADIUS - 2) {
            coin.pocketed = true;
            coin.vx = 0;
            coin.vy = 0;
            pocketedThisFrame.push(coin);
            break;
          }
        }

        // Coin-striker collision
        if (!coin.pocketed) {
          const cdx = coin.x - s.x;
          const cdy = coin.y - s.y;
          const dist = Math.sqrt(cdx * cdx + cdy * cdy);
          const minDist = coin.radius + s.radius;
          if (dist < minDist && dist > 0) {
            const nx = cdx / dist;
            const ny = cdy / dist;
            const overlap = minDist - dist;
            coin.x += nx * overlap * 0.5;
            coin.y += ny * overlap * 0.5;
            s.x -= nx * overlap * 0.5;
            s.y -= ny * overlap * 0.5;

            const dvx = s.vx - coin.vx;
            const dvy = s.vy - coin.vy;
            const dot = dvx * nx + dvy * ny;
            if (dot > 0) {
              coin.vx += nx * dot * 0.9;
              coin.vy += ny * dot * 0.9;
              s.vx -= nx * dot * 0.9;
              s.vy -= ny * dot * 0.9;
            }
            allStopped = false;
          }
        }
      }

      // Coin-coin collisions
      for (let i = 0; i < currentCoins.length; i++) {
        if (currentCoins[i].pocketed) continue;
        for (let j = i + 1; j < currentCoins.length; j++) {
          if (currentCoins[j].pocketed) continue;
          const a = currentCoins[i];
          const b = currentCoins[j];
          const ddx = b.x - a.x;
          const ddy = b.y - a.y;
          const dist = Math.sqrt(ddx * ddx + ddy * ddy);
          const minDist = a.radius + b.radius;
          if (dist < minDist && dist > 0) {
            const nx = ddx / dist;
            const ny = ddy / dist;
            const overlap = minDist - dist;
            a.x -= nx * overlap * 0.5;
            a.y -= ny * overlap * 0.5;
            b.x += nx * overlap * 0.5;
            b.y += ny * overlap * 0.5;

            const dvx = a.vx - b.vx;
            const dvy = a.vy - b.vy;
            const dot = dvx * nx + dvy * ny;
            if (dot > 0) {
              a.vx -= nx * dot * 0.5;
              a.vy -= ny * dot * 0.5;
              b.vx += nx * dot * 0.5;
              b.vy += ny * dot * 0.5;
            }
            allStopped = false;
          }
        }
      }

      setStriker(s);
      setCoins([...currentCoins]);

      if (pocketedThisFrame.length > 0) {
        const earned = pocketedThisFrame.reduce((sum, c) => sum + c.points, 0);
        setScore((prev) => prev + earned);
      }

      if (strikerPocket) {
        setStrikerPocketed(true);
      }

      if (allStopped) {
        setAnimating(false);

        if (strikerPocket) {
          // Penalty: lose 5 points
          setScore((prev) => Math.max(0, prev - 5));
          setStrikerPocketed(false);
        }

        // Reset striker position
        setStriker(createStriker());

        // Check game over
        const remaining = currentCoins.filter((c) => !c.pocketed);
        if (remaining.length === 0) {
          setGameOver(true);
        }
      } else {
        animFrameRef.current = requestAnimationFrame(simulate);
      }
    };

    animFrameRef.current = requestAnimationFrame(simulate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [animating]);

  const resetGame = () => {
    setCoins(createCoins());
    setStriker(createStriker());
    setScore(0);
    setShots(0);
    setGameOver(false);
    setAnimating(false);
    setStrikerPocketed(false);
  };

  // Allow repositioning striker along baseline by clicking the baseline area
  const handleBaselineClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (animating || dragging || gameOver) return;
    const pos = getCanvasPos(e);
    if (pos.y > BOARD_SIZE - 80 && pos.y < BOARD_SIZE - 40) {
      const newX = Math.max(70, Math.min(BOARD_SIZE - 70, pos.x));
      setStriker((s) => ({ ...s, x: newX }));
    }
  };

  const remainingCoins = coins.filter((c) => !c.pocketed);
  const pocketedWhite = coins.filter((c) => c.pocketed && c.color === "white").length;
  const pocketedBlack = coins.filter((c) => c.pocketed && c.color === "black").length;
  const pocketedRed = coins.filter((c) => c.pocketed && c.color === "red").length;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Score */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-6 bg-[hsl(var(--sport-card))] rounded-xl px-5 py-3 shadow-md border border-[hsl(var(--sport-border))]"
      >
        <div className="text-center">
          <div className="text-xs text-[hsl(var(--sport-muted))] font-sport-body">SCORE</div>
          <div className="text-2xl font-sport text-[hsl(var(--sport-primary))]">{score}</div>
        </div>
        <div className="w-px h-8 bg-[hsl(var(--sport-border))]" />
        <div className="text-center">
          <div className="text-xs text-[hsl(var(--sport-muted))] font-sport-body">SHOTS</div>
          <div className="text-2xl font-sport text-[hsl(var(--sport-secondary))]">{shots}</div>
        </div>
        <div className="w-px h-8 bg-[hsl(var(--sport-border))]" />
        <div className="text-center">
          <div className="text-xs text-[hsl(var(--sport-muted))] font-sport-body">LEFT</div>
          <div className="text-2xl font-sport text-[hsl(var(--sport-accent))]">{remainingCoins.length}</div>
        </div>
      </motion.div>

      {/* Pocketed display */}
      <div className="flex items-center gap-3 text-xs font-sport-body text-[hsl(var(--sport-muted))]">
        <span>⚪ {pocketedWhite} (10pts)</span>
        <span>⚫ {pocketedBlack} (5pts)</span>
        <span>🔴 {pocketedRed} (20pts)</span>
      </div>

      {/* Game over */}
      {gameOver && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="bg-[hsl(var(--sport-primary))]/20 border border-[hsl(var(--sport-primary))] rounded-xl px-6 py-3 text-center"
        >
          <div className="text-xl font-sport text-[hsl(var(--sport-primary))]">🎉 ALL POCKETED!</div>
          <div className="text-sm text-[hsl(var(--sport-text))] font-sport-body">
            Final Score: {score} in {shots} shots
          </div>
        </motion.div>
      )}

      {/* Striker pocketed warning */}
      {strikerPocketed && animating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm font-sport-body text-red-400"
        >
          ⚠️ Striker pocketed! -5 penalty
        </motion.div>
      )}

      {/* Board */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-lg overflow-hidden shadow-2xl border-4 border-amber-900/80"
      >
        <canvas
          ref={canvasRef}
          style={{ width: BOARD_SIZE, height: BOARD_SIZE, touchAction: "none" }}
          onMouseDown={(e) => { handleBaselineClick(e); handlePointerDown(e); }}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={(e) => { handleBaselineClick(e); handlePointerDown(e); }}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
        />
      </motion.div>

      {/* Instructions */}
      {!animating && !gameOver && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          className="text-xs text-[hsl(var(--sport-muted))] font-sport-body text-center max-w-[280px]"
        >
          Drag the striker to aim & set power. Click baseline area to reposition. Pocket all coins!
        </motion.p>
      )}

      {/* Controls */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={resetGame}
        className="px-5 py-2 rounded-lg bg-[hsl(var(--sport-card))] border border-[hsl(var(--sport-border))] text-[hsl(var(--sport-text))] font-sport-body font-bold text-sm shadow-sm hover:shadow-md transition-shadow"
      >
        🔄 New Game
      </motion.button>
    </div>
  );
};
