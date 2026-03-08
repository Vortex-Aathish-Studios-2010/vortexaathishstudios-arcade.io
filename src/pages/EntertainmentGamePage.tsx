import { useParams, useNavigate } from "react-router-dom";
import { entertainmentGames } from "@/lib/entertainmentData";
import { ChessGame } from "@/components/games/ChessGame";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const gameComponents: Record<string, React.FC> = {
  chess: ChessGame,
};

const EntertainmentGamePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const game = entertainmentGames.find((g) => g.id === id);
  const GameComponent = id ? gameComponents[id] : null;

  if (!game || !GameComponent) {
    navigate("/entertainment");
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="entertainment-theme min-h-screen bg-[hsl(var(--sport-bg))] p-6"
    >
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex items-center justify-between mb-8"
        >
          <button
            onClick={() => navigate("/entertainment")}
            className="flex items-center gap-2 text-[hsl(var(--sport-muted))] hover:text-[hsl(var(--sport-text))] transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-sport text-sm tracking-wider">BACK</span>
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15, type: "spring", stiffness: 150 }}
          className="text-center mb-8"
        >
          <motion.span
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.25, type: "spring", stiffness: 200 }}
            className="text-5xl mb-3 block"
          >
            {game.icon}
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="text-2xl font-sport tracking-wide text-[hsl(var(--sport-text))]"
          >
            {game.name}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="text-sm text-[hsl(var(--sport-muted))] font-sport-body mt-1"
          >
            {game.description}
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5, type: "spring", stiffness: 100 }}
        >
          <GameComponent />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default EntertainmentGamePage;
