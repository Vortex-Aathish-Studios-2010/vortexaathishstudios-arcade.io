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
}

type Mode = "select" | "bot" | "friend";
type Player = "player1" | "player2";

const BOARD_SIZE = 360;
const POCKET_RADIUS = 18;
const COIN_RADIUS = 10;
const STRIKER_RADIUS = 13;
const FRICTION = 0.978;
const MIN_SPEED = 0.12;
const BASELINE_Y1 = BOARD_SIZE - 55; // player1 baseline (bottom)
const BASELINE_Y2 = 55; // player2 baseline (top)
const BASELINE_MIN_X = 65;
const BASELINE_MAX_X = BOARD_SIZE - 65;

const POCKET_POSITIONS = [
  { x: 28, y: 28 },
  { x: BOARD_SIZE - 28, y: 28 },
  { x: 28, y: BOARD_SIZE - 28 },
  { x: BOARD_SIZE - 28, y: BOARD_SIZE - 28 },
];

const createCoins = (): Coin[] => {
  const coins: Coin[] = [];
  const cx = BOARD_SIZE / 2;
  const cy = BOARD_SIZE / 2;

  // Queen (red) center
  coins.push({ id: "red-0", x: cx, y: cy, vx: 0, vy: 0, radius: COIN_RADIUS, color: "red", pocketed: false, points: 20 });

  // Inner ring - 6 coins
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI * 2) / 6;
    const color: "white" | "black" = i % 2 === 0 ? "white" : "black";
    coins.push({
      id: `inner-${i}`, x: cx + Math.cos(angle) * 26, y: cy + Math.sin(angle) * 26,
      vx: 0, vy: 0, radius: COIN_RADIUS, color, pocketed: false, points: color === "white" ? 10 : 5,
    });
  }

  // Outer ring - 12 coins
  for (let i = 0; i < 12; i++) {
    const angle = (i * Math.PI * 2) / 12 + Math.PI / 12;
    const color: "white" | "black" = i % 2 === 0 ? "black" : "white";
    coins.push({
      id: `outer-${i}`, x: cx + Math.cos(angle) * 48, y: cy + Math.sin(angle) * 48,
      vx: 0, vy: 0, radius: COIN_RADIUS, color, pocketed: false, points: color === "white" ? 10 : 5,
    });
  }

  return coins;
};

const createStriker = (turn: Player): Striker => ({
  x: BOARD_SIZE / 2,
  y: turn === "player1" ? BASELINE_Y1 : BASELINE_Y2,
  vx: 0, vy: 0, radius: STRIKER_RADIUS,
});

// Resolve overlap between circles
const resolveOverlap = (
  ax: number, ay: number, ar: number,
  bx: number, by: number, br: number
): { ax: number; ay: number; bx: number; by: number } | null => {
  const dx = bx - ax;
  const dy = by - ay;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const minDist = ar + br;
  if (dist >= minDist || dist === 0) return null;
  const nx = dx / dist;
  const ny = dy / dist;
  const overlap = minDist - dist;
  return {
    ax: ax - nx * overlap * 0.5,
    ay: ay - ny * overlap * 0.5,
    bx: bx + nx * overlap * 0.5,
    by: by + ny * overlap * 0.5,
  };
};

