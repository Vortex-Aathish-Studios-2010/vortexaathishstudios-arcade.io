import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Copy, Play, Trophy, X } from "lucide-react";
import { ensurePlayer, createRoom, joinRoom, startGame, reportScore, subscribeToRoom } from "@/lib/multiplayer";
import { getPlayerName, addWin, addLoss } from "@/lib/streaks";
import { toast } from "sonner";

interface MultiplayerLobbyProps {
  gameId: string;
  onStartMultiplayer: (roomId: string, playerId: string, difficulty: number) => void;
  onClose: () => void;
}

export const MultiplayerLobby = ({ gameId, onStartMultiplayer, onClose }: MultiplayerLobbyProps) => {
  const [step, setStep] = useState<"name" | "choice" | "create" | "join" | "waiting">("name");
  const [name, setName] = useState(getPlayerName() || "");
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState("");
  const [roomId, setRoomId] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [players, setPlayers] = useState<any[]>([]);
  const [roomStatus, setRoomStatus] = useState("waiting");
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    if (!roomId) return;
    // Initial fetch of players
    const fetchPlayers = async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: ps } = await supabase.from("room_players").select("*, players(display_name)").eq("room_id", roomId);
      const { data: room } = await supabase.from("game_rooms").select("status").eq("id", roomId).single();
      if (ps) setPlayers(ps);
      if (room) setRoomStatus(room.status || "waiting");
    };
    fetchPlayers();
    const unsub = subscribeToRoom(roomId, (ps, status) => {
      setPlayers(ps);
      setRoomStatus(status);
      if (status === "playing" && !isHost) {
        onStartMultiplayer(roomId, playerId!, 1);
      }
    });
    return unsub;
  }, [roomId, isHost, playerId]);

  const handleSetName = async () => {
    if (!name.trim()) return;
    try {
      const id = await ensurePlayer(name.trim());
      setPlayerId(id);
      setStep("choice");
    } catch {
      toast.error("Failed to set up player");
    }
  };

  const handleCreate = async () => {
    if (!playerId) return;
    try {
      const room = await createRoom(playerId, gameId);
      setRoomCode(room.code);
      setRoomId(room.id);
      setIsHost(true);
      setStep("waiting");
    } catch {
      toast.error("Failed to create room");
    }
  };

  const handleJoin = async () => {
    if (!playerId || !joinCode.trim()) return;
    try {
      const room = await joinRoom(playerId, joinCode.trim());
      if (!room) { toast.error("Room not found or game already started"); return; }
      setRoomId(room.id);
      setRoomCode(joinCode.trim().toUpperCase());
      setIsHost(false);
      setStep("waiting");
    } catch {
      toast.error("Failed to join room");
    }
  };

  const handleStart = async () => {
    await startGame(roomId);
    onStartMultiplayer(roomId, playerId!, 1);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    toast.success("Code copied!");
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-card border-2 border-primary/30 rounded-2xl p-6 max-w-sm w-full relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg font-bold text-foreground">Multiplayer</h2>
        </div>

        {step === "name" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Enter your display name:</p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSetName()}
              placeholder="Your name"
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground font-display text-sm focus:border-primary outline-none"
              autoFocus
            />
            <button onClick={handleSetName} className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-display text-sm hover:brightness-110 transition-all">
              CONTINUE
            </button>
          </div>
        )}

        {step === "choice" && (
          <div className="space-y-3">
            <button onClick={handleCreate} className="w-full py-3 bg-primary/10 border-2 border-primary/40 text-primary rounded-xl font-display text-sm hover:border-primary hover:glow-primary transition-all">
              CREATE ROOM
            </button>
            <div className="text-center text-muted-foreground text-xs font-display">OR</div>
            <div className="flex gap-2">
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ROOM CODE"
                maxLength={6}
                className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-foreground font-display text-sm text-center tracking-widest focus:border-secondary outline-none"
              />
              <button onClick={handleJoin} className="px-4 py-2 bg-secondary/10 border-2 border-secondary/40 text-secondary rounded-lg font-display text-sm hover:border-secondary hover:glow-secondary transition-all">
                JOIN
              </button>
            </div>
          </div>
        )}

        {step === "waiting" && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Room Code</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-display font-black text-primary tracking-[0.3em] text-glow-primary">{roomCode}</span>
                <button onClick={copyCode} className="text-muted-foreground hover:text-primary transition-colors">
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="border border-border rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-2 font-display">PLAYERS ({players.length})</p>
              {players.map((p: any) => (
                <div key={p.id} className="flex items-center gap-2 py-1">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-sm text-foreground">{p.players?.display_name || "Player"}</span>
                </div>
              ))}
              {players.length < 2 && (
                <p className="text-xs text-muted-foreground animate-pulse mt-1">Waiting for players...</p>
              )}
            </div>
            {isHost && players.length >= 2 && (
              <button onClick={handleStart} className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-display text-sm glow-primary hover:brightness-110 transition-all flex items-center justify-center gap-2">
                <Play className="h-4 w-4" /> START GAME
              </button>
            )}
            {!isHost && roomStatus === "waiting" && (
              <p className="text-center text-xs text-muted-foreground animate-pulse">Waiting for host to start...</p>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

interface MultiplayerResultProps {
  roomId: string;
  playerId: string;
  gameId: string;
  onClose: () => void;
}

export const MultiplayerResult = ({ roomId, playerId, gameId, onClose }: MultiplayerResultProps) => {
  const [players, setPlayers] = useState<any[]>([]);
  const [allDone, setAllDone] = useState(false);

  useEffect(() => {
    const unsub = subscribeToRoom(roomId, (ps, status) => {
      setPlayers(ps);
      if (status === "finished") {
        setAllDone(true);
        const me = ps.find((p: any) => p.player_id === playerId);
        if (me?.is_winner) addWin(gameId);
        else addLoss(gameId);
      }
    });
    // Initial fetch
    const fetch = async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data } = await supabase.from("room_players").select("*, players(display_name)").eq("room_id", roomId);
      if (data) setPlayers(data);
    };
    fetch();
    return unsub;
  }, [roomId, playerId, gameId]);

  const sorted = [...players].sort((a, b) => b.score - a.score);
  const me = players.find((p: any) => p.player_id === playerId);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-card border-2 border-primary/30 rounded-2xl p-6 max-w-sm w-full">
        <div className="text-center mb-4">
          <Trophy className="h-8 w-8 text-accent mx-auto mb-2" />
          <h2 className="font-display text-lg font-bold text-foreground">
            {allDone ? (me?.is_winner ? "YOU WON! 🎉" : "YOU LOST") : "Waiting for others..."}
          </h2>
        </div>
        <div className="space-y-2 mb-4">
          {sorted.map((p: any, i) => (
            <div key={p.id} className={`flex items-center justify-between px-3 py-2 rounded-lg border ${p.player_id === playerId ? "border-primary/50 bg-primary/10" : "border-border"}`}>
              <div className="flex items-center gap-2">
                <span className="font-display text-xs text-muted-foreground">#{i + 1}</span>
                <span className="text-sm text-foreground">{p.players?.display_name || "Player"}</span>
                {p.is_winner && <Trophy className="h-3 w-3 text-accent" />}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-display text-sm text-primary">{p.score}</span>
                {p.finished ? <span className="text-xs text-primary">✓</span> : <span className="text-xs text-muted-foreground animate-pulse">playing</span>}
              </div>
            </div>
          ))}
        </div>
        {allDone && (
          <button onClick={onClose} className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-display text-sm hover:brightness-110 transition-all">
            DONE
          </button>
        )}
      </motion.div>
    </motion.div>
  );
};
