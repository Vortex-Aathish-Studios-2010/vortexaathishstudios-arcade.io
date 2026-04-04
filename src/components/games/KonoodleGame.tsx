import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { addPoints, updateStreak, addWin } from "@/lib/streaks";
import { sfx } from "@/lib/sounds";
import { toast } from "sonner";
import { Shuffle, Eye, RotateCw } from "lucide-react";
import { PIECES, BOARD_ROWS, BOARD_COLS, createEmptyBoard, solvePuzzle, type PieceDef, type BoardState, type Placement } from "@/lib/konoodleSolver";

const isTouchDevice = () => 'ontouchstart' in window || navigator.maxTouchPoints > 0;

const PiecePreview = ({
  piece,
  selected,
  onPointerDown,
}: {
  piece: PieceDef;
  selected: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
}) => {
  const cells = piece.orientations[0];
  const maxR = Math.max(...cells.map(([r]) => r));
  const maxC = Math.max(...cells.map(([, c]) => c));
  const cellSet = new Set(cells.map(([r, c]) => `${r},${c}`));

  return (
    <div
      onPointerDown={onPointerDown}
      className={`p-1.5 rounded-lg transition-all border-2 cursor-grab active:cursor-grabbing touch-none ${
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
    </div>
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
  const [shuffling, setShuffling] = useState(false);
  const [hasShuffled, setHasShuffled] = useState(false);
  const [removingPieces, setRemovingPieces] = useState<Set<string>>(new Set());
  
  // New Drag State
  const [draggingPiece, setDraggingPiece] = useState<PieceDef | null>(null);
  const [dragPointerPos, setDragPointerPos] = useState({ x: 0, y: 0 });
  const [dragOverCell, setDragOverCell] = useState<[number, number] | null>(null);
  
  const shuffledPieceIdRef = useRef<string | null>(null);
  const cachedSolutionRef = useRef<Placement[] | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
    if (solving) return;
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
    setShuffling(false);
    setHasShuffled(false);
    setRemovingPieces(new Set());
    shuffledPieceIdRef.current = null;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingPiece) return;
    setDragPointerPos({ x: e.clientX, y: e.clientY });

    const boardRect = boardRef.current?.getBoundingClientRect();
    if (boardRect) {
      const x = e.clientX - boardRect.left;
      const y = e.clientY - boardRect.top;
      const cellSize = 30; // 28 + borders approx
      const r = Math.floor(y / cellSize);
      const c = Math.floor(x / cellSize);
      
      if (r >= 0 && r < BOARD_ROWS && c >= 0 && c < BOARD_COLS) {
        setDragOverCell([r, c]);
      } else {
        setDragOverCell(null);
      }
    }
  };

  const handlePointerUp = () => {
    if (!draggingPiece) return;
    if (dragOverCell) {
      placePiece(dragOverCell[0], dragOverCell[1]);
    } else {
      // Re-place if it was dragged from board
      const placement = placed.get(draggingPiece.id);
      if (placement) {
        setBoard(prev => {
          const b = prev.map(r => [...r]);
          placement.forEach(([r, c]) => { b[r][c] = draggingPiece.id; });
          return b;
        });
      }
      sfx.click();
    }
    setDraggingPiece(null);
    setDragOverCell(null);
  };

  const startDragging = (piece: PieceDef, fromBoard = false) => {
    if (fromBoard) {
      const placement = placed.get(piece.id);
      if (placement) {
        setBoard(prev => {
          const b = prev.map(r => [...r]);
          placement.forEach(([r, c]) => { b[r][c] = null; });
          return b;
        });
      }
    }
    setDraggingPiece(piece);
    setSelectedPiece(piece);
    // Preserve current rotation instead of resetting
    if (!fromBoard && !selectedPiece) {
      setRotation(0);
    }
  };

  // Drag preview cells
  const dragPreviewCells = dragOverCell && selectedPiece ? (() => {
    const cells = getRotatedCells(selectedPiece, rotation);
    const [r, c] = dragOverCell;
    const valid = canPlace(cells, r, c);
    return { cells: cells.map(([dr, dc]) => [r + dr, c + dc] as [number, number]), valid };
  })() : null;
  const dragPreviewSet = new Set(dragPreviewCells?.cells.map(([r, c]) => `${r},${c}`) || []);

  // Shuffle: solve empty board once, extract the target piece's placement
  const shakeLastPiece = useCallback(() => {
    if (!lastPlacedId) return;

    setShuffling(true);
    sfx.shake();

    // Use requestAnimationFrame + setTimeout to keep UI responsive
    setTimeout(() => {
      // Solve a completely empty board — one call, guaranteed fast
      const emptyBoard = createEmptyBoard();
      const solution = solvePuzzle(emptyBoard, new Set(), 2000000);

      if (solution) {
        // Find where our target piece lands in the full solution
        const targetStep = solution.find(s => s.pieceId === lastPlacedId);
        if (targetStep) {
          // Place only the target piece, cache the rest as hints
          const newBoard = createEmptyBoard();
          targetStep.cells.forEach(([r, c]) => { newBoard[r][c] = lastPlacedId; });

          const newPlaced = new Map<string, [number, number][]>();
          newPlaced.set(lastPlacedId, targetStep.cells);

          cachedSolutionRef.current = solution.filter(s => s.pieceId !== lastPlacedId);

          setBoard(newBoard);
          setPlaced(newPlaced);
        }
      }

      setTimeout(() => {
        setShuffling(false);
        setHasShuffled(true);
        shuffledPieceIdRef.current = lastPlacedId;
        sfx.place();
      }, 300);
    }, 100);
  }, [lastPlacedId]);

  // Hint system — places one piece at a time if the board is solvable
  const handleHint = useCallback(() => {
    if (solving) return;
    setSolving(true);

    setTimeout(() => {
      let solution = cachedSolutionRef.current;
      
      const currentPlacedIds = new Set<string>();
      let emptyCells = 0;
      for (let r = 0; r < BOARD_ROWS; r++) {
        for (let c = 0; c < BOARD_COLS; c++) {
          if (board[r][c]) currentPlacedIds.add(board[r][c]!);
          else emptyCells++;
        }
      }

      if (emptyCells === 0) {
        setSolving(false);
        return; 
      }

      // If no valid cache or player added pieces, verify if current board is solvable
      // We assume if cached solution has right number of steps, it might still be valid, 
      // but to be safe we can just solve.
      if (!solution || solution.length !== Math.floor(emptyCells / 5)) { // Each piece is 5 blocks typically
         // Fast solve attempt to check viability
         solution = solvePuzzle(board, currentPlacedIds, 1000000);
      }

      if (solution && solution.length > 0) {
        const step = solution.shift()!; // Take first hint step
        cachedSolutionRef.current = solution; // Save remaining steps
        
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
        setSolving(false);
      } else {
        // Unsolvable! The hint HELPS by removing the most recent wrong piece.
        const shuffledId = shuffledPieceIdRef.current;
        const playerPieceIds = Array.from(placed.keys()).filter(id => id !== shuffledId);
        
        if (playerPieceIds.length > 0) {
            const wrongId = playerPieceIds[playerPieceIds.length - 1]; // Assume last placed piece is the dead end
            setBoard(prev => {
               const b = prev.map(r => [...r]);
               const cells = placed.get(wrongId);
               if (cells) cells.forEach(([r, c]) => { b[r][c] = null; });
               return b;
            });
            setPlaced(prev => {
                const p = new Map(prev);
                p.delete(wrongId);
                return p;
            });
            sfx.mismatch?.();
            toast.info(`Hint: Removed piece '${wrongId}' as it leads to a dead end!`);
        } else {
            sfx.error();
            toast.error("No valid moves! Something is wrong.");
        }
        setSolving(false);
      }
    }, 50);
  }, [board, placed]);

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
    <div 
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className="flex flex-col items-center gap-4 touch-none select-none"
    >
      <div className="text-xs font-display text-muted-foreground">
        {PIECES.length} pieces · {BOARD_ROWS * BOARD_COLS} cells · Fill the entire board!
      </div>

      {/* Board with shuffle cover animation */}
      <div ref={boardRef} className="relative bg-card border border-border p-2 rounded-xl">
        {board.map((row, r) => (
          <div key={r} className="flex">
            {row.map((cell, c) => {
              const isRemoving = cell ? removingPieces.has(cell) : false;
              return (
                <motion.div
                  key={c}
                  animate={isRemoving ? { scale: 0, opacity: 0, rotate: 180 } : { scale: 1, opacity: 1, rotate: 0 }}
                  transition={isRemoving ? { duration: 0.5, ease: "easeIn" } : { duration: 0.2 }}
                  onPointerDown={(e) => {
                    if (cell && !isRemoving) {
                      e.stopPropagation();
                      const piece = PIECES.find(p => p.id === cell);
                      if (piece) startDragging(piece, true);
                    }
                  }}
                  className={`w-7 h-7 border border-border/20 rounded-sm transition-colors ${
                    cell ? `cursor-grab active:cursor-grabbing ${pieceColor(cell)} shadow-[0_0_6px_rgba(0,0,0,0.15)]`
                    : dragPreviewSet.has(`${r},${c}`)
                      ? (dragPreviewCells?.valid ? "bg-primary/20 border-primary/40" : "bg-destructive/20 border-destructive/40")
                      : "bg-background/30 hover:bg-muted/50"
                  }`}
                />
              );
            })}
          </div>
        ))}

        {/* Shuffle cover overlay */}
        <AnimatePresence>
          {shuffling && (
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              exit={{ scaleY: 0, transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] } }}
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
              onPointerDown={(e) => {
                e.preventDefault();
                startDragging(piece);
              }}
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
        {lastPlacedId && (
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
            onClick={handleHint}
            disabled={solving}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary/10 border border-primary/30 text-primary rounded-xl font-display text-xs hover:border-primary/60 transition-all disabled:opacity-40"
          >
            <Eye className="h-3.5 w-3.5" />
            {solving ? "THINKING..." : "GET HINT"}
          </button>
        )}
        <button onClick={reset} className="px-6 py-2 bg-card border border-border text-foreground rounded-xl font-display text-sm hover:border-primary/50 transition-all">
          RESET
        </button>
      </div>
      <p className="text-xs text-muted-foreground text-center">Drag pieces onto the board · Tap pieces to rotate before dragging</p>

      {/* Dragging Piece Visual */}
      <AnimatePresence>
        {draggingPiece && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="fixed pointer-events-none z-[100]"
            style={{ 
              left: dragPointerPos.x,
              top: dragPointerPos.y,
              transform: "translate(-50%, -50%)"
            }}
          >
             {(() => {
                const cells = getRotatedCells(draggingPiece, rotation);
                const maxR = Math.max(...cells.map(([r]) => r));
                const maxC = Math.max(...cells.map(([, c]) => c));
                const cellSet = new Set(cells.map(([r, c]) => `${r},${c}`));
                return (
                  <div className="flex flex-col">
                    {Array.from({ length: maxR + 1 }, (_, r) => (
                      <div key={r} className="flex">
                        {Array.from({ length: maxC + 1 }, (_, c) => (
                          <div key={c} className={`w-7 h-7 rounded-sm border border-black/10 ${cellSet.has(`${r},${c}`) ? draggingPiece.color : "bg-transparent"}`} />
                        ))}
                      </div>
                    ))}
                  </div>
                );
             })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
