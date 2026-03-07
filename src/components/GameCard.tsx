import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { GameInfo } from "@/lib/gameData";
import { Flame } from "lucide-react";
import { getStreak } from "@/lib/streaks";

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

export const GameCard = ({ game, index }: { game: GameInfo; index: number }) => {
  const navigate = useNavigate();
  const streak = getStreak(game.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      whileHover={{ scale: 1.04, y: -4 }}
      onClick={() => navigate(`/game/${game.id}`)}
      className={`relative cursor-pointer rounded-xl border-2 bg-card p-6 transition-all duration-300 ${colorMap[game.color]}`}
    >
      <div className="text-4xl mb-3">{game.icon}</div>
      <h3 className="font-display text-lg font-bold text-foreground mb-1">{game.name}</h3>
      <p className="text-sm text-muted-foreground mb-3">{game.description}</p>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${badgeMap[game.color]}`}>
          {game.difficulty}
        </span>
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
