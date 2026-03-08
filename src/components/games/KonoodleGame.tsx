import { useState, useRef, useEffect, useCallback } from "react";
import { addPoints, updateStreak, addWin } from "@/lib/streaks";
import { sfx } from "@/lib/sounds";
import { toast } from "sonner";
import { Smartphone } from "lucide-react";

const BOARD_ROWS = 5;
const BOARD_COLS = 11;
const TOTAL_CELLS = BOARD_ROWS * BOARD_COLS; // 55

const PIECES = [
  { id: "L", cells: [[0,0],[1,0],[2,0],[2,1]], color: "bg-primary" },
  { id: "T", cells: [[0,0],[0,1],[0,2],[1,1]], color: "bg-secondary" },
  { id: "S", cells: [[0,1],[0,2],[1,0],[1,1]], color: "bg-accent" },
  { id: "I", cells: [[0,0],[1,0],[2,0],[3,0]], color: "bg-primary/70" },
  { id: "Z", cells: [[0,0],[0,1],[1,1],[1,2]], color: "bg-secondary/70" },
  { id: "O", cells: [[0,0],[0,1],[1,0],[1,1]], color: "bg-accent/70" },
  { id: "J", cells: [[0,0],[0,1],[1,0],[2,0]], color: "bg-primary/50" },
  { id: "P", cells: [[0,0],[0,1],[1,0],[1,1],[2,0]], color: "bg-secondary/50" },
  { id: "U", cells: [[0,0],[0,2],[1,0],[1,1],[1,2]], color: "bg-accent/50" },
  { id: "F", cells: [[0,1],[0,2],[1,0],[1,1],[2,1]], color: "bg-primary/60" },
  { id: "W", cells: [[0,0],[1,0],[1,1],[2,1],[2,2]], color: "bg-secondary/60" },
  { id: "Y", cells: [[0,1],[1,0],[1,1],[2,1],[3,1]], color: "bg-accent/60" },
  { id: "N", cells: [[0,0],[1,0],[1,1],[2,1],[3,1]], color: "bg-primary/80" },
]; // 13 pieces, total cells = 4+3+4+4+4+4+3+5+5+5+5+4+4 = 55 = exactly fills the board

type PieceDef = typeof PIECES[number];

const rotateCells = (cells: number[][]): number[][] =>
  cells.map(([r, c]) => [c, -r]);

