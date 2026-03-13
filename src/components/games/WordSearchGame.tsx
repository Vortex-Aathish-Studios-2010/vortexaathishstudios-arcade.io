import { useState, useMemo, useCallback, useRef } from "react";
import { addPoints, updateStreak, getGameLevel, incrementLevel, addWin } from "@/lib/streaks";
import { sfx } from "@/lib/sounds";
import { toast } from "sonner";

const BASE_GRID = 8;
const DIRECTIONS = [[0, 1], [1, 0], [1, 1], [0, -1], [1, -1], [-1, 0], [-1, -1], [-1, 1]];

const ALL_WORDS = [
  ["CODE", "TYPE", "LOOP", "NODE", "DATA", "GAME"],
  ["REACT", "BRAIN", "SCORE", "LEVEL", "LOGIC", "THINK"],
  ["PUZZLE", "QUEST", "POWER", "SMART", "FOCUS", "SHARP"],
  ["SKILL", "SPEED", "TRAIN", "LEARN", "BUILD", "CRAFT"],
  ["MEMORY", "ARCADE", "SEARCH", "HIDDEN", "TARGET", "MASTER"],
  ["GENIUS", "NEURAL", "CODING", "GAMING", "PLAYER", "WINNER"],
  ["CHAMPION", "DISCOVER", "TREASURE", "CREATIVE", "ADVANCED", "STRATEGY"],
  ["CHALLENGE", "BRILLIANT", "KNOWLEDGE", "DEVELOPER", "ALGORITHM", "ARCHITECT"],
  ["INNOVATION", "INCREDIBLE", "TECHNOLOGY", "MASTERPLAN", "EXPERIENCE"],
];

const getConfig = (level: number) => {
  const gridSize = Math.min(BASE_GRID + Math.floor((level - 1) * 1.2), 18);
  const wordSetIdx = Math.min(level - 1, ALL_WORDS.length - 1);
  const wordCount = Math.min(3 + level, 8);
  return { gridSize, words: ALL_WORDS[wordSetIdx].slice(0, wordCount) };
};

const generateGrid = (words: string[], gridSize: number) => {
  const grid: string[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(""));
  const placements = new Map<string, [number, number][]>();
  for (const word of words) {
    let placed = false;
    for (let attempt = 0; attempt < 300 && !placed; attempt++) {
      const [dr, dc] = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
      const r = Math.floor(Math.random() * gridSize);
      const c = Math.floor(Math.random() * gridSize);
      const cells: [number, number][] = [];
      let valid = true;
      for (let i = 0; i < word.length; i++) {
        const nr = r + dr * i, nc = c + dc * i;
        if (nr < 0 || nr >= gridSize || nc < 0 || nc >= gridSize) { valid = false; break; }
        if (grid[nr][nc] !== "" && grid[nr][nc] !== word[i]) { valid = false; break; }
        cells.push([nr, nc]);
      }
      if (valid) { cells.forEach(([cr, cc], i) => { grid[cr][cc] = word[i]; }); placements.set(word, cells); placed = true; }
    }
  }
  for (let r = 0; r < gridSize; r++)
    for (let c = 0; c < gridSize; c++)
      if (grid[r][c] === "") grid[r][c] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  return { grid, placements };
};

interface Props {
  level?: number;
  onComplete?: (score: number) => void;
}

