import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { GameInfo } from "@/lib/gameData";
import { Flame } from "lucide-react";
import { getStreak } from "@/lib/streaks";
import { sfx } from "@/lib/sounds";

const colorMap = {
  primary: "border-primary/30 hover:border-primary/60 hover:glow-primary",
  secondary: "border-secondary/30 hover:border-secondary/60 hover:glow-secondary",
  accent: "border-accent/30 hover:border-accent/60 hover:glow-accent",
};

const badgeMap = {
  primary: "bg-primary/20 text-primary",
  secondary: "bg-secondary/20 text-secondary",
  accent: "bg-accent/20 text-accent",
};

const glowColors = {
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  accent: "hsl(var(--accent))",
};

export const GameCard = ({ game, index }: { game: GameInfo; index: number }) => {
  const navigate = useNavigate();
  const streak = getStreak(game.id);
  const [clicked, setClicked] = useState(false);

  const handleClick = () => {
    if (clicked) return;
    setClicked(true);
    sfx.click();
    setTimeout(() => navigate(`/game/${game.id}`), 500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={clicked
        ? { scale: 1.3, opacity: 0, y: -20, filter: "blur(8px)" }
        : { opacity: 1, y: 0 }
      }
      transition={clicked
        ? { duration: 0.45, ease: [0.4, 0, 0.2, 1] }
        : { delay: index * 0.08, duration: 0.4 }
      }
      whileHover={!clicked ? { scale: 1.04, y: -4 } : undefined}
      onClick={handleClick}
      className={`relative cursor-pointer rounded-xl border-2 bg-card p-6 transition-shadow duration-300 ${colorMap[game.color]} overflow-hidden`}
      style={clicked ? { zIndex: 50 } : undefined}
    >
      {/* Ripple effect on click */}
      <AnimatePresence>
        {clicked && (
          <motion.div
            initial={{ scale: 0, opacity: 0.6 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 m-auto w-16 h-16 rounded-full"
            style={{ backgroundColor: glowColors[game.color] }}
          />
        )}
      </AnimatePresence>
      <div className="text-4xl mb-3 relative z-10">{game.icon}</div>
      <h3 className="font-display text-lg font-bold text-foreground mb-1 relative z-10">{game.name}</h3>
      <p className="text-sm text-muted-foreground mb-3 relative z-10">{game.description}</p>
      <div className="flex items-center justify-end relative z-10">
        {streak > 0 && (
          <div className="flex items-center gap-1 text-accent">
            <Flame className="h-3.5 w-3.5" />
            <span className="text-xs font-display font-bold">{streak}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};
