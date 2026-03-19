import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { GameInfo } from "@/lib/gameData";
import { getGameLevel } from "@/lib/streaks";
import { sfx } from "@/lib/sounds";

const colorMap = {
  primary: "border-primary/40 hover:border-primary/80 hover:shadow-[0_0_40px_hsl(var(--primary)/0.3)] bg-primary/5",
  secondary: "border-secondary/40 hover:border-secondary/80 hover:shadow-[0_0_40px_hsl(var(--secondary)/0.3)] bg-secondary/5",
  accent: "border-accent/40 hover:border-accent/80 hover:shadow-[0_0_40px_hsl(var(--accent)/0.3)] bg-accent/5",
};

const glowColors = {
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  accent: "hsl(var(--accent))",
};

const badgeColor = {
  primary: "text-primary bg-primary/10",
  secondary: "text-secondary bg-secondary/10",
  accent: "text-accent bg-accent/10",
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
      initial={{ opacity: 0, y: 40, scale: 0.88 }}
      animate={clicked
        ? { scale: 0.92, opacity: 0, filter: "blur(14px)" }
        : { opacity: 1, y: 0, scale: 1 }
      }
      transition={clicked
        ? { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
        : { delay: index * 0.07, duration: 0.5, type: "spring", stiffness: 120 }
      }
      whileHover={!clicked ? { scale: 1.05, y: -6, transition: { type: "spring", stiffness: 300 } } : undefined}
      whileTap={!clicked ? { scale: 0.97 } : undefined}
      onClick={handleClick}
      className={`relative cursor-pointer rounded-2xl border bg-card overflow-hidden transition-all duration-300 ${colorMap[game.color]} backdrop-blur-sm`}
      style={clicked ? { zIndex: 50 } : undefined}
    >
      {/* Expanding glow ring on click */}
      <AnimatePresence>
        {clicked && (
          <>
            <motion.div
              initial={{ scale: 0, opacity: 0.8 }}
              animate={{ scale: 8, opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="absolute inset-0 m-auto w-12 h-12 rounded-full z-10"
              style={{ backgroundColor: glowColors[game.color] }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Background gradient blob */}
      <div className="absolute top-0 right-0 w-32 h-32 -mt-8 -mr-8 bg-white/5 blur-3xl rounded-full pointer-events-none" />

      {/* Icon fills top section of card */}
      <motion.div
        className="relative w-full flex items-center justify-center pt-8 pb-4"
        animate={clicked ? { scale: 1.3, y: -8 } : {}}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <div className="w-20 h-20 flex items-center justify-center">
          {game.icon}
        </div>
      </motion.div>

      {/* Text content */}
      <div className="px-5 pb-5 relative z-10">
        <h3 className="font-display text-base font-bold text-foreground mb-1">{game.name}</h3>
        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{game.description}</p>
        <div className="flex items-center justify-between">
          <span className={`text-[10px] font-display px-2 py-0.5 rounded-full ${badgeColor[game.color]}`}>
            {game.difficulty}
          </span>
          {showLevel && level > 1 && (
            <span className="text-[10px] font-display text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              LVL {level}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};
