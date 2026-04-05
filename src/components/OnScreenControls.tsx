import { useDevice } from "@/lib/DeviceContext";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";

export const OnScreenControls = ({ gameId }: { gameId?: string }) => {
  const { device } = useDevice();
  const touchRefs = useRef<{ [key: string]: boolean }>({});

  // Only show for phone or tablet and only for snake/tetris
  if (!device || device === "laptop" || !gameId || !["snake", "tetris", "avoid-the-walls"].includes(gameId)) return null;

  const dispatchKey = (type: "keydown" | "keyup", key: string) => {
    const event = new KeyboardEvent(type, {
      key,
      code: key === " " ? "Space" : key,
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(event);
  };

  const handleStart = (key: string) => (e: React.PointerEvent | React.TouchEvent | React.MouseEvent) => {
    if (e.cancelable) e.preventDefault();
    if (touchRefs.current[key]) return;
    touchRefs.current[key] = true;
    dispatchKey("keydown", key);
  };

  const handleEnd = (key: string) => (e: React.PointerEvent | React.TouchEvent | React.MouseEvent) => {
    if (e.cancelable) e.preventDefault();
    if (!touchRefs.current[key]) return;
    touchRefs.current[key] = false;
    dispatchKey("keyup", key);
  };

  const isTablet = device === "tablet";
  // Larger buttons for better mobile tapping
  const btnSize = isTablet ? "w-16 h-16" : "w-14 h-14";
  const iconSize = isTablet ? "w-9 h-9" : "w-8 h-8";
  const dpadSize = isTablet ? "w-44 h-44" : "w-40 h-40";

  return (
    <div className={`absolute bottom-0 left-0 right-0 p-4 z-[80] flex justify-between items-end pointer-events-none mb-4 mx-2 sm:mx-8 ${isTablet ? 'pb-8 opacity-90' : 'opacity-70'} hover:opacity-100 transition-opacity touch-none select-none`}>
      {/* D-Pad */}
      <div className="relative w-36 h-36 pointer-events-auto group">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 rounded-t-xl bg-background border border-border shadow-lg active:bg-primary/20 backdrop-blur w-12 h-12 flex items-center justify-center cursor-pointer transition-colors"
          onPointerDown={handleStart("ArrowUp")} onPointerUp={handleEnd("ArrowUp")} onPointerLeave={handleEnd("ArrowUp")} onPointerCancel={handleEnd("ArrowUp")}>
          <ChevronUp className="w-8 h-8 text-primary group-hover:glow-primary" />
        </div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-b-xl bg-background border border-border shadow-lg active:bg-primary/20 backdrop-blur w-12 h-12 flex items-center justify-center cursor-pointer transition-colors"
          onPointerDown={handleStart("ArrowDown")} onPointerUp={handleEnd("ArrowDown")} onPointerLeave={handleEnd("ArrowDown")} onPointerCancel={handleEnd("ArrowDown")}>
          <ChevronDown className="w-8 h-8 text-primary group-hover:glow-primary" />
        </div>
        <div className="absolute left-0 top-1/2 -translate-y-1/2 rounded-l-xl bg-background border border-border shadow-lg active:bg-primary/20 backdrop-blur w-12 h-12 flex items-center justify-center cursor-pointer transition-colors"
          onPointerDown={handleStart("ArrowLeft")} onPointerUp={handleEnd("ArrowLeft")} onPointerLeave={handleEnd("ArrowLeft")} onPointerCancel={handleEnd("ArrowLeft")}>
          <ChevronLeft className="w-8 h-8 text-primary group-hover:glow-primary" />
        </div>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 rounded-r-xl bg-background border border-border shadow-lg active:bg-primary/20 backdrop-blur w-12 h-12 flex items-center justify-center cursor-pointer transition-colors"
          onPointerDown={handleStart("ArrowRight")} onPointerUp={handleEnd("ArrowRight")} onPointerLeave={handleEnd("ArrowRight")} onPointerCancel={handleEnd("ArrowRight")}>
          <ChevronRight className="w-8 h-8 text-primary group-hover:glow-primary" />
        </div>
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full ${gameId === "snake" ? "w-14 h-14" : "w-10 h-10"} bg-background/50 border border-border shadow-inner`} />
      </div>

      {/* Action Buttons (Only for Tetris) */}
      {gameId === "tetris" && (
        <div className="flex gap-4 sm:gap-6 pointer-events-auto items-end pb-4">
          <button
            className="w-18 h-18 min-w-[4.5rem] min-h-[4.5rem] rounded-full bg-background/90 border border-border shadow-lg backdrop-blur flex items-center justify-center active:bg-primary/20 hover:scale-105 active:scale-95 transition-all outline-none select-none"
            onPointerDown={handleStart("ArrowUp")} onPointerUp={handleEnd("ArrowUp")} onPointerLeave={handleEnd("ArrowUp")} onPointerCancel={handleEnd("ArrowUp")}>
            <div className="font-display font-black text-sm text-primary drop-shadow-[0_0_8px_hsl(var(--primary))]">FLIP</div>
          </button>
          <button
            className="w-18 h-18 min-w-[4.5rem] min-h-[4.5rem] rounded-full bg-background/90 border border-border shadow-lg backdrop-blur flex items-center justify-center active:bg-secondary/20 hover:scale-105 active:scale-95 transition-all outline-none select-none mb-4"
            onPointerDown={handleStart(" ")} onPointerUp={handleEnd(" ")} onPointerLeave={handleEnd(" ")} onPointerCancel={handleEnd(" ")}>
            <div className="font-display font-black text-sm text-secondary drop-shadow-[0_0_8px_hsl(var(--secondary))]">DROP</div>
          </button>
        </div>
      )}
    </div>
  );
};
