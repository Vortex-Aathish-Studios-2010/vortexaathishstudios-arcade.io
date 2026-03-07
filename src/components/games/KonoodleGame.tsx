import { useState } from "react";
import { addPoints, updateStreak } from "@/lib/streaks";
import { toast } from "sonner";

const BOARD_ROWS = 5;
const BOARD_COLS = 11;

const PIECES = [
  { id: "L", cells: [[0,0],[1,0],[2,0],[2,1]], color: "bg-primary" },
  { id: "T", cells: [[0,0],[0,1],[0,2],[1,1]], color: "bg-secondary" },
  { id: "S", cells: [[0,1],[0,2],[1,0],[1,1]], color: "bg-accent" },
  { id: "I", cells: [[0,0],[1,0],[2,0],[3,0]], color: "bg-primary/70" },
  { id: "Z", cells: [[0,0],[0,1],[1,1],[1,2]], color: "bg-secondary/70" },
  { id: "O", cells: [[0,0],[0,1],[1,0],[1,1]], color: "bg-accent/70" },
  { id: "J", cells: [[0,0],[0,1],[1,0],[2,0]], color: "bg-primary/50" },
  { id: "P", cells: [[0,0],[0,1],[1,0],[1,1],[2,0]], color: "bg-secondary/50" },
];

type PieceDef = typeof PIECES[number];

const rotateCells = (cells: number[][]): number[][] =>
  cells.map(([r, c]) => [c, -r]).map(([r, c]) => {
    const minR = Math.min(...cells.map(([r2]) => r2));
    const minC = Math.min(...cells.map(([, c2]) => c2));
    return [r - Math.min(...cells.map(([, c2]) => c2)), c - Math.min(...cells.map(([r2]) => -r2))];
  });

const normalizeCells = (cells: number[][]): number[][] => {
  const minR = Math.min(...cells.map(([r]) => r));
  const minC = Math.min(...cells.map(([, c]) => c));
  return cells.map(([r, c]) => [r - minR, c - minC]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
};

export const KonoodleGame = () => {
  const [board, setBoard] = useState<(string | null)[][]>(() =>
    Array.from({ length: BOARD_ROWS }, () => Array(BOARD_COLS).fill(null))
  );
  const [placed, setPlaced] = useState<Set<string>>(new Set());
  const [selectedPiece, setSelectedPiece] = useState<PieceDef | null>(null);
  const [rotation, setRotation] = useState(0);

  const getRotatedCells = (piece: PieceDef, rot: number) => {
    let cells = piece.cells.map(c => [...c]);
    for (let i = 0; i < rot % 4; i++) cells = normalizeCells(rotateCells(cells));
    return cells;
  };

  const canPlace = (cells: number[][], r: number, c: number) =>
    cells.every(([dr, dc]) => {
      const nr = r + dr, nc = c + dc;
      return nr >= 0 && nr < BOARD_ROWS && nc >= 0 && nc < BOARD_COLS && !board[nr][nc];
    });

  const placePiece = (r: number, c: number) => {
    if (!selectedPiece || placed.has(selectedPiece.id)) return;
    const cells = getRotatedCells(selectedPiece, rotation);
    if (!canPlace(cells, r, c)) return;
    const newBoard = board.map((row) => [...row]);
    cells.forEach(([dr, dc]) => { newBoard[r + dr][c + dc] = selectedPiece.id; });
    setBoard(newBoard);
    setPlaced(new Set([...placed, selectedPiece.id]));
    setSelectedPiece(null);
    setRotation(0);
    if (newBoard.every((row) => row.every((cell) => cell !== null))) {
      addPoints(200);
      updateStreak("konoodle");
      toast.success("Konoodle solved! +200 points");
    }
  };

  const removePiece = (id: string) => {
    setBoard(board.map((row) => row.map((cell) => (cell === id ? null : cell))));
    const newPlaced = new Set(placed);
    newPlaced.delete(id);
    setPlaced(newPlaced);
  };

  const reset = () => {
    setBoard(Array.from({ length: BOARD_ROWS }, () => Array(BOARD_COLS).fill(null)));
    setPlaced(new Set());
    setSelectedPiece(null);
    setRotation(0);
  };

  const pieceColor = (id: string) => PIECES.find((p) => p.id === id)?.color || "bg-muted";

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="bg-card border border-border p-2 rounded-xl">
        {board.map((row, r) => (
          <div key={r} className="flex">
            {row.map((cell, c) => (
              <div
                key={c}
                onClick={() => cell ? removePiece(cell) : placePiece(r, c)}
                className={`w-7 h-7 border border-border/20 rounded-sm cursor-pointer transition-all ${
                  cell ? `${pieceColor(cell)} shadow-[0_0_6px_hsl(var(--primary)/0.2)]` : "bg-background/30 hover:bg-muted/50"
                }`}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        {PIECES.filter((p) => !placed.has(p.id)).map((piece) => (
          <button
            key={piece.id}
            onClick={() => { setSelectedPiece(piece); setRotation(0); }}
            className={`px-3 py-1.5 rounded-lg font-display text-xs transition-all border ${
              selectedPiece?.id === piece.id
                ? `${piece.color} border-primary ring-2 ring-primary/50 glow-primary`
                : "bg-card border-border text-foreground hover:border-primary/40"
            }`}
          >
            {piece.id}
          </button>
        ))}
      </div>

      {selectedPiece && (
        <button onClick={() => setRotation((r) => r + 1)} className="px-4 py-1.5 bg-card border border-border text-foreground rounded-lg font-display text-xs hover:border-secondary/50 transition-all">
          ROTATE (R)
        </button>
      )}

      <button onClick={reset} className="px-6 py-2 bg-card border border-border text-foreground rounded-xl font-display text-sm hover:border-primary/50 transition-all">
        RESET
      </button>
    </div>
  );
};
