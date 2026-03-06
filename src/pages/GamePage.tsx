import { useParams, useNavigate } from "react-router-dom";
import { games } from "@/lib/gameData";
import { MemoryGame } from "@/components/games/MemoryGame";
import { Game2048 } from "@/components/games/Game2048";
import { SlidingPuzzle } from "@/components/games/SlidingPuzzle";
import { StatsBar } from "@/components/StatsBar";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const gameComponents: Record<string, React.FC> = {
  memory: MemoryGame,
  "2048": Game2048,
  sliding: SlidingPuzzle,
};

const GamePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const game = games.find((g) => g.id === id);
  const GameComponent = id ? gameComponents[id] : null;

  if (!game || !GameComponent) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="font-display text-sm">BACK</span>
          </button>
          <StatsBar />
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <span className="text-4xl mb-2 block">{game.icon}</span>
          <h1 className="text-2xl font-display font-bold text-foreground">{game.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{game.description}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <GameComponent />
        </motion.div>
      </div>
    </div>
  );
};

export default GamePage;
