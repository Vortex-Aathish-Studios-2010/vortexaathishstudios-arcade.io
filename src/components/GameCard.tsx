import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { GameInfo } from "@/lib/gameData";
import { getGameLevel } from "@/lib/streaks";
import { sfx } from "@/lib/sounds";

const colorMap = {
  primary: "border-primary/40 hover:border-primary/80 hover:shadow-[0_0_30px_hsl(var(--primary)/0.25)] bg-primary/5",
  secondary: "border-secondary/40 hover:border-secondary/80 hover:shadow-[0_0_30px_hsl(var(--secondary)/0.25)] bg-secondary/5",
  accent: "border-accent/40 hover:border-accent/80 hover:shadow-[0_0_30px_hsl(var(--accent)/0.25)] bg-accent/5",
};

const iconGlow = {
  primary: "bg-primary/20 text-primary shadow-[0_0_15px_hsl(var(--primary)/0.4)]",
  secondary: "bg-secondary/20 text-secondary shadow-[0_0_15px_hsl(var(--secondary)/0.4)]",
  accent: "bg-accent/20 text-accent shadow-[0_0_15px_hsl(var(--accent)/0.4)]",
};

const glowColors = {
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  accent: "hsl(var(--accent))",
};

const HIDE_LEVEL_IDS = new Set(["tetris", "snake", "konoodle", "tictactoe"]);

export const GameCard = ({ game, index }: { game: GameInfo; index: number }) => {
  const navigate = useNavigate();
  const level = getGameLevel(game.id);
  const showLevel = !HIDE_LEVEL_IDS.has(game.id);
  const [clicked, setClicked] = useState(false);

  const handleClick = () => {
    if (clicked) return;
    setClicked(true);
    sfx.click();
    setTimeout(() => navigate(`/game/${game.id}`), 600);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={clicked
        ? { scale: 0.95, opacity: 0, y: 0, filter: "blur(12px)" }
        : { opacity: 1, y: 0, scale: 1 }
      }
      transition={clicked
        ? { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
        : { delay: index * 0.07, duration: 0.5, type: "spring", stiffness: 120 }
      }
      whileHover={!clicked ? { scale: 1.06, y: -6, transition: { type: "spring", stiffness: 300 } } : undefined}
      whileTap={!clicked ? { scale: 0.97 } : undefined}
      onClick={handleClick}
      className={`relative cursor-pointer rounded-2xl border bg-card p-6 transition-all duration-300 ${colorMap[game.color]} overflow-hidden backdrop-blur-sm`}
      style={clicked ? { zIndex: 50 } : undefined}
    >
      {/* Expanding glow ring on click */}
      <AnimatePresence>
        {clicked && (
          <>
            <motion.div
              initial={{ scale: 0, opacity: 0.7 }}
              animate={{ scale: 6, opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="absolute inset-0 m-auto w-12 h-12 rounded-full"
              style={{ backgroundColor: glowColors[game.color] }}
            />
            <motion.div
              initial={{ scale: 1, opacity: 1 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute inset-0 rounded-xl border-2"
              style={{ borderColor: glowColors[game.color], boxShadow: `0 0 30px ${glowColors[game.color]}` }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Card Background Pattern (Subtle radial gradient) */}
      <div className="absolute top-0 right-0 -mt-16 -mr-16 w-32 h-32 bg-white/5 blur-3xl rounded-full pointer-events-none" />

      {/* Icon */}
      <motion.div
        className={`w-14 h-14 rounded-2xl mb-4 relative z-10 flex items-center justify-center text-3xl ${iconGlow[game.color]} backdrop-blur-md`}
        animate={clicked ? { scale: 1.4, y: -10 } : {}}
        transition={{ type: "spring", stiffness: 300 }}
      >
        {game.icon}
      </motion.div>
      <h3 className="font-display text-lg font-bold text-foreground mb-1 relative z-10">{game.name}</h3>
      <p className="text-sm text-muted-foreground mb-3 relative z-10">{game.description}</p>
      <div className="flex items-center justify-end relative z-10">
        {showLevel && level > 1 && (
          <span className="text-[10px] font-display text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            LVL {level}
          </span>
        )}
      </div>
    </motion.div>
  );
};
