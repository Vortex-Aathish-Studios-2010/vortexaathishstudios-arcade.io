import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GameState, Position, createInitialState, getLegalMoves,
  makeMove, getBotMove,
} from "@/lib/chessEngine";
import { chessSfx } from "@/lib/chessSounds";
import { CHESS_PIECE_COMPONENTS } from "@/lib/chessPieces";

export const ChessGame = ({ initialMode = "bot" }: { initialMode?: "bot" | "friend" }) => {
  const [mode, setMode] = useState<Mode>(initialMode === "bot" ? "color" : "friend");
  const [pendingMode, setPendingMode] = useState<"bot" | "friend">(initialMode);
  const [playerColor, setPlayerColor] = useState<PlayerColor>("white");
  const [state, setState] = useState<GameState>(createInitialState());
  const [selected, setSelected] = useState<Position | null>(null);
  const [legalMoves, setLegalMoves] = useState<Position[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Position; to: Position } | null>(null);
  const [botThinking, setBotThinking] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);

  const resetGame = useCallback((m: Mode, color: PlayerColor = "white") => {
    setMode(m);
    setPlayerColor(color);
    setState(createInitialState());
    setSelected(null);
    setLegalMoves([]);
    setLastMove(null);
    setBotThinking(false);
  }, []);

  const handleSquareClick = useCallback((r: number, c: number) => {
    if (state.isCheckmate || state.isStalemate || botThinking) return;
    if (mode === "bot" && state.turn !== playerColor) return;

    const piece = state.board[r][c];

    if (selected) {
      const isLegal = legalMoves.some(([mr, mc]) => mr === r && mc === c);
      if (isLegal) {
        const captured = state.board[r][c];
        const movingPiece = state.board[selected[0]][selected[1]];
        const newState = makeMove(state, selected, [r, c]);

        if (movingPiece?.type === "king" && Math.abs(c - selected[1]) === 2) {
          chessSfx.castling();
        } else if (captured || (movingPiece?.type === "pawn" && state.enPassantTarget && r === state.enPassantTarget[0] && c === state.enPassantTarget[1])) {
          chessSfx.capture();
        } else {
          chessSfx.move();
        }

        if (newState.isCheck && !newState.isCheckmate) setTimeout(() => chessSfx.check(), 200);
        if (newState.isCheckmate) setTimeout(() => chessSfx.checkmate(), 300);

        setState(newState);
        setLastMove({ from: selected, to: [r, c] });
        setSelected(null);
        setLegalMoves([]);
        return;
      }

      if (piece && piece.color === state.turn) {
        const moves = getLegalMoves(state.board, [r, c], state.enPassantTarget);
        setSelected([r, c]);
        setLegalMoves(moves);
        chessSfx.select();
        return;
      }

      chessSfx.illegal();
      setSelected(null);
      setLegalMoves([]);
      return;
    }

    if (piece && piece.color === state.turn) {
      const moves = getLegalMoves(state.board, [r, c], state.enPassantTarget);
      if (moves.length > 0) {
        setSelected([r, c]);
        setLegalMoves(moves);
        chessSfx.select();
      }
    }
  }, [state, selected, legalMoves, mode, botThinking, playerColor]);

  // Bot move
  useEffect(() => {
    if (mode !== "bot") return;
    const botColor = playerColor === "white" ? "black" : "white";
    if (state.turn !== botColor || state.isCheckmate || state.isStalemate) return;
    setBotThinking(true);
    const timer = setTimeout(() => {
      const botMoveResult = getBotMove(state);
      if (botMoveResult) {
        const { from, to } = botMoveResult;
        const captured = state.board[to[0]][to[1]];
        const movingPiece = state.board[from[0]][from[1]];
        const newState = makeMove(state, from, to);

        if (movingPiece?.type === "king" && Math.abs(to[1] - from[1]) === 2) {
          chessSfx.castling();
        } else if (captured) {
          chessSfx.capture();
        } else {
          chessSfx.move();
        }

        if (newState.isCheck && !newState.isCheckmate) setTimeout(() => chessSfx.check(), 200);
        if (newState.isCheckmate) setTimeout(() => chessSfx.checkmate(), 300);

        setState(newState);
        setLastMove({ from, to });
      }
      setBotThinking(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [mode, state, playerColor]);


  // Color select screen (bot mode only)
  if (mode === "color") {
    return (
      <div className="flex flex-col items-center gap-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="text-6xl mb-4">♟️</div>
          <h2 className="font-sport text-2xl tracking-wide text-[hsl(var(--sport-text))] mb-2">CHOOSE YOUR COLOR</h2>
          <p className="text-[hsl(var(--sport-muted))] font-sport-body text-sm">Which side will you play?</p>
        </motion.div>

        <div className="flex gap-6">
          <motion.button
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            whileHover={{ scale: 1.06, y: -4 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => resetGame("bot", "white")}
            className="flex flex-col items-center gap-4 px-8 py-6 rounded-2xl border-2 border-white/30 bg-white/10 hover:border-white/70 hover:bg-white/20 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all"
          >
            <img src={PIECE_IMAGES.white.king} alt="White King" className="w-16 h-16 drop-shadow-lg" draggable="false" />
            <div>
              <p className="font-sport text-lg text-white font-bold">WHITE</p>
              <p className="font-sport-body text-xs text-white/60">Moves first</p>
            </div>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            whileHover={{ scale: 1.06, y: -4 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => resetGame("bot", "black")}
            className="flex flex-col items-center gap-4 px-8 py-6 rounded-2xl border-2 border-[hsl(var(--sport-text))]/30 bg-[hsl(var(--sport-bg))]/60 hover:border-[hsl(var(--sport-primary))]/70 hover:shadow-[0_0_30px_hsl(var(--sport-primary)/0.3)] transition-all"
          >
            <img src={PIECE_IMAGES.black.king} alt="Black King" className="w-16 h-16 drop-shadow-lg" draggable="false" />
            <div>
              <p className="font-sport text-lg text-[hsl(var(--sport-text))] font-bold">BLACK</p>
              <p className="font-sport-body text-xs text-[hsl(var(--sport-muted))]">Bot moves first</p>
            </div>
          </motion.button>
        </div>

      </div>
    );
  }

  const botColor = playerColor === "white" ? "black" : "white";
  const statusText = state.isCheckmate
    ? `Checkmate! ${state.turn === "white" ? "Black" : "White"} wins!`
    : state.isStalemate
      ? "Stalemate! It's a draw."
      : state.isCheck
        ? `${state.turn === "white" ? "White" : "Black"} is in check!`
        : botThinking
          ? "Bot is thinking..."
          : `${state.turn === "white" ? "White" : "Black"}'s turn`;

  // Flip board if playing as black
  const displayBoard = playerColor === "black"
    ? state.board.slice().reverse().map(row => row.slice().reverse())
    : state.board;
  const displayRanks = playerColor === "black" ? [...RANKS].reverse() : RANKS;
  const displayFiles = playerColor === "black" ? [...FILES].reverse() : FILES;
  const toDisplayCoords = (r: number, c: number): [number, number] => {
    if (playerColor === "black") return [7 - r, 7 - c];
    return [r, c];
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <motion.div
        key={statusText}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`font-sport-body text-base font-bold px-4 py-2 rounded-lg ${state.isCheckmate ? "bg-red-900/60 text-red-300"
            : state.isCheck ? "bg-yellow-900/60 text-yellow-300"
              : "bg-[hsl(var(--sport-card))] text-[hsl(var(--sport-text))]"
          } shadow-sm`}
      >
        {statusText}
      </motion.div>

      <div className="flex items-center gap-1 min-h-[24px] px-2 flex-wrap">
        {state.capturedBlack.map((p, i) => (
          <img key={i} src={PIECE_IMAGES.black[p.type]} alt="Captured Black" draggable="false" className="w-5 h-5 opacity-80" />
        ))}
      </div>

      <div
        ref={boardRef}
        className="relative shadow-2xl border-[4px] border-[#8B6914] rounded-lg bg-[#6B4E0A]"
        style={{ padding: "12px 12px 16px 16px" }}
      >
        <div className="absolute left-1 top-[12px] bottom-[16px] flex flex-col">
          {displayRanks.map(rank => (
            <div key={rank} className="flex-1 flex items-center justify-center w-3">
              <span className="text-[10px] font-sport-body font-bold text-white/70">{rank}</span>
            </div>
          ))}
        </div>
        <div className="absolute left-[16px] right-[12px] bottom-1 flex">
          {displayFiles.map(file => (
            <div key={file} className="flex-1 flex items-center justify-center h-3">
              <span className="text-[10px] font-sport-body font-bold text-white/70">{file}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-8 grid-rows-8 w-full aspect-square rounded overflow-hidden" style={{ width: "min(85vw, 440px)" }}>
          {displayBoard.map((row, dr) =>
            row.map((piece, dc) => {
              const [r, c] = toDisplayCoords(dr, dc);
              const isLight = (r + c) % 2 === 0;
              const isSelected = selected?.[0] === r && selected?.[1] === c;
              const isLegalTarget = legalMoves.some(([mr, mc]) => mr === r && mc === c);
              const isLastFrom = lastMove?.from[0] === r && lastMove?.from[1] === c;
              const isLastTo = lastMove?.to[0] === r && lastMove?.to[1] === c;
              const isCheckSquare = state.isCheck && piece?.type === "king" && piece?.color === state.turn;

              return (
                <motion.div
                  key={`${dr}-${dc}`}
                  onClick={() => handleSquareClick(r, c)}
                  className="relative flex items-center justify-center cursor-pointer select-none aspect-square"
                  style={{
                    background: isCheckSquare
                      ? `radial-gradient(circle, #ef4444 0%, #dc2626 60%, ${isLight ? "#F0D9B5" : "#B58863"} 100%)`
                      : isSelected ? (isLight ? "#F7EC7D" : "#DAC34B")
                        : isLastFrom || isLastTo ? (isLight ? "#CDD16A" : "#AAA23A")
                          : isLight ? "#F0D9B5" : "#B58863",
                    transition: "background 0.15s ease",
                  }}
                  whileHover={{ opacity: 0.85 }}
                >
                  {isLegalTarget && !piece && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute w-[30%] h-[30%] rounded-full bg-black/25"
                    />
                  )}
                  {isLegalTarget && piece && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute inset-0 rounded-sm border-[3px] border-black/25"
                    />
                  )}
                  {piece && (
                    <motion.img
                      key={`piece-${r}-${c}-${piece.type}-${piece.color}`}
                      src={PIECE_IMAGES[piece.color][piece.type]}
                      alt={`${piece.color} ${piece.type}`}
                      draggable="false"
                      initial={isLastTo ? { scale: 1.2 } : {}}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="w-[85%] h-[85%] select-none z-10"
                      style={{
                        filter: piece.color === "white"
                          ? "drop-shadow(1px 2px 3px rgba(0,0,0,0.5))"
                          : "drop-shadow(1px 1px 1px rgba(0,0,0,0.3))",
                      }}
                    />
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 min-h-[24px] px-2 flex-wrap">
        {state.capturedWhite.map((p, i) => (
          <img key={i} src={PIECE_IMAGES.white[p.type]} alt="Captured White" draggable="false" className="w-5 h-5 opacity-80" />
        ))}
      </div>

      <div className="flex gap-3 mt-1">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => resetGame(mode, playerColor)}
          className="px-4 py-2 rounded-lg bg-[hsl(var(--sport-card))] border border-[hsl(var(--sport-border))] text-[hsl(var(--sport-text))] font-sport-body font-bold text-sm hover:shadow-md transition-all"
        >
          🔄 New Game
        </motion.button>
      </div>
    </div>
  );
};
