import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Trophy, ArrowLeft, Medal, Crown, Plus, Trash2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getTotalWins, getTotalLosses, getPlayerName, setPlayerName } from "@/lib/streaks";

interface LeaderboardEntry {
  id: string;
  player_name: string;
  wins: number;
  losses: number;
}

const LeaderboardPage = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState(() => getPlayerName());
  const [nameError, setNameError] = useState("");
  const [showSubmit, setShowSubmit] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const currentPlayerName = getPlayerName();

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

  useEffect(() => {
    fetchLeaderboard();
    const channel = supabase
      .channel("leaderboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "leaderboard" }, fetchLeaderboard)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const checkNameAvailable = async (n: string): Promise<boolean> => {
    const { data } = await supabase
      .from("leaderboard")
      .select("id, player_name")
      .eq("player_name", n.trim())
      .maybeSingle();
    // Name is available if no entry exists OR the existing entry belongs to the current player
    if (!data) return true;
    if (currentPlayerName && data.player_name === currentPlayerName) return true;
    return false;
  };

  const handleNameChange = (val: string) => {
    setName(val);
    setNameError("");
  };

  const handleSubmitScore = async () => {
    const trimmed = name.trim();
    if (!trimmed) { setNameError("Please enter your name"); return; }
    if (trimmed.length < 2) { setNameError("Name must be at least 2 characters"); return; }

    setSubmitting(true);

    // Check if name is taken by someone else
    const { data: existing } = await supabase
      .from("leaderboard")
      .select("id, player_name")
      .eq("player_name", trimmed)
      .maybeSingle();

    const isOwnEntry = existing && currentPlayerName === trimmed;

    if (existing && !isOwnEntry) {
      setNameError("This name is already taken — choose another!");
      setSubmitting(false);
      return;
    }

    setPlayerName(trimmed);
    const wins = getTotalWins();
    const losses = getTotalLosses();

    if (isOwnEntry && existing) {
      await supabase.from("leaderboard").update({ wins, losses, updated_at: new Date().toISOString() }).eq("id", existing.id);
      toast.success("Score updated!");
    } else {
      const { error } = await supabase.from("leaderboard").insert({ player_name: trimmed, wins, losses });
      if (error) {
        toast.error("Failed to submit score");
        console.error(error);
        setSubmitting(false);
        return;
      }
      toast.success("Joined the leaderboard!");
    }

    setSubmitting(false);
    setShowSubmit(false);
    setNameError("");
    fetchLeaderboard();
  };

  const handleDelete = async (id: string, playerNameToDelete: string) => {
    setDeletingId(id);
    const { error } = await supabase.from("leaderboard").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete entry");
      console.error(error);
    } else {
      toast.success(`Removed ${playerNameToDelete} from leaderboard`);
      if (playerNameToDelete === currentPlayerName) {
        setPlayerName("");
        setName("");
      }
    }
    setDeletingId(null);
    setConfirmDeleteId(null);
    fetchLeaderboard();
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="h-5 w-5 text-accent" />;
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Medal className="h-5 w-5 text-[hsl(25,80%,50%)]" />;
    return <span className="w-5 h-5 flex items-center justify-center font-display text-xs text-muted-foreground">{index + 1}</span>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, filter: "blur(8px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 1.04, filter: "blur(12px)" }}
      transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
      className="min-h-screen bg-background p-6"
    >
      <div className="max-w-2xl mx-auto">
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

          {currentPlayerName ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-xl text-primary font-display text-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              SYNCING AS {currentPlayerName.toUpperCase()}
            </div>
          ) : (
            <button
              onClick={() => setShowSubmit(!showSubmit)}
              className="flex items-center gap-1.5 px-4 py-2 bg-accent/10 border border-accent/30 text-accent rounded-xl font-display text-xs hover:border-accent/60 transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              JOIN LEADERBOARD
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

        {/* Submit form */}
        <AnimatePresence>
          {showSubmit && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 bg-card border border-border rounded-xl p-4 overflow-hidden"
            >
              <p className="font-display text-sm text-foreground mb-3">
                Your stats:{" "}
                <span className="text-primary">{getTotalWins()}W</span>{" / "}
                <span className="text-destructive">{getTotalLosses()}L</span>
              </p>
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmitScore()}
                    placeholder="Enter your name"
                    maxLength={20}
                    className={`w-full bg-background border rounded-lg px-3 py-2 text-foreground font-display text-sm focus:outline-none transition-colors ${
                      nameError ? "border-destructive focus:border-destructive" : "border-border focus:border-primary"
                    }`}
                  />
                  {nameError && (
                    <p className="text-destructive text-xs font-display mt-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> {nameError}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleSubmitScore}
                  disabled={submitting}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-display text-sm hover:opacity-90 transition-all disabled:opacity-50 h-fit"
                >
                  {submitting ? "..." : "SUBMIT"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Leaderboard table */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground font-display">Loading...</div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground font-display mb-2">No scores yet!</p>
            <p className="text-sm text-muted-foreground">Be the first to submit your score.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, i) => {
              const isCurrentPlayer = entry.player_name === currentPlayerName;
              const isConfirmingDelete = confirmDeleteId === entry.id;
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

                    {/* Delete button (only for your own entry or all visible) */}
                    {isConfirmingDelete ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleDelete(entry.id, entry.player_name)}
                          disabled={deletingId === entry.id}
                          className="px-2 py-1 bg-destructive text-destructive-foreground rounded text-[10px] font-display hover:opacity-90 transition-all"
                        >
                          {deletingId === entry.id ? "..." : "CONFIRM"}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-1 bg-muted text-muted-foreground rounded text-[10px] font-display hover:bg-muted/80 transition-all"
                        >
                          CANCEL
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(entry.id)}
                        className="p-1.5 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 rounded transition-all"
                        title="Delete entry"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
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