const normalizeCells = (cells: number[][]): number[][] => {
  const minR = Math.min(...cells.map(([r]) => r));
  const minC = Math.min(...cells.map(([, c]) => c));
  return cells.map(([r, c]) => [r - minR, c - minC]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
};

const PiecePreview = ({ piece, selected, onClick }: { piece: PieceDef; selected: boolean; onClick: () => void }) => {
  const cells = piece.cells;
  const maxR = Math.max(...cells.map(([r]) => r));
  const maxC = Math.max(...cells.map(([, c]) => c));
  const cellSet = new Set(cells.map(([r, c]) => `${r},${c}`));

  return (
    <button
      onClick={onClick}
      className={`p-1.5 rounded-lg transition-all border-2 ${
        selected ? `${piece.color} border-primary ring-2 ring-primary/50 glow-primary` : "bg-card border-border hover:border-primary/40"
      }`}
    >
      {Array.from({ length: maxR + 1 }, (_, r) => (
        <div key={r} className="flex">
          {Array.from({ length: maxC + 1 }, (_, c) => (
            <div
              key={c}
              className={`w-4 h-4 rounded-sm ${
                cellSet.has(`${r},${c}`) ? piece.color : "bg-transparent"
              }`}
            />
          ))}
        </div>
      ))}
    </button>
  );
};

interface Props {
  level?: number;
  onComplete?: (score: number) => void;
}

export const KonoodleGame = ({ onComplete }: Props) => {
  const [board, setBoard] = useState<(string | null)[][]>(() =>
    Array.from({ length: BOARD_ROWS }, () => Array(BOARD_COLS).fill(null))
  );
  const [placed, setPlaced] = useState<Set<string>>(new Set());
  const [selectedPiece, setSelectedPiece] = useState<PieceDef | null>(null);
  const [rotation, setRotation] = useState(0);
  const [dragOverCell, setDragOverCell] = useState<[number, number] | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

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
    if (!canPlace(cells, r, c)) { sfx.error(); return; }
    sfx.place();
    const newBoard = board.map((row) => [...row]);
    cells.forEach(([dr, dc]) => { newBoard[r + dr][c + dc] = selectedPiece.id; });
    setBoard(newBoard);
    setPlaced(new Set([...placed, selectedPiece.id]));
    setSelectedPiece(null);
    setRotation(0);
    setDragOverCell(null);
    if (newBoard.every((row) => row.every((cell) => cell !== null))) {
      sfx.levelComplete();
      addPoints(200);
      updateStreak("konoodle");
      addWin("konoodle");
      toast.success("Konoodle solved! +200 points");
      onComplete?.(200);
    }
  };

  const removePiece = (id: string) => {
    sfx.click();
    setBoard(board.map((row) => row.map((cell) => (cell === id ? null : cell))));
    const newPlaced = new Set(placed);
    newPlaced.delete(id);
    setPlaced(newPlaced);
  };

  const reset = () => {
    sfx.click();
    setBoard(Array.from({ length: BOARD_ROWS }, () => Array(BOARD_COLS).fill(null)));
    setPlaced(new Set());
    setSelectedPiece(null);
    setRotation(0);
    setDragOverCell(null);
  };

  // Shake to randomly place a piece
  const shakePlace = useCallback(() => {
    const unplacedPieces = PIECES.filter(p => !placed.has(p.id));
    if (unplacedPieces.length === 0) return;
    const piece = unplacedPieces[Math.floor(Math.random() * unplacedPieces.length)];
    const rot = Math.floor(Math.random() * 4);
    const cells = (() => {
      let c = piece.cells.map(x => [...x]);
      for (let i = 0; i < rot % 4; i++) c = normalizeCells(rotateCells(c));
      return c;
    })();
    // Find all valid positions
    const validPositions: [number, number][] = [];
    for (let r = 0; r < BOARD_ROWS; r++)
      for (let c = 0; c < BOARD_COLS; c++)
        if (cells.every(([dr, dc]) => {
          const nr = r + dr, nc = c + dc;
          return nr >= 0 && nr < BOARD_ROWS && nc >= 0 && nc < BOARD_COLS && !board[nr][nc];
        })) validPositions.push([r, c]);
    
    if (validPositions.length === 0) { toast.error("No valid position for random placement!"); return; }
    const [pr, pc] = validPositions[Math.floor(Math.random() * validPositions.length)];
    sfx.shake();
    const newBoard = board.map((row) => [...row]);
    cells.forEach(([dr, dc]) => { newBoard[pr + dr][pc + dc] = piece.id; });
    setBoard(newBoard);
    setPlaced(new Set([...placed, piece.id]));
    setSelectedPiece(null);
    toast.success(`Randomly placed "${piece.id}"!`);

    if (newBoard.every((row) => row.every((cell) => cell !== null))) {
      sfx.levelComplete();
      addPoints(200);
      updateStreak("konoodle");
      addWin("konoodle");
      toast.success("Konoodle solved! +200 points");
      onComplete?.(200);
    }
  }, [board, placed, onComplete]);

  // Device shake detection
  useEffect(() => {
    let lastShake = 0;
    const handleMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;
      const force = Math.sqrt((acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2);
      if (force > 25 && Date.now() - lastShake > 1000) {
        lastShake = Date.now();
        shakePlace();
      }
    };
    window.addEventListener("devicemotion", handleMotion);
    return () => window.removeEventListener("devicemotion", handleMotion);
  }, [shakePlace]);

  // Drag handling for pieces
  const handleDragStart = (e: React.DragEvent, piece: PieceDef) => {
    setSelectedPiece(piece);
    setRotation(0);
    e.dataTransfer.setData("text/plain", piece.id);
  };

  const handleBoardDragOver = (e: React.DragEvent, r: number, c: number) => {
    e.preventDefault();
    setDragOverCell([r, c]);
  };

  const handleBoardDrop = (e: React.DragEvent, r: number, c: number) => {
    e.preventDefault();
    if (selectedPiece) placePiece(r, c);
    setDragOverCell(null);
  };

  const pieceColor = (id: string) => PIECES.find((p) => p.id === id)?.color || "bg-muted";

  // Preview cells for drag hover
  const dragPreviewCells = dragOverCell && selectedPiece ? (() => {
    const cells = getRotatedCells(selectedPiece, rotation);
    const [r, c] = dragOverCell;
    const valid = canPlace(cells, r, c);
    return { cells: cells.map(([dr, dc]) => [r + dr, c + dc] as [number, number]), valid };
  })() : null;
  const dragPreviewSet = new Set(dragPreviewCells?.cells.map(([r, c]) => `${r},${c}`) || []);

  const rotatedPreview = selectedPiece ? (() => {
    const cells = getRotatedCells(selectedPiece, rotation);
    const maxR = Math.max(...cells.map(([r]) => r));
    const maxC = Math.max(...cells.map(([, c]) => c));
    const cellSet = new Set(cells.map(([r, c]) => `${r},${c}`));
    return (
      <div className="bg-card border border-primary/30 rounded-lg p-2">
        <p className="text-[10px] font-display text-muted-foreground mb-1">PLACING</p>
        {Array.from({ length: maxR + 1 }, (_, r) => (
          <div key={r} className="flex">
            {Array.from({ length: maxC + 1 }, (_, c) => (
              <div key={c} className={`w-5 h-5 rounded-sm ${cellSet.has(`${r},${c}`) ? selectedPiece.color : "bg-transparent"}`} />
            ))}
          </div>
        ))}
      </div>
    );
  })() : null;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-xs font-display text-muted-foreground">
        {PIECES.length} pieces · {TOTAL_CELLS} cells · Fill the entire board!
      </div>
      <div ref={boardRef} className="bg-card border border-border p-2 rounded-xl">
        {board.map((row, r) => (
          <div key={r} className="flex">
            {row.map((cell, c) => (
              <div
                key={c}
                onClick={() => cell ? removePiece(cell) : placePiece(r, c)}
                onDragOver={(e) => handleBoardDragOver(e, r, c)}
                onDrop={(e) => handleBoardDrop(e, r, c)}
                className={`w-7 h-7 border border-border/20 rounded-sm cursor-pointer transition-all ${
                  cell ? `${pieceColor(cell)} shadow-[0_0_6px_hsl(var(--primary)/0.2)]`
                  : dragPreviewSet.has(`${r},${c}`) ? (dragPreviewCells?.valid ? "bg-primary/20 border-primary/40" : "bg-destructive/20 border-destructive/40")
                  : "bg-background/30 hover:bg-muted/50"
                }`}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 justify-center max-w-xs">
        {PIECES.filter((p) => !placed.has(p.id)).map((piece) => (
          <div
            key={piece.id}
            draggable
            onDragStart={(e) => handleDragStart(e, piece)}
          >
            <PiecePreview
              piece={piece}
              selected={selectedPiece?.id === piece.id}
              onClick={() => { setSelectedPiece(piece); setRotation(0); sfx.click(); }}
            />
          </div>
        ))}
      </div>

      {selectedPiece && (
        <div className="flex items-center gap-3">
          {rotatedPreview}
          <button onClick={() => { setRotation((r) => r + 1); sfx.rotate(); }} className="px-4 py-2 bg-card border border-border text-foreground rounded-lg font-display text-xs hover:border-secondary/50 transition-all">
            ROTATE ↻
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={shakePlace} className="flex items-center gap-1.5 px-4 py-2 bg-accent/10 border border-accent/30 text-accent rounded-xl font-display text-xs hover:border-accent/60 transition-all">
          <Smartphone className="h-3.5 w-3.5" />
          SHAKE / RANDOM
        </button>
        <button onClick={reset} className="px-6 py-2 bg-card border border-border text-foreground rounded-xl font-display text-sm hover:border-primary/50 transition-all">
          RESET
        </button>
      </div>
      <p className="text-xs text-muted-foreground text-center">Drag pieces or click to place · Shake your phone for random placement!</p>
    </div>
  );
};
