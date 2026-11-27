import { useEffect, useMemo, useRef, useState } from "react";
import {
  RotateCw,
  FlipHorizontal,
  Undo2,
  RotateCcw,
  LockKeyhole,
} from "lucide-react";
import {
  PIECES,
  BOARD_ROWS,
  BOARD_COLS,
  normalizeCells,
} from "@/lib/konoodleSolver";
import solution from "@/lib/konoodleSolution.json";
import { flipPiece, rotatePiece, placementAt } from "@/lib/konoodlePlacement";
import {
  addPoints,
  updateStreak,
  incrementLevel,
  getGameLevel,
} from "@/lib/streaks";
import { useMatchProgress } from "@/lib/matchPlay";
import { sfx } from "@/lib/sounds";
const colors: Record<string, string> = {
  F: "#d97979",
  I: "#75b9c2",
  L: "#dab473",
  N: "#80b19b",
  P: "#ab94c9",
  T: "#de9d75",
  U: "#82acd0",
  V: "#cd93b1",
  W: "#b9c875",
  Y: "#9098cb",
  Z: "#71b8ad",
};
type Placed = Record<string, number[][]>;
function Shape({ id, cells }: { id: string; cells: number[][] }) {
  const w = Math.max(...cells.map((c) => c[1])) + 1,
    h = Math.max(...cells.map((c) => c[0])) + 1;
  return (
    <svg
      viewBox={`0 0 ${w * 24} ${h * 24}`}
      style={{ aspectRatio: `${w}/${h}` }}
      aria-hidden="true"
    >
      {cells.map(([r, c]) => (
        <g key={r + "," + c}>
          <rect
            x={c * 24 + 1}
            y={r * 24 + 1}
            width="22"
            height="22"
            rx="6"
            fill={colors[id]}
          />
          <path
            d={`M${c * 24 + 6} ${r * 24 + 5}h12`}
            stroke="#ffffff"
            opacity=".35"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
      ))}
    </svg>
  );
}
export const KonoodleGame = ({
  level,
  onComplete,
}: {
  level?: number;
  onComplete?: (score: number) => void;
}) => {
  const [round, setRound] = useState(level || getGameLevel("konoodle"));
  const locked = useMemo(
    () => solution.slice(0, Math.max(0, 6 - round)),
    [round],
  );
  const initial = () =>
    Object.fromEntries(locked.map((p) => [p.pieceId, p.cells]));
  const [placed, setPlaced] = useState<Placed>(initial),
    [selected, setSelected] = useState<string | null>(null),
    [shape, setShape] = useState<number[][]>([]),
    [hover, setHover] = useState<number[] | null>(null),
    [won, setWon] = useState(false),
    [notice, setNotice] = useState(
      "Choose a piece. Drag it in, or tap a piece and then the board.",
    );
  const [ghost, setGhost] = useState<{ x: number; y: number } | null>(null);
  const board = useRef<HTMLDivElement>(null),
    drag = useRef<{
      id: string;
      x: number;
      y: number;
      offset: number[];
      touch: boolean;
      moved: boolean;
    } | null>(null),
    history = useRef<Placed[]>([]),
    suppressClick = useRef(false);
  const occupied = Object.entries(placed)
    .filter(([id]) => id !== selected)
    .flatMap(([, cells]) => cells);
  const candidate =
    hover && selected ? placementAt(shape, hover[0], hover[1], occupied) : null;
  const isLocked = (id: string) => locked.some((p) => p.pieceId === id);
  const inMatch = useMatchProgress(
    (Object.keys(placed).length - locked.length) * 10,
  );
  function choose(id: string) {
    if (won || isLocked(id) || selected === id) return;
    setSelected(id);
    setShape(
      placed[id]
        ? normalizeCells(placed[id])
        : PIECES.find((p) => p.id === id)!.cells,
    );
    setNotice("Rotate or flip, then place the piece.");
  }
  function place(row: number, col: number) {
    if (!selected || won) return;
    const cells = placementAt(shape, row, col, occupied);
    if (!cells) {
      setNotice("That piece does not fit there. Try rotating it.");
      sfx.error();
      return;
    }
    history.current.push(placed);
    const next = { ...placed, [selected]: cells };
    setPlaced(next);
    setSelected(null);
    setHover(null);
    setNotice("Nice fit. Choose the next piece.");
    sfx.place();
    if (Object.values(next).flat().length === BOARD_ROWS * BOARD_COLS) {
      setWon(true);
      const points = 200;
      addPoints(points);
      updateStreak("konoodle");
      if (!inMatch) incrementLevel("konoodle");
      sfx.levelComplete();
      onComplete?.(points);
      setNotice("Board complete. Every piece belongs.");
    }
  }
  function point(e: React.PointerEvent) {
    const rect = board.current?.getBoundingClientRect();
    if (!rect) return null;
    const offset = drag.current?.offset || [0, 0];
    const y = e.clientY - (drag.current?.touch ? 48 : 0);
    const r =
        Math.floor(((y - rect.top) / rect.height) * BOARD_ROWS) - offset[0],
      c =
        Math.floor(((e.clientX - rect.left) / rect.width) * BOARD_COLS) -
        offset[1];
    return [r, c];
  }
  function begin(e: React.PointerEvent, id: string, cell?: number[]) {
    if (won || isLocked(id)) return;
    e.preventDefault();
    choose(id);
    const cells =
      selected === id
        ? shape
        : placed[id]
          ? normalizeCells(placed[id])
          : PIECES.find((p) => p.id === id)!.cells;
    const minR = placed[id] ? Math.min(...placed[id].map((c) => c[0])) : 0,
      minC = placed[id] ? Math.min(...placed[id].map((c) => c[1])) : 0;
    drag.current = {
      id,
      x: e.clientX,
      y: e.clientY,
      offset: cell ? [cell[0] - minR, cell[1] - minC] : cells[0],
      touch: e.pointerType === "touch",
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function move(e: React.PointerEvent) {
    if (!drag.current) return;
    const d = drag.current;
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) < 5 && !d.moved) return;
    d.moved = true;
    const cell = point(e);
    setHover(cell);
    setGhost({ x: e.clientX, y: e.clientY - (d.touch ? 48 : 0) });
  }
  function end(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const cell = point(e);
    if (d.moved) {
      suppressClick.current = true;
      if (cell) place(cell[0], cell[1]);
    }
    drag.current = null;
    setGhost(null);
    setHover(null);
  }
  function cancel() {
    drag.current = null;
    setGhost(null);
    setHover(null);
  }
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (!selected || (e.target as HTMLElement).closest("input")) return;
      if (e.key.toLowerCase() === "r") setShape(rotatePiece);
      if (e.key.toLowerCase() === "f") setShape(flipPiece);
      if (e.key === "Escape") {
        setSelected(null);
        cancel();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [selected]);
  function reset(nextRound = round) {
    history.current = [];
    setRound(nextRound);
    setPlaced(
      Object.fromEntries(
        solution
          .slice(0, Math.max(0, 6 - nextRound))
          .map((p) => [p.pieceId, p.cells]),
      ),
    );
    setSelected(null);
    setWon(false);
    cancel();
    setNotice("Choose a piece. Drag it in, or tap a piece and then the board.");
  }
  const preview = hover
    ? shape.map(([r, c]) => [r + hover[0], c + hover[1]])
    : [];
  return (
    <section
      className="konoodle-game"
      onPointerDownCapture={() => {
        suppressClick.current = false;
      }}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={cancel}
    >
      <div className="game-hud">
        <div>
          <span>KONOODLE</span>
          <strong>Find your fit.</strong>
        </div>
        <div>
          <span>PIECES</span>
          <strong>{Object.keys(placed).length} / 11</strong>
        </div>
      </div>
      <div className="konoodle-toolbar">
        <button
          disabled={!selected || won}
          onClick={() => setShape(rotatePiece)}
        >
          <RotateCw size={18} />
          Rotate <kbd>R</kbd>
        </button>
        <button disabled={!selected || won} onClick={() => setShape(flipPiece)}>
          <FlipHorizontal size={18} />
          Flip <kbd>F</kbd>
        </button>
        <button
          disabled={!history.current.length || won}
          onClick={() => {
            setPlaced(history.current.pop()!);
            setSelected(null);
          }}
        >
          <Undo2 size={18} />
          Undo
        </button>
        <button onClick={() => reset()}>
          <RotateCcw size={18} />
          Reset
        </button>
      </div>
      <div ref={board} className="konoodle-board" aria-label="Konoodle board">
        {Array.from({ length: 55 }, (_, i) => {
          const r = Math.floor(i / 11),
            c = i % 11;
          const id = Object.keys(placed).find((id) =>
            placed[id].some(([y, x]) => y === r && x === c),
          );
          const target = preview.some(([y, x]) => y === r && x === c);
          return (
            <button
              key={i}
              aria-label={`Row ${r + 1} column ${c + 1}${id ? ", piece " + id : ""}`}
              className={
                "konoodle-cell" +
                (id ? " occupied" : "") +
                (target ? (candidate ? " valid" : " invalid") : "") +
                (id && isLocked(id) ? " locked" : "")
              }
              style={{
                backgroundColor: id ? colors[id] : undefined,
                opacity: id === selected && Boolean(ghost) ? 0.4 : 1,
              }}
              onPointerDown={(e) => {
                if (id) begin(e, id, [r, c]);
              }}
              onPointerEnter={() => {
                if (selected && !drag.current)
                  setHover([r - shape[0][0], c - shape[0][1]]);
              }}
              onClick={() => {
                if (suppressClick.current) {
                  suppressClick.current = false;
                  return;
                }
                if (id) {
                  if (!isLocked(id)) choose(id);
                } else if (selected) place(r - shape[0][0], c - shape[0][1]);
              }}
            >
              {id && isLocked(id) ? (
                <LockKeyhole size={11} />
              ) : id ? (
                <span>{id}</span>
              ) : (
                <i />
              )}
            </button>
          );
        })}
      </div>
      <p role="status" className="konoodle-notice">
        {notice}
      </p>
      <div className="konoodle-tray" aria-label="Available pieces">
        {PIECES.filter((p) => !placed[p.id]).map((p) => (
          <button
            key={p.id}
            className={selected === p.id ? "selected" : ""}
            aria-label={"Choose piece " + p.id}
            aria-pressed={selected === p.id}
            onPointerDown={(e) => begin(e, p.id)}
            onClick={() => {
              if (suppressClick.current) {
                suppressClick.current = false;
                return;
              }
              choose(p.id);
            }}
          >
            <Shape id={p.id} cells={selected === p.id ? shape : p.cells} />
            <span>{p.id}</span>
          </button>
        ))}
      </div>
      {selected && (
        <div className="konoodle-selected">
          <Shape id={selected} cells={shape} />
          <span>Piece {selected} selected</span>
          {placed[selected] && (
            <button
              className="club-light"
              onClick={() => {
                history.current.push(placed);
                const next = { ...placed };
                delete next[selected];
                setPlaced(next);
                setSelected(null);
              }}
            >
              Return to tray
            </button>
          )}
        </div>
      )}
      {won && !inMatch && (
        <button className="solid-button" onClick={() => reset(round + 1)}>
          Next puzzle
        </button>
      )}
      {ghost && selected && (
        <div
          className="konoodle-ghost"
          style={{
            left: ghost.x,
            top: ghost.y,
            width:
              ((board.current?.clientWidth || 330) / 11) *
              (Math.max(...shape.map((c) => c[1])) + 1),
            transform: `translate(${(-((drag.current?.offset[1] || 0) + 0.5) / (Math.max(...shape.map((c) => c[1])) + 1)) * 100}%,${(-((drag.current?.offset[0] || 0) + 0.5) / (Math.max(...shape.map((c) => c[0])) + 1)) * 100}%)`,
          }}
        >
          <Shape id={selected} cells={shape} />
        </div>
      )}
    </section>
  );
};
