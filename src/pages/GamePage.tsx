import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { games } from "@/lib/gameData";
import { MemoryGame } from "@/components/games/MemoryGame";
import { SlidingPuzzle } from "@/components/games/SlidingPuzzle";
import { BlockStack } from "@/components/games/BlockStack";
import { SudokuGame } from "@/components/games/SudokuGame";
import { KonoodleGame } from "@/components/games/KonoodleGame";
import { WordSearchGame } from "@/components/games/WordSearchGame";
import { SnakeGame } from "@/components/games/SnakeGame";
import { GameTutorial } from "@/components/GameTutorial";
import { StatsBar } from "@/components/StatsBar";
import { ArrowLeft, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";
import { getStreak } from "@/lib/streaks";
import { Flame } from "lucide-react";

const gameComponents: Record<string, React.FC> = {
  memory: MemoryGame,
  sliding: SlidingPuzzle,
  tetris: BlockStack,
  sudoku: SudokuGame,
  konoodle: KonoodleGame,
  wordsearch: WordSearchGame,
  snake: SnakeGame,
};

const GamePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const game = games.find((g) => g.id === id);
  const GameComponent = id ? gameComponents[id] : null;
  const [showTutorial, setShowTutorial] = useState(true); // Auto-show tutorial

  if (!game || !GameComponent) {
    navigate("/");
    return null;
  }

  const gameStreak = id ? getStreak(id) : 0;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="font-display text-sm">BACK</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-3 py-1.5">
              <Flame className="h-4 w-4 text-accent" />
              <span className="font-display text-sm font-bold text-foreground">{gameStreak}</span>
            </div>
            <button onClick={() => setShowTutorial(true)} className="text-muted-foreground hover:text-foreground transition-colors">
              <HelpCircle className="h-5 w-5" />
            </button>
            <StatsBar />
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <span className="text-4xl mb-2 block">{game.icon}</span>
          <h1 className="text-2xl font-display font-bold text-foreground">{game.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{game.description}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <GameComponent />
        </motion.div>

        <GameTutorial game={game} open={showTutorial} onClose={() => setShowTutorial(false)} />
      </div>
    </div>
  );
};

export default GamePage;
