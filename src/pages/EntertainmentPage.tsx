import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { entertainmentGames } from "@/lib/entertainmentData";
import { EntertainmentCard } from "@/components/EntertainmentCard";
import { ArrowLeftRight, Trophy, XCircle } from "lucide-react";
import { getTotalWins, getTotalLosses } from "@/lib/streaks";

const EntertainmentPage = () => {
  const navigate = useNavigate();
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);

  useEffect(() => {
    setWins(getTotalWins());
    setLosses(getTotalLosses());
    const interval = setInterval(() => {
      setWins(getTotalWins());
      setLosses(getTotalLosses());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="entertainment-theme min-h-screen bg-[hsl(var(--sport-bg))]">
      {/* Decorative background stripes */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-[hsl(var(--sport-primary))]/10 blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-80 h-80 rounded-full bg-[hsl(var(--sport-secondary))]/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full bg-[hsl(var(--sport-accent))]/10 blur-3xl" />
        {/* Field lines */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-[hsl(var(--sport-primary))]/5" />
        <div className="absolute top-1/2 left-0 w-full h-px bg-[hsl(var(--sport-primary))]/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full border border-[hsl(var(--sport-primary))]/5" />
      </div>

      <header className="relative z-10 border-b border-[hsl(var(--sport-border))]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/?mode=select")} className="text-[hsl(var(--sport-muted))] hover:text-[hsl(var(--sport-text))] transition-colors font-sport text-sm tracking-wider">
              ← BACK
            </button>
            <h1 className="text-2xl font-sport tracking-wider">
              <span className="text-[hsl(var(--sport-primary))]">ENTERTAINMENT</span>
              <span className="text-[hsl(var(--sport-secondary))]"> ARCADE</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Brain Arcade switch */}
            <button
              onClick={() => navigate("/?mode=brain")}
              className="rounded-lg px-3 py-1.5 bg-gray-900 border border-gray-700 hover:border-gray-500 transition-all"
            >
              <span className="font-display text-xs text-cyan-400 flex items-center gap-1">
                🧠
              </span>
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
            Sports & action games — coming to your arena soon!
          </p>
        </motion.div>

        {/* Animated stadium wave decoration */}
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
                animationDelay: `${i * 0.1}s`,
              }}
              animate={{
                y: [0, -12, 0],
              }}
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

        <div className="mt-8 flex justify-center">
          <button
            onClick={() => navigate("/?mode=select")}
            className="flex items-center gap-2 text-[hsl(var(--sport-muted))] hover:text-[hsl(var(--sport-text))] transition-colors bg-white border border-[hsl(var(--sport-border))] rounded-xl px-5 py-2.5 shadow-sm hover:shadow-md font-sport-body"
          >
            <ArrowLeftRight className="h-4 w-4" />
            <span className="text-sm font-bold">Switch Arcade</span>
          </button>
        </div>
      </main>
    </div>
  );
};

export default EntertainmentPage;
