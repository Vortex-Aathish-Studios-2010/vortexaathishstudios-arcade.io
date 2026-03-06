import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { GameInfo } from "@/lib/gameData";
import { Lock } from "lucide-react";

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      whileHover={game.available ? { scale: 1.04, y: -4 } : {}}
      onClick={() => game.available && navigate(`/game/${game.id}`)}
      className={`relative cursor-pointer rounded-xl border-2 bg-card p-6 transition-all duration-300 ${colorMap[game.color]} ${!game.available ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {!game.available && (
        <div className="absolute top-3 right-3">
          <Lock className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      <div className="text-4xl mb-3">{game.icon}</div>
      <h3 className="font-display text-lg font-bold text-foreground mb-1">{game.name}</h3>
      <p className="text-sm text-muted-foreground mb-3">{game.description}</p>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${badgeMap[game.color]}`}>
          {game.difficulty}
        </span>
        {!game.available && (
          <span className="text-xs text-muted-foreground font-display">SOON</span>
        )}
      </div>
    </motion.div>
  );
};
