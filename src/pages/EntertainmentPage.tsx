import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { entertainmentGames } from "@/lib/entertainmentData";
import { EntertainmentCard } from "@/components/EntertainmentCard";
import { Star, Brain, Trophy } from "lucide-react";
import { getEntertainmentPoints } from "@/lib/streaks";

const EntertainmentPage = () => {
  const navigate = useNavigate();
  const [points, setPoints] = useState(0);

  useEffect(() => {
    setPoints(getEntertainmentPoints());
    const interval = setInterval(() => setPoints(getEntertainmentPoints()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Shared page transition
  const pageVariants = {
    initial: { opacity: 0, scale: 0.96, filter: "blur(8px)" },
    animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
    exit: { opacity: 0, scale: 1.04, filter: "blur(12px)" },
  };

  const pageTransition = { duration: 0.45, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
      className="entertainment-theme min-h-screen bg-[hsl(var(--sport-bg))]"
    >
      {/* Decorative background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-[hsl(var(--sport-primary))]/10 blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-80 h-80 rounded-full bg-[hsl(var(--sport-secondary))]/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full bg-[hsl(var(--sport-accent))]/10 blur-3xl" />
      </div>

      <header className="relative z-10 border-b border-[hsl(var(--sport-border))]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/?mode=select")} className="text-[hsl(var(--sport-muted))] hover:text-[hsl(var(--sport-text))] transition-colors font-sport text-sm tracking-wider">
              ← BACK
            </button>
            <h1 className="text-2xl font-sport tracking-wider">
              <span className="text-[hsl(var(--sport-primary))]">ARCADE</span>
              <span className="text-[hsl(var(--sport-accent))]">.IO</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Points display */}
            <div className="flex items-center gap-2 bg-[hsl(var(--sport-card))] border border-[hsl(var(--sport-border))] rounded-lg px-3 py-1.5 shadow-sm">
              <Star className="h-3.5 w-3.5 text-[hsl(var(--sport-accent))]" />
              <span className="font-sport text-sm text-[hsl(var(--sport-text))]">{points}</span>
              <span className="font-sport-body text-[10px] text-[hsl(var(--sport-muted))]">PTS</span>
            </div>
            {/* Leaderboard */}
            <button
              onClick={() => navigate("/leaderboard")}
              className="rounded-lg px-3 py-1.5 bg-[hsl(var(--sport-card))] border border-[hsl(var(--sport-accent))]/30 hover:border-[hsl(var(--sport-accent))]/60 transition-all"
              title="Leaderboard"
            >
              <Trophy className="h-4 w-4 text-[hsl(var(--sport-accent))]" />
            </button>
            {/* Brain Arcade switch */}
            <button
              onClick={() => navigate("/?mode=brain")}
              className="rounded-lg px-3 py-1.5 bg-[hsl(var(--sport-card))] border border-[hsl(var(--sport-border))] hover:border-[hsl(var(--sport-primary))]/60 transition-all"
            >
              <Brain className="h-4 w-4 text-[hsl(var(--sport-primary))]" />
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-10">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            className="inline-block text-6xl mb-4"
          >
            🏟️
          </motion.div>
          <h2 className="text-4xl font-sport tracking-wide text-[hsl(var(--sport-text))] mb-2">
            GAME ON!
          </h2>
          <p className="text-[hsl(var(--sport-muted))] font-sport-body text-lg">
            Sports & action games
          </p>
        </motion.div>

        {/* Stadium wave decoration — same spring animation style */}
        <div className="flex justify-center gap-1 mb-10">
          {Array.from({ length: 15 }).map((_, i) => (
            <motion.div
              key={i}
              className="w-3 h-8 rounded-full"
              style={{
                backgroundColor: i % 3 === 0
                  ? "hsl(145 70% 40%)"
                  : i % 3 === 1
                  ? "hsl(210 90% 55%)"
                  : "hsl(35 95% 55%)",
              }}
              animate={{ y: [0, -12, 0] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.08,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {entertainmentGames.map((game, i) => (
            <EntertainmentCard key={game.id} game={game} index={i} />
          ))}
        </div>
      </main>
    </motion.div>
  );
};

export default EntertainmentPage;
