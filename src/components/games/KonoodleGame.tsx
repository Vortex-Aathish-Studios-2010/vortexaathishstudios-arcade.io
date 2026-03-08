import { useState, useRef, useCallback } from "react";
import { addPoints, updateStreak, addWin } from "@/lib/streaks";
import { sfx } from "@/lib/sounds";
import { toast } from "sonner";
import { Shuffle, Eye, RotateCw } from "lucide-react";
import { PIECES, BOARD_ROWS, BOARD_COLS, createEmptyBoard, solvePuzzle, normalizeCells, type PieceDef, type BoardState, type Placement } from "@/lib/konoodleSolver";

const PiecePreview = ({ piece, selected, onClick }: { piece: PieceDef; selected: boolean; onClick: () => void }) => {
  const cells = piece.orientations[0];
  const maxR = Math.max(...cells.map(([r]) => r));
  const maxC = Math.max(...cells.map(([, c]) => c));
  const cellSet = new Set(cells.map(([r, c]) => `${r},${c}`));

  return (
    <button
      onClick={onClick}
      className={`p-1.5 rounded-lg transition-all border-2 ${
        selected ? `border-primary ring-2 ring-primary/50 glow-primary` : "bg-card border-border hover:border-primary/40"
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
  const [board, setBoard] = useState<BoardState>(createEmptyBoard);
  const [placed, setPlaced] = useState<Map<string, [number, number][]>>(new Map());
  const [selectedPiece, setSelectedPiece] = useState<PieceDef | null>(null);
  const [rotation, setRotation] = useState(0);
  const [lastPlacedId, setLastPlacedId] = useState<string | null>(null);
  const [solving, setSolving] = useState(false);
  const [solutionSteps, setSolutionSteps] = useState<Placement[] | null>(null);
  const [showingSolution, setShowingSolution] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);

  const placedIds = new Set(placed.keys());

  const getRotatedCells = (piece: PieceDef, rot: number) => {
    return piece.orientations[rot % piece.orientations.length];
  };

  const canPlace = (cells: number[][], r: number, c: number) =>
    cells.every(([dr, dc]) => {
      const nr = r + dr, nc = c + dc;
      return nr >= 0 && nr < BOARD_ROWS && nc >= 0 && nc < BOARD_COLS && !board[nr][nc];
    });

  const placePiece = (r: number, c: number) => {
    if (!selectedPiece || placedIds.has(selectedPiece.id)) return;
    const cells = getRotatedCells(selectedPiece, rotation);
    if (!canPlace(cells, r, c)) { sfx.error(); return; }
    sfx.place();
    const newBoard = board.map((row) => [...row]);
    const placedCells: [number, number][] = [];
    cells.forEach(([dr, dc]) => {
      newBoard[r + dr][c + dc] = selectedPiece.id;
      placedCells.push([r + dr, c + dc]);
    });
    setBoard(newBoard);
    const newPlaced = new Map(placed);
    newPlaced.set(selectedPiece.id, placedCells);
    setPlaced(newPlaced);
    setLastPlacedId(selectedPiece.id);
    setSelectedPiece(null);
    setRotation(0);
    setSolutionSteps(null);
    setShowingSolution(false);

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
    const newPlaced = new Map(placed);
    newPlaced.delete(id);
    setPlaced(newPlaced);
    if (lastPlacedId === id) setLastPlacedId(null);
  };

  const reset = () => {
    sfx.click();
    setBoard(createEmptyBoard());
    setPlaced(new Map());
    setSelectedPiece(null);
    setRotation(0);
    setLastPlacedId(null);
    setSolutionSteps(null);
    setShowingSolution(false);
  };

  // Shake: reposition the last placed piece randomly
  const shakeLastPiece = useCallback(() => {
    if (!lastPlacedId) return;
    const piece = PIECES.find(p => p.id === lastPlacedId);
    if (!piece) return;

    // Remove the piece first
    const boardWithout = board.map(row => row.map(cell => cell === lastPlacedId ? null : cell));
    
    // Try random orientations and positions
    const orientIdx = Math.floor(Math.random() * piece.orientations.length);
    const cells = piece.orientations[orientIdx];
    
    const validPositions: [number, number][] = [];
    for (let r = 0; r < BOARD_ROWS; r++)
      for (let c = 0; c < BOARD_COLS; c++)
        if (cells.every(([dr, dc]) => {
          const nr = r + dr, nc = c + dc;
          return nr >= 0 && nr < BOARD_ROWS && nc >= 0 && nc < BOARD_COLS && !boardWithout[nr][nc];
        })) validPositions.push([r, c]);

    if (validPositions.length === 0) {
      toast.error("No valid position found!");
      return;
    }

    const [pr, pc] = validPositions[Math.floor(Math.random() * validPositions.length)];
    sfx.shake();
    const newBoard = boardWithout.map(row => [...row]);
    const placedCells: [number, number][] = [];
    cells.forEach(([dr, dc]) => {
      newBoard[pr + dr][pc + dc] = lastPlacedId;
      placedCells.push([pr + dr, pc + dc]);
    });
    setBoard(newBoard);
    const newPlaced = new Map(placed);
    newPlaced.set(lastPlacedId, placedCells);
    setPlaced(newPlaced);
    toast.success(`Repositioned "${lastPlacedId}"!`);
  }, [board, placed, lastPlacedId]);

  // Solve: find solution and animate it
  const handleSolve = useCallback(() => {
    setSolving(true);
    // Run solver in a timeout to not block UI
    setTimeout(() => {
      const solution = solvePuzzle(board, placedIds);
      setSolving(false);
      if (solution) {
        setSolutionSteps(solution);
        setShowingSolution(true);
        toast.success("Solution found! Watch the pieces fill in.");
        // Animate placing pieces one by one
        let newBoard = board.map(r => [...r]);
        const newPlaced = new Map(placed);
        solution.forEach((step, i) => {
          setTimeout(() => {
            setBoard(prev => {
              const b = prev.map(r => [...r]);
              step.cells.forEach(([r, c]) => { b[r][c] = step.pieceId; });
              return b;
            });
            setPlaced(prev => {
              const p = new Map(prev);
              p.set(step.pieceId, step.cells);
              return p;
            });
            sfx.place();
          }, (i + 1) * 400);
        });
      } else {
        toast.error("No solution found. Try resetting and starting over.");
      }
    }, 50);
  }, [board, placedIds, placed]);

  const pieceColor = (id: string) => PIECES.find((p) => p.id === id)?.color || "bg-muted";

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
        {PIECES.length} pieces · {BOARD_ROWS * BOARD_COLS} cells · Fill the entire board!
      </div>
      <div ref={boardRef} className="bg-card border border-border p-2 rounded-xl">
        {board.map((row, r) => (
          <div key={r} className="flex">
            {row.map((cell, c) => (
              <div
                key={c}
                onClick={() => cell ? removePiece(cell) : placePiece(r, c)}
                className={`w-7 h-7 border border-border/20 rounded-sm cursor-pointer transition-all ${
                  cell ? `${pieceColor(cell)} shadow-[0_0_6px_rgba(0,0,0,0.15)]`
                  : "bg-background/30 hover:bg-muted/50"
                }`}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 justify-center max-w-xs">
        {PIECES.filter((p) => !placedIds.has(p.id)).map((piece) => (
          <PiecePreview
            key={piece.id}
            piece={piece}
            selected={selectedPiece?.id === piece.id}
            onClick={() => { setSelectedPiece(piece); setRotation(0); sfx.click(); }}
          />
        ))}
      </div>

      {selectedPiece && (
        <div className="flex items-center gap-3">
          {rotatedPreview}
          <button onClick={() => { setRotation((r) => r + 1); sfx.rotate(); }} className="px-4 py-2 bg-card border border-border text-foreground rounded-lg font-display text-xs hover:border-secondary/50 transition-all flex items-center gap-1.5">
            <RotateCw className="h-3.5 w-3.5" />
            ROTATE
          </button>
        </div>
      )}

      <div className="flex gap-2 flex-wrap justify-center">
        {lastPlacedId && !showingSolution && (
          <button onClick={shakeLastPiece} className="flex items-center gap-1.5 px-4 py-2 bg-accent/10 border border-accent/30 text-accent rounded-xl font-display text-xs hover:border-accent/60 transition-all">
            <Shuffle className="h-3.5 w-3.5" />
            SHAKE "{lastPlacedId}"
          </button>
        )}
        <button
          onClick={handleSolve}
          disabled={solving || showingSolution}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary/10 border border-primary/30 text-primary rounded-xl font-display text-xs hover:border-primary/60 transition-all disabled:opacity-40"
        >
          <Eye className="h-3.5 w-3.5" />
          {solving ? "SOLVING..." : "SHOW SOLUTION"}
        </button>
        <button onClick={reset} className="px-6 py-2 bg-card border border-border text-foreground rounded-xl font-display text-sm hover:border-primary/50 transition-all">
          RESET
        </button>
      </div>
      <p className="text-xs text-muted-foreground text-center">Click a piece then click the board · Tap placed pieces to remove</p>
    </div>
  );
};
