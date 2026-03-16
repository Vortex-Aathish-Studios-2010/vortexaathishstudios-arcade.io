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

  if (!game) {
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
          className="flex items-center mb-6"
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
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5, type: "spring", stiffness: 100 }}
        >
          {GameComponent ? (
            <GameComponent />
          ) : (
            <div className="text-center py-20 bg-[hsl(var(--sport-card))] rounded-2xl border border-[hsl(var(--sport-border))]">
              <div className="flex justify-center mb-6 text-[hsl(var(--sport-primary))] opacity-80">
                {game.icon}
              </div>
              <h2 className="text-3xl font-sport tracking-wider text-[hsl(var(--sport-text))] mb-3">{game.name.toUpperCase()}</h2>
              <p className="text-[hsl(var(--sport-muted))] mb-8 font-sport-body text-lg">
                This arena is currently under construction. Check back soon!
              </p>
              <button
                onClick={() => navigate("/entertainment")}
                className="px-6 py-3 rounded-lg bg-[hsl(var(--sport-primary))]/20 border border-[hsl(var(--sport-primary))]/50 text-[hsl(var(--sport-primary))] font-sport tracking-wider hover:bg-[hsl(var(--sport-primary))]/30 transition-all font-bold"
              >
                RETURN TO LOBBY
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default EntertainmentGamePage;
