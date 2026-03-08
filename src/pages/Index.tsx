import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { games } from "@/lib/gameData";
import { GameCard } from "@/components/GameCard";
import { motion } from "framer-motion";
import { Brain } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "brain" ? "brain" : "select";
  const [mode, setMode] = useState<"select" | "brain">(initialMode);

  if (mode === "select") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-display font-black text-foreground mb-2">
            <span className="text-primary text-glow-primary">BRAIN</span><span className="text-secondary text-glow-secondary">ARCADE</span>
          </h1>
          <p className="text-muted-foreground">Choose your arena</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl w-full">
          <motion.button
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.04, y: -4 }}
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
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.04, y: -4 }}
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setMode("select")} className="text-muted-foreground hover:text-foreground transition-colors font-display text-sm">← BACK</button>
            <h1 className="text-2xl font-display font-black text-glow-primary text-primary">
              BRAIN<span className="text-secondary">ARCADE</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Entertainment Arcade button */}
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
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h2 className="text-3xl font-display font-bold text-foreground mb-2">Choose Your Challenge</h2>
          <p className="text-muted-foreground">Pick a puzzle to test your brain power.</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {games.map((game, i) => (
            <GameCard key={game.id} game={game} index={i} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default Index;