export const CarromGame = () => {
  const [mode, setMode] = useState<Mode>("select");
  const [coins, setCoins] = useState<Coin[]>(createCoins);
  const [turn, setTurn] = useState<Player>("player1");
  const [striker, setStriker] = useState<Striker>(createStriker("player1"));
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [shots, setShots] = useState(0);
  const [draggingStriker, setDraggingStriker] = useState(false); // repositioning along baseline
  const [aiming, setAiming] = useState(false); // pulling back to aim
  const [aimStart, setAimStart] = useState<{ x: number; y: number } | null>(null);
  const [aimCurrent, setAimCurrent] = useState<{ x: number; y: number } | null>(null);
  const [animating, setAnimating] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [pocketedThisTurn, setPocketedThisTurn] = useState<Coin[]>([]);
  const [botThinking, setBotThinking] = useState(false);
  const [message, setMessage] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const coinsRef = useRef(coins);
  const strikerRef = useRef(striker);
  const turnRef = useRef(turn);

  coinsRef.current = coins;
  strikerRef.current = striker;
  turnRef.current = turn;

  const resetGame = (m: Mode) => {
    setMode(m);
    setCoins(createCoins());
    setTurn("player1");
    setStriker(createStriker("player1"));
    setScores({ player1: 0, player2: 0 });
    setShots(0);
    setGameOver(false);
    setAnimating(false);
    setBotThinking(false);
    setAiming(false);
    setDraggingStriker(false);
    setMessage("");
    setPocketedThisTurn([]);
  };

  // ─── Drawing ───────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = BOARD_SIZE * dpr;
    canvas.height = BOARD_SIZE * dpr;
    ctx.scale(dpr, dpr);

    // Board surface
    ctx.fillStyle = "#C8963E";
    ctx.fillRect(0, 0, BOARD_SIZE, BOARD_SIZE);

    // Outer frame
    ctx.strokeStyle = "#5C3A1E";
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, BOARD_SIZE - 10, BOARD_SIZE - 10);

    // Inner playing boundary
    ctx.strokeStyle = "#8B691499";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(22, 22, BOARD_SIZE - 44, BOARD_SIZE - 44);

    const cx = BOARD_SIZE / 2;
    const cy = BOARD_SIZE / 2;

    // Center circles
    ctx.beginPath(); ctx.arc(cx, cy, 55, 0, Math.PI * 2);
    ctx.strokeStyle = "#6B4E0A88"; ctx.lineWidth = 1.5; ctx.stroke();

    ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.fillStyle = "#B8862222"; ctx.fill();
    ctx.strokeStyle = "#6B4E0A88"; ctx.lineWidth = 1; ctx.stroke();

    // Corner arrows (decorative lines toward pockets)
    const arrowLen = 40;
    const arrowOff = 22;
    [
      [arrowOff, arrowOff, 1, 1], [BOARD_SIZE - arrowOff, arrowOff, -1, 1],
      [arrowOff, BOARD_SIZE - arrowOff, 1, -1], [BOARD_SIZE - arrowOff, BOARD_SIZE - arrowOff, -1, -1],
    ].forEach(([x, y, dx, dy]) => {
      ctx.beginPath(); ctx.moveTo(x as number, y as number);
      ctx.lineTo((x as number) + (dx as number) * arrowLen, (y as number) + (dy as number) * arrowLen);
      ctx.strokeStyle = "#6B4E0A55"; ctx.lineWidth = 1.5; ctx.stroke();
    });

    // Baselines
    const drawBaseline = (y: number, active: boolean) => {
      ctx.save();
      ctx.setLineDash(active ? [] : [4, 4]);
      ctx.beginPath();
      ctx.moveTo(BASELINE_MIN_X, y);
      ctx.lineTo(BASELINE_MAX_X, y);
      ctx.strokeStyle = active ? "#22c55e66" : "#6B4E0A44";
      ctx.lineWidth = active ? 2 : 1;
      ctx.stroke();

      // Small circles at ends of baseline
      if (active) {
        [BASELINE_MIN_X, BASELINE_MAX_X].forEach((bx) => {
          ctx.beginPath(); ctx.arc(bx, y, 3, 0, Math.PI * 2);
          ctx.fillStyle = "#22c55e44"; ctx.fill();
        });
      }
      ctx.restore();
    };

    drawBaseline(BASELINE_Y1, turn === "player1");
    drawBaseline(BASELINE_Y2, turn === "player2");

    // Pockets
    POCKET_POSITIONS.forEach(({ x, y }) => {
      ctx.beginPath(); ctx.arc(x, y, POCKET_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = "#1a0e05"; ctx.fill();
      ctx.strokeStyle = "#3d2510"; ctx.lineWidth = 2.5; ctx.stroke();
    });

    // Coins
    coinsRef.current.forEach((coin) => {
      if (coin.pocketed) return;
      // Shadow
      ctx.beginPath(); ctx.arc(coin.x + 1, coin.y + 2, coin.radius, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,0.15)"; ctx.fill();
      // Body
      ctx.beginPath(); ctx.arc(coin.x, coin.y, coin.radius, 0, Math.PI * 2);
      if (coin.color === "white") { ctx.fillStyle = "#F0E8D0"; ctx.strokeStyle = "#B8A880"; }
      else if (coin.color === "black") { ctx.fillStyle = "#1a1a1a"; ctx.strokeStyle = "#3a3a3a"; }
      else { ctx.fillStyle = "#DC2626"; ctx.strokeStyle = "#991B1B"; }
      ctx.fill(); ctx.lineWidth = 1.2; ctx.stroke();
      // Inner ring
      ctx.beginPath(); ctx.arc(coin.x, coin.y, coin.radius * 0.5, 0, Math.PI * 2);
      ctx.strokeStyle = coin.color === "black" ? "#4a4a4a" : coin.color === "red" ? "#FCA5A5" : "#C8B888";
      ctx.lineWidth = 0.7; ctx.stroke();
    });

    // Striker shadow + body
    const s = strikerRef.current;
    ctx.beginPath(); ctx.arc(s.x + 1, s.y + 2, s.radius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.2)"; ctx.fill();
    ctx.beginPath(); ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    const strikerGrad = ctx.createRadialGradient(s.x - 2, s.y - 2, 1, s.x, s.y, s.radius);
    strikerGrad.addColorStop(0, "#F5E8C8");
    strikerGrad.addColorStop(1, "#C8A868");
    ctx.fillStyle = strikerGrad; ctx.fill();
    ctx.strokeStyle = "#8B6914"; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.arc(s.x, s.y, s.radius * 0.35, 0, Math.PI * 2);
    ctx.strokeStyle = "#A08050"; ctx.lineWidth = 1; ctx.stroke();

    // Aim line
    if (aiming && aimStart && aimCurrent) {
      const dx = aimStart.x - aimCurrent.x;
      const dy = aimStart.y - aimCurrent.y;
      const power = Math.min(Math.sqrt(dx * dx + dy * dy), 160);
      const angle = Math.atan2(dy, dx);

      // Dotted aim line
      const lineLen = power * 1.2;
      ctx.save();
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x + Math.cos(angle) * lineLen, s.y + Math.sin(angle) * lineLen);
      ctx.strokeStyle = `rgba(34, 197, 94, ${0.3 + power / 300})`;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // Power indicator circle
      const pw = power / 160;
      ctx.beginPath();
      ctx.arc(s.x + Math.cos(angle) * lineLen, s.y + Math.sin(angle) * lineLen, 5, 0, Math.PI * 2);
      ctx.fillStyle = pw > 0.7 ? "#ef4444" : pw > 0.4 ? "#f59e0b" : "#22c55e";
      ctx.fill();

      // Pull-back indicator at striker
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius + 3 + power * 0.05, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(220, 38, 38, ${0.2 + pw * 0.4})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }, [aiming, aimStart, aimCurrent, turn]);

  useEffect(() => { draw(); }, [draw, coins, striker]);

  // ─── Input helpers ─────────────────────
  const getCanvasPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const sx = BOARD_SIZE / rect.width;
    const sy = BOARD_SIZE / rect.height;
    if ("touches" in e) {
      return { x: (e.touches[0].clientX - rect.left) * sx, y: (e.touches[0].clientY - rect.top) * sy };
    }
    return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
  };

  const isBotTurn = mode === "bot" && turn === "player2";

  const fireStriker = useCallback((vx: number, vy: number) => {
    setStriker((s) => ({ ...s, vx, vy }));
    setShots((s) => s + 1);
    setAnimating(true);
    setPocketedThisTurn([]);
  }, []);

  // ─── Pointer handlers ─────────────────
  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (animating || gameOver || isBotTurn || botThinking) return;
    const pos = getCanvasPos(e);
    const baseY = turn === "player1" ? BASELINE_Y1 : BASELINE_Y2;
    const dx = pos.x - striker.x;
    const dy = pos.y - striker.y;
    const distToStriker = Math.sqrt(dx * dx + dy * dy);

    // If clicking near baseline but not on striker → reposition
    if (Math.abs(pos.y - baseY) < 25 && distToStriker > striker.radius * 2) {
      const newX = Math.max(BASELINE_MIN_X, Math.min(BASELINE_MAX_X, pos.x));
      setStriker((s) => ({ ...s, x: newX, y: baseY }));
      setDraggingStriker(true);
      return;
    }

    // If clicking on/near striker → start aiming
    if (distToStriker < striker.radius * 3.5) {
      setAiming(true);
      setAimStart(pos);
      setAimCurrent(pos);
    }
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const pos = getCanvasPos(e);

    if (draggingStriker) {
      const baseY = turn === "player1" ? BASELINE_Y1 : BASELINE_Y2;
      const newX = Math.max(BASELINE_MIN_X, Math.min(BASELINE_MAX_X, pos.x));
      setStriker((s) => ({ ...s, x: newX, y: baseY }));
      return;
    }

    if (aiming) {
      setAimCurrent(pos);
    }
  };

  const handlePointerUp = () => {
    if (draggingStriker) {
      setDraggingStriker(false);
      return;
    }

    if (!aiming || !aimStart || !aimCurrent) {
      setAiming(false);
      return;
    }

    const dx = aimStart.x - aimCurrent.x;
    const dy = aimStart.y - aimCurrent.y;
    const power = Math.min(Math.sqrt(dx * dx + dy * dy), 160);

    if (power < 10) {
      setAiming(false); setAimStart(null); setAimCurrent(null);
      return;
    }

    const angle = Math.atan2(dy, dx);
    const speed = power * 0.13;
    fireStriker(Math.cos(angle) * speed, Math.sin(angle) * speed);
    setAiming(false); setAimStart(null); setAimCurrent(null);
  };

  // ─── Bot AI ────────────────────────────
  useEffect(() => {
    if (!isBotTurn || animating || gameOver) return;
    setBotThinking(true);

    const timer = setTimeout(() => {
      const remaining = coinsRef.current.filter((c) => !c.pocketed);
      if (remaining.length === 0) { setBotThinking(false); return; }

      const s = { ...strikerRef.current };

      // Try multiple striker positions and pick the best shot
      let bestVx = 0;
      let bestVy = 0;
      let bestScore = -Infinity;
      let bestStrikerX = s.x;

      for (let attempt = 0; attempt < 15; attempt++) {
        const testX = BASELINE_MIN_X + Math.random() * (BASELINE_MAX_X - BASELINE_MIN_X);
        const testY = BASELINE_Y2;

        for (const coin of remaining) {
          for (const pocket of POCKET_POSITIONS) {
            // Direction from coin to pocket
            const cpx = pocket.x - coin.x;
            const cpy = pocket.y - coin.y;
            const cpDist = Math.sqrt(cpx * cpx + cpy * cpy);
            if (cpDist < 1) continue;

            // Point behind coin to hit it toward pocket
            const hitX = coin.x - (cpx / cpDist) * (coin.radius + STRIKER_RADIUS + 1);
            const hitY = coin.y - (cpy / cpDist) * (coin.radius + STRIKER_RADIUS + 1);

            // Direction from striker to hit point
            const sx = hitX - testX;
            const sy = hitY - testY;
            const sDist = Math.sqrt(sx * sx + sy * sy);
            if (sDist < 20) continue;

            // Check if path is roughly clear (no coins blocking)
            let blocked = false;
            for (const other of remaining) {
              if (other.id === coin.id) continue;
              // Distance from other coin to the line (striker → hitpoint)
              const nx = sx / sDist;
              const ny = sy / sDist;
              const ox = other.x - testX;
              const oy = other.y - testY;
              const proj = ox * nx + oy * ny;
              if (proj > 0 && proj < sDist) {
                const perpDist = Math.abs(ox * ny - oy * nx);
                if (perpDist < other.radius + STRIKER_RADIUS + 2) {
                  blocked = true;
                  break;
                }
              }
            }

            // Score this shot
            let score = coin.points * 2;
            score -= sDist * 0.02; // prefer closer
            score -= cpDist * 0.01; // prefer closer to pocket
            if (blocked) score -= 50;
            // Bonus if hit point is reachable (not behind walls)
            if (hitX > 20 && hitX < BOARD_SIZE - 20 && hitY > 20 && hitY < BOARD_SIZE - 20) {
              score += 10;
            }

            if (score > bestScore) {
              bestScore = score;
              bestStrikerX = testX;
              const angle = Math.atan2(sy, sx);
              const power = Math.min(6 + Math.random() * 7, 14);
              bestVx = Math.cos(angle) * power;
              bestVy = Math.sin(angle) * power;
            }
          }
        }
      }

      // If no good shot found, shoot toward center
      if (bestScore < -40) {
        const angle = Math.PI / 2 + (Math.random() - 0.5) * 0.5; // roughly downward
        bestVx = Math.cos(angle) * 8;
        bestVy = Math.sin(angle) * 8;
        bestStrikerX = BASELINE_MIN_X + Math.random() * (BASELINE_MAX_X - BASELINE_MIN_X);
      }

      // Reposition striker, then fire
      setStriker((prev) => ({ ...prev, x: bestStrikerX, y: BASELINE_Y2 }));

      setTimeout(() => {
        fireStriker(bestVx, bestVy);
        setBotThinking(false);
      }, 500);
    }, 700);

    return () => clearTimeout(timer);
  }, [turn, mode, animating, gameOver, isBotTurn, fireStriker]);

  // ─── Physics ───────────────────────────
  useEffect(() => {
    if (!animating) return;

    const simulate = () => {
      let allStopped = true;
      const cs = coinsRef.current.map((c) => ({ ...c }));
      const s = { ...strikerRef.current };
      const newPocketed: Coin[] = [];
      let sPocketed = false;

      // Move striker
      if (Math.abs(s.vx) > MIN_SPEED || Math.abs(s.vy) > MIN_SPEED) {
        s.x += s.vx; s.y += s.vy;
        s.vx *= FRICTION; s.vy *= FRICTION;
        allStopped = false;
        // Walls
        if (s.x - s.radius < 12) { s.x = 12 + s.radius; s.vx = Math.abs(s.vx) * 0.6; }
        if (s.x + s.radius > BOARD_SIZE - 12) { s.x = BOARD_SIZE - 12 - s.radius; s.vx = -Math.abs(s.vx) * 0.6; }
        if (s.y - s.radius < 12) { s.y = 12 + s.radius; s.vy = Math.abs(s.vy) * 0.6; }
        if (s.y + s.radius > BOARD_SIZE - 12) { s.y = BOARD_SIZE - 12 - s.radius; s.vy = -Math.abs(s.vy) * 0.6; }
        // Pockets
        for (const p of POCKET_POSITIONS) {
          if (Math.sqrt((s.x - p.x) ** 2 + (s.y - p.y) ** 2) < POCKET_RADIUS - 3) {
            sPocketed = true; break;
          }
        }
      } else { s.vx = 0; s.vy = 0; }

      // Move coins
      for (const coin of cs) {
        if (coin.pocketed) continue;
        if (Math.abs(coin.vx) > MIN_SPEED || Math.abs(coin.vy) > MIN_SPEED) {
          coin.x += coin.vx; coin.y += coin.vy;
          coin.vx *= FRICTION; coin.vy *= FRICTION;
          allStopped = false;
        } else { coin.vx = 0; coin.vy = 0; }

        // Walls
        if (coin.x - coin.radius < 12) { coin.x = 12 + coin.radius; coin.vx = Math.abs(coin.vx) * 0.6; }
        if (coin.x + coin.radius > BOARD_SIZE - 12) { coin.x = BOARD_SIZE - 12 - coin.radius; coin.vx = -Math.abs(coin.vx) * 0.6; }
        if (coin.y - coin.radius < 12) { coin.y = 12 + coin.radius; coin.vy = Math.abs(coin.vy) * 0.6; }
        if (coin.y + coin.radius > BOARD_SIZE - 12) { coin.y = BOARD_SIZE - 12 - coin.radius; coin.vy = -Math.abs(coin.vy) * 0.6; }

        // Pockets
        for (const p of POCKET_POSITIONS) {
          if (Math.sqrt((coin.x - p.x) ** 2 + (coin.y - p.y) ** 2) < POCKET_RADIUS - 3) {
            coin.pocketed = true; coin.vx = 0; coin.vy = 0;
            newPocketed.push(coin); break;
          }
        }

        // Striker-coin collision
        if (!coin.pocketed && !sPocketed) {
          const res = resolveOverlap(s.x, s.y, s.radius, coin.x, coin.y, coin.radius);
          if (res) {
            s.x = res.ax; s.y = res.ay; coin.x = res.bx; coin.y = res.by;
            const nx = (coin.x - s.x); const ny = (coin.y - s.y);
            const d = Math.sqrt(nx * nx + ny * ny) || 1;
            const ux = nx / d; const uy = ny / d;
            const dvx = s.vx - coin.vx; const dvy = s.vy - coin.vy;
            const dot = dvx * ux + dvy * uy;
            if (dot > 0) {
              coin.vx += ux * dot * 0.85; coin.vy += uy * dot * 0.85;
              s.vx -= ux * dot * 0.85; s.vy -= uy * dot * 0.85;
            }
            allStopped = false;
          }
        }
      }

      // Coin-coin collisions
      for (let i = 0; i < cs.length; i++) {
        if (cs[i].pocketed) continue;
        for (let j = i + 1; j < cs.length; j++) {
          if (cs[j].pocketed) continue;
          const a = cs[i]; const b = cs[j];
          const res = resolveOverlap(a.x, a.y, a.radius, b.x, b.y, b.radius);
          if (res) {
            a.x = res.ax; a.y = res.ay; b.x = res.bx; b.y = res.by;
            const nx = b.x - a.x; const ny = b.y - a.y;
            const d = Math.sqrt(nx * nx + ny * ny) || 1;
            const ux = nx / d; const uy = ny / d;
            const dvx = a.vx - b.vx; const dvy = a.vy - b.vy;
            const dot = dvx * ux + dvy * uy;
            if (dot > 0) {
              a.vx -= ux * dot * 0.5; a.vy -= uy * dot * 0.5;
              b.vx += ux * dot * 0.5; b.vy += uy * dot * 0.5;
            }
            allStopped = false;
          }
        }
      }

      strikerRef.current = s;
      coinsRef.current = cs;
      setStriker({ ...s });
      setCoins([...cs]);

      if (newPocketed.length > 0) {
        const currentTurn = turnRef.current;
        const earned = newPocketed.reduce((sum, c) => sum + c.points, 0);
        setScores((prev) => ({ ...prev, [currentTurn]: prev[currentTurn] + earned }));
        setPocketedThisTurn((prev) => [...prev, ...newPocketed]);
      }

      if (allStopped) {
        setAnimating(false);
        const currentTurn = turnRef.current;

        if (sPocketed) {
          setScores((prev) => ({ ...prev, [currentTurn]: Math.max(0, prev[currentTurn] - 5) }));
          setMessage("Striker pocketed! -5 penalty");
          setTimeout(() => setMessage(""), 2000);
        }

        const remaining = cs.filter((c) => !c.pocketed);
        if (remaining.length === 0) {
          setGameOver(true);
          return;
        }

        // Switch turns
        const nextTurn: Player = currentTurn === "player1" ? "player2" : "player1";
        setTurn(nextTurn);
        setStriker(createStriker(nextTurn));
        setPocketedThisTurn([]);
      } else {
        animFrameRef.current = requestAnimationFrame(simulate);
      }
    };

    animFrameRef.current = requestAnimationFrame(simulate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [animating]);

  // ─── Mode select screen ────────────────
  if (mode === "select") {
    return (
      <div className="flex flex-col items-center gap-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }} className="text-7xl">
          🎯
        </motion.div>
        <h2 className="font-sport text-2xl tracking-wide text-[hsl(var(--sport-text))]">CARROMS</h2>
        <div className="flex gap-4">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => resetGame("bot")}
            className="px-6 py-3 rounded-xl bg-[hsl(var(--sport-primary))] text-[hsl(var(--sport-bg))] font-sport-body font-bold text-lg shadow-lg hover:shadow-xl transition-shadow">
            🤖 vs Bot
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => resetGame("friend")}
            className="px-6 py-3 rounded-xl bg-[hsl(var(--sport-secondary))] text-[hsl(var(--sport-bg))] font-sport-body font-bold text-lg shadow-lg hover:shadow-xl transition-shadow">
            👥 vs Friend
          </motion.button>
        </div>
        <p className="text-xs text-[hsl(var(--sport-muted))] font-sport-body text-center max-w-[260px]">
          Drag along baseline to position striker. Pull back on striker to aim & shoot!
        </p>
      </div>
    );
  }

  // ─── Game UI ───────────────────────────
  const remaining = coins.filter((c) => !c.pocketed);
  const currentLabel = turn === "player1"
    ? (mode === "bot" ? "You" : "Player 1")
    : (mode === "bot" ? "Bot" : "Player 2");

  const winner = gameOver
    ? scores.player1 > scores.player2
      ? (mode === "bot" ? "You Win! 🎉" : "Player 1 Wins! 🎉")
      : scores.player2 > scores.player1
      ? (mode === "bot" ? "Bot Wins! 🤖" : "Player 2 Wins! 🎉")
      : "It's a Draw!"
    : "";

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Scores bar */}
      <div className="flex items-center gap-4 bg-[hsl(var(--sport-card))] rounded-xl px-4 py-2.5 shadow-md border border-[hsl(var(--sport-border))] w-full max-w-[360px]">
        <div className={`text-center flex-1 ${turn === "player1" ? "opacity-100" : "opacity-40"}`}>
          <div className="text-[10px] text-[hsl(var(--sport-muted))] font-sport-body uppercase">{mode === "bot" ? "You" : "P1"}</div>
          <div className="text-xl font-sport text-[hsl(var(--sport-primary))]">{scores.player1}</div>
        </div>
        <div className="text-[hsl(var(--sport-muted))] font-sport text-xs">VS</div>
        <div className={`text-center flex-1 ${turn === "player2" ? "opacity-100" : "opacity-40"}`}>
          <div className="text-[10px] text-[hsl(var(--sport-muted))] font-sport-body uppercase">{mode === "bot" ? "Bot" : "P2"}</div>
          <div className="text-xl font-sport text-[hsl(var(--sport-secondary))]">{scores.player2}</div>
        </div>
        <div className="w-px h-7 bg-[hsl(var(--sport-border))]" />
        <div className="text-center">
          <div className="text-[10px] text-[hsl(var(--sport-muted))] font-sport-body">LEFT</div>
          <div className="text-xl font-sport text-[hsl(var(--sport-accent))]">{remaining.length}</div>
        </div>
      </div>

      {/* Status */}
      <div className="text-xs font-sport-body text-[hsl(var(--sport-muted))]">
        {botThinking ? "🤖 Bot is aiming..." : gameOver ? "" : `${currentLabel}'s turn`}
        {message && <span className="ml-2 text-red-400">{message}</span>}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 text-[10px] font-sport-body text-[hsl(var(--sport-muted))]">
        <span>⚪ 10pts</span><span>⚫ 5pts</span><span>🔴 20pts</span>
      </div>

      {gameOver && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
          className="bg-[hsl(var(--sport-primary))]/20 border border-[hsl(var(--sport-primary))] rounded-xl px-6 py-3 text-center">
          <div className="text-lg font-sport text-[hsl(var(--sport-primary))]">{winner}</div>
          <div className="text-xs text-[hsl(var(--sport-text))] font-sport-body">{scores.player1} vs {scores.player2} in {shots} shots</div>
        </motion.div>
      )}

      {/* Board */}
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="rounded-lg overflow-hidden shadow-2xl border-4 border-amber-900/80 cursor-crosshair">
        <canvas ref={canvasRef} style={{ width: BOARD_SIZE, height: BOARD_SIZE, touchAction: "none" }}
          onMouseDown={handlePointerDown} onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp} onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown} onTouchMove={handlePointerMove} onTouchEnd={handlePointerUp}
        />
      </motion.div>

      {/* Controls */}
      <div className="flex gap-3 mt-1">
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => resetGame(mode)}
          className="px-4 py-2 rounded-lg bg-[hsl(var(--sport-card))] border border-[hsl(var(--sport-border))] text-[hsl(var(--sport-text))] font-sport-body font-bold text-sm shadow-sm">
          🔄 New Game
        </motion.button>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => resetGame("select")}
          className="px-4 py-2 rounded-lg bg-[hsl(var(--sport-card))] border border-[hsl(var(--sport-border))] text-[hsl(var(--sport-text))] font-sport-body font-bold text-sm shadow-sm">
          🔙 Mode
        </motion.button>
      </div>
    </div>
  );
};
