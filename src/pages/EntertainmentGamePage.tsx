import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { entertainmentGames } from "@/lib/entertainmentData";

import { ChessGame } from "@/components/games/ChessGame";
import { TapRushGame } from "@/components/games/TapRushGame";
import { ColorSwitchTapGame } from "@/components/games/ColorSwitchTapGame";
import { StackTowerGame } from "@/components/games/StackTowerGame";
import { OneShotAimGame } from "@/components/games/OneShotAimGame";
import { AvoidTheWallsGame } from "@/components/games/AvoidTheWallsGame";
import { ThreeCupsGame } from "@/components/games/ThreeCupsGame";
import { GravityFlipRunner } from "@/components/games/GravityFlipRunner";
import { Starfield } from "@/components/Starfield";
import { MultiplayerLobby, MultiplayerResult } from "@/components/MultiplayerLobby";

import { ArrowLeft, Bot, Users, Smartphone, Globe, Plus, LogIn, Monitor, Tablet, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDevice } from "@/lib/DeviceContext";
import { addWin, addLoss } from "@/lib/streaks";

const gameComponents: Record<string, React.FC<{ onComplete?: (score: number, isWin?: boolean) => void; initialMode?: "bot" | "friend" }>> = {
  "chess": ChessGame,
  "tap-rush": TapRushGame,
  "color-switch": ColorSwitchTapGame,
  "stack-tower": StackTowerGame,
  "one-shot": OneShotAimGame,
  "avoid-walls": AvoidTheWallsGame,
  "three-cups": ThreeCupsGame,
  "gravity-flip": GravityFlipRunner,
};

const EntertainmentGamePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const game = entertainmentGames.find((g) => g.id === id);
  const [matchMode, setMatchMode] = useState<"select" | "bot" | "friends" | "local_friend" | null>("select");
  const [showMultiplayer, setShowMultiplayer] = useState(false);
  const [multiplayerRoom, setMultiplayerRoom] = useState<{ roomId: string; playerId: string } | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [gameReady, setGameReady] = useState(false);
  const { device, setDevice } = useDevice();

  const GameComponent = id ? gameComponents[id] : null;

  const handleMultiplayerStart = useCallback((roomId: string, playerId: string, _diff: number) => {
    setMultiplayerRoom({ roomId, playerId });
    setShowMultiplayer(false);
    setMatchMode("bot");
    setCountdown(3);
    setGameReady(false);
  }, []);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      setCountdown(null);
      setGameReady(true);
      return;
    }
    const timer = setTimeout(() => setCountdown(c => (c !== null ? c - 1 : null)), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleGameComplete = useCallback((score: number, isWin: boolean = true) => {
    if (multiplayerRoom) {
      import("@/lib/multiplayer").then(({ reportScore }) => {
        reportScore(multiplayerRoom.roomId, multiplayerRoom.playerId, score);
      });
      setShowResult(true);
    } else {
      // Local Play - Sync Leaderboard
      if (game) {
        if (isWin) addWin(game.id);
        else addLoss(game.id);
      }
    }
  }, [multiplayerRoom, game]);

  if (!game) {
    navigate("/entertainment");
    return null;
  }

  const renderMultiplayerSelection = () => (
    <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto">
      <h2 className="font-sport text-2xl tracking-widest text-white mb-4">SELECT MODE</h2>
      <div className="grid grid-cols-2 gap-4 w-full">
        <button 
          onClick={() => setMatchMode("bot")}
          className="flex flex-col items-center gap-4 p-8 bg-[hsl(var(--sport-card))] border border-[hsl(var(--sport-border))] rounded-2xl hover:border-[hsl(var(--sport-primary))] transition-all group"
        >
          {id === "chess" ? (
             <Bot className="h-12 w-12 text-[hsl(var(--sport-primary))] group-hover:scale-110 transition-transform" />
          ) : (
             <User className="h-12 w-12 text-[hsl(var(--sport-primary))] group-hover:scale-110 transition-transform" />
          )}
          <span className="font-sport tracking-widest text-sm">{id === "chess" ? "VS BOT" : "ALONE"}</span>
        </button>
        <button 
          onClick={() => {
            if (id === "chess") {
              setMatchMode("friends");
            } else {
              setShowMultiplayer(true);
            }
          }}
          className="flex flex-col items-center gap-4 p-8 bg-[hsl(var(--sport-card))] border border-[hsl(var(--sport-border))] rounded-2xl hover:border-[hsl(var(--sport-accent))] transition-all group"
        >
          <Users className="h-12 w-12 text-[hsl(var(--sport-accent))] group-hover:scale-110 transition-transform" />
          <span className="font-sport tracking-widest text-sm">FRIENDS</span>
        </button>
      </div>
    </div>
  );

  const renderFriendsSelection = () => (
    <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto">
      <h2 className="font-sport text-2xl tracking-widest text-white mb-4">FRIENDS MODE</h2>
      <div className="grid grid-cols-2 gap-4 w-full">
        <button 
          onClick={() => setMatchMode("local_friend")}
          className="flex flex-col items-center gap-4 p-8 bg-[hsl(var(--sport-card))] border border-[hsl(var(--sport-border))] rounded-2xl hover:border-[hsl(var(--sport-primary))] transition-all group"
        >
          <Smartphone className="h-12 w-12 text-[hsl(var(--sport-primary))] group-hover:scale-110 transition-transform" />
          <div className="text-center">
            <span className="font-sport tracking-widest text-sm block">NEAR</span>
            <span className="text-[10px] text-muted-foreground uppercase mt-1">Same Device</span>
          </div>
        </button>
        <button 
          onClick={() => setShowMultiplayer(true)}
          className="flex flex-col items-center gap-4 p-8 bg-[hsl(var(--sport-card))] border border-[hsl(var(--sport-border))] rounded-2xl hover:border-[hsl(var(--sport-accent))] transition-all group"
        >
          <Globe className="h-12 w-12 text-[hsl(var(--sport-accent))] group-hover:scale-110 transition-transform" />
          <div className="text-center">
            <span className="font-sport tracking-widest text-sm block">FAR</span>
            <span className="text-[10px] text-muted-foreground uppercase mt-1">Lobby Sync</span>
          </div>
        </button>
      </div>
      <button onClick={() => setMatchMode("select")} className="font-sport text-xs text-muted-foreground hover:text-white transition-colors">← BACK</button>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97, filter: "blur(8px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.4 }}
      className="entertainment-theme min-h-screen bg-black flex flex-col"
    >
      <Starfield />
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="relative z-10 flex items-center px-4 py-3 border-b border-[hsl(var(--sport-border))] bg-black/50 backdrop-blur-md"
      >
        <button
          onClick={() => {
            if (matchMode === "bot" || matchMode === "local_friend") {
              setMatchMode("select");
            } else if (matchMode === "friends") {
              setMatchMode("select");
            } else {
              navigate("/entertainment");
            }
          }}
          className="flex items-center gap-2 text-[hsl(var(--sport-muted))] hover:text-[hsl(var(--sport-text))] transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="font-sport text-sm tracking-wider">BACK</span>
        </button>
        <h1 className="ml-4 font-sport text-lg tracking-wider text-[hsl(var(--sport-text))]">
          {game.name.toUpperCase()}
        </h1>
      </motion.div>

      {/* Game Content */}
      <div className="relative z-10 flex-1 flex items-start justify-center p-4 pt-6 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5, type: "spring", stiffness: 100 }}
          className="w-full max-w-3xl flex items-center justify-center min-h-[500px]"
        >
          {matchMode === "select" && renderMultiplayerSelection()}
          {matchMode === "friends" && renderFriendsSelection()}
          
          {(matchMode === "bot" || matchMode === "local_friend" || matchMode === null) && (
            GameComponent ? (
              <div className={countdown !== null ? "blur-md pointer-events-none w-full flex justify-center" : "w-full flex justify-center"}>
                <GameComponent 
                  initialMode={matchMode === "local_friend" ? "friend" : "bot"} 
                  onComplete={handleGameComplete}
                />
              </div>
            ) : (
              <div className="text-center py-20 bg-[hsl(var(--sport-card))] rounded-2xl border border-[hsl(var(--sport-border))]">
                <div className="flex justify-center mb-6 text-[hsl(var(--sport-primary))] opacity-80 w-16 h-16 mx-auto">
                  {game.icon}
                </div>
                <h2 className="text-3xl font-sport tracking-wider text-[hsl(var(--sport-text))] mb-3">{game.name.toUpperCase()}</h2>
                <p className="text-[hsl(var(--sport-muted))] mb-8 font-sport-body text-lg">
                  This arena is currently under construction. Check back soon!
                </p>
                <button
                  onClick={() => navigate("/entertainment")}
                  className="px-6 py-3 rounded-lg bg-[hsl(var(--sport-primary))]/20 border border-[hsl(var(--sport-primary))]/50 text-[hsl(var(--sport-primary))] font-sport tracking-wider hover:bg-[hsl(var(--sport-primary))]/30 transition-all font-bold"
                >
                  RETURN TO LOBBY
                </button>
              </div>
            )
          )}

          <AnimatePresence>
            {countdown !== null && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none"
              >
                <motion.span
                  key={countdown}
                  initial={{ scale: 2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
                  className="text-8xl font-display font-black text-[hsl(var(--sport-primary))] drop-shadow-[0_0_20px_hsl(var(--sport-primary))]"
                >
                  {countdown === 0 ? "GO!" : countdown}
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {showMultiplayer && (
        <MultiplayerLobby
          gameId={game.id}
          onStartMultiplayer={handleMultiplayerStart}
          onClose={() => setShowMultiplayer(false)}
        />
      )}

      {showResult && multiplayerRoom && (
        <MultiplayerResult
          roomId={multiplayerRoom.roomId}
          playerId={multiplayerRoom.playerId}
          gameId={game.id}
          onClose={() => { setShowResult(false); setMultiplayerRoom(null); }}
        />
      )}

      {/* Device Toggle */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[70] flex bg-[hsl(var(--sport-card))] border border-[hsl(var(--sport-border))] rounded-lg p-0.5 shadow-lg">
        <button title="Phone" onClick={() => setDevice("phone")} className={`p-2 rounded-md transition-colors ${device === "phone" ? "bg-[hsl(var(--sport-primary))] text-black" : "text-[hsl(var(--sport-muted))] hover:bg-[hsl(var(--sport-bg))]"}`}>
          <Smartphone className="w-4 h-4" />
        </button>
        <button title="Tablet" onClick={() => setDevice("tablet")} className={`p-2 rounded-md transition-colors ${device === "tablet" ? "bg-[hsl(var(--sport-primary))] text-black" : "text-[hsl(var(--sport-muted))] hover:bg-[hsl(var(--sport-bg))]"}`}>
          <Tablet className="w-4 h-4" />
        </button>
        <button title="Laptop" onClick={() => setDevice("laptop")} className={`p-2 rounded-md transition-colors ${device === "laptop" ? "bg-[hsl(var(--sport-primary))] text-black" : "text-[hsl(var(--sport-muted))] hover:bg-[hsl(var(--sport-bg))]"}`}>
          <Monitor className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

export default EntertainmentGamePage;
