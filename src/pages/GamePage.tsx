import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { games } from "@/lib/gameData";
import { MemoryGame } from "@/components/games/MemoryGame";
import { SlidingPuzzle } from "@/components/games/SlidingPuzzle";
import { BlockStack } from "@/components/games/BlockStack";
import { SudokuGame } from "@/components/games/SudokuGame";
import { KonoodleGame } from "@/components/games/KonoodleGame";
import { WordSearchGame } from "@/components/games/WordSearchGame";
import { SnakeGame } from "@/components/games/SnakeGame";
import { TicTacToeGame } from "@/components/games/TicTacToeGame";
import { GameTutorial } from "@/components/GameTutorial";
import { MultiplayerLobby, MultiplayerResult } from "@/components/MultiplayerLobby";
import { ArrowLeft, HelpCircle, Users } from "lucide-react";
import { motion } from "framer-motion";
import { isTutorialShown, markTutorialShown, getGameLevel } from "@/lib/streaks";
import { reportScore } from "@/lib/multiplayer";

const gameComponents: Record<string, React.FC<{ level?: number; onComplete?: (score: number) => void }>> = {
  memory: MemoryGame,
  sliding: SlidingPuzzle,
  tetris: BlockStack,
  sudoku: SudokuGame,
  konoodle: KonoodleGame,
  wordsearch: WordSearchGame,
  snake: SnakeGame,
  tictactoe: TicTacToeGame,
};

const HIDE_LEVEL_IDS = new Set(["tetris", "snake", "konoodle", "tictactoe"]);

const GamePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const game = games.find((g) => g.id === id);
  const GameComponent = id ? gameComponents[id] : null;

  const [showTutorial, setShowTutorial] = useState(() => id ? !isTutorialShown(id) : false);
  const [showMultiplayer, setShowMultiplayer] = useState(false);
  const [multiplayerRoom, setMultiplayerRoom] = useState<{ roomId: string; playerId: string } | null>(null);
  const [showResult, setShowResult] = useState(false);
  const level = id ? getGameLevel(id) : 1;

  const handleTutorialClose = useCallback(() => {
    setShowTutorial(false);
    if (id) markTutorialShown(id);
  }, [id]);

  const handleMultiplayerStart = useCallback((roomId: string, playerId: string, _diff: number) => {
    setMultiplayerRoom({ roomId, playerId });
    setShowMultiplayer(false);
  }, []);

  const handleGameComplete = useCallback((score: number) => {
    if (multiplayerRoom) {
      reportScore(multiplayerRoom.roomId, multiplayerRoom.playerId, score);
      setShowResult(true);
    }
  }, [multiplayerRoom]);

  if (!game || !GameComponent) {
    navigate("/");
    return null;
  }

  const showLevel = id && !HIDE_LEVEL_IDS.has(id);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, filter: "blur(8px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
      className="min-h-screen bg-background p-6"
    >
      <div className="max-w-lg mx-auto">
        {/* Top bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex items-center justify-between mb-6"
        >
          <button
            onClick={() => navigate("/?mode=brain")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-display text-sm">BACK</span>
          </button>
          <div className="flex items-center gap-2">
            {showLevel && (
              <span className="text-xs font-display text-primary bg-primary/10 border border-primary/20 rounded-lg px-3 py-1.5">
                LVL {level}
              </span>
            )}
            <button
              onClick={() => setShowMultiplayer(true)}
              className="flex items-center gap-1.5 bg-card border border-secondary/30 rounded-lg px-3 py-1.5 text-secondary hover:border-secondary/60 hover:glow-secondary transition-all"
            >
              <Users className="h-4 w-4" />
              <span className="font-display text-xs">VS</span>
            </button>
            <button
              onClick={() => setShowTutorial(true)}
              className="text-muted-foreground hover:text-foreground transition-colors p-1.5"
            >
              <HelpCircle className="h-5 w-5" />
            </button>
          </div>
        </motion.div>

        {/* Game title */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="text-center mb-6"
        >
          <span className="text-4xl mb-2 block">{game.icon}</span>
          <h1 className="text-xl font-display font-bold text-foreground">{game.name}</h1>
        </motion.div>

        {/* Game component */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5, type: "spring", stiffness: 120 }}
        >
          <GameComponent level={level} onComplete={multiplayerRoom ? handleGameComplete : undefined} />
        </motion.div>

        <GameTutorial game={game} open={showTutorial} onClose={handleTutorialClose} />

        {showMultiplayer && (
          <MultiplayerLobby
            gameId={game.id}
            onStartMultiplayer={handleMultiplayerStart}
            onClose={() => setShowMultiplayer(false)}
          />
        )}

        {showResult && multiplayerRoom && (
          <MultiplayerResult
            roomId={multiplayerRoom.roomId}
            playerId={multiplayerRoom.playerId}
            gameId={game.id}
            onClose={() => { setShowResult(false); setMultiplayerRoom(null); }}
          />
        )}
      </div>
    </motion.div>
  );
};

export default GamePage;
