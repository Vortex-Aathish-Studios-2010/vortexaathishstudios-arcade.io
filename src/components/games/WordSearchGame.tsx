import { useState, useMemo } from "react";
import { addPoints, updateStreak } from "@/lib/streaks";
import { toast } from "sonner";

const GRID_SIZE = 10;
const WORD_LISTS = [
  ["REACT", "CODE", "TYPE", "LOOP", "NODE", "DATA"],
  ["BRAIN", "GAME", "PLAY", "SCORE", "LEVEL", "PUZZLE"],
  ["LOGIC", "THINK", "SOLVE", "GRID", "FIND", "WORD"],
];

const DIRECTIONS = [
  [0, 1], [1, 0], [1, 1], [0, -1], [1, -1],
];

const generateGrid = (words: string[]): { grid: string[][]; placements: Map<string, [number, number][]> } => {
  const grid: string[][] = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(""));
  const placements = new Map<string, [number, number][]>();

  for (const word of words) {
    let placed = false;
    for (let attempt = 0; attempt < 100 && !placed; attempt++) {
      const [dr, dc] = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
      const r = Math.floor(Math.random() * GRID_SIZE);
      const c = Math.floor(Math.random() * GRID_SIZE);
      const cells: [number, number][] = [];
      let valid = true;

      for (let i = 0; i < word.length; i++) {
        const nr = r + dr * i, nc = c + dc * i;
        if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE) { valid = false; break; }
        if (grid[nr][nc] !== "" && grid[nr][nc] !== word[i]) { valid = false; break; }
        cells.push([nr, nc]);
      }

      if (valid) {
        cells.forEach(([cr, cc], i) => { grid[cr][cc] = word[i]; });
        placements.set(word, cells);
        placed = true;
      }
    }
  }

  // Fill remaining
  for (let r = 0; r < GRID_SIZE; r++)
    for (let c = 0; c < GRID_SIZE; c++)
      if (grid[r][c] === "") grid[r][c] = String.fromCharCode(65 + Math.floor(Math.random() * 26));

  return { grid, placements };
};

export const WordSearchGame = () => {
  const words = useMemo(() => WORD_LISTS[Math.floor(Math.random() * WORD_LISTS.length)], []);
  const { grid, placements } = useMemo(() => generateGrid(words), [words]);
  const [found, setFound] = useState<Set<string>>(new Set());
  const [selecting, setSelecting] = useState<[number, number][]>([]);
  const [isMouseDown, setIsMouseDown] = useState(false);

  const cellKey = (r: number, c: number) => `${r},${c}`;

  const foundCells = useMemo(() => {
    const s = new Set<string>();
    found.forEach((word) => {
      placements.get(word)?.forEach(([r, c]) => s.add(cellKey(r, c)));
    });
    return s;
  }, [found, placements]);

  const selectingSet = useMemo(() => new Set(selecting.map(([r, c]) => cellKey(r, c))), [selecting]);

  const checkSelection = () => {
    const selected = selecting.map(([r, c]) => grid[r][c]).join("");
    const reversed = selected.split("").reverse().join("");
    for (const word of words) {
      if (!found.has(word) && (selected === word || reversed === word)) {
        const newFound = new Set([...found, word]);
        setFound(newFound);
        if (newFound.size === words.length) {
          addPoints(100);
          updateStreak();
          toast.success("All words found! +100 points");
        } else {
          toast.success(`Found "${word}"!`);
        }
      }
    }
    setSelecting([]);
    setIsMouseDown(false);
  };

  const handleCellDown = (r: number, c: number) => {
    setIsMouseDown(true);
    setSelecting([[r, c]]);
  };

  const handleCellEnter = (r: number, c: number) => {
    if (!isMouseDown) return;
    if (!selectingSet.has(cellKey(r, c))) {
      setSelecting((prev) => [...prev, [r, c]]);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="bg-muted/30 p-2 rounded-xl select-none"
        onMouseUp={checkSelection}
        onMouseLeave={() => { if (isMouseDown) checkSelection(); }}
        onTouchEnd={checkSelection}
      >
        {grid.map((row, r) => (
          <div key={r} className="flex">
            {row.map((letter, c) => (
              <div
                key={c}
                onMouseDown={() => handleCellDown(r, c)}
                onMouseEnter={() => handleCellEnter(r, c)}
                onTouchStart={() => handleCellDown(r, c)}
                onTouchMove={(e) => {
                  const touch = e.touches[0];
                  const el = document.elementFromPoint(touch.clientX, touch.clientY);
                  const rc = el?.getAttribute("data-rc");
                  if (rc) {
                    const [rr, cc] = rc.split(",").map(Number);
                    handleCellEnter(rr, cc);
                  }
                }}
                data-rc={`${r},${c}`}
                className={`w-8 h-8 flex items-center justify-center font-display text-sm font-bold cursor-pointer transition-colors rounded-sm
                  ${foundCells.has(cellKey(r, c)) ? "bg-primary/30 text-primary" : selectingSet.has(cellKey(r, c)) ? "bg-accent/30 text-accent" : "text-foreground hover:bg-muted/50"}
                `}
              >
                {letter}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        {words.map((word) => (
          <span key={word} className={`font-display text-xs px-2 py-1 rounded-full ${found.has(word) ? "bg-primary/20 text-primary line-through" : "bg-muted text-foreground"}`}>
            {word}
          </span>
        ))}
      </div>
    </div>
  );
};
