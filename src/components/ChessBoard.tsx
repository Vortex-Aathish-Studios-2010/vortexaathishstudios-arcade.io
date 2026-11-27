import { useState } from "react";
import { Chess, Square, PieceSymbol } from "chess.js";
import { CHESS_PIECE_COMPONENTS } from "@/lib/chessPieces";
const types = {
  p: "pawn",
  r: "rook",
  n: "knight",
  b: "bishop",
  q: "queen",
  k: "king",
} as const;
export function ChessBoard({
  chess,
  orientation = "w",
  tabletop = false,
  disabled = false,
  onMove,
}: {
  chess: Chess;
  orientation?: "w" | "b";
  tabletop?: boolean;
  disabled?: boolean;
  onMove: (from: Square, to: Square, promotion?: string) => void;
}) {
  const [selected, setSelected] = useState<Square | null>(null);
  const [promotion, setPromotion] = useState<{
    from: Square;
    to: Square;
  } | null>(null);
  const moves = selected
    ? chess.moves({ square: selected, verbose: true })
    : [];
  const cells = chess.board().flat();
  if (!tabletop && orientation === "b") cells.reverse();
  const last = chess.history({ verbose: true }).at(-1);
  function choose(square: Square) {
    if (disabled || chess.isGameOver()) return;
    const move = moves.find((m) => m.to === square);
    if (selected && move) {
      if (move.flags.includes("p"))
        setPromotion({ from: selected, to: square });
      else onMove(selected, square);
      setSelected(null);
      return;
    }
    const piece = chess.get(square);
    setSelected(piece?.color === chess.turn() ? square : null);
  }
  return (
    <div className="chess-playfield">
      <div
        className={"chess-surface " + (tabletop ? "tabletop" : "")}
        style={{
          transform:
            tabletop && chess.turn() === "b"
              ? "rotate(180deg)"
              : "rotate(0deg)",
        }}
        aria-label="Chess board"
      >
        {cells.map((piece, index) => {
          const row = Math.floor(index / 8),
            col = index % 8;
          const square = (piece?.square ||
            (orientation === "b" && !tabletop
              ? String.fromCharCode(104 - col) + (row + 1)
              : String.fromCharCode(97 + col) + (8 - row))) as Square;
          const active = selected === square,
            target = moves.some((m) => m.to === square),
            check =
              chess.isCheck() &&
              piece?.type === "k" &&
              piece.color === chess.turn();
          const Piece = piece
            ? CHESS_PIECE_COMPONENTS[piece.color === "w" ? "white" : "black"][
                types[piece.type]
              ]
            : null;
          return (
            <button
              key={square}
              className={
                "chess-cell " +
                ((row + col) % 2 ? "dark" : "light") +
                (active ? " selected" : "") +
                (check ? " checked" : "") +
                (last?.from === square || last?.to === square
                  ? " last-move"
                  : "")
              }
              aria-label={
                square +
                (piece
                  ? " " +
                    (piece.color === "w" ? "white " : "black ") +
                    types[piece.type]
                  : " empty")
              }
              disabled={disabled}
              onClick={() => choose(square)}
            >
              {Piece && (
                <span className="chess-man">
                  <Piece />
                </span>
              )}
              {target && (
                <span className={"chess-target " + (piece ? "capture" : "")} />
              )}
              {(col === 0 || row === 7) && (
                <small>
                  {col === 0 ? square[1] : ""}
                  {row === 7 ? square[0] : ""}
                </small>
              )}
            </button>
          );
        })}
      </div>
      {promotion && (
        <div
          className="chess-promotion"
          role="dialog"
          aria-label="Promote pawn"
        >
          <h3>Choose your promotion</h3>
          {(["q", "r", "b", "n"] as PieceSymbol[]).map((type) => (
            <button
              key={type}
              onClick={() => {
                onMove(promotion.from, promotion.to, type);
                setPromotion(null);
              }}
            >
              {types[type]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
