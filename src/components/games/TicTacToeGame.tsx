import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Users, ArrowLeft, RotateCcw, Trophy } from "lucide-react";
import { sfx } from "@/lib/sounds";
import { addPoints, updateStreak } from "@/lib/streaks";
import { toast } from "sonner";
import { ensurePlayer, createRoom, joinRoom, startGame, subscribeToRoom } from "@/lib/multiplayer";
import { supabase } from "@/integrations/supabase/client";
import { getPlayerName } from "@/lib/streaks";

type Cell = "X" | "O" | null;
type Board = Cell[];
type Difficulty = "easy" | "medium" | "hard";
type GameMode = null | "bot" | "friend";
type FriendStep = "choice" | "create" | "join" | "waiting" | "playing";

const WINNING_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

const checkWinner = (board: Board): { winner: Cell; line: number[] | null } => {
  for (const combo of WINNING_COMBOS) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: combo };
    }
  }
  return { winner: null, line: null };
};

const isDraw = (board: Board) => board.every((c) => c !== null);

// --- Bot AI ---
const getEmptyCells = (board: Board) => board.map((c, i) => (c === null ? i : -1)).filter((i) => i !== -1);

const minimax = (board: Board, isMax: boolean): number => {
  const { winner } = checkWinner(board);
  if (winner === "O") return 10;
  if (winner === "X") return -10;
  if (isDraw(board)) return 0;

  const empty = getEmptyCells(board);
  if (isMax) {
    let best = -Infinity;
    for (const i of empty) {
      board[i] = "O";
      best = Math.max(best, minimax(board, false));
      board[i] = null;
    }
    return best;
  } else {
    let best = Infinity;
    for (const i of empty) {
      board[i] = "X";
      best = Math.min(best, minimax(board, true));
      board[i] = null;
    }
    return best;
  }
};

const botMove = (board: Board, difficulty: Difficulty): number => {
  const empty = getEmptyCells(board);
  if (empty.length === 0) return -1;

  if (difficulty === "easy") {
    // 80% random → user wins ~80%
    if (Math.random() < 0.8) return empty[Math.floor(Math.random() * empty.length)];
  } else if (difficulty === "medium") {
    // 50% random → user wins ~50%
    if (Math.random() < 0.5) return empty[Math.floor(Math.random() * empty.length)];
  }
  // Hard: 99.9% best move, 0.1% random → user wins ~0.1%
  if (difficulty === "hard" && Math.random() < 0.001) {
    return empty[Math.floor(Math.random() * empty.length)];
  }

  // Hard: always best move
  let bestScore = -Infinity;
  let bestMove = empty[0];
  for (const i of empty) {
    board[i] = "O";
    const score = minimax(board, false);
    board[i] = null;
    if (score > bestScore) {
      bestScore = score;
      bestMove = i;
    }
  }
  return bestMove;
};

// --- Multiplayer channel for moves ---
const CHANNEL_PREFIX = "ttt-game-";