export const WordSearchGame = ({ level: propLevel, onComplete }: Props) => {
  const [currentLevel, setCurrentLevel] = useState(propLevel || getGameLevel("wordsearch"));
  const config = useMemo(() => getConfig(currentLevel), [currentLevel]);
  const { grid, placements } = useMemo(() => generateGrid(config.words, config.gridSize), [currentLevel]);
  const [found, setFound] = useState<Set<string>>(new Set());
  const [selecting, setSelecting] = useState<[number, number][]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [levelComplete, setLevelComplete] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const cellKey = (r: number, c: number) => `${r},${c}`;
  const foundCells = useMemo(() => {
    const s = new Set<string>();
    found.forEach((word) => { placements.get(word)?.forEach(([r, c]) => s.add(cellKey(r, c))); });
    return s;
  }, [found, placements]);
  const selectingSet = useMemo(() => new Set(selecting.map(([r, c]) => cellKey(r, c))), [selecting]);

  // Check if adding a cell keeps selection in a straight line
  const isValidLineCell = useCallback((r: number, c: number, current: [number, number][]) => {
    if (current.length === 0) return true;
    if (current.length === 1) {
      const [r0, c0] = current[0];
      const dr = Math.abs(r - r0), dc = Math.abs(c - c0);
      return dr <= 1 && dc <= 1 && (dr + dc > 0); // adjacent
    }
    // Must continue same direction
    const [r0, c0] = current[0];
    const [r1, c1] = current[1];
    const dirR = Math.sign(r1 - r0), dirC = Math.sign(c1 - c0);
    const last = current[current.length - 1];
    return r === last[0] + dirR && c === last[1] + dirC;
  }, []);

  const tryMatchWord = useCallback((sel: [number, number][]) => {
    if (sel.length < 2) return;
    const selected = sel.map(([r, c]) => grid[r][c]).join("");
    const reversed = selected.split("").reverse().join("");
    for (const word of config.words) {
      if (!found.has(word) && (selected === word || reversed === word)) {
        const newFound = new Set([...found, word]);
        setFound(newFound);
        sfx.wordFound();
        if (newFound.size === config.words.length) {
          const pts = 80 + currentLevel * 30;
          addPoints(pts);
          updateStreak("wordsearch");
          addWin("wordsearch");
          incrementLevel("wordsearch");
          sfx.levelComplete();
          toast.success(`All words found! +${pts} points`);
          setLevelComplete(true);
          onComplete?.(pts);
        } else toast.success(`Found "${word}"!`);
        setSelecting([]);
        return;
      }
    }
    setSelecting([]);
  }, [grid, config.words, found, currentLevel, onComplete]);

  // Click-to-select: builds a line one cell at a time
  const handleCellClick = useCallback((r: number, c: number) => {
    if (isDragging) return; // Don't handle click after drag
    sfx.click();
    
    if (selecting.length === 0) {
      setSelecting([[r, c]]);
      return;
    }
    
    // If clicking the same cell, deselect
    if (selecting.length > 0 && selecting[selecting.length - 1][0] === r && selecting[selecting.length - 1][1] === c) {
      setSelecting(prev => prev.slice(0, -1));
      return;
    }
    
    if (isValidLineCell(r, c, selecting)) {
      const newSel = [...selecting, [r, c] as [number, number]];
      setSelecting(newSel);
      // Auto-check on each addition
      const selected = newSel.map(([rr, cc]) => grid[rr][cc]).join("");
      const reversed = selected.split("").reverse().join("");
      for (const word of config.words) {
        if (!found.has(word) && (selected === word || reversed === word)) {
          const newFound = new Set([...found, word]);
          setFound(newFound);
          sfx.wordFound();
          if (newFound.size === config.words.length) {
            const pts = 80 + currentLevel * 30;
            addPoints(pts);
            updateStreak("wordsearch");
            addWin("wordsearch");
            incrementLevel("wordsearch");
            sfx.levelComplete();
            toast.success(`All words found! +${pts} points`);
            setLevelComplete(true);
            onComplete?.(pts);
          } else toast.success(`Found "${word}"!`);
          setSelecting([]);
          return;
        }
      }
    } else {
      // Reset and start new selection
      setSelecting([[r, c]]);
    }
  }, [selecting, isDragging, isValidLineCell, grid, config.words, found, currentLevel, onComplete]);

  // Drag selection
  const handleDragStart = useCallback((r: number, c: number) => {
    setIsDragging(true);
    setSelecting([[r, c]]);
    sfx.click();
  }, []);

  const handleDragEnter = useCallback((r: number, c: number) => {
    if (!isDragging) return;
    if (selectingSet.has(cellKey(r, c))) return;
    if (isValidLineCell(r, c, selecting)) {
      setSelecting(prev => [...prev, [r, c]]);
    }
  }, [isDragging, selectingSet, isValidLineCell, selecting]);

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    tryMatchWord(selecting);
  }, [isDragging, selecting, tryMatchWord]);

  const getCellFromTouch = useCallback((touch: { clientX: number; clientY: number }): [number, number] | null => {
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const rc = el?.getAttribute("data-rc");
    if (rc) {
      const [r, c] = rc.split(",").map(Number);
      return [r, c];
    }
    return null;
  }, []);

  const handleNextLevel = () => {
    const next = currentLevel + 1;
    setCurrentLevel(next);
    setFound(new Set());
    setSelecting([]);
    setLevelComplete(false);
  };

  const cellSize = config.gridSize > 14 ? "w-5 h-5 text-[10px]" : config.gridSize > 12 ? "w-6 h-6 text-[11px]" : "w-8 h-8 text-sm";

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-xs font-display text-muted-foreground">
        Level {currentLevel} · Grid: {config.gridSize}×{config.gridSize}
      </div>
      <p className="text-[10px] text-muted-foreground/60">Click letters in a line or drag to select</p>
      <div
        ref={gridRef}
        className="bg-card border border-border p-2 rounded-xl select-none touch-none"
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchEnd={handleDragEnd}
      >
        {grid.map((row, r) => (
          <div key={r} className="flex">
            {row.map((letter, c) => (
              <div
                key={c}
                data-rc={`${r},${c}`}
                onMouseDown={(e) => { e.preventDefault(); handleDragStart(r, c); }}
                onMouseEnter={() => handleDragEnter(r, c)}
                onClick={() => { if (!isDragging) handleCellClick(r, c); }}
                onTouchStart={(e) => { e.preventDefault(); handleDragStart(r, c); }}
                onTouchMove={(e) => {
                  const touch = e.touches[0];
                  const cell = getCellFromTouch(touch);
                  if (cell) handleDragEnter(cell[0], cell[1]);
                }}
                className={`${cellSize} flex items-center justify-center font-display font-bold cursor-pointer transition-all rounded-sm
                  ${foundCells.has(cellKey(r, c)) ? "bg-primary/30 text-primary text-glow-primary" : selectingSet.has(cellKey(r, c)) ? "bg-accent/30 text-accent" : "text-foreground/80 hover:bg-muted/50"}
                `}
              >
                {letter}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {config.words.map((word) => (
          <span key={word} className={`font-display text-xs px-3 py-1 rounded-full border transition-all ${found.has(word) ? "bg-primary/20 border-primary/40 text-primary line-through glow-primary" : "bg-card border-border text-foreground"}`}>
            {word}
          </span>
        ))}
      </div>
      {selecting.length > 0 && !isDragging && (
        <div className="flex gap-2">
          <span className="px-4 py-1.5 bg-accent/10 border border-accent/30 rounded-lg font-display text-xs text-accent">
            {selecting.map(([r, c]) => grid[r][c]).join("")}
          </span>
          <button
            onClick={() => setSelecting([])}
            className="px-3 py-1.5 bg-card border border-border text-foreground rounded-lg font-display text-xs hover:border-destructive/50 transition-all"
          >
            CLEAR
          </button>
        </div>
      )}
      {levelComplete && (
        <button
          onClick={handleNextLevel}
          className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-display text-sm glow-primary hover:brightness-110 transition-all"
        >
          NEXT LEVEL →
        </button>
      )}
    </div>
  );
};
