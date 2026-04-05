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
      setNameError("NAME ALREADY TAKEN — CHOOSE ANOTHER!");
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
        </motion.div>

        {/* Title & Lock */}
        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.1 }}
           className="text-center py-16 bg-card border border-border rounded-xl mt-8 shadow-sm"
        >
           <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
           <h2 className="text-3xl font-display font-black text-foreground mb-3 tracking-wide">
             <span className="text-primary text-glow-primary">COMING</span>{" "}
             <span className="text-accent text-glow-accent">SOON</span>
           </h2>
           <p className="text-muted-foreground max-w-sm mx-auto">
             The Worldwide Leaderboard is currently being upgraded with new global ranking features. Stay tuned!
           </p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default LeaderboardPage;
