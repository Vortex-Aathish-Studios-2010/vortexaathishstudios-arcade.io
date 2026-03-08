import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GameState, Position, createInitialState, getLegalMoves,
  makeMove, getPieceSymbol, getBotMove,
} from "@/lib/chessEngine";
import { chessSfx } from "@/lib/chessSounds";

type Mode = "select" | "bot" | "friend";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"];

export const ChessGame = () => {
  const [mode, setMode] = useState<Mode>("select");
  const [state, setState] = useState<GameState>(createInitialState());
  const [selected, setSelected] = useState<Position | null>(null);
  const [legalMoves, setLegalMoves] = useState<Position[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Position; to: Position } | null>(null);
  const [botThinking, setBotThinking] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);

  const resetGame = useCallback((m: Mode) => {
    setMode(m);
    setState(createInitialState());
    setSelected(null);
    setLegalMoves([]);
    setLastMove(null);
    setBotThinking(false);
  }, []);

  const handleSquareClick = useCallback((r: number, c: number) => {
    if (state.isCheckmate || state.isStalemate || botThinking) return;
    if (mode === "bot" && state.turn === "black") return;

    const piece = state.board[r][c];

    if (selected) {
      const isLegal = legalMoves.some(([mr, mc]) => mr === r && mc === c);
      if (isLegal) {
        const move = state.moves;
        const captured = state.board[r][c];
        const movingPiece = state.board[selected[0]][selected[1]];
        const newState = makeMove(state, selected, [r, c]);

        // Sound effects
        if (movingPiece?.type === "king" && Math.abs(c - selected[1]) === 2) {
          chessSfx.castling();
        } else if (captured || (movingPiece?.type === "pawn" && state.enPassantTarget && r === state.enPassantTarget[0] && c === state.enPassantTarget[1])) {
          chessSfx.capture();
        } else {
          chessSfx.move();
        }

        if (newState.isCheck && !newState.isCheckmate) {
          setTimeout(() => chessSfx.check(), 200);
        }
        if (newState.isCheckmate) {
          setTimeout(() => chessSfx.checkmate(), 300);
        }

        setState(newState);
        setLastMove({ from: selected, to: [r, c] });
        setSelected(null);
        setLegalMoves([]);
        return;
      }

      // Clicked own piece — reselect
      if (piece && piece.color === state.turn) {
        const moves = getLegalMoves(state.board, [r, c], state.enPassantTarget);
        setSelected([r, c]);
        setLegalMoves(moves);
        chessSfx.select();
        return;
      }

      // Clicked invalid square
      chessSfx.illegal();
      setSelected(null);
      setLegalMoves([]);
      return;
    }

    // No selection yet
    if (piece && piece.color === state.turn) {
      const moves = getLegalMoves(state.board, [r, c], state.enPassantTarget);
      if (moves.length > 0) {
        setSelected([r, c]);
        setLegalMoves(moves);
        chessSfx.select();
      }
    }
  }, [state, selected, legalMoves, mode, botThinking]);

  // Bot move
  useEffect(() => {
    if (mode !== "bot" || state.turn !== "black" || state.isCheckmate || state.isStalemate) return;
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

        if (newState.isCheck && !newState.isCheckmate) {
          setTimeout(() => chessSfx.check(), 200);
        }
        if (newState.isCheckmate) {
          setTimeout(() => chessSfx.checkmate(), 300);
        }

        setState(newState);
        setLastMove({ from, to });
      }
      setBotThinking(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [mode, state]);

  if (mode === "select") {
    return (
      <div className="flex flex-col items-center gap-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="text-7xl"
        >
          ♚
        </motion.div>
        <h2 className="font-sport text-2xl tracking-wide text-[hsl(var(--sport-text))]">
          CHOOSE MODE
        </h2>
        <div className="flex gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => resetGame("bot")}
            className="px-6 py-3 rounded-xl bg-[hsl(var(--sport-primary))] text-white font-sport-body font-bold text-lg shadow-lg hover:shadow-xl transition-shadow"
          >
            🤖 vs Hard Bot
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => resetGame("friend")}
            className="px-6 py-3 rounded-xl bg-[hsl(var(--sport-secondary))] text-white font-sport-body font-bold text-lg shadow-lg hover:shadow-xl transition-shadow"
          >
            👥 vs Friend
          </motion.button>
        </div>
      </div>
    );
  }

  const statusText = state.isCheckmate
    ? `Checkmate! ${state.turn === "white" ? "Black" : "White"} wins!`
    : state.isStalemate
    ? "Stalemate! It's a draw."
    : state.isCheck
    ? `${state.turn === "white" ? "White" : "Black"} is in check!`
    : botThinking
    ? "Bot is thinking..."
    : `${state.turn === "white" ? "White" : "Black"}'s turn`;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Status */}
      <motion.div
        key={statusText}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`font-sport-body text-lg font-bold px-4 py-2 rounded-lg ${
          state.isCheckmate
            ? "bg-red-100 text-red-800"
            : state.isCheck
            ? "bg-yellow-100 text-yellow-800"
            : "bg-white/80 text-[hsl(var(--sport-text))]"
        } shadow-sm`}
      >
        {statusText}
      </motion.div>

      {/* Captured pieces - Black */}
      <div className="flex items-center gap-1 min-h-[28px] px-2">
        {state.capturedBlack.map((p, i) => (
          <span key={i} className="text-lg opacity-70">{getPieceSymbol(p)}</span>
        ))}
      </div>

      {/* Board */}
      <div
        ref={boardRef}
        className="relative rounded-lg overflow-hidden shadow-2xl border-4 border-amber-900/80"
        style={{
          background: "linear-gradient(135deg, #8B6914 0%, #6B4E0A 100%)",
          padding: "2px",
        }}
      >
        {/* Rank labels (left) */}
        <div className="absolute left-[-22px] top-0 bottom-0 flex flex-col">
          {RANKS.map((rank, i) => (
            <div key={rank} className="flex-1 flex items-center justify-center">
              <span className="text-xs font-sport-body font-bold text-[hsl(var(--sport-muted))]">{rank}</span>
            </div>
          ))}
        </div>

        {/* File labels (bottom) */}
        <div className="absolute left-0 right-0 bottom-[-20px] flex">
          {FILES.map((file) => (
            <div key={file} className="flex-1 flex items-center justify-center">
              <span className="text-xs font-sport-body font-bold text-[hsl(var(--sport-muted))]">{file}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-8" style={{ width: "min(85vw, 400px)" }}>
          {state.board.map((row, r) =>
            row.map((piece, c) => {
              const isLight = (r + c) % 2 === 0;
              const isSelected = selected?.[0] === r && selected?.[1] === c;
              const isLegalTarget = legalMoves.some(([mr, mc]) => mr === r && mc === c);
              const isLastFrom = lastMove?.from[0] === r && lastMove?.from[1] === c;
              const isLastTo = lastMove?.to[0] === r && lastMove?.to[1] === c;
              const isCheckSquare = state.isCheck && piece?.type === "king" && piece?.color === state.turn;

              return (
                <motion.div
                  key={`${r}-${c}`}
                  onClick={() => handleSquareClick(r, c)}
                  className="relative flex items-center justify-center cursor-pointer select-none"
                  style={{
                    background: isCheckSquare
                      ? "radial-gradient(circle, #ef4444 0%, #dc2626 60%, " + (isLight ? "#F0D9B5" : "#B58863") + " 100%)"
                      : isSelected
                      ? isLight ? "#F7EC7D" : "#DAC34B"
                      : isLastFrom || isLastTo
                      ? isLight ? "#CDD16A" : "#AAA23A"
                      : isLight ? "#F0D9B5" : "#B58863",
                    transition: "background 0.15s ease",
                  }}
                  whileHover={{ opacity: 0.85 }}
                >
                  {/* Legal move indicator */}
                  {isLegalTarget && !piece && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute w-[30%] h-[30%] rounded-full bg-black/20"
                    />
                  )}
                  {isLegalTarget && piece && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute inset-0 rounded-sm border-[3px] border-black/25"
                    />
                  )}

                  {/* Piece */}
                  {piece && (
                    <motion.span
                      key={`piece-${r}-${c}-${piece.type}-${piece.color}`}
                      initial={lastMove?.to[0] === r && lastMove?.to[1] === c ? { scale: 1.2 } : {}}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="select-none z-10"
                      style={{
                        fontSize: "min(9vw, 42px)",
                        filter: piece.color === "white"
                          ? "drop-shadow(1px 2px 2px rgba(0,0,0,0.4))"
                          : "drop-shadow(1px 2px 2px rgba(0,0,0,0.3))",
                        lineHeight: 1,
                      }}
                    >
                      {getPieceSymbol(piece)}
                    </motion.span>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Captured pieces - White */}
      <div className="flex items-center gap-1 min-h-[28px] px-2">
        {state.capturedWhite.map((p, i) => (
          <span key={i} className="text-lg opacity-70">{getPieceSymbol(p)}</span>
        ))}
      </div>

      {/* Controls */}
      <div className="flex gap-3 mt-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => resetGame(mode)}
          className="px-4 py-2 rounded-lg bg-white border border-[hsl(var(--sport-border))] text-[hsl(var(--sport-text))] font-sport-body font-bold text-sm shadow-sm hover:shadow-md transition-shadow"
        >
          🔄 New Game
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => resetGame("select")}
          className="px-4 py-2 rounded-lg bg-white border border-[hsl(var(--sport-border))] text-[hsl(var(--sport-text))] font-sport-body font-bold text-sm shadow-sm hover:shadow-md transition-shadow"
        >
          🔙 Change Mode
        </motion.button>
      </div>
    </div>
  );
};
