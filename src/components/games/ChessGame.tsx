import { useEffect, useMemo, useRef, useState } from "react";
import { Chess, Square } from "chess.js";
import { ChessBoard } from "@/components/ChessBoard";
import { publicAsset } from "@/lib/assets";
import { createChessBot } from "@/lib/stockfish";
import { chessSfx } from "@/lib/chessSounds";
import { addEntertainmentPoints, updateStreak } from "@/lib/streaks";
export const ChessGame = ({
  initialMode = "bot",
  onComplete,
}: {
  initialMode?: "bot" | "friend";
  onComplete?: (score: number, won?: boolean) => void;
}) => {
  const [color, setColor] = useState<"w" | "b" | null>(
    initialMode === "friend" ? "w" : null,
  );
  const [pgn, setPgn] = useState("");
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const chess = useMemo(() => {
    const game = new Chess();
    if (pgn) game.loadPgn(pgn);
    return game;
  }, [pgn]);
  const engine = useRef<ReturnType<typeof createChessBot> | null>(null);
  useEffect(
    () => () => {
      engine.current?.dispose();
    },
    [],
  );
  const awarded = useRef(false),
    callback = useRef(onComplete);
  callback.current = onComplete;
  useEffect(() => {
    if (!chess.isGameOver() || awarded.current) return;
    awarded.current = true;
    const won =
      chess.isCheckmate() &&
      (initialMode === "friend" || chess.turn() !== color);
    const points = won ? 200 : chess.isDraw() ? 40 : 0;
    addEntertainmentPoints(points);
    updateStreak("chess");
    callback.current?.(points, won);
  }, [chess, color, initialMode]);
  useEffect(() => {
    if (
      initialMode !== "bot" ||
      !color ||
      chess.turn() === color ||
      chess.isGameOver()
    )
      return;
    let cancelled = false;
    setThinking(true);
    setError("");
    const bot = engine.current || (engine.current = createChessBot());
    bot
      .move(chess.fen())
      .then((move) => {
        if (cancelled) return;
        const next = new Chess();
        next.loadPgn(chess.pgn());
        next.move({
          from: move.slice(0, 2),
          to: move.slice(2, 4),
          promotion: move[4] || "q",
        });
        setPgn(next.pgn());
        chessSfx.move();
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setThinking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [chess, color, initialMode, attempt]);
  function move(from: Square, to: Square, promotion = "q") {
    if (
      thinking ||
      chess.isGameOver() ||
      (initialMode === "bot" && chess.turn() !== color)
    )
      return;
    try {
      const next = new Chess();
      next.loadPgn(chess.pgn());
      const result = next.move({ from, to, promotion });
      setPgn(next.pgn());
      if (result.captured) chessSfx.capture();
      else chessSfx.move();
    } catch {
      chessSfx.illegal();
    }
  }
  if (!color)
    return (
      <div className="chess-color">
        <span className="eyebrow">STOCKFISH · EXPERT</span>
        <h2>Choose your side</h2>
        <p>
          Engine strength set to 2000 Elo. Actual strength varies with the
          device and thinking time.
        </p>
        <div>
          <button className="solid-button" onClick={() => setColor("w")}>
            Play White
          </button>
          <button className="club-light" onClick={() => setColor("b")}>
            Play Black
          </button>
        </div>
        <small>
          The engine runs on your device and works offline once downloaded.
        </small>
      </div>
    );
  const status = chess.isCheckmate()
    ? `Checkmate · ${chess.turn() === "w" ? "Black" : "White"} wins`
    : chess.isStalemate()
      ? "Draw · stalemate"
      : chess.isThreefoldRepetition()
        ? "Draw · repetition"
        : chess.isInsufficientMaterial()
          ? "Draw · insufficient material"
          : chess.isDraw()
            ? "Draw"
            : thinking
              ? "Stockfish is thinking…"
              : `${chess.turn() === "w" ? "White" : "Black"} to move${chess.isCheck() ? " · check" : ""}`;
  return (
    <section className="chess-game">
      <div className="chess-status">
        <span>
          {initialMode === "friend" ? "FACE-TO-FACE" : "STOCKFISH · EXPERT"}
        </span>
        <h2 aria-live="polite">{status}</h2>
      </div>
      {initialMode === "friend" && (
        <p className="club-help">
          Sit opposite each other. The board and pieces turn toward the player
          whose move it is.
        </p>
      )}
      <ChessBoard
        chess={chess}
        orientation={color}
        tabletop={initialMode === "friend"}
        disabled={thinking || (initialMode === "bot" && chess.turn() !== color)}
        onMove={move}
      />
      {error && (
        <div role="alert">
          {error}
          <button
            className="club-light"
            onClick={() => {
              engine.current?.dispose();
              engine.current = null;
              setAttempt((n) => n + 1);
            }}
          >
            Retry engine
          </button>
        </div>
      )}
      <div className="chess-history">
        {chess.history().slice(-8).join("  ") || "Your opening move awaits."}
      </div>
      <button
        className="club-light"
        onClick={() => {
          engine.current?.dispose();
          engine.current = null;
          awarded.current = false;
          setPgn("");
          setError("");
          if (initialMode === "bot") setColor(null);
        }}
      >
        New game
      </button>
      <small className="chess-license">
        Stockfish 19 ·{" "}
        <a
          href={publicAsset("engine/Copying.txt")}
          target="_blank"
          rel="noreferrer"
        >
          GPL v3
        </a>{" "}
        ·{" "}
        <a href={publicAsset("engine/stockfish-v19.0.1-source.zip")}>
          Engine source
        </a>
      </small>
    </section>
  );
};
