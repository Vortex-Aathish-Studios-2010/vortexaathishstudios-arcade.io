import { useDevice } from "@/lib/DeviceContext";
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useRef } from "react";

const directions = [
  { key: "ArrowUp", label: "Up", icon: ChevronUp, column: 2, row: 1 },
  { key: "ArrowLeft", label: "Left", icon: ChevronLeft, column: 1, row: 2 },
  { key: "ArrowDown", label: "Down", icon: ChevronDown, column: 2, row: 2 },
  { key: "ArrowRight", label: "Right", icon: ChevronRight, column: 3, row: 2 },
];
export function OnScreenControls({ gameId }: { gameId?: string }) {
  const { device } = useDevice();
  const pressed = useRef(new Set<string>());
  if (
    device === "laptop" ||
    !gameId ||
    !["snake", "tetris", "avoid-the-walls"].includes(gameId)
  )
    return null;
  function trigger(key: string, down: boolean) {
    if (pressed.current.has(key) === down) return;
    if (down) pressed.current.add(key);
    else pressed.current.delete(key);
    window.dispatchEvent(
      new KeyboardEvent(down ? "keydown" : "keyup", {
        key,
        code: key === " " ? "Space" : key,
        bubbles: true,
        cancelable: true,
      }),
    );
  }
  function handlers(key: string) {
    return {
      onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        trigger(key, true);
      },
      onPointerUp: () => trigger(key, false),
      onLostPointerCapture: () => trigger(key, false),
      onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
        if (e.detail === 0) {
          trigger(key, true);
          trigger(key, false);
        }
      },
    };
  }
  return (
    <div className="touch-console" role="group" aria-label="Game controls">
      <div className="direction-pad">
        {directions.map(({ key, label, icon: Icon, column, row }) => (
          <button
            key={key}
            aria-label={label}
            style={{ gridColumn: column, gridRow: row }}
            {...handlers(key)}
          >
            <Icon size={22} />
          </button>
        ))}
      </div>
      {gameId === "tetris" && (
        <div className="touch-actions">
          <button {...handlers("ArrowUp")}>Rotate</button>
          <button {...handlers(" ")}>Drop</button>
        </div>
      )}
    </div>
  );
}
