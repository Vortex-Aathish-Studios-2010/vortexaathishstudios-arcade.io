import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { games } from "@/lib/gameData";
import { GameCard } from "@/components/GameCard";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Trophy, TrendingUp, TrendingDown } from "lucide-react";
import { StatsBar } from "@/components/StatsBar";
import { getTotalWins, getTotalLosses, getPoints } from "@/lib/streaks";

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "brain" ? "brain" : "select";
  const [mode, setMode] = useState<"select" | "brain">(initialMode);
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [points, setPoints] = useState(0);

  useEffect(() => {
    setWins(getTotalWins());
    setLosses(getTotalLosses());
    setPoints(getPoints());
    const interval = setInterval(() => {
      setWins(getTotalWins());
      setLosses(getTotalLosses());
      setPoints(getPoints());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Shared page transition variants
  const pageVariants = {
    initial: { opacity: 0, scale: 0.96, filter: "blur(8px)" },
    animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
    exit: { opacity: 0, scale: 1.04, filter: "blur(12px)" },
  };

  const pageTransition = { duration: 0.45, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] };

  return (
    <AnimatePresence mode="wait">
      {mode === "select" ? (
        <motion.div
          key="select"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={pageTransition}
          className="min-h-screen bg-background flex flex-col items-center justify-center p-6"
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-display font-black text-foreground mb-2">
              <span className="text-primary text-glow-primary">ARCADE</span>
              <span className="text-secondary text-glow-secondary">.IO</span>
            </h1>
            <p className="text-muted-foreground">Choose your arena</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl w-full">
            <motion.button
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 120 }}
              whileHover={{ scale: 1.04, y: -4 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setMode("brain")}
              className="relative rounded-2xl border-2 border-primary/40 bg-card p-8 text-center hover:border-primary hover:glow-primary transition-all"
            >
              <Brain className="h-16 w-16 text-primary mx-auto mb-4" />
              <h2 className="font-display text-xl font-bold text-foreground mb-2">Brain Arcade</h2>
              <p className="text-sm text-muted-foreground">Puzzles & strategy games to train your mind</p>
            </motion.button>

            <motion.button
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 120 }}
              whileHover={{ scale: 1.04, y: -4 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/entertainment")}
              className="relative rounded-2xl border-2 border-[hsl(35,95%,55%)]/40 bg-card p-8 text-center hover:border-[hsl(35,95%,55%)] transition-all"
            >
              <div className="absolute top-0 left-0 right-0 h-[4px] flex rounded-t-2xl overflow-hidden">
                <div className="flex-1 bg-[hsl(145,70%,40%)]" />
                <div className="flex-1 bg-[hsl(210,90%,55%)]" />
                <div className="flex-1 bg-[hsl(35,95%,55%)]" />
              </div>
              <div className="h-16 w-16 mx-auto mb-4 flex items-center justify-center text-4xl">🎮</div>
              <h2 className="font-display text-xl font-bold text-foreground mb-2">Entertainment Arcade</h2>
              <p className="text-sm text-muted-foreground">Sports & action games</p>
            </motion.button>
          </div>

          {/* Leaderboard link */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/leaderboard")}
            className="mt-8 flex items-center gap-2 px-6 py-3 rounded-xl border border-accent/40 bg-card hover:border-accent hover:glow-accent transition-all"
          >
            <Trophy className="h-5 w-5 text-accent" />
            <span className="font-display text-sm text-foreground">WORLDWIDE LEADERBOARD</span>
          </motion.button>
        </motion.div>
      ) : (
        <motion.div
          key="brain"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={pageTransition}
          className="min-h-screen bg-background"
        >
          <header className="border-b border-border">
            <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => setMode("select")}
                  className="text-muted-foreground hover:text-foreground transition-colors font-display text-sm"
                >
                  ← BACK
                </motion.button>
                <h1 className="text-2xl font-display font-black">
                  <span className="text-primary text-glow-primary">ARCADE</span>
                  <span className="text-secondary text-glow-secondary">.IO</span>
                </h1>
              </div>
              <div className="flex items-center gap-3">
                {/* Wins / Losses */}
                <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
                  <span className="font-display text-xs text-primary">{wins}W</span>
                  <span className="text-muted-foreground">/</span>
                  <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                  <span className="font-display text-xs text-destructive">{losses}L</span>
                </div>
                {/* Points */}
                <StatsBar />
                {/* Leaderboard */}
                <button
                  onClick={() => navigate("/leaderboard")}
                  className="rounded-lg px-3 py-1.5 bg-card border border-accent/30 hover:border-accent/60 transition-all"
                  title="Leaderboard"
                >
                  <Trophy className="h-4 w-4 text-accent" />
                </button>
                {/* Entertainment switch */}
                <button
                  onClick={() => navigate("/entertainment")}
                  className="relative overflow-hidden rounded-lg px-3 py-1.5 bg-card border border-border hover:border-[hsl(35,95%,55%)]/60 transition-all cursor-pointer"
                  title="Entertainment Arcade"
                >
                  <div className="absolute top-0 left-0 right-0 h-[3px] flex">
                    <div className="flex-1 bg-[hsl(145,70%,40%)]" />
                    <div className="flex-1 bg-[hsl(210,90%,55%)]" />
                    <div className="flex-1 bg-[hsl(35,95%,55%)]" />
                  </div>
                  <span className="font-display text-xs text-foreground flex items-center gap-1">
                    🎮
                  </span>
                </button>
              </div>
            </div>
          </header>

          <main className="max-w-5xl mx-auto px-6 py-10">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              <h2 className="text-3xl font-display font-bold text-foreground mb-2">Choose Your Challenge</h2>
              <p className="text-muted-foreground">Pick a puzzle to test your brain power.</p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {games.map((game, i) => (
                <GameCard key={game.id} game={game} index={i} />
              ))}
            </div>
          </main>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Index;