export const TicTacToeGame: React.FC<{ level?: number; onComplete?: (score: number) => void }> = ({ onComplete }) => {
  const [mode, setMode] = useState<GameMode>(null);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [turn, setTurn] = useState<"X" | "O">("X");
  const [winLine, setWinLine] = useState<number[] | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  // Friend mode state
  const [friendStep, setFriendStep] = useState<FriendStep>("choice");
  const [playerName, setPlayerNameInput] = useState(getPlayerName() || "");
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [myMark, setMyMark] = useState<"X" | "O">("X");
  const [isHost, setIsHost] = useState(false);
  const [players, setPlayers] = useState<any[]>([]);
  const [opponentName, setOpponentName] = useState("Opponent");

  // Subscribe to multiplayer moves
  useEffect(() => {
    if (mode !== "friend" || !roomId || friendStep !== "playing") return;

    const channel = supabase.channel(CHANNEL_PREFIX + roomId)
      .on("broadcast", { event: "move" }, ({ payload }) => {
        if (payload.playerId !== playerId) {
          setBoard((prev) => {
            const newBoard = [...prev];
            newBoard[payload.cell] = payload.mark;
            return newBoard;
          });
          setTurn(myMark);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [mode, roomId, friendStep, playerId, myMark]);

  // Check win/draw after board updates
  useEffect(() => {
    const { winner, line } = checkWinner(board);
    if (winner) {
      setWinLine(line);
      setGameOver(true);
      if (mode === "bot") {
        if (winner === "X") {
          setResult("You Win! 🎉");
          const pts = difficulty === "hard" ? 50 : difficulty === "medium" ? 30 : 15;
          addPoints(pts);
          updateStreak("tictactoe");
          toast.success(`+${pts} points!`);
          onComplete?.(pts);
        } else {
          setResult("Bot Wins 🤖");
          onComplete?.(0);
        }
      } else {
        setResult(winner === myMark ? "You Win! 🎉" : `${opponentName} Wins!`);
        if (winner === myMark) {
          addPoints(30);
          updateStreak("tictactoe");
          toast.success("+30 points!");
        }
      }
      sfx.levelComplete?.();
    } else if (isDraw(board)) {
      setGameOver(true);
      setResult("It's a Draw!");
      sfx.click?.();
    }
  }, [board]);

  // Bot makes a move
  useEffect(() => {
    if (mode !== "bot" || turn !== "O" || gameOver || !difficulty) return;
    const timer = setTimeout(() => {
      const move = botMove([...board], difficulty);
      if (move >= 0) {
        setBoard((prev) => {
          const newBoard = [...prev];
          newBoard[move] = "O";
          return newBoard;
        });
        setTurn("X");
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [turn, mode, gameOver, difficulty]);

  const handleCellClick = (i: number) => {
    if (board[i] || gameOver) return;

    if (mode === "bot") {
      if (turn !== "X") return;
      sfx.click?.();
      setBoard((prev) => {
        const newBoard = [...prev];
        newBoard[i] = "X";
        return newBoard;
      });
      setTurn("O");
    } else if (mode === "friend" && friendStep === "playing") {
      if (turn !== myMark) return;
      sfx.click?.();
      const newBoard = [...board];
      newBoard[i] = myMark;
      setBoard(newBoard);
      setTurn(myMark === "X" ? "O" : "X");
      // Broadcast move
      supabase.channel(CHANNEL_PREFIX + roomId).send({
        type: "broadcast",
        event: "move",
        payload: { cell: i, mark: myMark, playerId },
      });
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setTurn("X");
    setWinLine(null);
    setGameOver(false);
    setResult(null);
  };

  const backToMenu = () => {
    resetGame();
    setMode(null);
    setDifficulty(null);
    setFriendStep("choice");
    setRoomId(null);
    setRoomCode("");
    setJoinCode("");
    setPlayers([]);
  };

  // --- Friend mode handlers ---
  const handleNameSubmit = async () => {
    if (!playerName.trim()) return;
    try {
      const id = await ensurePlayer(playerName.trim());
      setPlayerId(id);
      setFriendStep("choice");
    } catch {
      toast.error("Failed to set up player");
    }
  };

  const handleCreateRoom = async () => {
    if (!playerId) {
      await handleNameSubmit();
      return;
    }
    try {
      const room = await createRoom(playerId, "tictactoe");
      setRoomCode(room.code);
      setRoomId(room.id);
      setIsHost(true);
      setMyMark("X");
      setFriendStep("waiting");
    } catch {
      toast.error("Failed to create room");
    }
  };

  const handleJoinRoom = async () => {
    if (!playerId) {
      await handleNameSubmit();
      return;
    }
    if (!joinCode.trim()) return;
    try {
      const room = await joinRoom(playerId, joinCode.trim());
      if (!room) { toast.error("Room not found or already started"); return; }
      setRoomId(room.id);
      setRoomCode(joinCode.trim().toUpperCase());
      setIsHost(false);
      setMyMark("O");
      setFriendStep("waiting");
    } catch {
      toast.error("Failed to join room");
    }
  };

  // Subscribe to room for waiting
  useEffect(() => {
    if (mode !== "friend" || !roomId || friendStep !== "waiting") return;
    const unsub = subscribeToRoom(roomId, (ps, status) => {
      setPlayers(ps);
      if (status === "playing") {
        const opp = ps.find((p: any) => p.player_id !== playerId);
        if (opp) setOpponentName(opp.players?.display_name || "Opponent");
        setFriendStep("playing");
      }
    });
    return unsub;
  }, [roomId, friendStep, mode, playerId]);

  const handleStartFriend = async () => {
    if (!roomId) return;
    await startGame(roomId);
    const opp = players.find((p: any) => p.player_id !== playerId);
    if (opp) setOpponentName(opp.players?.display_name || "Opponent");
    setFriendStep("playing");
  };

  // --- MODE SELECTION ---
  if (mode === null) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <p className="text-center text-sm text-muted-foreground font-display mb-2">Choose how to play</p>
        <button
          onClick={() => setMode("bot")}
          className="w-full flex items-center gap-4 p-5 rounded-xl border-2 border-primary/30 bg-card hover:border-primary/60 hover:glow-primary transition-all"
        >
          <Bot className="h-8 w-8 text-primary" />
          <div className="text-left">
            <div className="font-display font-bold text-foreground">Play vs Bot</div>
            <div className="text-xs text-muted-foreground">Choose difficulty and challenge the AI</div>
          </div>
        </button>
        <button
          onClick={() => {
            setMode("friend");
            if (!playerId) setFriendStep("choice");
          }}
          className="w-full flex items-center gap-4 p-5 rounded-xl border-2 border-secondary/30 bg-card hover:border-secondary/60 hover:glow-secondary transition-all"
        >
          <Users className="h-8 w-8 text-secondary" />
          <div className="text-left">
            <div className="font-display font-bold text-foreground">Play vs Friend</div>
            <div className="text-xs text-muted-foreground">Create or join a room with a code</div>
          </div>
        </button>
      </motion.div>
    );
  }

  // --- DIFFICULTY SELECTION (Bot) ---
  if (mode === "bot" && !difficulty) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <button onClick={backToMenu} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-2">
          <ArrowLeft className="h-4 w-4" />
          <span className="font-display text-xs">BACK</span>
        </button>
        <p className="text-center text-sm text-muted-foreground font-display mb-2">Select Bot Difficulty</p>
        {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
          <button
            key={d}
            onClick={() => setDifficulty(d)}
            className={`w-full p-4 rounded-xl border-2 bg-card font-display font-bold text-foreground transition-all capitalize ${
              d === "easy" ? "border-accent/30 hover:border-accent/60 hover:glow-accent" :
              d === "medium" ? "border-primary/30 hover:border-primary/60 hover:glow-primary" :
              "border-destructive/30 hover:border-destructive/60"
            }`}
          >
            <span>{d.charAt(0).toUpperCase() + d.slice(1)}</span>
          </button>
        ))}
      </motion.div>
    );
  }

  // --- FRIEND LOBBY ---
  if (mode === "friend" && friendStep !== "playing") {
    // Need name first
    if (!playerId) {
      return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <button onClick={backToMenu} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-2">
            <ArrowLeft className="h-4 w-4" />
            <span className="font-display text-xs">BACK</span>
          </button>
          <p className="text-sm text-muted-foreground">Enter your display name:</p>
          <input
            value={playerName}
            onChange={(e) => setPlayerNameInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
            placeholder="Your name"
            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground font-display text-sm focus:border-primary outline-none"
            autoFocus
          />
          <button onClick={handleNameSubmit} className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-display text-sm hover:brightness-110 transition-all">
            CONTINUE
          </button>
        </motion.div>
      );
    }

    if (friendStep === "choice") {
      return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <button onClick={backToMenu} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-2">
            <ArrowLeft className="h-4 w-4" />
            <span className="font-display text-xs">BACK</span>
          </button>
          <button onClick={handleCreateRoom} className="w-full py-3 bg-primary/10 border-2 border-primary/40 text-primary rounded-xl font-display text-sm hover:border-primary hover:glow-primary transition-all">
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
            <button onClick={handleJoinRoom} className="px-4 py-2 bg-secondary/10 border-2 border-secondary/40 text-secondary rounded-lg font-display text-sm hover:border-secondary hover:glow-secondary transition-all">
              JOIN
            </button>
          </div>
        </motion.div>
      );
    }

    if (friendStep === "waiting") {
      return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <button onClick={backToMenu} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-2">
            <ArrowLeft className="h-4 w-4" />
            <span className="font-display text-xs">BACK</span>
          </button>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Room Code</p>
            <span className="text-2xl font-display font-black text-primary tracking-[0.3em] text-glow-primary">{roomCode}</span>
            <button
              onClick={() => { navigator.clipboard.writeText(roomCode); toast.success("Code copied!"); }}
              className="ml-2 text-muted-foreground hover:text-primary transition-colors text-xs"
            >
              Copy
            </button>
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
              <p className="text-xs text-muted-foreground animate-pulse mt-1">Waiting for opponent...</p>
            )}
          </div>
          {isHost && players.length >= 2 && (
            <button onClick={handleStartFriend} className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-display text-sm glow-primary hover:brightness-110 transition-all">
              START GAME
            </button>
          )}
          {!isHost && <p className="text-center text-xs text-muted-foreground animate-pulse">Waiting for host to start...</p>}
        </motion.div>
      );
    }
  }

  // --- GAME BOARD ---
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={backToMenu} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span className="font-display text-xs">MENU</span>
        </button>
        <div className="text-sm font-display text-muted-foreground">
          {gameOver ? result : mode === "friend"
            ? (turn === myMark ? "Your turn" : `${opponentName}'s turn`)
            : (turn === "X" ? "Your turn" : "Bot thinking...")}
        </div>
        {gameOver && (
          <button onClick={resetGame} className="flex items-center gap-1 text-primary hover:brightness-110 transition-colors">
            <RotateCcw className="h-4 w-4" />
            <span className="font-display text-xs">AGAIN</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 max-w-[280px] mx-auto">
        {board.map((cell, i) => {
          const isWin = winLine?.includes(i);
          return (
            <motion.button
              key={i}
              whileTap={!cell && !gameOver ? { scale: 0.9 } : undefined}
              onClick={() => handleCellClick(i)}
              className={`aspect-square rounded-xl border-2 flex items-center justify-center text-3xl font-display font-black transition-all ${
                isWin
                  ? "border-accent bg-accent/20 glow-accent"
                  : cell
                  ? "border-border bg-card"
                  : "border-border bg-card hover:border-primary/50 cursor-pointer"
              }`}
            >
              <AnimatePresence mode="wait">
                {cell && (
                  <motion.span
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className={cell === "X" ? "text-primary" : "text-secondary"}
                  >
                    {cell}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      {gameOver && result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-4 rounded-xl border-2 border-accent/30 bg-card"
        >
          <Trophy className="h-6 w-6 text-accent mx-auto mb-1" />
          <p className="font-display font-bold text-foreground">{result}</p>
        </motion.div>
      )}
    </motion.div>
  );
};
