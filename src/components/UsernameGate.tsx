import { useState } from "react";
import { motion } from "framer-motion";
import { User, ArrowRight } from "lucide-react";
import { Starfield } from "@/components/Starfield";
import { setPlayerName } from "@/lib/streaks";
import { toast } from "sonner";

interface UsernameGateProps {
  onComplete: (username: string) => void;
}

export const UsernameGate = ({ onComplete }: UsernameGateProps) => {
  const [username, setUsername] = useState("");

  const handleSubmit = () => {
    const trimmed = username.trim();
    if (!trimmed || trimmed.length < 2) {
      toast.error("Username must be at least 2 characters");
      return;
    }
    if (trimmed.length > 20) {
      toast.error("Username must be 20 characters or less");
      return;
    }
    setPlayerName(trimmed);
    onComplete(trimmed);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-background overflow-hidden">
      <Starfield />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="relative z-10 w-full max-w-md px-6 text-center"
      >
        <h1 className="text-4xl md:text-5xl font-display font-black mb-2">
          <span className="text-primary text-glow-primary">ARCADE</span>
          <span className="text-secondary text-glow-secondary">.IO</span>
        </h1>
        <p className="text-muted-foreground text-sm font-display tracking-wider mb-10">
          Enter your username to play
        </p>

        <div className="bg-card border border-border rounded-2xl p-8 space-y-5">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Your username"
              maxLength={20}
              autoFocus
              className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl text-foreground font-display text-sm focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-all placeholder:text-muted-foreground/50"
            />
          </div>

          <button
            onClick={handleSubmit}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-primary text-primary-foreground rounded-xl font-display font-bold text-sm hover:brightness-110 transition-all glow-primary"
          >
            LET'S PLAY
            <ArrowRight className="h-4 w-4" />
          </button>

          <p className="text-muted-foreground/40 text-[10px]">
            Your username will appear on the leaderboard and in multiplayer lobbies
          </p>
        </div>
      </motion.div>
    </div>
  );
};
