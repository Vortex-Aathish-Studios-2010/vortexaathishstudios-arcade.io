import { useDevice } from "@/lib/DeviceContext";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";

export const OnScreenControls = ({ gameId }: { gameId?: string }) => {
  const { device } = useDevice();
  const touchRefs = useRef<{ [key: string]: boolean }>({});

  // Only show for phone or tablet and only for snake/tetris
  if (!device || device === "laptop" || !gameId || !["snake", "tetris"].includes(gameId)) return null;

  const dispatchKey = (type: "keydown" | "keyup", key: string) => {
    const event = new KeyboardEvent(type, {
      key,
      code: key === " " ? "Space" : key,
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(event);
  };

  const handleStart = (key: string) => (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (touchRefs.current[key]) return;
    touchRefs.current[key] = true;
    dispatchKey("keydown", key);
  };

  const handleEnd = (key: string) => (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!touchRefs.current[key]) return;
    touchRefs.current[key] = false;
    dispatchKey("keyup", key);
  };

  const isTablet = device === "tablet";

  return (
    <div className={`absolute bottom-0 left-0 right-0 p-4 z-[80] flex justify-between items-end pointer-events-none mb-4 mx-2 sm:mx-8 ${isTablet ? 'pb-8 opacity-90' : 'opacity-70'} hover:opacity-100 transition-opacity`}>
      {/* D-Pad */}
      <div className="relative w-36 h-36 pointer-events-auto group">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 rounded-t-xl bg-background border border-border shadow-lg active:bg-primary/20 backdrop-blur w-12 h-12 flex items-center justify-center cursor-pointer transition-colors"
          onTouchStart={handleStart("ArrowUp")} onTouchEnd={handleEnd("ArrowUp")}
          onMouseDown={handleStart("ArrowUp")} onMouseUp={handleEnd("ArrowUp")} onMouseLeave={handleEnd("ArrowUp")}>
            <ChevronUp className="w-8 h-8 text-primary group-hover:glow-primary" />
        </div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-b-xl bg-background border border-border shadow-lg active:bg-primary/20 backdrop-blur w-12 h-12 flex items-center justify-center cursor-pointer transition-colors"
          onTouchStart={handleStart("ArrowDown")} onTouchEnd={handleEnd("ArrowDown")}
          onMouseDown={handleStart("ArrowDown")} onMouseUp={handleEnd("ArrowDown")} onMouseLeave={handleEnd("ArrowDown")}>
            <ChevronDown className="w-8 h-8 text-primary group-hover:glow-primary" />
        </div>
        <div className="absolute left-0 top-1/2 -translate-y-1/2 rounded-l-xl bg-background border border-border shadow-lg active:bg-primary/20 backdrop-blur w-12 h-12 flex items-center justify-center cursor-pointer transition-colors"
          onTouchStart={handleStart("ArrowLeft")} onTouchEnd={handleEnd("ArrowLeft")}
          onMouseDown={handleStart("ArrowLeft")} onMouseUp={handleEnd("ArrowLeft")} onMouseLeave={handleEnd("ArrowLeft")}>
            <ChevronLeft className="w-8 h-8 text-primary group-hover:glow-primary" />
        </div>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 rounded-r-xl bg-background border border-border shadow-lg active:bg-primary/20 backdrop-blur w-12 h-12 flex items-center justify-center cursor-pointer transition-colors"
          onTouchStart={handleStart("ArrowRight")} onTouchEnd={handleEnd("ArrowRight")}
          onMouseDown={handleStart("ArrowRight")} onMouseUp={handleEnd("ArrowRight")} onMouseLeave={handleEnd("ArrowRight")}>
            <ChevronRight className="w-8 h-8 text-primary group-hover:glow-primary" />
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full w-10 h-10 bg-background/50 border border-border shadow-inner" />
      </div>

      {/* Action Buttons (Only for Tetris) */}
      {gameId === "tetris" && (
        <div className="flex gap-4 sm:gap-6 pointer-events-auto items-end pb-4">
          <button
            className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-background border border-border shadow-lg backdrop-blur flex items-center justify-center active:bg-primary/20 hover:scale-105 active:scale-95 transition-all outline-none select-none"
            onTouchStart={handleStart("ArrowUp")} onTouchEnd={handleEnd("ArrowUp")}
            onMouseDown={handleStart("ArrowUp")} onMouseUp={handleEnd("ArrowUp")} onMouseLeave={handleEnd("ArrowUp")}>
              <div className="font-display font-black text-sm text-primary drop-shadow-[0_0_8px_hsl(var(--primary))]">FLIP</div>
          </button>
          <button
            className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-background border border-border shadow-lg backdrop-blur flex items-center justify-center active:bg-secondary/20 hover:scale-105 active:scale-95 transition-all outline-none select-none mb-4"
            onTouchStart={handleStart(" ")} onTouchEnd={handleEnd(" ")}
            onMouseDown={handleStart(" ")} onMouseUp={handleEnd(" ")} onMouseLeave={handleEnd(" ")}>
              <div className="font-display font-black text-sm text-secondary drop-shadow-[0_0_8px_hsl(var(--secondary))]">DROP</div>
          </button>
        </div>
      )}
    </div>
  );
};
