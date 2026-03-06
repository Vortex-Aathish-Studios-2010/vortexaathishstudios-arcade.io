import { games } from "@/lib/gameData";
import { GameCard } from "@/components/GameCard";
import { StatsBar } from "@/components/StatsBar";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { LogOut } from "lucide-react";

const Index = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-display font-black text-glow-primary text-primary">
            BRAIN<span className="text-secondary">ARCADE</span>
          </h1>
          <div className="flex items-center gap-4">
            <StatsBar />
            <button onClick={signOut} className="text-muted-foreground hover:text-foreground transition-colors p-2">
              <LogOut className="h-5 w-5" />
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
          {games.map((game, i) =>
          <GameCard key={game.id} game={game} index={i} />
          )}
        </div>
      </main>
    </div>);

};

export default Index;