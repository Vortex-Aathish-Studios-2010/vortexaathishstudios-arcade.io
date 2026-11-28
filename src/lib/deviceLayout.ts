import type { DeviceType } from "@/components/DeviceSelector";

export type ScreenMetrics = {
  width: number;
  height: number;
  touch: boolean;
  native: boolean;
  screenWidth?: number;
  screenHeight?: number;
};
export function detectDevice({
  width,
  height,
  touch,
  native,
  screenWidth,
  screenHeight,
}: ScreenMetrics): DeviceType {
  const shortest =
    native && screenWidth && screenHeight
      ? Math.min(screenWidth, screenHeight)
      : Math.min(width, height);
  if (native || touch) return shortest < 600 ? "phone" : "tablet";
  return "laptop";
}
export type ArcadeOrientation = "portrait" | "landscape" | "any";
const wideGames = new Set(["snake", "konoodle", "gravity-flip"]);
export function preferredOrientation(
  device: DeviceType,
  game?: string | null,
): ArcadeOrientation {
  return device === "phone"
    ? wideGames.has(game || "")
      ? "landscape"
      : "portrait"
    : "any";
}

// Serialize native requests so an old rotation cannot win a navigation race.
export function orientationController(adapter: {
  lock: (value: { orientation: "portrait" | "landscape" }) => Promise<void>;
  unlock: () => Promise<void>;
}) {
  let version = 0,
    queue = Promise.resolve();
  return (orientation: ArcadeOrientation) => {
    const request = ++version;
    queue = queue
      .catch(() => {})
      .then(async () => {
        if (request !== version) return;
        if (orientation === "any") await adapter.unlock();
        else await adapter.lock({ orientation });
      });
    return queue;
  };
}
