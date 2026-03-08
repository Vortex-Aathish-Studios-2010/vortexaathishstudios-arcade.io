import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { addPoints, updateStreak, addWin } from "@/lib/streaks";
import { sfx } from "@/lib/sounds";
import { toast } from "sonner";
import { Shuffle, Eye, RotateCw } from "lucide-react";
import { PIECES, BOARD_ROWS, BOARD_COLS, createEmptyBoard, solvePuzzle, type PieceDef, type BoardState, type Placement } from "@/lib/konoodleSolver";

const PiecePreview = ({
  piece,
  selected,
  onClick,
  onDragStart,
}: {
  piece: PieceDef;
  selected: boolean;
  onClick: () => void;
  onDragStart?: (e: React.DragEvent) => void;
}) => {
  const cells = piece.orientations[0];
  const maxR = Math.max(...cells.map(([r]) => r));
  const maxC = Math.max(...cells.map(([, c]) => c));
  const cellSet = new Set(cells.map(([r, c]) => `${r},${c}`));

  return (
    <button
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className={`p-1.5 rounded-lg transition-all border-2 cursor-grab active:cursor-grabbing ${
        selected ? "border-primary ring-2 ring-primary/50 glow-primary" : "bg-card border-border hover:border-primary/40"
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
  const [showingSolution, setShowingSolution] = useState(false);
  const [shuffling, setShuffling] = useState(false);
  const [hasShuffled, setHasShuffled] = useState(false);
  const cachedSolutionRef = useRef<Placement[] | null>(null);
  const [dragOverCell, setDragOverCell] = useState<[number, number] | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const placedIds = new Set(placed.keys());

  const getRotatedCells = (piece: PieceDef, rot: number) => {
    return piece.orientations[rot % piece.orientations.length];
  };

  const canPlace = (cells: number[][], r: number, c: number, boardState: BoardState = board) =>
    cells.every(([dr, dc]) => {
      const nr = r + dr, nc = c + dc;
      return nr >= 0 && nr < BOARD_ROWS && nc >= 0 && nc < BOARD_COLS && !boardState[nr][nc];
    });

  const doPlace = (piece: PieceDef, cells: number[][], r: number, c: number, currentBoard: BoardState, currentPlaced: Map<string, [number, number][]>) => {
    const newBoard = currentBoard.map((row) => [...row]);
    const placedCells: [number, number][] = [];
    cells.forEach(([dr, dc]) => {
      newBoard[r + dr][c + dc] = piece.id;
      placedCells.push([r + dr, c + dc]);
    });
    const newPlaced = new Map(currentPlaced);
    newPlaced.set(piece.id, placedCells);
    return { newBoard, newPlaced, placedCells };
  };

  const placePiece = (r: number, c: number) => {
    if (!selectedPiece || placedIds.has(selectedPiece.id)) return;
    const cells = getRotatedCells(selectedPiece, rotation);
    if (!canPlace(cells, r, c)) { sfx.error(); return; }
    sfx.place();
    const { newBoard, newPlaced } = doPlace(selectedPiece, cells, r, c, board, placed);
    setBoard(newBoard);
    setPlaced(newPlaced);
    setLastPlacedId(selectedPiece.id);
    setSelectedPiece(null);
    setRotation(0);
    setShowingSolution(false);
    setDragOverCell(null);
    checkWin(newBoard);
  };

  const checkWin = (b: BoardState) => {
    if (b.every((row) => row.every((cell) => cell !== null))) {
      sfx.levelComplete();
      addPoints(200);
      updateStreak("konoodle");
      addWin("konoodle");
      onComplete?.(200);
    }
  };

  const removePiece = (id: string) => {
    if (showingSolution) return;
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
    setShowingSolution(false);
    setShuffling(false);
    setHasShuffled(false);
  };

  // Drag and drop — create a custom drag image matching board cell size
  const handleDragStart = (e: React.DragEvent, piece: PieceDef) => {
    setSelectedPiece(piece);
    setRotation(0);
    e.dataTransfer.setData("text/plain", piece.id);
    e.dataTransfer.effectAllowed = "move";

    // Build a canvas drag image sized to board cells (28px each)
    const cells = piece.orientations[0];
    const maxR = Math.max(...cells.map(([r]) => r)) + 1;
    const maxC = Math.max(...cells.map(([, c]) => c)) + 1;
    const cellSize = 28;
    const canvas = document.createElement("canvas");
    canvas.width = maxC * cellSize;
    canvas.height = maxR * cellSize;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      // Get computed color from the piece's tailwind class
      const tempDiv = document.createElement("div");
      tempDiv.className = piece.color;
      document.body.appendChild(tempDiv);
      const color = getComputedStyle(tempDiv).backgroundColor;
      document.body.removeChild(tempDiv);

      cells.forEach(([r, c]) => {
        ctx.fillStyle = color || "#8b5cf6";
        ctx.beginPath();
        ctx.roundRect(c * cellSize + 1, r * cellSize + 1, cellSize - 2, cellSize - 2, 3);
        ctx.fill();
      });
    }
    e.dataTransfer.setDragImage(canvas, cellSize / 2, cellSize / 2);
  };

  const handleBoardDragOver = (e: React.DragEvent, r: number, c: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCell([r, c]);
  };

  const handleBoardDrop = (e: React.DragEvent, r: number, c: number) => {
    e.preventDefault();
    if (selectedPiece) placePiece(r, c);
    setDragOverCell(null);
  };

  const handleBoardDragLeave = () => {
    setDragOverCell(null);
  };

  // Drag preview cells
  const dragPreviewCells = dragOverCell && selectedPiece ? (() => {
    const cells = getRotatedCells(selectedPiece, rotation);
    const [r, c] = dragOverCell;
    const valid = canPlace(cells, r, c);
    return { cells: cells.map(([dr, dc]) => [r + dr, c + dc] as [number, number]), valid };
  })() : null;
  const dragPreviewSet = new Set(dragPreviewCells?.cells.map(([r, c]) => `${r},${c}`) || []);

  // Shuffle with cover/reveal animation — only commits if arrangement is solvable
  const shakeLastPiece = useCallback(() => {
    if (!lastPlacedId) return;
    const piece = PIECES.find(p => p.id === lastPlacedId);
    if (!piece) return;

    setShuffling(true);
    sfx.shake();

    setTimeout(() => {
      const boardWithout = board.map(row => row.map(cell => cell === lastPlacedId ? null : cell));

      type Candidate = { cells: number[][]; r: number; c: number };
      const candidates: Candidate[] = [];
      for (const orientation of piece.orientations) {
        for (let r = 0; r < BOARD_ROWS; r++)
          for (let c = 0; c < BOARD_COLS; c++)
            if (canPlace(orientation, r, c, boardWithout))
              candidates.push({ cells: orientation, r, c });
      }

      // Shuffle and pick a random valid candidate immediately (no heavy solve check)
      for (let i = candidates.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
      }

      let foundBoard: BoardState | null = null;
      let foundCells: [number, number][] = [];

      if (candidates.length > 0) {
        // Try ALL candidates until we find one with a known solution
        for (const cand of candidates) {
          const testBoard = boardWithout.map(row => [...row]);
          const pc: [number, number][] = [];
          cand.cells.forEach(([dr, dc]) => {
            testBoard[cand.r + dr][cand.c + dc] = lastPlacedId;
            pc.push([cand.r + dr, cand.c + dc]);
          });
          const currentPlacedIds = new Set(placed.keys());
          const sol = solvePuzzle(testBoard, currentPlacedIds, 500000);
          if (sol !== null) {
            foundBoard = testBoard;
            foundCells = pc;
            cachedSolutionRef.current = sol;
            break;
          }
        }
      }

      if (foundBoard) {
        setBoard(foundBoard);
        const newPlaced = new Map(placed);
        newPlaced.set(lastPlacedId, foundCells);
        setPlaced(newPlaced);
      }

      setTimeout(() => {
        setShuffling(false);
        setHasShuffled(true);
        sfx.place();
      }, 400);
    }, 400);
  }, [board, placed, lastPlacedId]);

  // Solve puzzle — use cached solution from shuffle if available
  const handleSolve = useCallback(() => {
    setSolving(true);
    setTimeout(() => {
      // Use cached solution from shuffle first, then try solving fresh
      let solution = cachedSolutionRef.current;
      if (!solution || solution.length === 0) {
        solution = solvePuzzle(board, placedIds, 20000000);
      }

      setSolving(false);
      cachedSolutionRef.current = null;

      if (solution && solution.length > 0) {
        setShowingSolution(true);

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
            if (i === solution!.length - 1) {
              setTimeout(() => sfx.levelComplete(), 200);
            }
          }, (i + 1) * 350);
        });
      }
    }, 50);
  }, [board, placedIds]);

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

      {/* Board with shuffle cover animation */}
      <div ref={boardRef} className="relative bg-card border border-border p-2 rounded-xl">
        {board.map((row, r) => (
          <div key={r} className="flex">
            {row.map((cell, c) => (
              <div
                key={c}
                onClick={() => cell ? removePiece(cell) : placePiece(r, c)}
                onDragOver={(e) => handleBoardDragOver(e, r, c)}
                onDrop={(e) => handleBoardDrop(e, r, c)}
                onDragLeave={handleBoardDragLeave}
                className={`w-7 h-7 border border-border/20 rounded-sm cursor-pointer transition-all ${
                  cell ? `${pieceColor(cell)} shadow-[0_0_6px_rgba(0,0,0,0.15)]`
                  : dragPreviewSet.has(`${r},${c}`)
                    ? (dragPreviewCells?.valid ? "bg-primary/20 border-primary/40" : "bg-destructive/20 border-destructive/40")
                    : "bg-background/30 hover:bg-muted/50"
                }`}
              />
            ))}
          </div>
        ))}

        {/* Shuffle cover overlay */}
        <AnimatePresence>
          {shuffling && (
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              exit={{ scaleY: 0, transition: { duration: 0.4, ease: "easeIn" } }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              style={{ originY: 0 }}
              className="absolute inset-0 rounded-xl bg-gradient-to-b from-primary via-secondary to-accent flex items-center justify-center z-10"
            >
              <div className="animate-spin" style={{ animationDuration: "0.6s" }}>
                <Shuffle className="h-8 w-8 text-primary-foreground" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Piece tray — hidden until first shuffle */}
      {(hasShuffled || placed.size === 0) && (
        <div className="flex flex-wrap gap-2 justify-center max-w-sm">
          {PIECES.filter((p) => !placedIds.has(p.id)).map((piece) => (
            <PiecePreview
              key={piece.id}
              piece={piece}
              selected={selectedPiece?.id === piece.id}
              onClick={() => { setSelectedPiece(piece); setRotation(0); sfx.click(); }}
              onDragStart={(e) => handleDragStart(e, piece)}
            />
          ))}
        </div>
      )}

      {/* Rotation controls */}
      {selectedPiece && (
        <div className="flex items-center gap-3">
          {rotatedPreview}
          <button onClick={() => { setRotation((r) => r + 1); sfx.rotate(); }} className="px-4 py-2 bg-card border border-border text-foreground rounded-lg font-display text-xs hover:border-secondary/50 transition-all flex items-center gap-1.5">
            <RotateCw className="h-3.5 w-3.5" />
            ROTATE
          </button>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 flex-wrap justify-center">
        {lastPlacedId && !showingSolution && (
          <button
            onClick={shakeLastPiece}
            disabled={shuffling}
            className="flex items-center gap-1.5 px-4 py-2 bg-accent/10 border border-accent/30 text-accent rounded-xl font-display text-xs hover:border-accent/60 transition-all disabled:opacity-40"
          >
            <Shuffle className="h-3.5 w-3.5" />
            SHUFFLE "{lastPlacedId}"
          </button>
        )}
        {hasShuffled && (
          <button
            onClick={handleSolve}
            disabled={solving || showingSolution}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary/10 border border-primary/30 text-primary rounded-xl font-display text-xs hover:border-primary/60 transition-all disabled:opacity-40"
          >
            <Eye className="h-3.5 w-3.5" />
            {solving ? "SOLVING..." : "SHOW SOLUTION"}
          </button>
        )}
        <button onClick={reset} className="px-6 py-2 bg-card border border-border text-foreground rounded-xl font-display text-sm hover:border-primary/50 transition-all">
          RESET
        </button>
      </div>
      <p className="text-xs text-muted-foreground text-center">Drag pieces onto the board or click to place · Tap placed pieces to remove</p>
    </div>
  );
};
