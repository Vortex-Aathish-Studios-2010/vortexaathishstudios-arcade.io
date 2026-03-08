import { useState, useMemo, useCallback } from "react";
import { addPoints, updateStreak, getGameLevel, incrementLevel, addWin } from "@/lib/streaks";
import { sfx } from "@/lib/sounds";
import { toast } from "sonner";

const BASE_GRID = 8;
const DIRECTIONS = [[0, 1], [1, 0], [1, 1], [0, -1], [1, -1]];

const ALL_WORDS = [
  // 3-4 letter
  ["CODE", "TYPE", "LOOP", "NODE", "DATA", "GAME"],
  // 4-5 letter
  ["REACT", "BRAIN", "SCORE", "LEVEL", "LOGIC", "THINK"],
  // 5 letter
  ["PUZZLE", "QUEST", "POWER", "SMART", "FOCUS", "SHARP"],
  // 5-6 letter
  ["SKILL", "SPEED", "TRAIN", "LEARN", "BUILD", "CRAFT"],
  // 6 letter
  ["MEMORY", "ARCADE", "SEARCH", "HIDDEN", "TARGET", "MASTER"],
  // 6-7 letter
  ["GENIUS", "NEURAL", "CODING", "GAMING", "PLAYER", "WINNER"],
  // 7+ letter
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
  const { grid, placements } = useMemo(() => generateGrid(config.words, config.gridSize), [currentLevel, config]);
  const [found, setFound] = useState<Set<string>>(new Set());
  const [selecting, setSelecting] = useState<[number, number][]>([]);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [levelComplete, setLevelComplete] = useState(false);

  const cellKey = (r: number, c: number) => `${r},${c}`;
  const foundCells = useMemo(() => {
    const s = new Set<string>();
    found.forEach((word) => { placements.get(word)?.forEach(([r, c]) => s.add(cellKey(r, c))); });
    return s;
  }, [found, placements]);
  const selectingSet = useMemo(() => new Set(selecting.map(([r, c]) => cellKey(r, c))), [selecting]);

  const checkSelection = useCallback(() => {
    const selected = selecting.map(([r, c]) => grid[r][c]).join("");
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
      }
    }
    setSelecting([]);
    setIsMouseDown(false);
  }, [selecting, grid, config.words, found, currentLevel, onComplete]);

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
        Grid: {config.gridSize}×{config.gridSize} · Words up to {Math.max(...config.words.map(w => w.length))} letters
      </div>
      <div
        className="bg-card border border-border p-2 rounded-xl select-none"
        onMouseUp={checkSelection}
        onMouseLeave={() => { if (isMouseDown) checkSelection(); }}
        onTouchEnd={checkSelection}
      >
        {grid.map((row, r) => (
          <div key={r} className="flex">
            {row.map((letter, c) => (
              <div
                key={c}
                onMouseDown={() => { setIsMouseDown(true); setSelecting([[r, c]]); sfx.click(); }}
                onMouseEnter={() => { if (isMouseDown && !selectingSet.has(cellKey(r, c))) setSelecting((prev) => [...prev, [r, c]]); }}
                onTouchStart={() => { setIsMouseDown(true); setSelecting([[r, c]]); sfx.click(); }}
                onTouchMove={(e) => {
                  const touch = e.touches[0];
                  const el = document.elementFromPoint(touch.clientX, touch.clientY);
                  const rc = el?.getAttribute("data-rc");
                  if (rc) { const [rr, cc] = rc.split(",").map(Number); if (!selectingSet.has(cellKey(rr, cc))) setSelecting((prev) => [...prev, [rr, cc]]); }
                }}
                data-rc={`${r},${c}`}
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
