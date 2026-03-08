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
import { StatsBar } from "@/components/StatsBar";
import { MultiplayerLobby, MultiplayerResult } from "@/components/MultiplayerLobby";
import { ArrowLeft, HelpCircle, Flame, Users } from "lucide-react";
import { motion } from "framer-motion";
import { getStreak, isTutorialShown, markTutorialShown, getGameLevel } from "@/lib/streaks";
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

// Games that manage their own level internally or don't use levels
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
  const gameStreak = id ? getStreak(id) : 0;

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
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => navigate("/?mode=brain")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="font-display text-sm">BACK</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-3 py-1.5">
              <Flame className="h-4 w-4 text-accent" />
              <span className="font-display text-sm font-bold text-foreground">{gameStreak}</span>
            </div>
            <button onClick={() => setShowMultiplayer(true)} className="flex items-center gap-1.5 bg-card border border-secondary/30 rounded-lg px-3 py-1.5 text-secondary hover:border-secondary/60 hover:glow-secondary transition-all">
              <Users className="h-4 w-4" />
              <span className="font-display text-xs">VS</span>
            </button>
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
          {showLevel && (
            <span className="text-xs font-display text-primary mt-1 block">Level {level}</span>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
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
    </div>
  );
};

export default GamePage;
