import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Trophy, ArrowLeft, Medal, Crown, LogIn, LogOut, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getTotalWins, getTotalLosses, getPlayerName, setPlayerName } from "@/lib/streaks";
import { useAuth } from "@/hooks/useAuth";
import { Starfield } from "@/components/Starfield";

interface LeaderboardEntry {
  id: string;
  player_name: string;
  wins: number;
  losses: number;
}

const LeaderboardPage = () => {
  const navigate = useNavigate();
  const { user, signInWithGoogle, signOut } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const currentPlayerName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "";

  const fetchLeaderboard = async () => {
    const { data, error } = await supabase
      .from("leaderboard")
      .select("*")
      .order("wins", { ascending: false })
      .limit(50);

    if (error) {
      toast.error("Failed to load leaderboard");
      console.error(error);
    } else {
      setEntries(data || []);
    }
    setLoading(false);
  };

  // Auto-sync when user is logged in
  useEffect(() => {
    if (user && currentPlayerName) {
      setPlayerName(currentPlayerName);
      syncScore();
    }
  }, [user]);

  const syncScore = async () => {
    if (!currentPlayerName.trim()) return;
    const wins = getTotalWins();
    const losses = getTotalLosses();

    const { data: existing } = await supabase
      .from("leaderboard")
      .select("id, wins, losses")
      .eq("player_name", currentPlayerName.trim())
      .maybeSingle();

    if (existing) {
      if (existing.wins !== wins || existing.losses !== losses) {
        await supabase.from("leaderboard").update({ wins, losses, updated_at: new Date().toISOString() }).eq("id", existing.id);
      }
    } else {
      await supabase.from("leaderboard").insert({ player_name: currentPlayerName.trim(), wins, losses });
    }
    fetchLeaderboard();
  };

  useEffect(() => {
    fetchLeaderboard();
    const channel = supabase
      .channel("leaderboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "leaderboard" }, fetchLeaderboard)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="h-5 w-5 text-accent" />;
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Medal className="h-5 w-5 text-[hsl(25,80%,50%)]" />;
    return <span className="w-5 h-5 flex items-center justify-center font-display text-xs text-muted-foreground">{index + 1}</span>;
  };

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err: any) {
      toast.error(err.message || "Failed to sign in");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, filter: "blur(8px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 1.04, filter: "blur(12px)" }}
      transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
      className="min-h-screen bg-background p-6"
    >
      <Starfield />
      <div className="max-w-2xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <button
            onClick={() => navigate("/?mode=select")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-display text-sm">BACK</span>
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-xl">
                <User className="h-3.5 w-3.5 text-primary" />
                <span className="font-display text-xs text-primary">{currentPlayerName}</span>
              </div>
              <button
                onClick={() => syncScore()}
                className="px-3 py-1.5 bg-accent/10 border border-accent/30 text-accent rounded-xl font-display text-xs hover:border-accent/60 transition-all"
              >
                SYNC
              </button>
              <button
                onClick={signOut}
                className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleSignIn}
              className="flex items-center gap-1.5 px-4 py-2 bg-white text-black rounded-xl font-semibold text-xs hover:bg-gray-100 transition-all shadow"
            >
              <LogIn className="h-3.5 w-3.5" />
              Sign in with Google
            </button>
          )}
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <Trophy className="h-12 w-12 text-accent mx-auto mb-3" />
          <h1 className="text-3xl font-display font-black text-foreground mb-1">
            <span className="text-primary text-glow-primary">WORLD</span>{" "}
            <span className="text-accent">LEADERBOARD</span>
          </h1>
          <p className="text-muted-foreground text-sm">Top players ranked by wins</p>
        </motion.div>

        {/* Leaderboard table */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground font-display">Loading...</div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground font-display mb-2">No scores yet!</p>
            <p className="text-sm text-muted-foreground">Sign in with Google to be the first!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, i) => {
              const isCurrentPlayer = entry.player_name === currentPlayerName;
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, type: "spring", stiffness: 200 }}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                    i === 0
                      ? "bg-accent/5 border-accent/30 shadow-[0_0_20px_hsl(var(--accent)/0.1)]"
                      : isCurrentPlayer
                      ? "bg-primary/5 border-primary/30"
                      : i < 3
                      ? "bg-card border-border/60"
                      : "bg-card/50 border-border/30"
                  }`}
                >
                  <div className="w-8 flex justify-center flex-shrink-0">{getRankIcon(i)}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-display text-sm truncate ${
                      i === 0 ? "text-accent" : isCurrentPlayer ? "text-primary" : "text-foreground"
                    }`}>
                      {entry.player_name}
                      {isCurrentPlayer && <span className="ml-2 text-[10px] text-primary/60">(you)</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="font-display text-sm text-primary">{entry.wins}W</span>
                    <span className="font-display text-xs text-destructive">{entry.losses}L</span>
                    <span className="font-display text-[10px] text-muted-foreground w-8 text-right">
                      {entry.wins + entry.losses > 0
                        ? Math.round((entry.wins / (entry.wins + entry.losses)) * 100)
                        : 0}%
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default LeaderboardPage;
